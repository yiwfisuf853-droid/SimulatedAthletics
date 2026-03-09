export type AppLocale = 'en' | 'zh-CN';

export type StoryMatchStyle = 'training' | 'standard' | 'duel' | 'boss';

export type UiPreset = 'pure' | 'standard';

export interface KeyBindings {
  [key: `row_${number}`]: string;
  [key: `col_${number}`]: string;
}

export interface OptionalModules {
  leaderboard: boolean;
  virtualKeyboard: boolean;
  keyboardScore: boolean;
  audio: boolean;
  theme: boolean;
  storyEntry: boolean;
  multiplayer: boolean;
  achievements: boolean;
}

export interface AppConfig {
  defaultSize: number;
  defaultLayers: number;
  lazy: boolean;
  autoFinalClick: boolean;
  hideAxisLabels: boolean;
  keyBindings: KeyBindings;
  seed: string;

  theme: string;
  locale: AppLocale;

  expandMode: boolean;
  expandSize: number;

  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  muted: boolean;

  hideFinalLayer: boolean;
  backgroundImage: string;
  uiPreset: UiPreset;
  modules: OptionalModules;
}

export const PURE_MODULES: OptionalModules = {
  leaderboard: false,
  virtualKeyboard: false,
  keyboardScore: false,
  audio: false,
  theme: false,
  storyEntry: true,
  multiplayer: true,
  achievements: true,
};

export const STANDARD_MODULES: OptionalModules = {
  ...PURE_MODULES,
  leaderboard: true,
  virtualKeyboard: true,
  keyboardScore: true,
  audio: true,
  theme: true,
};

export const DEFAULT_CONFIG: AppConfig = {
  defaultSize: 4,
  defaultLayers: 3,
  lazy: false,
  autoFinalClick: false,
  hideAxisLabels: false,
  keyBindings: {},
  seed: '',
  theme: 'classic',
  locale: 'en',
  expandMode: false,
  expandSize: 6,
  masterVolume: 1.0,
  sfxVolume: 0.8,
  musicVolume: 0.5,
  muted: false,
  hideFinalLayer: false,
  backgroundImage: '',
  uiPreset: 'pure',
  modules: PURE_MODULES,
};
