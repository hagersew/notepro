export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink'

export type AnnotationPosition = {
  xpath: string
  offsetStart: number
  offsetEnd: number
}

export type Annotation = {
  id: string
  url: string
  title: string
  selectedText: string
  note: string
  color: HighlightColor
  createdAt: number
  position: AnnotationPosition
  /** Short quote anchors for fallback when DOM shifts */
  quotePrefix?: string
  quoteSuffix?: string
}

export const STORAGE_KEY = 'notepro_annotations' as const

export type AnnotationStore = {
  [STORAGE_KEY]: Annotation[]
}
