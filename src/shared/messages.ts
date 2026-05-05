import type { Annotation } from './types'

export type GetAnnotationsForUrlMessage = {
  type: 'GET_ANNOTATIONS_FOR_URL'
  url: string
}

export type SaveAnnotationMessage = {
  type: 'SAVE_ANNOTATION'
  annotation: Annotation
}

export type UpdateAnnotationMessage = {
  type: 'UPDATE_ANNOTATION'
  annotation: Annotation
}

export type DeleteAnnotationMessage = {
  type: 'DELETE_ANNOTATION'
  id: string
}

export type GetAllAnnotationsMessage = {
  type: 'GET_ALL_ANNOTATIONS'
}

export type ScrollToAnnotationMessage = {
  type: 'SCROLL_TO_ANNOTATION'
  id: string
}

export type OpenShareViewerMessage = {
  type: 'OPEN_SHARE_VIEWER'
  payload: SharePayload
}

export type OpenSidePanelMessage = {
  type: 'OPEN_SIDEPANEL'
}

export type BackgroundResponse =
  | { ok: true; annotations?: Annotation[]; annotation?: Annotation }
  | { ok: false; error: string }

export type SharePayload = Pick<
  Annotation,
  'selectedText' | 'note' | 'color' | 'title' | 'url' | 'createdAt'
>

export type ExtensionMessage =
  | GetAnnotationsForUrlMessage
  | SaveAnnotationMessage
  | UpdateAnnotationMessage
  | DeleteAnnotationMessage
  | GetAllAnnotationsMessage
  | ScrollToAnnotationMessage
  | OpenShareViewerMessage
  | OpenSidePanelMessage

export type ContentMessage =
  | { type: 'NOTEPRO_APPLY_HIGHLIGHTS'; annotations: Annotation[] }
  | { type: 'NOTEPRO_SCROLL_TO'; id: string }
