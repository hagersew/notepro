/** XPath + text-node offsets within a resolved subtree (container element). */

function isLikelyBlock(el: Element): boolean {
  const blocks = new Set([
    'P',
    'DIV',
    'LI',
    'BLOCKQUOTE',
    'PRE',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'SECTION',
    'ARTICLE',
    'MAIN',
    'ASIDE',
    'HEADER',
    'FOOTER',
    'TD',
    'TH',
    'DD',
    'DT',
    'FIGCAPTION',
    'CAPTION',
  ])
  return blocks.has(el.tagName)
}

export function resolveHighlightContainer(range: Range): Element {
  let node: Node | null = range.commonAncestorContainer
  if (node.nodeType === Node.TEXT_NODE) node = (node as Text).parentElement
  while (node && node instanceof Element) {
    if (node.tagName === 'BODY') return node
    if (isLikelyBlock(node)) return node
    node = node.parentElement
  }
  return document.body
}

export function collectTextNodes(root: Element): Text[] {
  const out: Text[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = (n as Text).parentElement
      if (!p) return NodeFilter.FILTER_REJECT
      if (p.closest('[data-notepro-mark]')) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })
  let cur: Node | null
  while ((cur = walker.nextNode())) out.push(cur as Text)
  return out
}

export function rangeToOffsets(container: Element, range: Range): { start: number; end: number } {
  const texts = collectTextNodes(container)
  let seen = 0
  let start: number | null = null

  for (const t of texts) {
    const len = t.length
    if (t === range.startContainer) {
      start = seen + range.startOffset
      break
    }
    seen += len
  }
  if (start === null) throw new Error('Could not map range start to offsets')

  seen = 0
  let end: number | null = null
  for (const t of texts) {
    const len = t.length
    if (t === range.endContainer) {
      end = seen + range.endOffset
      break
    }
    seen += len
  }
  if (end === null) throw new Error('Could not map range end to offsets')

  return { start, end }
}

export function offsetsToRange(
  container: Element,
  start: number,
  end: number,
): Range | null {
  if (start < 0 || end < start) return null
  const texts = collectTextNodes(container)
  let seen = 0
  const range = document.createRange()
  let started = false

  for (const t of texts) {
    const len = t.length
    const ns = seen
    const ne = seen + len

    if (!started && start < ne) {
      range.setStart(t, Math.max(0, Math.min(len, start - ns)))
      started = true
    }
    if (started && end <= ne) {
      range.setEnd(t, Math.max(0, Math.min(len, end - ns)))
      return range
    }
    seen += len
  }
  return null
}

export function elementToXPath(el: Element): string {
  const parts: string[] = []
  let cur: Element | null = el
  while (cur && cur.nodeType === Node.ELEMENT_NODE) {
    let index = 1
    let sib = cur.previousElementSibling
    while (sib) {
      if (sib.nodeName === cur.nodeName) index++
      sib = sib.previousElementSibling
    }
    parts.unshift(`${cur.nodeName.toLowerCase()}[${index}]`)
    cur = cur.parentElement
  }
  return '/' + parts.join('/')
}

export function elementFromXPath(doc: Document, xpath: string): Element | null {
  try {
    const result = doc.evaluate(
      xpath,
      doc,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    )
    const node = result.singleNodeValue
    return node?.nodeType === Node.ELEMENT_NODE ? (node as Element) : null
  } catch {
    return null
  }
}

const QUOTE_LEN = 48

export function makeQuoteAnchors(text: string): { quotePrefix?: string; quoteSuffix?: string } {
  if (!text) return {}
  return {
    quotePrefix: text.slice(0, QUOTE_LEN),
    quoteSuffix: text.slice(Math.max(0, text.length - QUOTE_LEN)),
  }
}

/** Fallback when XPath/offsets fail: first substring match in flattened text under root. */
export function findSubstringRange(root: Element, needle: string): Range | null {
  if (!needle) return null
  const texts = collectTextNodes(root)
  let flat = ''
  for (const t of texts) flat += t.textContent ?? ''
  const idx = flat.indexOf(needle)
  if (idx === -1) return null
  return indicesToRange(texts, idx, idx + needle.length)
}

function indicesToRange(texts: Text[], start: number, end: number): Range | null {
  let pos = 0
  let startNode: Text | null = null
  let startOffset = 0
  let endNode: Text | null = null
  let endOffset = 0
  for (const t of texts) {
    const len = (t.textContent ?? '').length
    const ns = pos
    const ne = pos + len
    if (startNode === null && start < ne) {
      startNode = t
      startOffset = start - ns
    }
    if (startNode !== null && end <= ne) {
      endNode = t
      endOffset = end - ns
      break
    }
    pos += len
  }
  if (!startNode || !endNode) return null
  const r = document.createRange()
  r.setStart(startNode, startOffset)
  r.setEnd(endNode, endOffset)
  return r
}
