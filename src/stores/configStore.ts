import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_CONFIG,
  PURE_MODULES,
  STANDARD_MODULES,
  type AppConfig,
  type AppLocale,
  type OptionalModules,
  type UiPreset,
} from '@/types/config';

interface ConfigStore extends AppConfig {
  setSize: (size: number) => void;
  setLayers: (layers: number) => void;
  setSeed: (seed: string) => void;
  setLocale: (locale: AppLocale) => void;
  toggleLazy: () => void;
  toggleAutoFinalClick: () => void;
  toggleAxisLabels: () => void;
  toggleHideFinalLayer: () => void;
  setKeyBinding: (type: 'row' | 'col', index: number, key: string) => void;
  setTheme: (theme: string) => void;
  toggleExpandMode: () => void;
  setExpandModeEnabled: (enabled: boolean) => void;
  setExpandSize: (size: number) => void;
  setMasterVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  toggleMuted: () => void;
  setBackgroundImage: (image: string) => void;
  setUiPreset: (preset: UiPreset) => void;
  setModuleEnabled: <K extends keyof OptionalModules>(module: K, enabled: boolean) => void;
  resetToPurePreset: () => void;
  reset: () => void;
}

const clampAudioUnit = (value: number) => Math.max(0, Math.min(1, value));

const getModulesForPreset = (preset: UiPreset): OptionalModules =>
  preset === 'standard' ? { ...STANDARD_MODULES } : { ...PURE_MODULES };

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      ...DEFAULT_CONFIG,
      modules: { ...DEFAULT_CONFIG.modules },
      setSize: (size) => set({ defaultSize: size }),
      setLayers: (layers) => set({ defaultLayers: layers }),
      setSeed: (seed) => set({ seed }),
      setLocale: (locale) => set({ locale }),
      toggleLazy: () => set((state) => ({ lazy: !state.lazy })),
      toggleAutoFinalClick: () => set((state) => ({ autoFinalClick: !state.autoFinalClick })),
      toggleAxisLabels: () => set((state) => ({ hideAxisLabels: !state.hideAxisLabels })),
      toggleHideFinalLayer: () => set((state) => ({ hideFinalLayer: !state.hideFinalLayer })),
      setKeyBinding: (type, index, key) =>
        set((state) => ({
          keyBindings: {
            ...state.keyBindings,
            [`${type}_${index}`]: key,
          },
        })),
      setTheme: (theme) => set({ theme }),
      toggleExpandMode: () => set((state) => ({ expandMode: !state.expandMode })),
      setExpandModeEnabled: (enabled) => set({ expandMode: enabled }),
      setExpandSize: (size) => set({ expandSize: size }),
      setMasterVolume: (volume) => set({ masterVolume: clampAudioUnit(volume) }),
      setSfxVolume: (volume) => set({ sfxVolume: clampAudioUnit(volume) }),
      setMusicVolume: (volume) => set({ musicVolume: clampAudioUnit(volume) }),
      toggleMuted: () => set((state) => ({ muted: !state.muted })),
      setBackgroundImage: (image) => set({ backgroundImage: image }),
      setUiPreset: (preset) =>
        set({
          uiPreset: preset,
          modules: getModulesForPreset(preset),
        }),
      setModuleEnabled: (module, enabled) =>
        set((state) => ({
          modules: {
            ...state.modules,
            [module]: enabled,
          },
        })),
      resetToPurePreset: () =>
        set({
          uiPreset: 'pure',
          modules: getModulesForPreset('pure'),
        }),
      reset: () =>
        set({
          ...DEFAULT_CONFIG,
          modules: { ...DEFAULT_CONFIG.modules },
        }),
    }),
    {
      name: 'simulated-athletics-config',
      merge: (persistedState, currentState) => {
        const mergedState = {
          ...currentState,
          ...(persistedState as Partial<ConfigStore>),
        };

        const resolvedPreset = mergedState.uiPreset ?? currentState.uiPreset;
        const persistedModules = (persistedState as Partial<ConfigStore> | undefined)?.modules;

        return {
          ...mergedState,
          uiPreset: resolvedPreset,
          modules: {
            ...getModulesForPreset(resolvedPreset),
            ...(persistedModules ?? {}),
          },
        };
      },
    }
  )
);
