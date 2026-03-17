import { describe, expect, it } from 'vitest'
import { zhCN } from '@/lib/locales'
import { renderEventLabel } from './presentation'
import type { AgentEvent } from './types'

function t(key: string, params?: Record<string, string | number>): string {
    const template = (zhCN as Record<string, string>)[key] ?? key
    return template.replace(/\{(\w+)\}/g, (match, name) => {
        const value = params?.[name]
        return value === undefined ? match : String(value)
    })
}

describe('renderEventLabel', () => {
    it('localizes the remaining system event copy in zh-CN', () => {
        const cases: Array<{
            name: string
            event: AgentEvent
            expected: string | RegExp
            english?: string
        }> = [
            {
                name: 'api error max retries',
                event: { type: 'api-error', retryAttempt: 3, maxRetries: 3, error: null },
                expected: 'API 错误：已达到最大重试次数'
            },
            {
                name: 'api error retrying with progress',
                event: { type: 'api-error', retryAttempt: 1, maxRetries: 3, error: null },
                expected: 'API 错误：正在重试（1/3）'
            },
            {
                name: 'api error retrying generic',
                event: { type: 'api-error', retryAttempt: 1, maxRetries: 0, error: null },
                expected: 'API 错误：正在重试…'
            },
            {
                name: 'api error base',
                event: { type: 'api-error', retryAttempt: 0, maxRetries: 0, error: null },
                expected: 'API 错误'
            },
            {
                name: 'title changed with title',
                event: { type: 'title-changed', title: '新标题' },
                expected: '标题已更改为“新标题”'
            },
            {
                name: 'title changed without title',
                event: { type: 'title-changed', title: '' },
                expected: '标题已更改'
            },
            {
                name: 'permission mode changed',
                event: { type: 'permission-mode-changed', mode: 'acceptEdits' } as AgentEvent,
                expected: '权限模式：接受编辑'
            },
            {
                name: 'usage limit reached with time',
                event: { type: 'limit-reached', endsAt: 1_700_000_000 },
                expected: /^已达到使用额度上限，直到 /,
                english: 'Usage limit reached'
            },
            {
                name: 'usage limit reached without time',
                event: { type: 'limit-reached', endsAt: 0 },
                expected: '已达到使用额度上限'
            },
            {
                name: 'turn duration',
                event: { type: 'turn-duration', durationMs: 1_500 },
                expected: '本轮耗时：1.5 秒'
            },
            {
                name: 'microcompact',
                event: { type: 'microcompact', trigger: 'auto', preTokens: 5_000, tokensSaved: 1_234 },
                expected: '上下文已压缩（节省 1K 个令牌）'
            },
            {
                name: 'compact',
                event: { type: 'compact', trigger: 'auto', preTokens: 5_000 },
                expected: '对话已压缩'
            },
            {
                name: 'message fallback',
                event: { type: 'message' } as AgentEvent,
                expected: '消息'
            }
        ]

        for (const testCase of cases) {
            const text = renderEventLabel(testCase.event, t)

            if (typeof testCase.expected === 'string') {
                expect(text, testCase.name).toBe(testCase.expected)
            } else {
                expect(text, testCase.name).toMatch(testCase.expected)
            }

            if (testCase.english) {
                expect(text, testCase.name).not.toContain(testCase.english)
            }
        }
    })
})
