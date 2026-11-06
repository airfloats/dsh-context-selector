import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { analyzeSessionLog, filterRequestMessages } from '../lib/index.js'

const tempDir = mkdtempSync(join(tmpdir(), 'dsh-ctx-sel-test-'))

try {
  const events = [
    { type: 'turn/start', seq: 0, time: 1000, data: { turn: 1 } },
    { type: 'step/start', seq: 1, time: 1001, data: { turn: 1, step: 1 } },
    {
      type: 'system/message',
      seq: 2,
      time: 1002,
      surfaceOp: 'append',
      data: {
        turn: 1,
        step: 1,
        message: { id: 'sys-1', role: 'system', source: { kind: 'system-prompt' }, content: [{ type: 'text', text: 'System Prompt' }] },
      },
    },
    {
      type: 'user/message',
      seq: 3,
      time: 1003,
      surfaceOp: 'append',
      data: {
        id: 'u-1',
        role: 'user',
        source: { kind: 'user' },
        content: [{ type: 'text', text: 'Turn 1 secret context' }],
      },
    },
    {
      type: 'assistant/message',
      seq: 4,
      time: 1004,
      surfaceOp: 'append',
      data: {
        turn: 1,
        step: 1,
        message: {
          id: 'a-1',
          role: 'assistant',
          source: { kind: 'model', provider: 'test', model: 'm' },
          content: [
            { type: 'text', text: 'Running tool' },
            { type: 'tool-call', id: 'call-1', name: 'read', arguments: '{"file_path":"a.txt"}' },
          ],
        },
        stream: [],
      },
    },
    {
      type: 'tool/result',
      seq: 5,
      time: 1005,
      surfaceOp: 'append',
      data: {
        turn: 1,
        step: 1,
        message: {
          id: 't-1',
          role: 'tool',
          toolCallId: 'call-1',
          source: { kind: 'tool', callId: 'call-1' },
          content: [{ type: 'tool-result', toolCallId: 'call-1', content: [{ type: 'text', text: 'Large file output' }] }],
        },
      },
    },
    { type: 'step/end', seq: 6, time: 1006, data: { turn: 1, step: 1 } },
    { type: 'turn/end', seq: 7, time: 1007, data: { turn: 1, reason: { kind: 'completed' } } },
    { type: 'turn/start', seq: 8, time: 2000, data: { turn: 2 } },
    { type: 'step/start', seq: 9, time: 2001, data: { turn: 2, step: 1 } },
    {
      type: 'user/message',
      seq: 10,
      time: 2002,
      surfaceOp: 'append',
      data: {
        id: 'u-2',
        role: 'user',
        source: { kind: 'user' },
        content: [{ type: 'text', text: 'Turn 2 question' }],
      },
    },
  ]

  const mockSession = {
    id: 'session-test-1',
    snapshotEvents: () => events,
    surface: { nodes: [2, 3, 4, 5, 10] },
  }

  const allMessages = [
    events[2].data.message,
    events[3].data,
    events[4].data.message,
    events[5].data.message,
    events[10].data,
  ]

  const stateTurnExcluded = {
    excludedTurns: [1],
    excludedMessageIds: [],
    excludedCallIds: [],
    nextTurnEphemeral: false,
    pendingEphemeralTurns: [],
  }

  const analysis = analyzeSessionLog(mockSession, stateTurnExcluded)
  assert.equal(analysis.turns.length, 2)
  assert.equal(analysis.turns[0].included, false)
  assert.ok(analysis.savedTokens > 0)

  const res1 = filterRequestMessages(
    { sessionId: 'session-test-1', messages: allMessages },
    mockSession,
    { get: () => stateTurnExcluded, save: (_id, next) => next },
  )
  assert.equal(res1.changed, true)
  assert.deepEqual(res1.messages.map((m) => m.id), ['sys-1', 'u-2'])

  const stateCallExcluded = {
    excludedTurns: [],
    excludedMessageIds: [],
    excludedCallIds: ['call-1'],
    nextTurnEphemeral: false,
    pendingEphemeralTurns: [],
  }
  const res2 = filterRequestMessages(
    { sessionId: 'session-test-1', messages: allMessages },
    mockSession,
    { get: () => stateCallExcluded, save: (_id, next) => next },
  )
  assert.equal(res2.changed, true)
  assert.deepEqual(res2.messages.map((m) => m.id), ['sys-1', 'u-1', 'a-1', 'u-2'])
  assert.equal(res2.messages[2].content.some((b) => b.type === 'tool-call'), false)

  console.log('ALL TESTS PASSED')
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}
