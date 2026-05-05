import type { Annotation } from '@shared/types'
import { STORAGE_KEY } from '@shared/types'
import type {
  ExtensionMessage,
  BackgroundResponse,
  SharePayload,
} from '@shared/messages'
import { encodeBase64UrlJson } from '@shared/base64url'

const recentSidePanelOpenByWindow = new Map<number, number>()

async function getAll(): Promise<Annotation[]> {
  const data = await chrome.storage.local.get(STORAGE_KEY)
  const list = data[STORAGE_KEY]
  return Array.isArray(list) ? list : []
}

async function saveAll(annotations: Annotation[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: annotations })
}

async function handleMessage(
  msg: ExtensionMessage,
  sender?: chrome.runtime.MessageSender,
): Promise<BackgroundResponse> {
  switch (msg.type) {
    case 'GET_ALL_ANNOTATIONS': {
      const annotations = await getAll()
      return { ok: true, annotations }
    }
    case 'GET_ANNOTATIONS_FOR_URL': {
      const all = await getAll()
      const annotations = all.filter((a) => a.url === msg.url)
      return { ok: true, annotations }
    }
    case 'SAVE_ANNOTATION': {
      const all = await getAll()
      all.push(msg.annotation)
      await saveAll(all)
      return { ok: true, annotation: msg.annotation }
    }
    case 'UPDATE_ANNOTATION': {
      const all = await getAll()
      const ix = all.findIndex((a) => a.id === msg.annotation.id)
      if (ix === -1) return { ok: false, error: 'Annotation not found' }
      all[ix] = msg.annotation
      await saveAll(all)
      return { ok: true, annotation: msg.annotation }
    }
    case 'DELETE_ANNOTATION': {
      const all = await getAll().then((xs) => xs.filter((a) => a.id !== msg.id))
      await saveAll(all)
      return { ok: true }
    }
    case 'SCROLL_TO_ANNOTATION': {
      const all = await getAll()
      const ann = all.find((a) => a.id === msg.id)
      if (!ann) return { ok: false, error: 'Annotation not found' }
      const norm = (u: string) => {
        try {
          const x = new URL(u)
          x.hash = ''
          return x.href.replace(/\/$/, '')
        } catch {
          return u
        }
      }
      const targetUrl = norm(ann.url)
      const tabs = await chrome.tabs.query({})
      const match = tabs.find((t) => t.url && norm(t.url) === targetUrl)
      if (match?.id) {
        await chrome.tabs.update(match.id, { active: true })
        await chrome.windows.update(match.windowId, { focused: true })
        try {
          await chrome.tabs.sendMessage(match.id, {
            type: 'NOTEPRO_SCROLL_TO',
            id: msg.id,
          })
        } catch {
          /* tab may not have content script yet */
        }
      } else {
        await chrome.tabs.create({ url: ann.url })
      }
      return { ok: true }
    }
    case 'OPEN_SHARE_VIEWER': {
      const payload: SharePayload = msg.payload
      const hash = encodeBase64UrlJson(payload)
      const url = chrome.runtime.getURL(`share-viewer.html`) + '#' + hash
      await chrome.tabs.create({ url })
      return { ok: true }
    }
    case 'OPEN_SIDEPANEL': {
      const windowId = sender?.tab?.windowId
      if (windowId == null) return { ok: false, error: 'No active tab window found' }
      const now = Date.now()
      const lastOpenAt = recentSidePanelOpenByWindow.get(windowId) ?? 0
      if (now - lastOpenAt < 700) return { ok: true }
      recentSidePanelOpenByWindow.set(windowId, now)
      await chrome.sidePanel.open({ windowId })
      return { ok: true }
    }
    default:
      return { ok: false, error: 'Unknown message' }
  }
}

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse: (r: BackgroundResponse) => void) => {
    handleMessage(message, sender)
      .then(sendResponse)
      .catch((e: unknown) =>
        sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) }),
      )
    return true
  },
)

chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    /* ignore */
  })
})
