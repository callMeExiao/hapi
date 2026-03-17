import type { AgentEvent } from '@/chat/types'

type TranslateFn = (key: string, params?: Record<string, string | number>) => string

export function formatUnixTimestamp(value: number): string {
    const ms = value < 1_000_000_000_000 ? value * 1000 : value
    const date = new Date(ms)
    if (Number.isNaN(date.getTime())) return String(value)
    return date.toLocaleString()
}

function formatDuration(ms: number, t?: TranslateFn): string {
    const seconds = ms / 1000
    if (seconds < 60) {
        const value = seconds.toFixed(1)
        return t ? t('chat.event.duration.seconds', { seconds: value }) : `${value}s`
    }

    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return t
        ? t('chat.event.duration.minutesSeconds', { minutes: mins, seconds: secs })
        : `${mins}m ${secs}s`
}

export type EventPresentation = {
    icon: string | null
    text: string
}

function getSwitchEventText(mode: 'local' | 'remote', t?: TranslateFn): string {
    if (!t) {
        return `Switched to ${mode}`
    }

    return mode === 'local'
        ? t('chat.event.switchedToLocal')
        : t('chat.event.switchedToRemote')
}

function getPermissionModeLabel(mode: string, t?: TranslateFn): string {
    if (!t) return mode

    switch (mode) {
        case 'default':
            return t('chat.permissionMode.default')
        case 'acceptEdits':
            return t('chat.permissionMode.acceptEdits')
        case 'bypassPermissions':
            return t('chat.permissionMode.bypassPermissions')
        case 'plan':
            return t('chat.permissionMode.plan')
        case 'ask':
            return t('chat.permissionMode.ask')
        case 'read-only':
            return t('chat.permissionMode.readOnly')
        case 'safe-yolo':
            return t('chat.permissionMode.safeYolo')
        case 'yolo':
            return t('chat.permissionMode.yolo')
        default:
            return mode
    }
}

export function getEventPresentation(event: AgentEvent, t?: TranslateFn): EventPresentation {
    if (event.type === 'api-error') {
        const { retryAttempt, maxRetries } = event as { retryAttempt: number; maxRetries: number }
        if (maxRetries > 0 && retryAttempt >= maxRetries) {
            return { icon: '⚠️', text: t ? t('chat.event.apiError.maxRetriesReached') : 'API error: Max retries reached' }
        }
        if (maxRetries > 0) {
            return {
                icon: '⏳',
                text: t
                    ? t('chat.event.apiError.retryingWithProgress', { retryAttempt, maxRetries })
                    : `API error: Retrying (${retryAttempt}/${maxRetries})`
            }
        }
        if (retryAttempt > 0) {
            return { icon: '⏳', text: t ? t('chat.event.apiError.retrying') : 'API error: Retrying...' }
        }
        return { icon: '⚠️', text: t ? t('chat.event.apiError.base') : 'API error' }
    }
    if (event.type === 'switch') {
        const mode = event.mode === 'local' ? 'local' : 'remote'
        return { icon: '🔄', text: getSwitchEventText(mode, t) }
    }
    if (event.type === 'title-changed') {
        const title = typeof event.title === 'string' ? event.title : ''
        return {
            icon: null,
            text: title
                ? (t ? t('chat.event.titleChangedTo', { title }) : `Title changed to "${title}"`)
                : (t ? t('chat.event.titleChanged') : 'Title changed')
        }
    }
    if (event.type === 'permission-mode-changed') {
        const modeValue = (event as Record<string, unknown>).mode
        const mode = typeof modeValue === 'string' ? modeValue : 'default'
        return {
            icon: '🔐',
            text: t
                ? t('chat.event.permissionModeChanged', { mode: getPermissionModeLabel(mode, t) })
                : `Permission mode: ${mode}`
        }
    }
    if (event.type === 'limit-reached') {
        const endsAt = typeof event.endsAt === 'number' ? event.endsAt : null
        return {
            icon: '⏳',
            text: endsAt
                ? (t
                    ? t('chat.event.limitReachedUntil', { time: formatUnixTimestamp(endsAt) })
                    : `Usage limit reached until ${formatUnixTimestamp(endsAt)}`)
                : (t ? t('chat.event.limitReached') : 'Usage limit reached')
        }
    }
    if (event.type === 'message') {
        return { icon: null, text: typeof event.message === 'string' ? event.message : (t ? t('chat.event.messageFallback') : 'Message') }
    }
    if (event.type === 'turn-duration') {
        const ms = typeof event.durationMs === 'number' ? event.durationMs : 0
        return {
            icon: '⏱️',
            text: t ? t('chat.event.turnDuration', { duration: formatDuration(ms, t) }) : `Turn: ${formatDuration(ms)}`
        }
    }
    if (event.type === 'microcompact') {
        const saved = typeof event.tokensSaved === 'number' ? event.tokensSaved : 0
        const formatted = saved >= 1000 ? `${Math.round(saved / 1000)}K` : String(saved)
        return {
            icon: '📦',
            text: t
                ? t('chat.event.microcompact', { tokens: formatted })
                : `Context compacted (saved ${formatted} tokens)`
        }
    }
    if (event.type === 'compact') {
        return { icon: '📦', text: t ? t('chat.event.compact') : 'Conversation compacted' }
    }
    try {
        return { icon: null, text: JSON.stringify(event) }
    } catch {
        return { icon: null, text: String(event.type) }
    }
}

export function renderEventLabel(event: AgentEvent, t?: TranslateFn): string {
    return getEventPresentation(event, t).text
}
