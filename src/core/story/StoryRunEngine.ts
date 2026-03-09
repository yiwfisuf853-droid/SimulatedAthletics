import { SeededRandom } from '@/lib/random';
import type {
  RunEngine,
  SkinDefinition,
  StoryAppliedModifiers,
  StoryBoardCell,
  StoryFailCondition,
  StoryInputAction,
  StoryObjectiveDefinition,
  StoryObjectiveProgress,
  StoryRunResult,
  StoryRunState,
  StoryStageDefinition,
} from '@/types/story';

type StoryListener = (state: StoryRunState) => void;

const ZERO_REWARD = {
  progressCurrency: 0,
  styleCurrency: 0,
  skinUnlockIds: [],
  stageUnlockIds: [],
};

const formatObjectiveLabel = (current: number, target: number) => `${Math.min(current, target)} / ${target}`;

const sortNumbers = (numbers: number[]) => [...numbers].sort((a, b) => a - b);

const sameMultiset = (left: number[], right: number[]) => {
  const normalizedLeft = sortNumbers(left);
  const normalizedRight = sortNumbers(right);
  return normalizedLeft.length === normalizedRight.length && normalizedLeft.every((value, index) => value === normalizedRight[index]);
};

const createAppliedModifiers = (skin: SkinDefinition | null): StoryAppliedModifiers => {
  const modifiers = skin?.modifiers ?? [];

  return modifiers.reduce<StoryAppliedModifiers>(
    (acc, modifier) => {
      if (modifier.type === 'simultaneous_window_bonus_ms') {
        acc.simultaneousWindowBonusMs += modifier.value;
      }
      if (modifier.type === 'preview_hint_charges_bonus') {
        acc.previewHintChargesBonus += modifier.value;
      }
      if (modifier.type === 'stage_entry_cost_reduction') {
        acc.stageEntryCostReduction += modifier.value;
      }
      if (modifier.type === 'style_currency_bonus_rate') {
        acc.styleCurrencyBonusRate += modifier.value;
      }

      return acc;
    },
    {
      simultaneousWindowBonusMs: 0,
      previewHintChargesBonus: 0,
      stageEntryCostReduction: 0,
      styleCurrencyBonusRate: 0,
    }
  );
};

const createObjectiveProgress = (objective: StoryObjectiveDefinition): StoryObjectiveProgress => {
  if (objective.type === 'tap_sequence') {
    return {
      objectiveId: objective.id,
      type: objective.type,
      title: objective.title,
      required: objective.required,
      completed: false,
      currentCount: 0,
      targetCount: objective.targetValues.length,
      currentLabel: formatObjectiveLabel(0, objective.targetValues.length),
    };
  }

  if (objective.type === 'tap_group_any_order') {
    return {
      objectiveId: objective.id,
      type: objective.type,
      title: objective.title,
      required: objective.required,
      completed: false,
      currentCount: 0,
      targetCount: objective.requiredCount,
      currentLabel: formatObjectiveLabel(0, objective.requiredCount),
    };
  }

  if (objective.type === 'tap_simultaneous') {
    return {
      objectiveId: objective.id,
      type: objective.type,
      title: objective.title,
      required: objective.required,
      completed: false,
      currentCount: 0,
      targetCount: objective.targetValues.length,
      currentLabel: formatObjectiveLabel(0, objective.targetValues.length),
    };
  }

  if (objective.type === 'clear_tagged_cells') {
    return {
      objectiveId: objective.id,
      type: objective.type,
      title: objective.title,
      required: objective.required,
      completed: false,
      currentCount: 0,
      targetCount: objective.requiredCount,
      currentLabel: formatObjectiveLabel(0, objective.requiredCount),
    };
  }

  return {
    objectiveId: objective.id,
    type: objective.type,
    title: objective.title,
    required: objective.required,
    completed: false,
    currentCount: 0,
    targetCount: objective.durationMs,
    currentLabel: '0 / 8s',
  };
};

const createBoard = (stage: StoryStageDefinition): StoryBoardCell[][] => {
  const totalCells = stage.board.rows * stage.board.cols;
  const rng = new SeededRandom(stage.board.seed);
  const generatedCells: Array<{ value: number; tags: string[] }> = [];

  stage.board.spawnRules.forEach((rule, ruleIndex) => {
    if (rule.type === 'fixed_values') {
      rule.values.forEach((value) => {
        generatedCells.push({
          value,
          tags: [...(rule.tags ?? []), `rule:${ruleIndex}`],
        });
      });
    }

    if (rule.type === 'duplicate_value') {
      Array.from({ length: rule.count }).forEach(() => {
        generatedCells.push({
          value: rule.value,
          tags: [...(rule.tags ?? []), `rule:${ruleIndex}`],
        });
      });
    }

    if (rule.type === 'tagged_values') {
      rule.values.forEach((value) => {
        generatedCells.push({
          value,
          tags: [rule.tag, ...(rule.extraTags ?? []), `rule:${ruleIndex}`],
        });
      });
    }

    if (rule.type === 'filler_values') {
      Array.from({ length: rule.count }).forEach(() => {
        generatedCells.push({
          value: rule.values[rng.randInt(0, rule.values.length)],
          tags: [...(rule.tags ?? []), 'filler', `rule:${ruleIndex}`],
        });
      });
    }
  });

  while (generatedCells.length < totalCells) {
    generatedCells.push({
      value: rng.randInt(1, 10),
      tags: ['filler'],
    });
  }

  const shuffled = rng.shuffle(generatedCells.slice(0, totalCells));
  const board: StoryBoardCell[][] = [];

  for (let row = 0; row < stage.board.rows; row += 1) {
    board[row] = [];
    for (let col = 0; col < stage.board.cols; col += 1) {
      const cell = shuffled[row * stage.board.cols + col];
      board[row][col] = {
        id: `story-cell-${row}-${col}`,
        row,
        col,
        value: cell.value,
        tags: cell.tags,
        cleared: false,
      };
    }
  }

  return board;
};

export class StoryRunEngine implements RunEngine {
  private readonly stage: StoryStageDefinition;
  private readonly listeners = new Set<StoryListener>();
  private readonly objectiveMap: Record<string, StoryObjectiveDefinition>;
  private readonly failConditionMap: Record<string, StoryFailCondition>;
  private readonly appliedModifiers: StoryAppliedModifiers;
  private state: StoryRunState;
  private startTime: number | null = null;
  private rafId: number | null = null;
  private hintTimeout: number | null = null;
  private simultaneousMisses = 0;
  private result: StoryRunResult | null = null;

  constructor(stage: StoryStageDefinition, equippedSkin: SkinDefinition | null) {
    this.stage = stage;
    this.objectiveMap = Object.fromEntries(stage.objectives.map((objective) => [objective.id, objective]));
    this.failConditionMap = Object.fromEntries(stage.failConditions.map((condition) => [condition.id, condition]));
    this.appliedModifiers = createAppliedModifiers(equippedSkin);

    const board = createBoard(stage);
    const boardFlat = board.flat();
    const hintsRemaining = stage.rules.baseHintCharges + this.appliedModifiers.previewHintChargesBonus;
    const mistakeLimit = stage.failConditions.find((condition) => condition.type === 'mistake_limit');
    const timeLimit = stage.failConditions.find((condition) => condition.type === 'time_limit');
    const focusLimit = stage.failConditions.find((condition) => condition.type === 'resource_depleted');
    const simultaneousLimit = stage.failConditions.find((condition) => condition.type === 'miss_simultaneous_window');

    this.state = {
      stageId: stage.id,
      phase: 'running',
      elapsedMs: 0,
      board,
      boardFlat,
      objectives: stage.objectives.map(createObjectiveProgress),
      completedObjectiveIds: [],
      failureRisk: {
        mistakesLeft: mistakeLimit ? mistakeLimit.maxMistakes : null,
        timeLeftMs: timeLimit ? timeLimit.limitMs : null,
        simultaneousMissesLeft: simultaneousLimit ? simultaneousLimit.maxMisses + 1 : null,
        focusLeft: focusLimit ? stage.rules.focusPool ?? 0 : null,
      },
      mistakes: 0,
      hintsRemaining,
      highlightedCellIds: [],
      pendingSimultaneous: null,
      lastEventText: stage.presentation.introDialogue,
      appliedModifiers: this.appliedModifiers,
    };
  }

  start(): void {
    this.startTime = performance.now();
    this.tick();
    this.notifyListeners();
  }

  handleInput(payload: StoryInputAction): void {
    if (this.state.phase !== 'running') {
      return;
    }

    if (payload.type === 'use_hint') {
      this.useHint();
      return;
    }

    const now = performance.now();
    this.updateElapsed(now);

    if (payload.type === 'multi_tap_cells') {
      payload.cellIds.forEach((cellId) => {
        this.handleTap(cellId, now);
      });
      return;
    }

    if (payload.type === 'hold_cell') {
      this.useHint();
      return;
    }

    this.handleTap(payload.cellId, now);
  }

  getState(): StoryRunState {
    return {
      ...this.state,
      board: this.state.board.map((row) => row.map((cell) => ({ ...cell, tags: [...cell.tags] }))),
      boardFlat: this.state.boardFlat.map((cell) => ({ ...cell, tags: [...cell.tags] })),
      objectives: this.state.objectives.map((objective) => ({ ...objective })),
      highlightedCellIds: [...this.state.highlightedCellIds],
      completedObjectiveIds: [...this.state.completedObjectiveIds],
      pendingSimultaneous: this.state.pendingSimultaneous
        ? {
            ...this.state.pendingSimultaneous,
            targetValues: [...this.state.pendingSimultaneous.targetValues],
            selectedCellIds: [...this.state.pendingSimultaneous.selectedCellIds],
          }
        : null,
      appliedModifiers: { ...this.state.appliedModifiers },
      failureRisk: { ...this.state.failureRisk },
    };
  }

  subscribe(listener: StoryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getResult(): StoryRunResult | null {
    return this.result
      ? {
          ...this.result,
          completedObjectives: [...this.result.completedObjectives],
          rewardsGranted: {
            ...this.result.rewardsGranted,
            skinUnlockIds: [...this.result.rewardsGranted.skinUnlockIds],
            stageUnlockIds: [...this.result.rewardsGranted.stageUnlockIds],
          },
          unlockChanges: this.result.unlockChanges.map((unlock) => ({ ...unlock })),
        }
      : null;
  }

  dispose(): void {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.hintTimeout !== null) {
      window.clearTimeout(this.hintTimeout);
      this.hintTimeout = null;
    }
    this.listeners.clear();
  }

  private tick = () => {
    if (this.state.phase !== 'running') {
      return;
    }

    const now = performance.now();
    this.updateElapsed(now);
    this.checkPendingSimultaneous(now);
    this.checkSurviveObjectives();
    this.checkTimeLimit();
    this.checkCompletion();
    this.notifyListeners();

    if (this.state.phase === 'running') {
      this.rafId = window.requestAnimationFrame(this.tick);
    }
  };

  private updateElapsed(now: number): void {
    if (this.startTime === null) {
      return;
    }

    this.state.elapsedMs = Math.max(0, now - this.startTime);
    const timeLimit = this.stage.failConditions.find((condition) => condition.type === 'time_limit');
    if (timeLimit) {
      this.state.failureRisk.timeLeftMs = Math.max(0, timeLimit.limitMs - this.state.elapsedMs);
    }
  }

  private handleTap(cellId: string, now: number): void {
    const cell = this.state.boardFlat.find((candidate) => candidate.id === cellId);
    if (!cell || cell.cleared) {
      this.registerWrong('That cell no longer counts.');
      return;
    }

    const simultaneousObjective = this.getNextIncompleteObjective('tap_simultaneous');
    if (
      simultaneousObjective &&
      simultaneousObjective.targetValues.includes(cell.value) &&
      (!this.state.pendingSimultaneous || this.state.pendingSimultaneous.objectiveId === simultaneousObjective.id)
    ) {
      this.handleSimultaneousTap(simultaneousObjective, cell, now);
      return;
    }

    const sequenceObjective = this.getNextIncompleteObjective('tap_sequence');
    if (sequenceObjective) {
      const progress = this.getProgress(sequenceObjective.id);
      const expectedValue = sequenceObjective.targetValues[progress.currentCount];
      if (cell.value === expectedValue) {
        this.clearCells([cell.id]);
        this.completeProgress(sequenceObjective.id, progress.currentCount + 1, sequenceObjective.targetValues.length);
        this.state.lastEventText = `Sequence advanced with ${cell.value}.`;
        this.checkCompletion();
        this.notifyListeners();
        return;
      }
    }

    const groupObjective = this.getNextIncompleteObjective('tap_group_any_order');
    if (groupObjective && cell.value === groupObjective.targetValue) {
      const progress = this.getProgress(groupObjective.id);
      this.clearCells([cell.id]);
      this.completeProgress(groupObjective.id, progress.currentCount + 1, groupObjective.requiredCount);
      this.state.lastEventText = `Cluster target ${groupObjective.targetValue} secured.`;
      this.checkCompletion();
      this.notifyListeners();
      return;
    }

    const taggedObjective = this.getNextIncompleteObjective('clear_tagged_cells');
    if (taggedObjective && cell.tags.includes(taggedObjective.tag)) {
      const progress = this.getProgress(taggedObjective.id);
      this.clearCells([cell.id]);
      this.completeProgress(taggedObjective.id, progress.currentCount + 1, taggedObjective.requiredCount);
      this.state.lastEventText = `Tagged cell "${taggedObjective.tag}" cleared.`;
      this.checkCompletion();
      this.notifyListeners();
      return;
    }

    this.registerWrong(`Wrong target: ${cell.value}.`);
  }

  private handleSimultaneousTap(
    objective: Extract<StoryObjectiveDefinition, { type: 'tap_simultaneous' }>,
    cell: StoryBoardCell,
    now: number
  ): void {
    const windowMs = objective.windowMs + this.appliedModifiers.simultaneousWindowBonusMs;
    const selectedCellIds = this.state.pendingSimultaneous?.selectedCellIds ?? [];

    if (selectedCellIds.includes(cell.id)) {
      this.registerWrong('Sync window expects distinct cells.');
      return;
    }

    const nextSelection = [...selectedCellIds, cell.id];
    this.state.pendingSimultaneous = {
      objectiveId: objective.id,
      targetValues: [...objective.targetValues],
      selectedCellIds: nextSelection,
      expiresAt: now + windowMs,
    };
    this.state.highlightedCellIds = [...nextSelection];
    this.state.lastEventText =
      nextSelection.length === 1 ? 'Sync armed. Finish the pair before the window closes.' : 'Sync pair captured.';

    if (nextSelection.length === objective.targetValues.length) {
      const selectedValues = nextSelection
        .map((selectedId) => this.state.boardFlat.find((boardCell) => boardCell.id === selectedId))
        .filter((boardCell): boardCell is StoryBoardCell => Boolean(boardCell))
        .map((boardCell) => boardCell.value);

      if (sameMultiset(selectedValues, objective.targetValues)) {
        this.clearCells(nextSelection);
        this.completeProgress(objective.id, objective.targetValues.length, objective.targetValues.length);
        this.state.pendingSimultaneous = null;
        this.state.highlightedCellIds = [];
        this.state.lastEventText = 'Sync objective completed inside the window.';
        this.checkCompletion();
        this.notifyListeners();
        return;
      }

      this.registerSimultaneousMiss('The sync set did not match the required values.');
      return;
    }

    this.notifyListeners();
  }

  private useHint(): void {
    if (this.state.hintsRemaining <= 0) {
      this.state.lastEventText = 'No hint charges remaining.';
      this.notifyListeners();
      return;
    }

    const targetIds = this.getHintTargetIds();
    if (targetIds.length === 0) {
      this.state.lastEventText = 'No live hint target for the current objective.';
      this.notifyListeners();
      return;
    }

    this.state.hintsRemaining -= 1;
    this.state.highlightedCellIds = targetIds;
    this.state.lastEventText = 'Hint pulse active.';

    if (this.hintTimeout !== null) {
      window.clearTimeout(this.hintTimeout);
    }

    this.hintTimeout = window.setTimeout(() => {
      if (!this.state.pendingSimultaneous) {
        this.state.highlightedCellIds = [];
      }
      this.notifyListeners();
    }, 1500);

    this.notifyListeners();
  }

  private getHintTargetIds(): string[] {
    const sequenceObjective = this.getNextIncompleteObjective('tap_sequence');
    if (sequenceObjective) {
      const progress = this.getProgress(sequenceObjective.id);
      const nextValue = sequenceObjective.targetValues[progress.currentCount];
      return this.state.boardFlat.filter((cell) => !cell.cleared && cell.value === nextValue).map((cell) => cell.id);
    }

    const simultaneousObjective = this.getNextIncompleteObjective('tap_simultaneous');
    if (simultaneousObjective) {
      return this.state.boardFlat
        .filter((cell) => !cell.cleared && simultaneousObjective.targetValues.includes(cell.value))
        .map((cell) => cell.id);
    }

    const groupObjective = this.getNextIncompleteObjective('tap_group_any_order');
    if (groupObjective) {
      return this.state.boardFlat
        .filter((cell) => !cell.cleared && cell.value === groupObjective.targetValue)
        .map((cell) => cell.id);
    }

    const taggedObjective = this.getNextIncompleteObjective('clear_tagged_cells');
    if (taggedObjective) {
      return this.state.boardFlat
        .filter((cell) => !cell.cleared && cell.tags.includes(taggedObjective.tag))
        .map((cell) => cell.id);
    }

    return [];
  }

  private getNextIncompleteObjective<T extends StoryObjectiveDefinition['type']>(
    type: T
  ): Extract<StoryObjectiveDefinition, { type: T }> | null {
    const objective = this.stage.objectives.find((candidate) => candidate.type === type && !this.getProgress(candidate.id).completed);
    return (objective as Extract<StoryObjectiveDefinition, { type: T }> | undefined) ?? null;
  }

  private getProgress(objectiveId: string): StoryObjectiveProgress {
    const progress = this.state.objectives.find((candidate) => candidate.objectiveId === objectiveId);
    if (!progress) {
      throw new Error(`Missing objective progress: ${objectiveId}`);
    }
    return progress;
  }

  private completeProgress(objectiveId: string, currentCount: number, targetCount: number): void {
    this.state.objectives = this.state.objectives.map((objective) => {
      if (objective.objectiveId !== objectiveId) {
        return objective;
      }

      const completed = currentCount >= targetCount;
      return {
        ...objective,
        completed,
        currentCount: Math.min(currentCount, targetCount),
        targetCount,
        currentLabel:
          objective.type === 'survive_duration'
            ? `${Math.min(Math.ceil(currentCount / 1000), Math.ceil(targetCount / 1000))} / ${Math.ceil(targetCount / 1000)}s`
            : formatObjectiveLabel(currentCount, targetCount),
      };
    });

    this.state.completedObjectiveIds = this.state.objectives
      .filter((objective) => objective.completed)
      .map((objective) => objective.objectiveId);
  }

  private clearCells(cellIds: string[]): void {
    const idSet = new Set(cellIds);
    this.state.board = this.state.board.map((row) =>
      row.map((cell) => (idSet.has(cell.id) ? { ...cell, cleared: true } : cell))
    );
    this.state.boardFlat = this.state.board.flat();
  }

  private checkPendingSimultaneous(now: number): void {
    if (!this.state.pendingSimultaneous) {
      return;
    }

    if (now > this.state.pendingSimultaneous.expiresAt) {
      this.registerSimultaneousMiss('The sync window closed before the full set landed.');
    }
  }

  private registerSimultaneousMiss(message: string): void {
    this.state.pendingSimultaneous = null;
    this.state.highlightedCellIds = [];
    this.simultaneousMisses += 1;
    const limit = this.stage.failConditions.find((condition) => condition.type === 'miss_simultaneous_window');
    if (limit) {
      this.state.failureRisk.simultaneousMissesLeft = Math.max(0, limit.maxMisses + 1 - this.simultaneousMisses);
      if (this.simultaneousMisses > limit.maxMisses) {
        this.failRun(limit, message);
        return;
      }
    }

    this.registerWrong(message, false);
  }

  private registerWrong(message: string, notify = true): void {
    this.state.mistakes += 1;
    this.state.lastEventText = message;

    const mistakeLimit = this.stage.failConditions.find((condition) => condition.type === 'mistake_limit');
    if (mistakeLimit) {
      this.state.failureRisk.mistakesLeft = Math.max(0, mistakeLimit.maxMistakes - this.state.mistakes);
      if (this.state.mistakes > mistakeLimit.maxMistakes) {
        this.failRun(mistakeLimit, 'Mistake limit exceeded.');
        return;
      }
    }

    const focusLimit = this.stage.failConditions.find((condition) => condition.type === 'resource_depleted');
    if (focusLimit && this.state.failureRisk.focusLeft !== null) {
      this.state.failureRisk.focusLeft = Math.max(0, this.state.failureRisk.focusLeft - 1);
      if (this.state.failureRisk.focusLeft <= 0) {
        this.failRun(focusLimit, 'Focus reserve depleted.');
        return;
      }
    }

    if (notify) {
      this.notifyListeners();
    }
  }

  private checkSurviveObjectives(): void {
    this.stage.objectives.forEach((objective) => {
      if (objective.type !== 'survive_duration') {
        return;
      }

      const progress = this.getProgress(objective.id);
      if (progress.completed) {
        return;
      }

      this.completeProgress(objective.id, this.state.elapsedMs, objective.durationMs);
    });
  }

  private checkTimeLimit(): void {
    const timeLimit = this.stage.failConditions.find((condition) => condition.type === 'time_limit');
    if (!timeLimit) {
      return;
    }

    if (this.state.elapsedMs > timeLimit.limitMs) {
      this.failRun(timeLimit, 'Time limit reached.');
    }
  }

  private checkCompletion(): void {
    const complete = this.state.objectives.every((objective) => objective.completed || !objective.required);
    if (!complete || this.state.phase !== 'running') {
      return;
    }

    this.state.phase = 'success';
    this.state.highlightedCellIds = [];
    this.state.pendingSimultaneous = null;
    this.state.lastEventText = this.stage.presentation.victoryDialogue;
    this.result = {
      success: true,
      stageId: this.stage.id,
      completedObjectives: [...this.state.completedObjectiveIds],
      rewardsGranted: {
        ...this.stage.rewards,
        skinUnlockIds: [...this.stage.rewards.skinUnlockIds],
        stageUnlockIds: [...this.stage.rewards.stageUnlockIds],
      },
      unlockChanges: [],
      elapsedMs: this.state.elapsedMs,
      usedSkinId: '',
    };
  }

  private failRun(condition: StoryFailCondition, message: string): void {
    this.state.phase = 'failed';
    this.state.pendingSimultaneous = null;
    this.state.highlightedCellIds = [];
    this.state.lastEventText = message;
    this.result = {
      success: false,
      stageId: this.stage.id,
      completedObjectives: [...this.state.completedObjectiveIds],
      failedCondition: condition,
      rewardsGranted: {
        ...ZERO_REWARD,
        skinUnlockIds: [],
        stageUnlockIds: [],
      },
      unlockChanges: [],
      elapsedMs: this.state.elapsedMs,
      usedSkinId: '',
    };
  }

  private notifyListeners(): void {
    const snapshot = this.getState();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
