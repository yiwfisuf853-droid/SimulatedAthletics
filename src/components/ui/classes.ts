type ClassValue = string | false | null | undefined;

export const cn = (...classes: ClassValue[]) => classes.filter(Boolean).join(' ');

interface PanelShellOptions {
  variant?: 'sidebar' | 'toolbar';
}

export const panelShellClass = ({ variant = 'sidebar' }: PanelShellOptions = {}) =>
  cn(
    'rounded-[24px] border backdrop-blur-[12px] transition-all duration-300',
    'shadow-[inset_0_1px_3px_rgba(255,255,255,0.24),0_12px_28px_rgba(0,20,40,0.1)]',
    variant === 'sidebar' &&
      'flex min-h-0 flex-col gap-4 overflow-y-auto border-white/45 bg-[var(--panel-bg)] p-[18px_14px] dark:border-white/8',
    variant === 'toolbar' &&
      'mb-4 flex flex-wrap items-center gap-3 border-[#d9e1ec] bg-white/84 px-3 py-3 dark:border-[#444] dark:bg-[#2f2f2f]/88'
  );

interface SurfaceCardOptions {
  compact?: boolean;
  interactive?: boolean;
  align?: 'left' | 'center' | 'right';
  tone?: 'default' | 'muted' | 'accent';
}

export const panelCardClass = ({
  compact = false,
  interactive = false,
  align = 'left',
  tone = 'default',
}: SurfaceCardOptions = {}) =>
  cn(
    'rounded-2xl border shadow-[0_10px_24px_rgba(0,20,40,0.08)] backdrop-blur',
    tone === 'default' && 'border-white/60 bg-white/92 dark:border-white/6 dark:bg-[#3f3f3f]/92',
    tone === 'muted' && 'border-[#dde6f0] bg-[#f8fbfe]/94 dark:border-[#4b4f56] dark:bg-[#32353a]/92',
    tone === 'accent' && 'border-[#d2e1f0] bg-[linear-gradient(180deg,rgba(250,253,255,0.98),rgba(240,247,252,0.96))] dark:border-[#4b5d72] dark:bg-[linear-gradient(180deg,rgba(56,63,72,0.96),rgba(46,51,58,0.94))]',
    compact ? 'px-3 py-2.5' : 'p-4',
    interactive &&
      'transition-[transform,background-color,border-color,box-shadow] duration-200 hover:-translate-y-[1px] hover:border-[#d7e3ee] hover:bg-white dark:hover:border-[#5a5a5a] dark:hover:bg-[#494949]',
    align === 'center' && 'text-center',
    align === 'right' && 'text-right'
  );

export const panelEyebrowClass =
  'text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f8297] dark:text-[#b7c0c8]';

export const panelTitleClass = 'text-sm font-semibold text-[#29435c] dark:text-[#e0e0e0]';

export const controlGroupClass = cn(
  'flex flex-wrap items-center gap-2 rounded-[20px]',
  'border border-[#e4ebf4] bg-[#f7fbff]/92 px-3 py-2',
  'dark:border-[#454545] dark:bg-[#373737]/88'
);

interface ToolbarButtonOptions {
  active?: boolean;
  compact?: boolean;
  variant?: 'neutral' | 'primary' | 'danger' | 'accent';
}

export const controlButtonClass = ({
  active = false,
  compact = false,
  variant = 'neutral',
}: ToolbarButtonOptions = {}) =>
  cn(
    'rounded-full font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
    compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-2 text-sm',
    variant === 'primary' &&
      (active
        ? 'bg-[#1e2b3a] text-white shadow-[0_8px_18px_rgba(30,43,58,0.22)] dark:bg-[#6a9aff] dark:text-[#10233d]'
        : 'bg-[#1e2b3a] text-white hover:bg-[#27384a] dark:bg-[#4e78c7] dark:text-[#f4f8ff] dark:hover:bg-[#5c86d6]'),
    variant === 'danger' &&
      (active
        ? 'bg-[#c44] text-white shadow-[0_8px_18px_rgba(196,68,68,0.24)] dark:bg-[#8b2f2f] dark:text-[#ffecec]'
        : 'bg-[#ffe8e8] text-[#c44] hover:bg-[#ffd7d7] dark:bg-[#5a1a1a] dark:text-[#ff7b7b] dark:hover:bg-[#6a2222]'),
    variant === 'accent' &&
      (active
        ? 'bg-[#d48b1f] text-white shadow-[0_8px_18px_rgba(212,139,31,0.22)] dark:bg-[#c47800]'
        : 'bg-[#fff1d8] text-[#9b6410] hover:bg-[#ffe7bf] dark:bg-[#594119] dark:text-[#ffcb7d] dark:hover:bg-[#684d1d]'),
    variant === 'neutral' &&
      (active
        ? 'bg-[#1e2b3a] text-white shadow-[0_8px_18px_rgba(30,43,58,0.18)] dark:bg-[#6a9aff] dark:text-[#10233d]'
        : 'bg-[#eef4fb] text-[#1e3b5c] hover:bg-[#dde9f5] dark:bg-[#3a3a3a] dark:text-[#e0e0e0] dark:hover:bg-[#4a4a4a]')
  );

export const controlInputClass = cn(
  'rounded-full border border-[#cdd6e4] bg-[#f7fbff] px-3 py-2 text-center text-xs font-medium text-[#2c3e50] outline-none transition-colors',
  'placeholder:text-[#8fa0b3] focus:border-[#9eb6cf] focus:bg-white dark:border-[#555] dark:bg-[#3a3a3a] dark:text-[#e0e0e0] dark:placeholder:text-[#8a8a8a] dark:focus:border-[#6a9aff]'
);

export const infoPanelShellClass = panelShellClass({ variant: 'sidebar' });
export const surfaceCardClass = panelCardClass;
export const toolbarShellClass = panelShellClass({ variant: 'toolbar' });
export const toolbarGroupClass = controlGroupClass;
export const toolbarLabelClass = panelEyebrowClass;
export const toolbarButtonClass = controlButtonClass;
export const toolbarInputClass = controlInputClass;
