/**
 * Visual tokens shared conceptually with Shadow DOM toolbar + static share page (hex duplicated in HTML vars).
 */
import type { HighlightColor } from '@shared/types'

export const brand = {
  /** Indigo → violet gradient stops */
  start: '#6366f1',
  mid: '#7c3aed',
  end: '#a855f7',
} as const

export const surface = {
  deep: '#0c0e14',
  elevated: '#13151f',
  raised: '#1a1d2e',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
} as const

export const text = {
  primary: '#f1f5f9',
  muted: '#94a3b8',
  subtle: '#64748b',
} as const

/** Accent colors aligned with highlight chips / marks */
export const highlightAccent: Record<HighlightColor, string> = {
  yellow: '#eab308',
  green: '#22c55e',
  blue: '#3b82f6',
  pink: '#ec4899',
}

export const highlightSoftBg: Record<HighlightColor, string> = {
  yellow: 'rgba(234, 179, 8, 0.12)',
  green: 'rgba(34, 197, 94, 0.12)',
  blue: 'rgba(59, 130, 246, 0.12)',
  pink: 'rgba(236, 72, 153, 0.12)',
}

/** Focus ring (toolbar textarea / buttons) — matches Chakra brand focus */
export const focusRing = '0 0 0 3px rgba(129, 140, 248, 0.45)'

/**
 * CSS injected into content-script Shadow DOM — keep in sync with `surface` / `brand` / `text`.
 */
export function getToolbarShadowStyles(theme: 'light' | 'dark' = 'dark'): string {
  const isLight = theme === 'light'
  const panelBg = isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(19, 21, 31, 0.82)'
  const panelBorder = isLight ? 'rgba(15, 23, 42, 0.14)' : surface.borderStrong
  const panelShadow = isLight
    ? '0 4px 6px -1px rgba(15, 23, 42, 0.15), 0 20px 40px -12px rgba(15, 23, 42, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.7)'
    : '0 4px 6px -1px rgba(0, 0, 0, 0.35), 0 20px 40px -12px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
  const primaryText = isLight ? '#1e293b' : text.primary
  const mutedText = isLight ? '#475569' : text.muted
  const subtleText = isLight ? '#64748b' : text.subtle
  const textareaBg = isLight ? 'rgba(248, 250, 252, 0.94)' : 'rgba(12, 14, 20, 0.65)'
  const textareaBorder = isLight ? 'rgba(15, 23, 42, 0.18)' : surface.borderStrong
  const dismissBg = isLight ? '#e2e8f0' : surface.raised
  const dismissBorder = isLight ? 'rgba(15, 23, 42, 0.18)' : surface.border
  const chipActiveBorder = isLight ? '#1e293b' : text.primary

  return `
      :host {
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        line-height: 1.45;
        color: ${primaryText};
      }
      .panel {
        width: 100%;
        max-width: min(320px, calc(100vw - 24px));
        padding: 12px 14px;
        border-radius: 14px;
        background: ${panelBg};
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid ${panelBorder};
        box-shadow: ${panelShadow};
      }
      .label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .brand {
        font-weight: 700;
        font-size: 12px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        background: linear-gradient(90deg, ${brand.start}, ${brand.end});
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      .sub {
        font-size: 11px;
        color: ${subtleText};
      }
      .colors-label {
        font-size: 11px;
        color: ${mutedText};
        margin-bottom: 6px;
      }
      .colors {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .chip {
        width: 26px;
        height: 26px;
        border-radius: 999px;
        border: 2px solid transparent;
        cursor: pointer;
        transition: transform 0.12s ease, box-shadow 0.12s ease;
        box-shadow: inset 0 0 0 1px rgba(0,0,0,0.25);
      }
      .chip:hover {
        transform: scale(1.08);
      }
      .chip[data-active="true"] {
        border-color: ${chipActiveBorder};
        box-shadow: ${focusRing};
      }
      .c-yellow { background: #fde047; }
      .c-green { background: #4ade80; }
      .c-blue { background: #60a5fa; }
      .c-pink { background: #f472b6; }
      textarea {
        width: 100%;
        min-height: 52px;
        resize: vertical;
        border-radius: 10px;
        border: 1px solid ${textareaBorder};
        padding: 10px 12px;
        margin-top: 10px;
        background: ${textareaBg};
        color: ${primaryText};
        font: inherit;
        box-sizing: border-box;
        outline: none;
      }
      textarea::placeholder {
        color: ${subtleText};
      }
      textarea:focus {
        border-color: rgba(129, 140, 248, 0.65);
        box-shadow: ${focusRing};
      }
      .row {
        width: 100%;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        flex-wrap: wrap;
        margin-top: 10px;
      }
      button.action {
        border: none;
        border-radius: 10px;
        padding: 8px 14px;
        cursor: pointer;
        font: inherit;
        font-weight: 600;
        transition: opacity 0.15s ease, transform 0.12s ease;
      }
      button.action:active {
        transform: scale(0.98);
      }
      .btn-dismiss {
        background: ${dismissBg};
        color: ${mutedText};
        border: 1px solid ${dismissBorder};
      }
      .btn-dismiss:hover {
        color: ${primaryText};
        border-color: ${textareaBorder};
      }
      .btn-save {
        color: #fff;
        background: linear-gradient(135deg, ${brand.start}, ${brand.mid});
        box-shadow: 0 4px 14px rgba(99, 102, 241, 0.45);
      }
      .btn-save:hover {
        opacity: 0.95;
      }
    `
}
