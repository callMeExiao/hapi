import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ChatBlock } from '@/chat/types'
import { I18nContext } from '@/lib/i18n-context'
import { zhCN } from '@/lib/locales'
import type { Session } from '@/types/api'
import { useHappyRuntime } from './assistant-runtime'

vi.mock('@assistant-ui/react', () => ({
    useExternalMessageConverter: ({ callback, messages }: { callback: (message: unknown) => unknown; messages: unknown[] }) => messages.map((message) => callback(message)),
    useExternalStoreRuntime: (adapter: unknown) => adapter,
}))

function RuntimeProbe(props: { blocks: readonly ChatBlock[] }) {
    const runtime = useHappyRuntime({
        session: { id: 'session-1', active: true, thinking: false } as Session,
        blocks: props.blocks,
        isSending: false,
        onSendMessage: vi.fn(),
        onAbort: vi.fn(async () => {}),
    }) as {
        messages?: Array<{
            content?: Array<{ type: string; text?: string }>
        }>
    }

    const firstPart = runtime.messages?.[0]?.content?.[0]
    const text = firstPart?.type === 'text' ? (firstPart.text ?? '') : ''

    return <div>{text}</div>
}

describe('useHappyRuntime', () => {
    it('does not show the English switch label in zh-CN', () => {
        const blocks: ChatBlock[] = [{
            kind: 'agent-event',
            id: 'event-1',
            createdAt: 0,
            event: { type: 'switch', mode: 'remote' }
        }]

        render(
            <I18nContext.Provider value={{
                t: (key: string) => (zhCN as Record<string, string>)[key] ?? key,
                locale: 'zh-CN',
                setLocale: vi.fn()
            }}>
                <RuntimeProbe blocks={blocks} />
            </I18nContext.Provider>
        )

        expect(screen.queryByText('Switched to remote')).not.toBeInTheDocument()
        expect(screen.getByText('已切换到远程')).toBeInTheDocument()
    })
})
