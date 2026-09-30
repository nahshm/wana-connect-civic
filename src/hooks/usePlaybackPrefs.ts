import { useCallback, useEffect, useState } from 'react'

/**
 * Persisted video playback preferences (speed + captions).
 * Shared across every clip so the choice sticks between videos.
 */

const STORAGE_KEY = 'wanaiq.playback.prefs'

export const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] as const

export interface PlaybackPrefs {
    rate: number
    captions: boolean
}

const DEFAULT_PREFS: PlaybackPrefs = { rate: 1, captions: false }

const readPrefs = (): PlaybackPrefs => {
    if (typeof window === 'undefined') return DEFAULT_PREFS
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return DEFAULT_PREFS
        const parsed = JSON.parse(raw) as Partial<PlaybackPrefs>
        return {
            rate: typeof parsed.rate === 'number' ? parsed.rate : DEFAULT_PREFS.rate,
            captions: !!parsed.captions,
        }
    } catch {
        return DEFAULT_PREFS
    }
}

export const usePlaybackPrefs = () => {
    const [prefs, setPrefs] = useState<PlaybackPrefs>(readPrefs)

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
        } catch {
            // storage unavailable (private mode) - preferences stay session-only
        }
    }, [prefs])

    const setRate = useCallback((rate: number) => setPrefs(p => ({ ...p, rate })), [])
    const setCaptions = useCallback((captions: boolean) => setPrefs(p => ({ ...p, captions })), [])
    const toggleCaptions = useCallback(() => setPrefs(p => ({ ...p, captions: !p.captions })), [])

    return { ...prefs, setRate, setCaptions, toggleCaptions }
}
