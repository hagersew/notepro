import type { HighlightColor } from '@shared/types'
import { getToolbarShadowStyles } from '../ui/tokens'

const COLORS: HighlightColor[] = ['yellow', 'green', 'blue', 'pink']

export type ToolbarCallbacks = {
  onColor: (color: HighlightColor) => void
  onSave: (note: string, color: HighlightColor) => void
  onDismiss: () => void
}

let hostEl: HTMLDivElement | null = null
let shadow: ShadowRoot | null = null
let selectedColor: HighlightColor = 'yellow'
let noteValue = ''

async function resolveToolbarTheme(): Promise<'light' | 'dark'> {
  try {
    const res = await chrome.storage.local.get('notepro_color_mode')
    const mode = res?.notepro_color_mode
    if (mode === 'light' || mode === 'dark') return mode
  } catch {
    /* fall back to system preference */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function removeToolbar(): void {
  hostEl?.remove()
  hostEl = null
  shadow = null
}

export async function showToolbarAt(x: number, y: number, callbacks: ToolbarCallbacks): Promise<void> {
  removeToolbar()
  const toolbarTheme = await resolveToolbarTheme()
  const TOOLBAR_W = 320
  const TOOLBAR_H = 180
  const MARGIN = 8
  const clampedX = Math.max(MARGIN, Math.min(x, window.innerWidth - TOOLBAR_W - MARGIN))
  const belowY = y + 8
  const aboveY = y - TOOLBAR_H - 8
  const preferredY = belowY + TOOLBAR_H <= window.innerHeight ? belowY : aboveY
  const clampedY = Math.max(MARGIN, Math.min(preferredY, window.innerHeight - TOOLBAR_H - MARGIN))

  hostEl = document.createElement('div')
  hostEl.id = 'notepro-toolbar-host'
  hostEl.style.all = 'initial'
  hostEl.style.position = 'fixed'
  hostEl.style.left = `${clampedX}px`
  hostEl.style.top = `${clampedY}px`
  hostEl.style.zIndex = '2147483646'
  hostEl.style.pointerEvents = 'auto'
  shadow = hostEl.attachShadow({ mode: 'open' })

  const wrap = document.createElement('div')
  wrap.innerHTML = `
    <style>${getToolbarShadowStyles(toolbarTheme)}</style>
    <div class="panel">
      <div class="label-row">
        <span class="brand">NotePro</span>
        <span class="sub">Highlight</span>
      </div>
      <div class="colors-label">Color</div>
      <div class="colors">
        ${COLORS.map(
          (c) =>
            `<button type="button" class="chip c-${c}" data-color="${c}" aria-label="${c} highlight"></button>`,
        ).join('')}
      </div>
      <textarea placeholder="Add a note (optional)" rows="2"></textarea>
      <div class="row">
        <button type="button" class="action btn-dismiss">Cancel</button>
        <button type="button" class="action btn-save">Save highlight</button>
      </div>
    </div>
  `
  shadow.appendChild(wrap)

  const chips = shadow.querySelectorAll<HTMLButtonElement>('.chip')
  const textarea = shadow.querySelector('textarea')
  const btnDismiss = shadow.querySelector('.btn-dismiss')
  const btnSave = shadow.querySelector('.btn-save')

  function updateActive(): void {
    chips.forEach((ch) => {
      ch.dataset.active = ch.dataset.color === selectedColor ? 'true' : 'false'
    })
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const c = chip.dataset.color as HighlightColor
      selectedColor = c
      updateActive()
      callbacks.onColor(c)
    })
  })

  textarea?.addEventListener('input', () => {
    noteValue = textarea.value
  })

  btnDismiss?.addEventListener('click', () => {
    callbacks.onDismiss()
    removeToolbar()
  })

  btnSave?.addEventListener('click', () => {
    const note = textarea?.value ?? ''
    callbacks.onSave(note, selectedColor)
    removeToolbar()
  })

  selectedColor = 'yellow'
  noteValue = ''
  if (textarea) textarea.value = ''
  updateActive()

  document.documentElement.appendChild(hostEl)
}

export function getToolbarNoteSnapshot(): string {
  return noteValue
}
