import type { AppLocale } from '@/types/config';

export interface LocaleMessages {
  [key: string]: string | string[];
  title: string;
  introLine1: string;
  introLine2: string;
  introLine3: string;
  introLine4: string;
  introLine5: string;
  introLine6: string;
  tipsLabel: string;
  leaderboardCleared: string;
  leaderboard: string;
  overall: string;
  restart: string;
  boardSize: string;
  lazyMode: string;
  seed: string;
  more: string;
  startGame: string;
  expansion: string;
  fixedLayers: string;
  expandMode: string;
  general: string;
  keybindings: string;
  audio: string;
  theme: string;
  story: string;
  storyMode: string;
  storyModeHint: string;
  storyLevels: string;
  storyPanelHint: string;
  addLevel: string;
  duplicateLevel: string;
  removeLevel: string;
  applyLevelConfig: string;
  storyLevelInfo: string;
  levelName: string;
  levelNamePlaceholder: string;
  storyChapter: string;
  storyChapterPlaceholder: string;
  matchStyle: string;
  storyStyleTraining: string;
  storyStyleStandard: string;
  storyStyleDuel: string;
  storyStyleBoss: string;
  storyDialogue: string;
  storyDialogueHint: string;
  introDialogue: string;
  introDialoguePlaceholder: string;
  rivalDialogue: string;
  rivalDialoguePlaceholder: string;
  victoryDialogue: string;
  victoryDialoguePlaceholder: string;
  boardSpec: string;
  boardSpecHint: string;
  storyLargeBoardHint: string;
  storySeedPlaceholder: string;
  storyRules: string;
  storyRulesHint: string;
  storyApplyHint: string;
  multiplayer: string;
  achievement: string;
  close: string;
  nextRoundOnly: string;
  display: string;
  keyboardMap: string;
  virtualKeyboard: string;
  axisLabels: string;
  finalStep: string;
  autoFinalClick: string;
  hideFinalLayer: string;
  backgroundImage: string;
  imageUrl: string;
  keyBinding: string;
  clickThenPress: string;
  slot: string;
  mute: string;
  masterVolume: string;
  sfxVolume: string;
  musicVolume: string;
  language: string;
  english: string;
  chinese: string;
  unavailable: string;
  previous: string;
  play: string;
  pause: string;
  next: string;
  exit: string;
  exitReplay: string;
  setHotkey: string;
  current: string;
  pressNewKey: string;
  escCancel: string;
  keyboardModeSingle: string;
  keyboardModeDual: string;
  replayLoading: string;
  introTips: string[];
}

export const localeMessages: Record<AppLocale, LocaleMessages> = {
  en: {
    title: 'Simulated Athletics',
    introLine1: 'Basic control: click the board.',
    introLine2: 'Advanced control: combine keyboard and mouse.',
    introLine3: 'Keyboard labels are positional, not row or column specific.',
    introLine4: 'Every correct click starts from 1 base point.',
    introLine5: 'Combo and click pace both affect your final score.',
    introLine6: 'The leaderboard ranks by total score.',
    tipsLabel: 'Tip: ',
    leaderboardCleared: 'Leaderboard cleared.',
    leaderboard: 'Leaderboard',
    overall: 'Overall',
    restart: 'Restart',
    boardSize: 'Size',
    lazyMode: 'Lazy Mode',
    seed: 'Seed',
    more: 'More',
    startGame: 'Start',
    expansion: 'Expansion',
    fixedLayers: 'Fixed Layers',
    expandMode: 'Expand Mode',
    general: 'General',
    keybindings: 'Keybindings',
    audio: 'Audio',
    theme: 'Theme',
    story: 'Story Mode',
    storyMode: 'Story Mode',
    storyModeHint: 'Build a chain of stages with their own dialogue, board presets, and rules. Apply any stage back to the lobby when you want to test it.',
    storyLevels: 'Levels',
    storyPanelHint: 'Keep multiple stages here and tune them one by one.',
    addLevel: 'Add Level',
    duplicateLevel: 'Duplicate',
    removeLevel: 'Delete',
    applyLevelConfig: 'Apply To Lobby',
    storyLevelInfo: 'Stage Identity',
    levelName: 'Level Name',
    levelNamePlaceholder: 'Name this stage',
    storyChapter: 'Chapter',
    storyChapterPlaceholder: 'Chapter label',
    matchStyle: 'Match Style',
    storyStyleTraining: 'Training',
    storyStyleStandard: 'Standard',
    storyStyleDuel: 'Duel',
    storyStyleBoss: 'Boss',
    storyDialogue: 'Dialogue Beats',
    storyDialogueHint: 'Keep each line concise so the stage rhythm stays clear.',
    introDialogue: 'Opening',
    introDialoguePlaceholder: 'Set the stage before the round begins.',
    rivalDialogue: 'Rival Line',
    rivalDialoguePlaceholder: 'Add pressure, taunt, or challenge from the opponent.',
    victoryDialogue: 'Victory',
    victoryDialoguePlaceholder: 'What should the player hear after winning?',
    boardSpec: 'Board Spec',
    boardSpecHint: 'Each story stage can define its own board size, layer count, and seed.',
    storyLargeBoardHint: 'Expanded boards currently lock the stage to a single layer, matching the live game rules.',
    storySeedPlaceholder: 'Optional seed for this stage',
    storyRules: 'Ruleset',
    storyRulesHint: 'These toggles are copied into the lobby when you apply this stage.',
    storyApplyHint: 'Apply copies the selected stage into the current start-game preset. It does not auto-launch the round.',
    multiplayer: 'Multiplayer',
    achievement: 'Achievements',
    close: 'Close',
    nextRoundOnly: 'Changes apply from the next round.',
    display: 'Display',
    keyboardMap: 'Keyboard Map',
    virtualKeyboard: 'Virtual Keyboard',
    axisLabels: 'Axis Labels',
    finalStep: 'Final Step',
    autoFinalClick: 'Auto Final Click',
    hideFinalLayer: 'Hide Final Layer',
    backgroundImage: 'Background Image',
    imageUrl: 'Image URL',
    keyBinding: 'Key Binding',
    clickThenPress: 'Click a slot, then press a key.',
    slot: 'Slot',
    mute: 'Mute',
    masterVolume: 'Master Volume',
    sfxVolume: 'SFX',
    musicVolume: 'Music',
    language: 'Language',
    english: 'English',
    chinese: 'Chinese',
    unavailable: 'Not available yet.',
    previous: 'Prev',
    play: 'Play',
    pause: 'Pause',
    next: 'Next',
    exit: 'Exit',
    exitReplay: 'Exit Replay',
    setHotkey: 'Set shared hotkey for slot',
    current: 'Current',
    pressNewKey: 'Press a new key (a-z, 0-9)',
    escCancel: 'Press Esc to cancel',
    keyboardModeSingle: 'Single-key Mode',
    keyboardModeDual: 'Dual-key Mode',
    replayLoading: 'Loading replay data...',
    achievementUnlocked: 'Unlocked',
    achievementCompletionRate: 'Completion',
    achievementRecentUnlocks: 'Recent unlocks',
    achievementRecentUnlock: 'Latest unlock',
    achievementClosingIn: 'Closing in',
    achievementKeepPlaying: 'Keep playing to start filling the wall.',
    achievementNoneYet: 'Nothing unlocked yet.',
    achievementCategoryPlay: 'Play',
    achievementCategoryPerformance: 'Performance',
    achievementCategoryMastery: 'Mastery',
    achievementCategoryStory: 'Story',
    achievementCategorySocialFuture: 'Replay & Social',
    achievementStatusUnlocked: 'Unlocked',
    achievementStatusInProgress: 'In progress',
    achievementStatusFuture: 'Future',
    achievementProgressLabel: 'Progress',
    achievementHiddenTitle: 'Hidden achievement',
    achievementHiddenDescription: 'Unlock it to reveal the full details.',
    achievementToastUnlocked: 'Achievement unlocked',
    achievementSessionSummary: 'Run summary',
    achievementUnlockedThisRun: 'Unlocked this run',
    achievementProgressThisRun: 'Progressed this run',
    achievementFirstSessionTitle: 'Starter Whistle',
    achievementFirstSessionDescription: 'Open your first run.',
    achievementFirstFinishTitle: 'Finish Line',
    achievementFirstFinishDescription: 'Complete a full run for the first time.',
    achievementManualFinalTitle: 'Manual Claim',
    achievementManualFinalDescription: 'Land a manual final click.',
    achievementCombo10Title: 'Combo Ten',
    achievementCombo10Description: 'Reach a 10-combo streak.',
    achievementCombo25Title: 'Combo Twenty-Five',
    achievementCombo25Description: 'Reach a 25-combo streak.',
    achievementCombo50Title: 'Combo Fifty',
    achievementCombo50Description: 'Reach a 50-combo streak.',
    achievementPerfectTitle: 'Clean Sheet',
    achievementPerfectDescription: 'Finish a run without any mistakes.',
    achievementKeyboardOnlyTitle: 'Hands Off',
    achievementKeyboardOnlyDescription: 'Clear a run using keyboard inputs only.',
    achievementLazyTitle: 'Guided Route',
    achievementLazyDescription: 'Win a run with Lazy Mode enabled.',
    achievementStandardTitle: 'No Training Wheels',
    achievementStandardDescription: 'Win a run without Lazy Mode.',
    achievementHiddenAxisTitle: 'Blind Coordinates',
    achievementHiddenAxisDescription: 'Win a run with axis labels hidden.',
    achievementHiddenFinalLayerTitle: 'Photo Finish',
    achievementHiddenFinalLayerDescription: 'Win a run with the final layer hidden.',
    achievementSize4Title: 'Square Four',
    achievementSize4Description: 'Complete a 4x4 board.',
    achievementSize6Title: 'Square Six',
    achievementSize6Description: 'Complete a 6x6 board.',
    achievementExpandedTitle: 'Arena Expansion',
    achievementExpandedDescription: 'Complete any expanded board larger than 6x6.',
    achievementReplayOpenTitle: 'Archive Opened',
    achievementReplayOpenDescription: 'Open a replay from the leaderboard.',
    achievementReplayPlayTitle: 'Study Session',
    achievementReplayPlayDescription: 'Play a replay instead of just opening it.',
    achievementStoryApplyTitle: 'Stage Setter',
    achievementStoryApplyDescription: 'Apply a story stage back to the lobby.',
    achievementStoryTrainingTitle: 'Training Cleared',
    achievementStoryTrainingDescription: 'Complete a story stage with the Training style.',
    achievementStoryDuelTitle: 'Duel Cleared',
    achievementStoryDuelDescription: 'Complete a story stage with the Duel style.',
    achievementRoomCreatorTitle: 'Room Architect',
    achievementRoomCreatorDescription: 'Create a multiplayer room when live matchmaking arrives.',
    achievementRoomJoinerTitle: 'Crowd Entry',
    achievementRoomJoinerDescription: 'Join a multiplayer room when live matchmaking arrives.',
    achievementChatStarterTitle: 'Mic Check',
    achievementChatStarterDescription: 'Send a room chat message when multiplayer chat is active.',
    achievementMultiplayerWinnerTitle: 'Podium Finish',
    achievementMultiplayerWinnerDescription: 'Win a multiplayer match when live competition is active.',
    introTips: [
      'Finish the body first, then wait one second for the final claim.',
      'Click the score panel after a run to restart immediately.',
      'Esc exits most active states quickly.',
      'The keyboard map always shows the full remaining route.',
      'Single-key mode reduces dual-key visual weight for reading.',
      'Use a seed to recreate the same board.',
    ],
  },
  'zh-CN': {
    title: '模拟竞技',
    introLine1: '入门操作：鼠标点击棋盘。',
    introLine2: '进阶操作：键盘与鼠标配合。',
    introLine3: '按键提示用于定位，不强调行或列的概念。',
    introLine4: '每次正确点击都从 1 点基础分开始。',
    introLine5: '连击和点击节奏都会影响最终得分。',
    introLine6: '排行榜按总分排序。',
    tipsLabel: '提示：',
    leaderboardCleared: '排行榜已清空。',
    leaderboard: '排行榜',
    overall: '综合',
    restart: '重新开始',
    boardSize: '边长',
    lazyMode: '懒人模式',
    seed: '种子',
    more: '更多',
    startGame: '开始游戏',
    expansion: '扩展',
    fixedLayers: '固定层数',
    expandMode: '扩展模式',
    general: '常规',
    keybindings: '快捷键',
    audio: '音效',
    theme: '主题',
    story: '剧情模式',
    storyMode: '剧情模式',
    storyModeHint: '在这里为多个关卡配置对话、棋盘预设和规则，需要测试时可以把某一关同步回大厅。',
    storyLevels: '关卡',
    storyPanelHint: '把多个关卡集中在这里，逐关调整节奏和参数。',
    addLevel: '新增关卡',
    duplicateLevel: '复制',
    removeLevel: '删除',
    applyLevelConfig: '应用到大厅',
    storyLevelInfo: '关卡信息',
    levelName: '关卡名称',
    levelNamePlaceholder: '为这个关卡命名',
    storyChapter: '章节',
    storyChapterPlaceholder: '输入章节标签',
    matchStyle: '对局样式',
    storyStyleTraining: '训练',
    storyStyleStandard: '标准',
    storyStyleDuel: '对决',
    storyStyleBoss: 'Boss',
    storyDialogue: '剧情对白',
    storyDialogueHint: '保持每段台词简洁，让每关的情绪节奏更清晰。',
    introDialogue: '开场对白',
    introDialoguePlaceholder: '关卡开始前想告诉玩家的话。',
    rivalDialogue: '对手台词',
    rivalDialoguePlaceholder: '补一句挑衅、施压或提醒。',
    victoryDialogue: '胜利台词',
    victoryDialoguePlaceholder: '玩家获胜后会听到什么？',
    boardSpec: '棋盘规格',
    boardSpecHint: '每个关卡都可以有自己的边长、层数和种子。',
    storyLargeBoardHint: '大尺寸棋盘目前会强制为单层，以保持和现有对局规则一致。',
    storySeedPlaceholder: '可选的关卡种子',
    storyRules: '规则开关',
    storyRulesHint: '点击应用后，这些规则会同步到当前大厅预设。',
    storyApplyHint: '应用只会把所选关卡的参数复制到当前开局配置，不会直接开始对局。',
    multiplayer: '多人',
    achievement: '成就',
    close: '关闭',
    nextRoundOnly: '修改会在下一局生效。',
    display: '显示',
    keyboardMap: '键盘映射',
    virtualKeyboard: '虚拟键盘',
    axisLabels: '坐标标签',
    finalStep: '结算',
    autoFinalClick: '自动最后一击',
    hideFinalLayer: '隐藏末层',
    backgroundImage: '背景图',
    imageUrl: '图片地址',
    keyBinding: '键位绑定',
    clickThenPress: '点击槽位后再按键。',
    slot: '槽位',
    mute: '静音',
    masterVolume: '总音量',
    sfxVolume: '音效',
    musicVolume: '音乐',
    language: '语言',
    english: '英文',
    chinese: '中文',
    unavailable: '暂未开放。',
    previous: '上一步',
    play: '播放',
    pause: '暂停',
    next: '下一步',
    exit: '退出',
    exitReplay: '退出复盘',
    setHotkey: '为槽位设置共用快捷键',
    current: '当前',
    pressNewKey: '按下新按键（a-z, 0-9）',
    escCancel: '按 Esc 取消',
    keyboardModeSingle: '单键模式',
    keyboardModeDual: '双键模式',
    replayLoading: '正在加载复盘数据...',
    achievementUnlocked: '已解锁',
    achievementCompletionRate: '完成率',
    achievementRecentUnlocks: '最近解锁',
    achievementRecentUnlock: '最新成就',
    achievementClosingIn: '即将完成',
    achievementKeepPlaying: '继续对局，成就墙会很快热起来。',
    achievementNoneYet: '还没有解锁成就。',
    achievementCategoryPlay: '对局',
    achievementCategoryPerformance: '表现',
    achievementCategoryMastery: '技巧',
    achievementCategoryStory: '剧情',
    achievementCategorySocialFuture: '回放与社交',
    achievementStatusUnlocked: '已解锁',
    achievementStatusInProgress: '进行中',
    achievementStatusFuture: '未来',
    achievementProgressLabel: '进度',
    achievementHiddenTitle: '隐藏成就',
    achievementHiddenDescription: '解锁后才会显示完整内容。',
    achievementToastUnlocked: '成就解锁',
    achievementSessionSummary: '本局成就摘要',
    achievementUnlockedThisRun: '本局新解锁',
    achievementProgressThisRun: '本局推进',
    achievementFirstSessionTitle: '发令枪',
    achievementFirstSessionDescription: '开启你的第一局。',
    achievementFirstFinishTitle: '冲过终点',
    achievementFirstFinishDescription: '第一次完整完成一局。',
    achievementManualFinalTitle: '手动收官',
    achievementManualFinalDescription: '亲手完成最后一击结算。',
    achievementCombo10Title: '十连击',
    achievementCombo10Description: '达成 10 连击。',
    achievementCombo25Title: '二十五连击',
    achievementCombo25Description: '达成 25 连击。',
    achievementCombo50Title: '五十连击',
    achievementCombo50Description: '达成 50 连击。',
    achievementPerfectTitle: '零失误通关',
    achievementPerfectDescription: '一局内没有任何失误并完成结算。',
    achievementKeyboardOnlyTitle: '全键盘操作',
    achievementKeyboardOnlyDescription: '整局只用键盘完成。',
    achievementLazyTitle: '引导路线',
    achievementLazyDescription: '开启懒人模式完成一局。',
    achievementStandardTitle: '纯手感',
    achievementStandardDescription: '关闭懒人模式完成一局。',
    achievementHiddenAxisTitle: '盲打坐标',
    achievementHiddenAxisDescription: '隐藏坐标提示完成一局。',
    achievementHiddenFinalLayerTitle: '留白收官',
    achievementHiddenFinalLayerDescription: '隐藏终层后完成一局。',
    achievementSize4Title: '四阶棋盘',
    achievementSize4Description: '完成一局 4x4 棋盘。',
    achievementSize6Title: '六阶棋盘',
    achievementSize6Description: '完成一局 6x6 棋盘。',
    achievementExpandedTitle: '扩展赛场',
    achievementExpandedDescription: '完成任意大于 6x6 的扩展棋盘。',
    achievementReplayOpenTitle: '翻开档案',
    achievementReplayOpenDescription: '从排行榜中打开一次回放。',
    achievementReplayPlayTitle: '复盘研究',
    achievementReplayPlayDescription: '真正播放一次回放，而不只是打开面板。',
    achievementStoryApplyTitle: '布置舞台',
    achievementStoryApplyDescription: '把剧情关卡应用回大厅。',
    achievementStoryTrainingTitle: '训练通过',
    achievementStoryTrainingDescription: '完成一个 Training 风格剧情关卡。',
    achievementStoryDuelTitle: '对决通过',
    achievementStoryDuelDescription: '完成一个 Duel 风格剧情关卡。',
    achievementRoomCreatorTitle: '房间搭建者',
    achievementRoomCreatorDescription: '为未来联机模式预留的建房成就。',
    achievementRoomJoinerTitle: '入场观众',
    achievementRoomJoinerDescription: '为未来联机模式预留的加房成就。',
    achievementChatStarterTitle: '麦克风测试',
    achievementChatStarterDescription: '为未来联机聊天预留的发言成就。',
    achievementMultiplayerWinnerTitle: '站上领奖台',
    achievementMultiplayerWinnerDescription: '为未来联机胜场预留的获胜成就。',
    introTips: [
      '主体完成后等 1 秒再领取最后一击。',
      '对局结束后可以点击得分面板快速重开。',
      'Esc 可以快速退出多数活跃状态。',
      '键盘映射会持续显示完整路线。',
      '单键模式会弱化双键干扰，方便阅读。',
      '输入种子可以复现同一棋盘。',
    ],
  },
};
