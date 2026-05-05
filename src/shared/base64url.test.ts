import { describe, expect, it } from 'vitest'
import { decodeBase64UrlJson, encodeBase64UrlJson } from './base64url'

describe('base64url', () => {
  it('roundtrips utf-8 json', () => {
    const obj = { hello: '世界', n: 3 }
    const enc = encodeBase64UrlJson(obj)
    const dec = decodeBase64UrlJson<typeof obj>(enc)
    expect(dec).toEqual(obj)
  })
})
