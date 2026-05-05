import type { Annotation, HighlightColor } from '@shared/types'
import {
  resolveHighlightContainer,
  rangeToOffsets,
  elementToXPath,
  makeQuoteAnchors,
} from '@shared/anchoring'
import { normalizePageUrl } from '@shared/url'
import type { ExtensionMessage } from '@shared/messages'
import {
  injectHighlightStyles,
  applyAnnotationHighlight,
  unwrapNoteproMarks,
} from './highlightDom'
import { showToolbarAt } from './toolbar'

injectHighlightStyles()

let hydrateTimer: ReturnType<typeof setTimeout> | null = null
let obs: MutationObserver | null = null
let applyingHighlights = false
let launcherBtn: HTMLButtonElement | null = null
let openingSidePanel = false

function mountOpenNoteProButton(): void {
  if (launcherBtn || document.getElementById('notepro-open-btn')) return
  const btn = document.createElement('button')
  btn.id = 'notepro-open-btn'
  btn.type = 'button'
  btn.textContent = 'Open Note Pro'
  btn.style.position = 'fixed'
  btn.style.right = '16px'
  btn.style.bottom = '16px'
  btn.style.zIndex = '2147483645'
  btn.style.padding = '10px 14px'
  btn.style.border = '0'
  btn.style.borderRadius = '999px'
  btn.style.background = '#6b46c1'
  btn.style.color = '#fff'
  btn.style.fontFamily = 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
  btn.style.fontSize = '13px'
  btn.style.fontWeight = '600'
  btn.style.cursor = 'pointer'
  btn.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)'
  btn.addEventListener('click', async () => {
    if (openingSidePanel) return
    openingSidePanel = true
    btn.disabled = true
    btn.style.opacity = '0.7'
    btn.style.transform = 'translateY(1px)'
    const res = await chrome.runtime.sendMessage({
      type: 'OPEN_SIDEPANEL',
    } satisfies ExtensionMessage)
    if (res?.ok) {
      launcherBtn?.remove()
      launcherBtn = null
      openingSidePanel = false
      return
    }
    openingSidePanel = false
    btn.disabled = false
    btn.style.opacity = '1'
    btn.style.transform = 'none'
  })
  launcherBtn = btn
  document.documentElement.appendChild(btn)
}

function eventFromToolbar(evt: Event): boolean {
  const path = evt.composedPath?.() ?? []
  return path.some((node) => node instanceof Element && node.id === 'notepro-toolbar-host')
}

function selectionTouchesToolbar(sel: Selection): boolean {
  const walk = (start: Node | null): boolean => {
    let cur: Node | null = start
    while (cur) {
      if (cur instanceof Element && cur.id === 'notepro-toolbar-host') return true
      if (cur instanceof ShadowRoot) {
        cur = cur.host
        continue
      }
      cur = cur.parentNode
    }
    return false
  }
  return walk(sel.anchorNode) || walk(sel.focusNode)
}

async function fetchAnnotationsForPage(): Promise<Annotation[]> {
  const url = normalizePageUrl(window.location.href)
  const res = await chrome.runtime.sendMessage({
    type: 'GET_ANNOTATIONS_FOR_URL',
    url,
  } satisfies ExtensionMessage)
  if (res?.ok && Array.isArray(res.annotations)) return res.annotations
  return []
}

function scheduleHydrate(): void {
  if (hydrateTimer) clearTimeout(hydrateTimer)
  hydrateTimer = setTimeout(() => {
    hydrateTimer = null
    void hydrateHighlights()
  }, 120)
}

async function hydrateHighlights(): Promise<void> {
  applyingHighlights = true
  obs?.disconnect()
  try {
    const list = (await fetchAnnotationsForPage()).slice().sort((a, b) => a.createdAt - b.createdAt)
    unwrapNoteproMarks(document)
    for (const a of list) {
      applyAnnotationHighlight(document, a)
    }
  } finally {
    applyingHighlights = false
    const rootEl = document.documentElement
    if (rootEl) obs?.observe(rootEl, { childList: true, subtree: true })
  }
}

function scrollToId(id: string): void {
  const el = document.querySelector(`mark[data-notepro-id="${CSS.escape(id)}"]`)
  el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

chrome.runtime.onMessage.addListener((msg: { type?: string; id?: string }) => {
  if (msg?.type === 'NOTEPRO_SCROLL_TO' && msg.id) {
    scrollToId(msg.id)
    return
  }
  if (msg?.type === 'NOTEPRO_SHOW_OPEN_BUTTON') {
    mountOpenNoteProButton()
  }
})

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return
  if (!changes.notepro_annotations) return
  scheduleHydrate()
})

function patchHistory(): void {
  const cb = () => scheduleHydrate()
  const ap = history.pushState
  const ar = history.replaceState
  history.pushState = function (...args: Parameters<typeof history.pushState>) {
    const r = ap.apply(this, args)
    queueMicrotask(cb)
    return r
  }
  history.replaceState = function (...args: Parameters<typeof history.replaceState>) {
    const r = ar.apply(this, args)
    queueMicrotask(cb)
    return r
  }
  window.addEventListener('popstate', cb)
}

patchHistory()
mountOpenNoteProButton()

if (!obs) {
  obs = new MutationObserver(() => {
    if (applyingHighlights) return
    scheduleHydrate()
  })
  const mountRoot = document.documentElement
  if (mountRoot) obs.observe(mountRoot, { childList: true, subtree: true })
}

let selectionTimer: ReturnType<typeof setTimeout> | null = null

function handleSelection(): void {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || !sel.rangeCount) {
    return
  }
  if (selectionTouchesToolbar(sel)) return
  const range = sel.getRangeAt(0).cloneRange()
  const text = range.toString().trim()
  if (!text || text.length < 1) return

  let draft: {
    selectedText: string
    xpath: string
    offsetStart: number
    offsetEnd: number
    quotePrefix?: string
    quoteSuffix?: string
  }
  try {
    const container = resolveHighlightContainer(range)
    const { start, end } = rangeToOffsets(container, range)
    draft = {
      selectedText: text,
      xpath: elementToXPath(container),
      offsetStart: start,
      offsetEnd: end,
      ...makeQuoteAnchors(text),
    }
  } catch (e) {
    console.warn('[NotePro] could not capture selection anchor', e)
    return
  }

  const rect = range.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top

  void showToolbarAt(x, y, {
    onColor() {},
    onDismiss() {
      window.getSelection()?.removeAllRanges()
    },
    onSave: async (note, color) => {
      try {
        const id = crypto.randomUUID()
        const annotation: Annotation = {
          id,
          url: normalizePageUrl(window.location.href),
          title: document.title,
          selectedText: draft.selectedText,
          note,
          color: color as HighlightColor,
          createdAt: Date.now(),
          position: {
            xpath: draft.xpath,
            offsetStart: draft.offsetStart,
            offsetEnd: draft.offsetEnd,
          },
          quotePrefix: draft.quotePrefix,
          quoteSuffix: draft.quoteSuffix,
        }
        await chrome.runtime.sendMessage({
          type: 'SAVE_ANNOTATION',
          annotation,
        } satisfies ExtensionMessage)
        window.getSelection()?.removeAllRanges()
        await hydrateHighlights()
      } catch (e) {
        console.warn('[NotePro] save failed', e)
      }
    },
  })
}

document.addEventListener(
  'mouseup',
  (evt) => {
    if (eventFromToolbar(evt)) return
    if (selectionTimer) clearTimeout(selectionTimer)
    selectionTimer = setTimeout(() => handleSelection(), 10)
  },
  true,
)

document.addEventListener(
  'keyup',
  (e) => {
    if (eventFromToolbar(e)) return
    if (e.key === 'Shift' || e.key.startsWith('Arrow')) {
      if (selectionTimer) clearTimeout(selectionTimer)
      selectionTimer = setTimeout(() => handleSelection(), 10)
    }
  },
  true,
)

void hydrateHighlights()
