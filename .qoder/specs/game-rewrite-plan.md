# 模拟竞技游戏 - 核心单人模式重写计划

## Context

当前项目从 Next.js 迁移到 Vite + React 后，虽然能够编译启动，但核心玩法、计分逻辑、UI 面板控制和键盘交互存在大量问题，与四份设计文档（UI设计与交互规范、操作与快捷键规范、竞技要素设计、项目文档）严重不符。本次重写聚焦于**单人模式核心体验**，跳过音效系统和联机/成就等计划中功能。

## 变更文件总览

| 文件 | 变更类型 | 阶段 |
|------|---------|------|
| `src/App.tsx` | 重写 | 1, 3 |
| `src/hooks/useTimer.ts` | 修复 | 1 |
| `src/core/game/GameEngine.ts` | 修改 | 2 |
| `src/core/replay/ReplayPlayer.ts` | 修改 | 2 |
| `src/hooks/useKeyboard.ts` | 完全重写 | 3 |
| `src/components/game/KeyDisplay.tsx` | 重写 | 3 |
| `src/components/layout/AppContainer.tsx` | 重写 | 4 |
| `src/components/layout/LeftPanel.tsx` | 修改 | 4 |
| `src/components/layout/RightPanel.tsx` | 重写 | 4 |
| `src/components/info/Leaderboard.tsx` | 修改 | 4, 7 |
| `src/components/game/GameBoard.tsx` | 重写 | 5 |
| `src/stores/gameStore.ts` | 修改 | 5, 7 |
| `src/stores/leaderboardStore.ts` | 扩展 | 5, 7 |
| `src/components/game/GridCell.tsx` | 修改 | 6 |
| `src/index.css` | 添加样式 | 6 |
| `src/components/replay/ReplayPanel.tsx` | 完全重写 | 7 |

---

## 阶段一：暗黑模式 + 计时器修复

### 1.1 暗黑模式 — `src/App.tsx`

**问题**：configStore 有 `darkMode` 状态，CSS 定义了 `body.dark` 变量，但没有代码把 `dark` 类添加到 `document.body`。

**修改**：
- 添加 `useEffect` 订阅 `configStore.darkMode`
- 内部执行 `document.body.classList.toggle('dark', darkMode)`

### 1.2 计时器 — `src/hooks/useTimer.ts`

**问题**：`start` 函数依赖 `elapsed`，导致每次 elapsed 更新都重新创建 `start`，和 `useEffect` 形成不必要的循环。

**修改**：
- 将 `elapsed` 存入 `useRef` 避免依赖循环
- `onUpdate` 也存入 ref
- `start`/`pause` 的 `useCallback` 依赖改为空数组

### 1.3 计时器接入游戏 — `src/App.tsx`

**修改**：
- 在 App 组件中使用 `useTimer(phase === 'playing', updateTime)`
- 当 phase 变回 idle 时调用 timer.reset()

---

## 阶段二：计分系统修复（渐进式失误惩罚）

### 2.1 `src/core/game/GameEngine.ts` — `handleWrongClick`

**当前**：任何失误都直接 `combo=0, multiplier=1`。

**目标**（竞技要素设计文档 §2.5）：
```
mistakeCount++
if mistakeCount === 1: multiplier *= 0.5（保留combo）
if mistakeCount === 2: multiplier *= 0.5（保留combo）
if mistakeCount >= 3: multiplier = 1, combo = 0
```

**注意**：`handleCorrectClick` 中已有 `this.state.mistakeCount = 0` 重置逻辑，无需修改。

### 2.2 `src/core/replay/ReplayPlayer.ts` — `executeStep`

同步惩罚逻辑：在 ReplayPlayer 中增加 `mistakeCount` 字段，复盘回放时应用相同的渐进惩罚。

---

## 阶段三：键盘输入系统 + 虚拟键盘

### 3.1 完全重写 `src/hooks/useKeyboard.ts`

**当前**：简单的 key→index 映射，无状态机，无 Esc/Enter 处理。

**目标**（操作规范 §2.2.1）：实现"对角线/十字"二步定位状态机。

状态机逻辑：
```
状态: firstKeyIndex (useRef, null | number)

keydown 事件处理:
1. Esc → phase=playing/finished/final_clicked 时 resetGame()；关闭对话框
2. Enter → phase=finished 时 finalClick()
3. 数字键/绑定键 → 映射为 index:
   a. 如果 firstKeyIndex === null（无高亮）：
      - 检查对角线 grid[index][index] 是否包含最小数字
      - 若包含：handleClick(index, index, 'keyboard')
      - 若不包含但该行/列有最小数字：setHighlight(index, index)，firstKeyIndex=index
   b. 如果 firstKeyIndex === index（相同键）：
      - clearHighlight()，firstKeyIndex=null
   c. 如果 firstKeyIndex !== null && firstKeyIndex !== index（不同键）：
      - 依次检查 (b,b) → (b,a) → (a,b)（其中 a=firstKeyIndex, b=index）
      - 第一个含最小数字的格子：handleClick 并清除高亮
      - 都不含：记为失误（handleClick 到一个错误格子触发 handleWrongClick）
      - clearHighlight()，firstKeyIndex=null
```

Hook 签名改为无参数，内部直接从 gameStore/configStore 读取状态。
返回 `{ simulateKeyPress: (key: string) => void }` 供虚拟键盘调用。

### 3.2 重写 `src/components/game/KeyDisplay.tsx`

**当前**：按钮无 onClick。

**修改**：
- 接收 `onKeyPress: (key: string) => void` prop
- 每个按钮 onClick 调用 `onKeyPress(对应键)`
- 按钮数量根据当前棋盘 size 动态生成（不再硬编码 1-0）
- 显示 configStore.keyBindings 中绑定的键名

### 3.3 `src/App.tsx` 挂载键盘 hook

在 App 中调用 `useKeyboard()`，获取 `simulateKeyPress`，通过 context 或 prop drilling 传递给 KeyDisplay。

选择方案：创建一个简单的 React Context `KeyboardContext` 传递 `simulateKeyPress`，避免层层 prop drilling（App → AppContainer → GameArea → GameBoard → KeyDisplay 有 4 层）。

### 3.4 传递链

- `src/App.tsx`：调用 `useKeyboard()`，用 `KeyboardContext.Provider` 包裹 `<App />`
- `src/components/game/KeyDisplay.tsx`：通过 `useContext(KeyboardContext)` 获取 `simulateKeyPress`

---

## 阶段四：UI 面板可见性控制

### 4.1 `src/components/layout/AppContainer.tsx`

**当前**：`showLeftPanel = phase === 'idle' || (keyboardScoreMode && lazy)`

**目标**（UI规范 §3.1-3.4）：

| phase | 左侧 | 中间 | 右侧 |
|-------|------|------|------|
| idle | SettingsPanel | ConfigBar + IntroMessage | Timer + Score + Leaderboard |
| playing | KeyboardScorePanel(仅lazy+KS) 或隐藏 | GameGrid + KeyDisplay | Timer + Score + Leaderboard(禁点击) |
| finished/final_clicked | 同 playing | GameGrid + 覆盖层 | Timer + Score + Leaderboard(可点击) |
| replay | KeyboardScorePanel(强制) | ReplayGrid + KeyDisplay | Timer + Score + ReplayPanel |

修改 showLeftPanel 逻辑：
```
idle → true（显示 SettingsPanel）
replay → true（显示 KeyboardScorePanel，强制）
playing/finished/final_clicked → lazy && keyboardScoreMode 时显示
```

### 4.2 `src/components/layout/LeftPanel.tsx`

按 phase 决定渲染内容：
- `idle`：SettingsPanel
- `replay`：KeyboardScorePanel（强制，不检查 lazy）
- 其他：KeyboardScorePanel（需 lazy+keyboardScoreMode）

### 4.3 `src/components/layout/RightPanel.tsx`

**当前**：无条件渲染 Timer + Score + Leaderboard + ReplayPanel。

**修改**：
- Timer + Score：始终显示
- `phase === 'replay'`：隐藏 Leaderboard，显示 ReplayPanel
- 其他 phase：显示 Leaderboard，隐藏 ReplayPanel
- 传递 `disabled={phase === 'playing'}` 给 Leaderboard

### 4.4 `src/components/info/Leaderboard.tsx`

- 新增 `disabled?: boolean` prop 和 `onReplay?: (recordId: string) => void` prop
- disabled 时：条目不可点击，降低透明度
- 可点击时：onClick 调用 `onReplay(record.id)`

---

## 阶段五：最后一击 + 游戏重置 + 排行榜保存

### 5.1 最后一击 UI — `src/components/game/GameBoard.tsx`

**修改**：
- `phase === 'finished'`：在 GameGrid 上覆盖半透明层 + "⚡ 最后一击" 按钮 + 预测奖分显示
- `phase === 'final_clicked'`：覆盖结果面板（最终得分、用时、"再来一局"按钮）
- "再来一局" 或 Esc → `gameStore.resetGame()`

### 5.2 排行榜自动保存 — `src/stores/gameStore.ts`

在引擎订阅回调中，当 phase 变为 `final_clicked` 时：
- 调用 `engine.getRecord()` 获取完整 GameRecord
- 生成唯一 id（`Date.now().toString(36) + random`）
- 调用 `leaderboardStore.getState().addRecord(record)` 保存

### 5.3 扩展 `src/stores/leaderboardStore.ts`

- 新增 `gameRecords: Record<string, GameRecord>` 字段（persist 持久化）
- `addRecord` 方法中同时存入完整 GameRecord
- 限制最多保留 50 条完整记录（按时间淘汰最旧）
- 新增 `getGameRecord(id: string): GameRecord | null` 方法

---

## 阶段六：失误视觉反馈

### 6.1 `src/index.css` — 新增动画

```css
@keyframes wrong-flash {
  0% { background-color: inherit; }
  25% { background-color: rgba(255, 80, 80, 0.5); }
  100% { background-color: inherit; }
}
.wrong-flash {
  animation: wrong-flash 0.4s ease-out;
}
```

### 6.2 `src/components/game/GridCell.tsx`

- GridCell 内部调用 `handleClick` 并检查返回值
- 返回 false 时设置本地 state `isWrong=true`，400ms 后重置
- `isWrong` 时添加 `wrong-flash` CSS 类

修改方式：GridCell 目前的 onClick 只是调用外部传入的回调。改为内部直接调用 `gameStore.handleClick(row, col, 'click')`，根据返回值控制错误反馈。

---

## 阶段七：复盘系统集成

### 7.1 `src/stores/gameStore.ts` 增加复盘支持

新增状态和动作：
- `startReplay(record: GameRecord): void` — 设置 phase='replay'
- `exitReplay(): void` — 重置到 idle

### 7.2 `src/components/info/Leaderboard.tsx`

- 点击条目时，从 `leaderboardStore.gameRecords` 获取 GameRecord
- 调用 `gameStore.startReplay(record)` 进入复盘模式

### 7.3 完全重写 `src/components/replay/ReplayPanel.tsx`

**当前**：全部硬编码 mock 数据。

**重写**：
- 使用 `useReplay` hook 接入 ReplayPlayer
- 从 gameStore 获取 replay 数据初始化 ReplayPlayer
- 控件连接到 useReplay 方法（play/pause/stepForward/stepBackward/setSpeed/seekTo）
- 进度条绑定 `state.step / state.totalSteps`
- "退出复盘" 按钮调用 `gameStore.exitReplay()`

### 7.4 `src/components/game/GameBoard.tsx` 复盘模式

- `phase === 'replay'` 时，从 useReplay 的 state.grid 渲染网格（复用 GameGrid 组件结构但数据源不同）
- 复盘模式下 GridCell 点击无效

---

## 验证方式

每个阶段完成后均可独立验证：

1. **暗黑模式**：在设置中切换暗黑模式开关 → 页面颜色立即变化
2. **计时器**：开始游戏 → 右侧计时器实时跳动 → 游戏结束后停止
3. **计分修复**：连续失误 1 次 → multiplier 减半但 combo 不变；第 3 次 → combo 归零
4. **键盘操作**：按 1 → 对角线检查/高亮；按 2 → 十字检查；Esc 退出；Enter 最后一击
5. **虚拟键盘**：点击虚拟按钮效果与物理键盘一致
6. **面板显隐**：idle 看到设置面板；游戏中设置消失、配置行消失
7. **最后一击**：所有格子消除完 → 出现"最后一击"按钮 → 点击后分数增加 → 出现结果面板
8. **排行榜保存**：完成游戏后排行榜自动出现新记录
9. **失误反馈**：点错格子 → 该格子闪红
10. **复盘**：点击排行榜条目 → 进入复盘 → 可播放/暂停/单步 → 退出回到 idle

最终验证：`npm run build` 通过（TypeScript 编译 + Vite 构建无错误）。
