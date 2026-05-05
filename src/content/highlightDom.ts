import type { Annotation, HighlightColor } from '@shared/types'
import {
  elementFromXPath,
  offsetsToRange,
  findSubstringRange,
} from '@shared/anchoring'

const STYLE_ID = 'notepro-highlight-styles'

export function injectHighlightStyles(): void {
  if (document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    mark.notepro-hl[data-notepro-mark] {
      padding: 0 2px;
      border-radius: 4px;
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
    }
    .notepro-yellow {
      background-color: rgba(253, 224, 71, 0.42);
      outline: 1px solid rgba(234, 179, 8, 0.35);
      color: inherit;
    }
    .notepro-green {
      background-color: rgba(74, 222, 128, 0.35);
      outline: 1px solid rgba(34, 197, 94, 0.35);
      color: inherit;
    }
    .notepro-blue {
      background-color: rgba(96, 165, 250, 0.38);
      outline: 1px solid rgba(59, 130, 246, 0.35);
      color: inherit;
    }
    .notepro-pink {
      background-color: rgba(244, 114, 182, 0.38);
      outline: 1px solid rgba(236, 72, 153, 0.35);
      color: inherit;
    }
    @media (prefers-color-scheme: dark) {
      .notepro-yellow { background-color: rgba(253, 224, 71, 0.28); outline-color: rgba(234, 179, 8, 0.28); }
      .notepro-green { background-color: rgba(74, 222, 128, 0.22); outline-color: rgba(34, 197, 94, 0.28); }
      .notepro-blue { background-color: rgba(96, 165, 250, 0.26); outline-color: rgba(59, 130, 246, 0.28); }
      .notepro-pink { background-color: rgba(244, 114, 182, 0.26); outline-color: rgba(236, 72, 153, 0.28); }
    }
  `
  document.documentElement.appendChild(el)
}

export function wrapRangeWithHighlight(range: Range, id: string, color: HighlightColor): boolean {
  try {
    const mark = document.createElement('mark')
    mark.setAttribute('data-notepro-mark', '')
    mark.setAttribute('data-notepro-id', id)
    mark.className = `notepro-hl notepro-${color}`
    range.surroundContents(mark)
    return true
  } catch {
    try {
      const mark = document.createElement('mark')
      mark.setAttribute('data-notepro-mark', '')
      mark.setAttribute('data-notepro-id', id)
      mark.className = `notepro-hl notepro-${color}`
      const frag = range.extractContents()
      mark.appendChild(frag)
      range.insertNode(mark)
      return true
    } catch {
      return false
    }
  }
}

export function unwrapNoteproMarks(doc: Document): void {
  const marks = Array.from(doc.querySelectorAll('mark[data-notepro-mark]'))
  for (const el of marks) {
    const parent = el.parentNode
    if (!parent) continue
    while (el.firstChild) parent.insertBefore(el.firstChild, el)
    parent.removeChild(el)
  }
  doc.body?.normalize()
}

export function applyAnnotationHighlight(doc: Document, a: Annotation): boolean {
  const existing = doc.querySelector(`mark[data-notepro-id="${cssEscape(a.id)}"]`)
  if (existing) return true

  const container = elementFromXPath(doc, a.position.xpath)
  if (!container) return false

  let range = offsetsToRange(container, a.position.offsetStart, a.position.offsetEnd)
  if (!range) {
    range = findSubstringRange(container, a.selectedText)
  }
  if (!range) return false
  return wrapRangeWithHighlight(range, a.id, a.color)
}

function cssEscape(s: string): string {
  if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(s)
  return s.replace(/["\\]/g, '\\$&')
}
