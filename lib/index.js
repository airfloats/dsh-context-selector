import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const name = 'dsh-context-selector'
export const inject = []

const FILTERED = new WeakSet()
const MAX_BODY_BYTES = 256 * 1024
const CHARS_PER_TOKEN = 4
const BLOCK_OVERHEAD = 4

const PROTECTED_USER_SOURCES = new Set([
  'agent-instructions',
  'skill-catalog',
  'compact-checkpoint',
])

const AMBIENT_SNAPSHOT_SOURCES = new Set([
  'runtime-context',
  'time-context',
  'plan-mode',
  'model-selection',
  'repeat-tool-reminder',
  'user-approval',
])

function serviceOf(ctx, serviceName) {
  if (ctx === null || ctx === undefined) return undefined
  try {
    if (typeof ctx.get === 'function') return ctx.get(serviceName)
  } catch {
  }
  try {
    return ctx[serviceName]
  } catch {
    return undefined
  }
}

function safeFileKey(sessionId) {
  return String(sessionId ?? 'default').replace(/[^A-Za-z0-9._-]/g, '_')
}

function defaultSessionState() {
  return {
    excludedTurns: [],
    excludedMessageIds: [],
    excludedCallIds: [],
    nextTurnEphemeral: false,
    pendingEphemeralTurns: [],
    revision: 1,
    updatedAt: Date.now(),
  }
}

function normalizeNumberArray(arr) {
  if (!Array.isArray(arr)) return []
  const set = new Set()
  for (const item of arr) {
    const num = Number(item)
    if (Number.isInteger(num) && num > 0) set.add(num)
  }
  return [...set].sort((a, b) => a - b)
}

function normalizeStringArray(arr) {
  if (!Array.isArray(arr)) return []
  const set = new Set()
  for (const item of arr) {
    if (typeof item === 'string' && item.length > 0) set.add(item)
  }
  return [...set]
}

class ContextSelectorStore {
  constructor(baseDir) {
    this.baseDir = baseDir
    this.cache = new Map()
    try {
      mkdirSync(this.baseDir, { recursive: true })
    } catch {
    }
  }

  filePath(sessionId) {
    return join(this.baseDir, `${safeFileKey(sessionId)}.json`)
  }

  get(sessionId) {
    const key = String(sessionId)
    const cached = this.cache.get(key)
    if (cached !== undefined) return cached
    const file = this.filePath(key)
    if (!existsSync(file)) {
      const init = defaultSessionState()
      this.cache.set(key, init)
      return init
    }
    try {
      const parsed = JSON.parse(readFileSync(file, 'utf8'))
      const state = {
        excludedTurns: normalizeNumberArray(parsed?.excludedTurns),
        excludedMessageIds: normalizeStringArray(parsed?.excludedMessageIds),
        excludedCallIds: normalizeStringArray(parsed?.excludedCallIds),
        nextTurnEphemeral: Boolean(parsed?.nextTurnEphemeral),
        pendingEphemeralTurns: normalizeNumberArray(parsed?.pendingEphemeralTurns),
        revision: typeof parsed?.revision === 'number' && Number.isFinite(parsed.revision) ? parsed.revision : 1,
        updatedAt: typeof parsed?.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
      }
      this.cache.set(key, state)
      return state
    } catch {
      const init = defaultSessionState()
      this.cache.set(key, init)
      return init
    }
  }

  save(sessionId, nextState) {
    const key = String(sessionId)
    const prev = this.get(key)
    const state = {
      excludedTurns: normalizeNumberArray(nextState.excludedTurns),
      excludedMessageIds: normalizeStringArray(nextState.excludedMessageIds),
      excludedCallIds: normalizeStringArray(nextState.excludedCallIds),
      nextTurnEphemeral: Boolean(nextState.nextTurnEphemeral),
      pendingEphemeralTurns: normalizeNumberArray(nextState.pendingEphemeralTurns),
      revision: (prev?.revision ?? 0) + 1,
      updatedAt: Date.now(),
    }
    this.cache.set(key, state)
    const file = this.filePath(key)
    const tmp = `${file}.tmp`
    try {
      mkdirSync(this.baseDir, { recursive: true })
      writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
      try {
        renameSync(tmp, file)
      } catch {
        writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
      }
    } catch {
    }
    return state
  }
}

function estimateBlockTokens(block) {
  if (!block || typeof block !== 'object') return 0
  if (block.type === 'text' || block.type === 'reasoning') {
    const len = typeof block.text === 'string' ? block.text.length : 0
    return Math.ceil(len / CHARS_PER_TOKEN) + BLOCK_OVERHEAD
  }
  if (block.type === 'tool-call') {
    const nLen = typeof block.name === 'string' ? block.name.length : 0
    const aLen = typeof block.arguments === 'string' ? block.arguments.length : 0
    return Math.ceil(nLen / CHARS_PER_TOKEN) + Math.ceil(aLen / CHARS_PER_TOKEN) + BLOCK_OVERHEAD
  }
  if (block.type === 'image') {
    const { offloaded: _off, ...ref } = block
    return BLOCK_OVERHEAD + Math.ceil(JSON.stringify(ref).length / CHARS_PER_TOKEN)
  }
  return BLOCK_OVERHEAD + Math.ceil(JSON.stringify(block).length / CHARS_PER_TOKEN)
}

function estimateMessageTokens(msg) {
  if (!msg || typeof msg !== 'object') return 0
  const content = Array.isArray(msg.content) ? msg.content : []
  if (msg.role === 'system') {
    if (content.length === 0) return 0
    let chars = 0
    for (const b of content) {
      chars += b?.type === 'text' && typeof b.text === 'string' ? b.text.length : JSON.stringify(b ?? {}).length
    }
    return Math.ceil(chars / CHARS_PER_TOKEN) + 4
  }
  let tokens = 4
  for (const b of content) tokens += estimateBlockTokens(b)
  return tokens
}

function extractMessageText(content) {
  if (!Array.isArray(content)) return ''
  const parts = []
  for (const block of content) {
    if (block === null || typeof block !== 'object') continue
    if (block.type === 'text' && typeof block.text === 'string') {
      parts.push(block.text)
    } else if (block.type === 'tool-result' && Array.isArray(block.content)) {
      for (const sub of block.content) {
        if (sub?.type === 'text' && typeof sub.text === 'string') {
          parts.push(sub.text)
        }
      }
    }
  }
  return parts.join('\n')
}

function oneLinePreview(text, maxChars = 96) {
  const cleaned = String(text ?? '').replace(/\s+/g, ' ').trim()
  if (cleaned.length === 0) return ''
  return cleaned.length <= maxChars ? cleaned : `${cleaned.slice(0, maxChars)}…`
}

function summarizeToolArgs(name, rawArgs) {
  if (typeof rawArgs !== 'string' || rawArgs.trim() === '') return name
  try {
    const obj = JSON.parse(rawArgs)
    if (obj && typeof obj === 'object') {
      const target =
        obj.file_path ??
        obj.path ??
        obj.pattern ??
        obj.command ??
        obj.url ??
        obj.description ??
        (Array.isArray(obj.queries) ? obj.queries.join(', ') : undefined)
      if (typeof target === 'string' && target.trim() !== '') {
        return `${name} · ${oneLinePreview(target, 72)}`
      }
    }
  } catch {
  }
  return `${name} · ${oneLinePreview(rawArgs, 64)}`
}

function classifyUserMessage(msg) {
  const srcKind = String(msg?.source?.kind ?? msg?.source?.plugin ?? '')
  if (PROTECTED_USER_SOURCES.has(srcKind)) return 'protected'
  if (AMBIENT_SNAPSHOT_SOURCES.has(srcKind)) return 'ambient'
  const text = extractMessageText(msg?.content).trim()
  if (
    text.startsWith('Current runtime context.') ||
    text.startsWith('<system-reminder>') ||
    text.startsWith('<available_skills>')
  ) {
    return 'ambient'
  }
  return 'user'
}

export function analyzeSessionLog(session, state) {
  const events = typeof session?.snapshotEvents === 'function' ? session.snapshotEvents() : []
  const surfaceSeqs = new Set(Array.isArray(session?.surface?.nodes) ? session.surface.nodes : [])
  const hasSurfaceInfo = surfaceSeqs.size > 0

  const seqToTurn = new Map()
  const messageIdToMeta = new Map()
  const callIdToMeta = new Map()
  const assistantIdToToolCallIds = new Map()
  const turnsMap = new Map()

  let currentTurn = 0
  let maxTurn = 0
  let openTurn = null
  let totalConversationTokens = 0
  let savedTokens = 0

  const excludedTurnSet = new Set(state?.excludedTurns ?? [])
  const excludedMsgSet = new Set(state?.excludedMessageIds ?? [])
  const excludedCallSet = new Set(state?.excludedCallIds ?? [])
  const pendingEphemeralSet = new Set(state?.pendingEphemeralTurns ?? [])

  const ensureTurn = (t) => {
    if (t <= 0) return null
    let row = turnsMap.get(t)
    if (row === undefined) {
      row = {
        turn: t,
        status: 'running',
        startedAt: null,
        endedAt: null,
        messages: [],
        calls: [],
      }
      turnsMap.set(t, row)
    }
    return row
  }

  for (const ev of events) {
    if (ev === null || typeof ev !== 'object') continue
    if (ev.type === 'turn/start') {
      const t = Number(ev.data?.turn ?? 0)
      if (t > 0) {
        currentTurn = t
        maxTurn = Math.max(maxTurn, t)
        openTurn = t
        const row = ensureTurn(t)
        if (row && row.startedAt === null) row.startedAt = ev.time ?? Date.now()
      }
      continue
    }
    if (ev.type === 'turn/end') {
      const t = Number(ev.data?.turn ?? currentTurn)
      const row = ensureTurn(t)
      if (row) {
        row.status = 'completed'
        row.endedAt = ev.time ?? Date.now()
      }
      if (openTurn === t) openTurn = null
      continue
    }
    if (ev.type === 'tool/call') {
      const callId = ev.data?.callId
      const toolName = ev.data?.name
      const turn = Number(ev.data?.turn ?? currentTurn)
      const step = Number(ev.data?.step ?? 1)
      if (typeof callId === 'string' && typeof toolName === 'string') {
        const rawArgs =
          typeof ev.data?.arguments === 'string'
            ? ev.data.arguments
            : JSON.stringify(ev.data?.arguments ?? {})
        const existing = callIdToMeta.get(callId) ?? {
          callId,
          toolName,
          turn,
          step,
          summary: summarizeToolArgs(toolName, rawArgs),
          assistantMessageId: null,
          toolMessageId: null,
          chars: 0,
          tokens: 0,
        }
        callIdToMeta.set(callId, existing)
        if (turn > 0) {
          const turnRow = ensureTurn(turn)
          if (turnRow && !turnRow.calls.some((c) => c.callId === callId)) {
            turnRow.calls.push(existing)
          }
        }
      }
      continue
    }

    const explicitTurn = typeof ev.data?.turn === 'number' ? ev.data.turn : undefined
    let resolvedTurn = explicitTurn ?? currentTurn
    if (
      resolvedTurn === 0 &&
      Array.isArray(ev.sourceEventSeqs) &&
      ev.sourceEventSeqs.length > 0
    ) {
      for (const srcSeq of ev.sourceEventSeqs) {
        const mapped = seqToTurn.get(srcSeq)
        if (mapped !== undefined && mapped > 0) {
          resolvedTurn = mapped
          break
        }
      }
    }
    if (typeof ev.seq === 'number' && resolvedTurn > 0) {
      seqToTurn.set(ev.seq, resolvedTurn)
      maxTurn = Math.max(maxTurn, resolvedTurn)
    }

    if (hasSurfaceInfo && typeof ev.seq === 'number' && !surfaceSeqs.has(ev.seq)) {
      continue
    }

    if (ev.type === 'user/message') {
      const msg = ev.data
      if (!msg || typeof msg.id !== 'string') continue
      const uKind = classifyUserMessage(msg)
      const rawText = extractMessageText(msg.content)
      const chars = rawText.length
      const tokens = estimateMessageTokens(msg)
      if (uKind === 'user') {
        totalConversationTokens += tokens
      }
      const meta = {
        id: msg.id,
        seq: ev.seq,
        turn: resolvedTurn,
        step: 1,
        role: 'user',
        kind: uKind,
        preview: oneLinePreview(rawText),
        chars,
        tokens,
      }
      messageIdToMeta.set(msg.id, meta)
      if (uKind === 'user' && resolvedTurn > 0) {
        ensureTurn(resolvedTurn)?.messages.push(meta)
      }
    } else if (ev.type === 'assistant/message') {
      const msg = ev.data?.message
      if (!msg || typeof msg.id !== 'string') continue
      const step = Number(ev.data?.step ?? 1)
      const content = Array.isArray(msg.content) ? msg.content : []
      const rawText = extractMessageText(content)
      const toolCalls = content.filter((b) => b && b.type === 'tool-call')
      const callIds = []
      const toolNames = []
      for (const tc of toolCalls) {
        if (typeof tc.id === 'string') {
          const cid = String(tc.id)
          callIds.push(cid)
          const tName = typeof tc.name === 'string' ? tc.name : 'tool'
          toolNames.push(tName)
          const callTokens = estimateBlockTokens(tc)
          const prevCall = callIdToMeta.get(cid)
          const callMeta = {
            callId: cid,
            toolName: tName,
            turn: resolvedTurn,
            step,
            summary: prevCall?.summary ?? summarizeToolArgs(tName, tc.arguments),
            assistantMessageId: msg.id,
            toolMessageId: prevCall?.toolMessageId ?? null,
            resultPreview: prevCall?.resultPreview ?? '',
            chars: (prevCall?.chars ?? 0) + String(tc.arguments ?? '').length,
            tokens: (prevCall?.tokens ?? 0) + callTokens,
          }
          callIdToMeta.set(cid, callMeta)
          if (resolvedTurn > 0) {
            const turnRow = ensureTurn(resolvedTurn)
            if (turnRow) {
              const idx = turnRow.calls.findIndex((c) => c.callId === cid)
              if (idx === -1) turnRow.calls.push(callMeta)
              else turnRow.calls[idx] = callMeta
            }
          }
        }
      }
      if (callIds.length > 0) {
        assistantIdToToolCallIds.set(msg.id, callIds)
      }
      const chars = JSON.stringify(content).length
      const tokens = estimateMessageTokens(msg)
      totalConversationTokens += tokens
      const hasVisibleText = rawText.trim().length > 0
      const previewText =
        oneLinePreview(rawText) ||
        (toolNames.length > 0 ? `[过程调用: ${toolNames.join(', ')}]` : '(助手消息)')
      const meta = {
        id: msg.id,
        seq: ev.seq,
        turn: resolvedTurn,
        step,
        role: 'assistant',
        kind: toolCalls.length > 0 && !hasVisibleText ? 'assistant-tool' : 'assistant',
        hasVisibleText,
        preview: previewText,
        toolNames,
        callIds,
        chars,
        tokens,
      }
      messageIdToMeta.set(msg.id, meta)
      if (resolvedTurn > 0) {
        ensureTurn(resolvedTurn)?.messages.push(meta)
      }
    } else if (ev.type === 'tool/result') {
      const msg = ev.data?.message
      if (!msg || typeof msg.id !== 'string') continue
      const step = Number(ev.data?.step ?? 1)
      const callId = String(msg.toolCallId ?? msg.source?.callId ?? '')
      const rawText = extractMessageText(msg.content)
      const chars = rawText.length
      const tokens = estimateMessageTokens(msg)
      totalConversationTokens += tokens
      const existingCall = callIdToMeta.get(callId)
      const toolName = existingCall?.toolName ?? 'tool'
      if (callId !== '') {
        const updatedCall = {
          callId,
          toolName,
          turn: resolvedTurn || existingCall?.turn || 1,
          step: existingCall?.step ?? step,
          summary: existingCall?.summary ?? `${toolName} · ${oneLinePreview(rawText, 64)}`,
          assistantMessageId: existingCall?.assistantMessageId ?? null,
          toolMessageId: msg.id,
          resultPreview: oneLinePreview(rawText, 80),
          chars: (existingCall?.chars ?? 0) + chars,
          tokens: (existingCall?.tokens ?? 0) + tokens,
        }
        callIdToMeta.set(callId, updatedCall)
        if (updatedCall.turn > 0) {
          const turnRow = ensureTurn(updatedCall.turn)
          if (turnRow) {
            const idx = turnRow.calls.findIndex((c) => c.callId === callId)
            if (idx === -1) turnRow.calls.push(updatedCall)
            else turnRow.calls[idx] = updatedCall
          }
        }
      }
      const meta = {
        id: msg.id,
        seq: ev.seq,
        turn: resolvedTurn,
        step,
        role: 'tool',
        kind: 'tool-result',
        toolCallId: callId,
        toolName,
        summary: existingCall?.summary ?? toolName,
        preview: oneLinePreview(rawText) || `[${toolName} 结果]`,
        chars,
        tokens,
      }
      messageIdToMeta.set(msg.id, meta)
      if (resolvedTurn > 0) {
        ensureTurn(resolvedTurn)?.messages.push(meta)
      }
    }
  }

  for (const [cid, cMeta] of callIdToMeta.entries()) {
    if (cMeta.toolMessageId && excludedMsgSet.has(cMeta.toolMessageId)) {
      excludedCallSet.add(cid)
    }
  }

  const turns = [...turnsMap.values()]
    .sort((a, b) => a.turn - b.turn)
    .map((row) => {
      const turnIncluded = !excludedTurnSet.has(row.turn)
      const userMsgs = row.messages.filter((m) => m.role === 'user')
      const assistantReplyMsgs = row.messages.filter((m) => m.role === 'assistant' && m.hasVisibleText)
      const allAssistantMsgs = row.messages.filter((m) => m.role === 'assistant')
      const closingMsg = assistantReplyMsgs.at(-1) ?? allAssistantMsgs.at(-1)

      let totalChars = 0
      let turnTokens = 0
      let turnSavedTokens = 0

      const detailedMessages = row.messages.map((m) => {
        totalChars += m.chars
        turnTokens += m.tokens
        const isCallExcluded = m.role === 'tool' && m.toolCallId && excludedCallSet.has(m.toolCallId)
        const allAssistantCallsExcluded =
          m.role === 'assistant' &&
          !m.hasVisibleText &&
          Array.isArray(m.callIds) &&
          m.callIds.length > 0 &&
          m.callIds.every((cid) => excludedCallSet.has(cid))
        const msgIncluded =
          turnIncluded && !excludedMsgSet.has(m.id) && !isCallExcluded && !allAssistantCallsExcluded
        if (!msgIncluded) {
          turnSavedTokens += m.tokens
        }
        return {
          id: m.id,
          seq: m.seq,
          turn: m.turn,
          step: m.step,
          role: m.role,
          kind: m.kind,
          toolCallId: m.toolCallId,
          toolName: m.toolName,
          callIds: m.callIds,
          summary: m.summary,
          preview: m.preview,
          chars: m.chars,
          tokens: m.tokens,
          included: msgIncluded,
          individuallyExcluded: excludedMsgSet.has(m.id) || Boolean(isCallExcluded),
        }
      })

      savedTokens += turnSavedTokens

      const detailedCalls = row.calls.map((c) => {
        const parentAssistantExcluded = c.assistantMessageId ? excludedMsgSet.has(c.assistantMessageId) : false
        const toolMsgExcluded = c.toolMessageId ? excludedMsgSet.has(c.toolMessageId) : false
        const callExcluded = excludedCallSet.has(c.callId) || parentAssistantExcluded || toolMsgExcluded
        return {
          callId: c.callId,
          toolName: c.toolName,
          turn: c.turn,
          step: c.step,
          summary: c.summary,
          resultPreview: c.resultPreview ?? '',
          assistantMessageId: c.assistantMessageId,
          toolMessageId: c.toolMessageId,
          chars: c.chars,
          tokens: c.tokens,
          included: turnIncluded && !callExcluded,
          individuallyExcluded: callExcluded,
        }
      })

      const outgoingIds = userMsgs.map((m) => m.id)
      const outgoingIncluded =
        turnIncluded && (outgoingIds.length === 0 || outgoingIds.some((id) => !excludedMsgSet.has(id)))

      const incomingIds = row.messages.filter((m) => m.role !== 'user').map((m) => m.id)
      const incomingCalls = row.calls.map((c) => c.callId)
      const incomingIncluded =
        turnIncluded &&
        (incomingIds.length === 0 ||
          incomingIds.some((id) => !excludedMsgSet.has(id)) ||
          incomingCalls.some((cid) => !excludedCallSet.has(cid)))

      return {
        turn: row.turn,
        status: row.status,
        included: turnIncluded,
        outgoingIncluded,
        incomingIncluded,
        outgoingIds,
        incomingIds,
        incomingCallIds: incomingCalls,
        closingMessageId: closingMsg?.id ?? null,
        ephemeral: pendingEphemeralSet.has(row.turn),
        userPreview: userMsgs[0]?.preview ?? `(第 ${row.turn} 轮发送)`,
        assistantPreview: closingMsg?.preview ?? (row.status === 'running' ? '正在生成回复…' : ''),
        charCount: totalChars,
        tokenCount: turnTokens,
        savedTokens: turnSavedTokens,
        messageCount: detailedMessages.length,
        callCount: detailedCalls.length,
        messages: detailedMessages,
        calls: detailedCalls,
      }
    })

  return {
    maxTurn,
    openTurn,
    turns,
    totalConversationTokens,
    savedTokens,
    messageIdToMeta,
    callIdToMeta,
    assistantIdToToolCallIds,
  }
}

export function filterRequestMessages(options, session, store) {
  const messages = options?.messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return { changed: false, messages }
  }
  const sessionId = String(options?.sessionId ?? '')
  if (sessionId === '') return { changed: false, messages }

  let state = store.get(sessionId)
  const analysis = analyzeSessionLog(session, state)
  const activeTurn = analysis.openTurn ?? analysis.maxTurn

  if (Array.isArray(state.pendingEphemeralTurns) && state.pendingEphemeralTurns.length > 0) {
    const expired = state.pendingEphemeralTurns.filter((t) => t < activeTurn)
    if (expired.length > 0) {
      state = store.save(sessionId, {
        ...state,
        excludedTurns: [...state.excludedTurns, ...expired],
        pendingEphemeralTurns: state.pendingEphemeralTurns.filter((t) => t >= activeTurn),
      })
    }
  }

  const excludedTurns = new Set(state.excludedTurns)
  const excludedMsgs = new Set(state.excludedMessageIds)
  const excludedCalls = new Set(state.excludedCallIds)

  if (excludedTurns.size === 0 && excludedMsgs.size === 0 && excludedCalls.size === 0) {
    return { changed: false, messages }
  }

  for (const [cid, cMeta] of analysis.callIdToMeta.entries()) {
    if (cMeta.toolMessageId && excludedMsgs.has(cMeta.toolMessageId)) {
      excludedCalls.add(cid)
    }
  }

  const droppedAssistantIds = new Set()
  const droppedToolCallIds = new Set(excludedCalls)

  for (const msg of messages) {
    if (!msg || typeof msg.id !== 'string') continue
    if (msg.role === 'system' || msg.role === 'developer') continue
    const meta = analysis.messageIdToMeta.get(msg.id)
    const turn = meta?.turn ?? 0
    const isTurnExcluded = turn > 0 && excludedTurns.has(turn)
    const isMsgExcluded = excludedMsgs.has(msg.id)
    if ((isTurnExcluded || isMsgExcluded) && msg.role === 'assistant') {
      droppedAssistantIds.add(msg.id)
      const callIds = analysis.assistantIdToToolCallIds.get(msg.id) ?? []
      for (const cid of callIds) droppedToolCallIds.add(cid)
      if (Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if (block?.type === 'tool-call' && typeof block.id === 'string') {
            droppedToolCallIds.add(String(block.id))
          }
        }
      }
    }
  }

  let changed = false
  const out = []

  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') {
      out.push(msg)
      continue
    }
    if (msg.role === 'system' || msg.role === 'developer') {
      out.push(msg)
      continue
    }

    const msgId = typeof msg.id === 'string' ? msg.id : ''
    const meta = msgId ? analysis.messageIdToMeta.get(msgId) : undefined
    const turn = meta?.turn ?? 0

    if (msg.role === 'user' && classifyUserMessage(msg) === 'protected') {
      out.push(msg)
      continue
    }

    const isTurnExcluded = turn > 0 && excludedTurns.has(turn)
    const isMsgExcluded = msgId !== '' && excludedMsgs.has(msgId)

    if (msg.role === 'user') {
      if (isTurnExcluded || isMsgExcluded) {
        changed = true
        continue
      }
      out.push(msg)
      continue
    }

    if (msg.role === 'assistant') {
      if (droppedAssistantIds.has(msgId) || isTurnExcluded || isMsgExcluded) {
        changed = true
        continue
      }
      if (Array.isArray(msg.content) && droppedToolCallIds.size > 0) {
        const hasDroppedCall = msg.content.some(
          (b) => b?.type === 'tool-call' && droppedToolCallIds.has(String(b.id)),
        )
        if (hasDroppedCall) {
          changed = true
          const filteredBlocks = msg.content.filter(
            (b) => !(b?.type === 'tool-call' && droppedToolCallIds.has(String(b.id))),
          )
          const meaningfulBlocks = filteredBlocks.filter((b) => {
            if (b?.type === 'text' || b?.type === 'reasoning') {
              return typeof b.text === 'string' && b.text.trim().length > 0
            }
            return true
          })
          if (meaningfulBlocks.length === 0) {
            continue
          }
          out.push({
            ...msg,
            content: filteredBlocks,
          })
          continue
        }
      }
      out.push(msg)
      continue
    }

    if (msg.role === 'tool') {
      const callId = String(msg.toolCallId ?? msg.source?.callId ?? '')
      if (droppedToolCallIds.has(callId) || isTurnExcluded || isMsgExcluded) {
        changed = true
        continue
      }
      out.push(msg)
      continue
    }

    out.push(msg)
  }

  const hasConversationMsg = out.some((m) => m && m.role !== 'system' && m.role !== 'developer')
  if (!hasConversationMsg) {
    const fallbackUser = [...messages].reverse().find((m) => m && m.role === 'user')
    if (fallbackUser) {
      out.push(fallbackUser)
    } else {
      return { changed: false, messages }
    }
  }

  return { changed, messages: out }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let bytes = 0
    req.on('data', (chunk) => {
      bytes += chunk.length
      if (bytes > MAX_BODY_BYTES) {
        reject(new Error('request body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8')
        resolve(text.trim() === '' ? {} : JSON.parse(text))
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function writeJson(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(payload))
}

function buildClientPayload(ctx, sessionId, session, store) {
  const state = store.get(sessionId)
  const analysis = session
    ? analyzeSessionLog(session, state)
    : { turns: [], maxTurn: 0, openTurn: null, totalConversationTokens: 0, savedTokens: 0 }

  let rawPressure
  let rawBreakdown
  try {
    const projections = serviceOf(ctx, 'sessionProjections')
    if (projections && session) {
      const snap = projections.snapshot(session, ['contextPressure', 'contextBreakdown'])
      rawPressure = snap?.values?.contextPressure
      rawBreakdown = snap?.values?.contextBreakdown
    }
  } catch {
  }

  const savedTokens = analysis.savedTokens ?? 0
  const totalConvTokens = analysis.totalConversationTokens ?? 0

  let adjustedPressure
  if (rawPressure && typeof rawPressure === 'object') {
    const baseUsed = rawPressure.projectedTokens ?? rawPressure.pressureTokens ?? 0
    let nextUsed = Math.max(0, baseUsed - savedTokens)
    if (rawBreakdown && typeof rawBreakdown === 'object') {
      const sysAndTools = (rawBreakdown.systemTokens ?? 0) + (rawBreakdown.toolsTokens ?? 0)
      const rawTotalHeuristic = sysAndTools + (rawBreakdown.messageTokens ?? 0)
      if (rawTotalHeuristic > 0 && baseUsed > 0) {
        const scale = baseUsed / rawTotalHeuristic
        nextUsed = Math.max(Math.round(sysAndTools * scale), Math.round(baseUsed - savedTokens * scale))
      }
    }
    adjustedPressure = {
      ...rawPressure,
      pressureTokens: nextUsed,
      projectedTokens: nextUsed,
    }
  }

  let adjustedBreakdown
  if (rawBreakdown && typeof rawBreakdown === 'object') {
    adjustedBreakdown = {
      systemTokens: rawBreakdown.systemTokens ?? 0,
      toolsTokens: rawBreakdown.toolsTokens ?? 0,
      messageTokens: Math.max(0, (rawBreakdown.messageTokens ?? 0) - savedTokens),
    }
  }

  return {
    ok: true,
    sessionId,
    state: {
      excludedTurns: state.excludedTurns,
      excludedMessageIds: state.excludedMessageIds,
      excludedCallIds: state.excludedCallIds,
      nextTurnEphemeral: state.nextTurnEphemeral,
      pendingEphemeralTurns: state.pendingEphemeralTurns,
      revision: state.revision,
      updatedAt: state.updatedAt,
    },
    turns: analysis.turns,
    maxTurn: analysis.maxTurn,
    openTurn: analysis.openTurn,
    tokenStats: {
      totalConversationTokens: totalConvTokens,
      savedTokens,
      rawPressure: rawPressure ?? null,
      rawBreakdown: rawBreakdown ?? null,
      adjustedPressure: adjustedPressure ?? null,
      adjustedBreakdown: adjustedBreakdown ?? null,
    },
  }
}

function applyToggleAction(ctx, store, session, sessionId, body) {
  const current = store.get(sessionId)
  const action = String(body?.action ?? '')
  const analysis = session ? analyzeSessionLog(session, current) : { turns: [] }

  if (action === 'toggle-turn') {
    const turn = Number(body?.turn)
    if (!Number.isInteger(turn) || turn <= 0) throw new Error('invalid turn number')
    const excludedSet = new Set(current.excludedTurns)
    const shouldInclude = typeof body?.included === 'boolean' ? body.included : excludedSet.has(turn)
    if (shouldInclude) {
      excludedSet.delete(turn)
    } else {
      excludedSet.add(turn)
    }
    const turnRow = analysis.turns.find((r) => r.turn === turn)
    let nextExcludedMsgs = current.excludedMessageIds
    let nextExcludedCalls = current.excludedCallIds
    if (shouldInclude && turnRow) {
      const turnMsgIds = new Set(turnRow.messages.map((m) => m.id))
      const turnCallIds = new Set(turnRow.calls.map((c) => c.callId))
      nextExcludedMsgs = nextExcludedMsgs.filter((id) => !turnMsgIds.has(id))
      nextExcludedCalls = nextExcludedCalls.filter((cid) => !turnCallIds.has(cid))
    }
    store.save(sessionId, {
      ...current,
      excludedTurns: [...excludedSet],
      excludedMessageIds: nextExcludedMsgs,
      excludedCallIds: nextExcludedCalls,
    })
  } else if (action === 'toggle-outgoing') {
    const turn = Number(body?.turn)
    const turnRow = analysis.turns.find((r) => r.turn === turn)
    if (!turnRow) throw new Error('turn not found')
    const excludedMsgSet = new Set(current.excludedMessageIds)
    const excludedTurnSet = new Set(current.excludedTurns)
    const shouldInclude = typeof body?.included === 'boolean' ? body.included : !turnRow.outgoingIncluded
    if (shouldInclude) {
      excludedTurnSet.delete(turn)
      for (const id of turnRow.outgoingIds) excludedMsgSet.delete(id)
    } else {
      for (const id of turnRow.outgoingIds) excludedMsgSet.add(id)
    }
    store.save(sessionId, {
      ...current,
      excludedTurns: [...excludedTurnSet],
      excludedMessageIds: [...excludedMsgSet],
    })
  } else if (action === 'toggle-incoming') {
    const turn = Number(body?.turn)
    const turnRow = analysis.turns.find((r) => r.turn === turn)
    if (!turnRow) throw new Error('turn not found')
    const excludedMsgSet = new Set(current.excludedMessageIds)
    const excludedCallSet = new Set(current.excludedCallIds)
    const excludedTurnSet = new Set(current.excludedTurns)
    const shouldInclude = typeof body?.included === 'boolean' ? body.included : !turnRow.incomingIncluded
    if (shouldInclude) {
      excludedTurnSet.delete(turn)
      for (const id of turnRow.incomingIds) excludedMsgSet.delete(id)
      for (const cid of turnRow.incomingCallIds) excludedCallSet.delete(cid)
    } else {
      for (const id of turnRow.incomingIds) excludedMsgSet.add(id)
      for (const cid of turnRow.incomingCallIds) excludedCallSet.add(cid)
    }
    store.save(sessionId, {
      ...current,
      excludedTurns: [...excludedTurnSet],
      excludedMessageIds: [...excludedMsgSet],
      excludedCallIds: [...excludedCallSet],
    })
  } else if (action === 'toggle-message') {
    const messageId = String(body?.messageId ?? '')
    if (messageId === '') throw new Error('missing messageId')
    const excludedMsgSet = new Set(current.excludedMessageIds)
    const shouldInclude = typeof body?.included === 'boolean' ? body.included : excludedMsgSet.has(messageId)
    if (shouldInclude) {
      excludedMsgSet.delete(messageId)
    } else {
      excludedMsgSet.add(messageId)
    }
    store.save(sessionId, {
      ...current,
      excludedMessageIds: [...excludedMsgSet],
    })
  } else if (action === 'toggle-call') {
    const callId = String(body?.callId ?? '')
    if (callId === '') throw new Error('missing callId')
    const excludedCallSet = new Set(current.excludedCallIds)
    const excludedMsgSet = new Set(current.excludedMessageIds)
    const shouldInclude = typeof body?.included === 'boolean' ? body.included : excludedCallSet.has(callId)
    const cMeta = analysis.callIdToMeta?.get?.(callId)
    if (shouldInclude) {
      excludedCallSet.delete(callId)
      if (cMeta?.toolMessageId) excludedMsgSet.delete(cMeta.toolMessageId)
    } else {
      excludedCallSet.add(callId)
      if (cMeta?.toolMessageId) excludedMsgSet.add(cMeta.toolMessageId)
    }
    store.save(sessionId, {
      ...current,
      excludedCallIds: [...excludedCallSet],
      excludedMessageIds: [...excludedMsgSet],
    })
  } else if (action === 'toggle-batch') {
    const msgIds = Array.isArray(body?.messageIds) ? body.messageIds.map(String).filter(Boolean) : []
    const callIds = Array.isArray(body?.callIds) ? body.callIds.map(String).filter(Boolean) : []
    const shouldInclude = Boolean(body?.included)
    const excludedMsgSet = new Set(current.excludedMessageIds)
    const excludedCallSet = new Set(current.excludedCallIds)
    for (const id of msgIds) {
      if (shouldInclude) excludedMsgSet.delete(id)
      else excludedMsgSet.add(id)
    }
    for (const cid of callIds) {
      const cMeta = analysis.callIdToMeta?.get?.(cid)
      if (shouldInclude) {
        excludedCallSet.delete(cid)
        if (cMeta?.toolMessageId) excludedMsgSet.delete(cMeta.toolMessageId)
      } else {
        excludedCallSet.add(cid)
        if (cMeta?.toolMessageId) excludedMsgSet.add(cMeta.toolMessageId)
      }
    }
    store.save(sessionId, {
      ...current,
      excludedMessageIds: [...excludedMsgSet],
      excludedCallIds: [...excludedCallSet],
    })
  } else if (action === 'set-all') {
    const includeAll = Boolean(body?.included)
    if (includeAll) {
      store.save(sessionId, {
        ...current,
        excludedTurns: [],
        excludedMessageIds: [],
        excludedCallIds: [],
      })
    } else {
      const allTurnNums = analysis.turns.map((t) => t.turn)
      store.save(sessionId, {
        ...current,
        excludedTurns: allTurnNums,
        excludedMessageIds: [],
        excludedCallIds: [],
      })
    }
  } else if (action === 'keep-last-n') {
    const count = Math.max(0, Number(body?.count ?? 3))
    const allTurnNums = analysis.turns.map((t) => t.turn)
    const keepSet = new Set(count === 0 ? [] : allTurnNums.slice(-count))
    const excludedTurns = allTurnNums.filter((t) => !keepSet.has(t))
    store.save(sessionId, {
      ...current,
      excludedTurns,
      excludedMessageIds: [],
      excludedCallIds: [],
    })
  } else if (action === 'set-next-ephemeral') {
    const ephemeral = Boolean(body?.ephemeral)
    store.save(sessionId, {
      ...current,
      nextTurnEphemeral: ephemeral,
    })
  } else {
    throw new Error(`unknown action "${action}"`)
  }

  return buildClientPayload(ctx, sessionId, session, store)
}

export function apply(ctx) {
  const dshHome = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  const store = new ContextSelectorStore(join(dshHome, 'context-selector'))

  ctx.on('session/event', (session, event) => {
    try {
      const sessionId = String(session?.id ?? '')
      if (sessionId === '' || !event) return
      if (event.type === 'turn/start') {
        const turn = Number(event.data?.turn ?? 0)
        if (turn > 0) {
          const state = store.get(sessionId)
          const expired = state.pendingEphemeralTurns.filter((t) => t < turn)
          const nextExcluded = expired.length > 0 ? [...state.excludedTurns, ...expired] : state.excludedTurns
          let nextPending = state.pendingEphemeralTurns.filter((t) => t >= turn)
          let nextEphemeralFlag = state.nextTurnEphemeral
          if (state.nextTurnEphemeral) {
            nextPending = [...nextPending, turn]
            nextEphemeralFlag = false
          }
          if (
            expired.length > 0 ||
            nextPending.length !== state.pendingEphemeralTurns.length ||
            nextEphemeralFlag !== state.nextTurnEphemeral
          ) {
            store.save(sessionId, {
              ...state,
              excludedTurns: nextExcluded,
              pendingEphemeralTurns: nextPending,
              nextTurnEphemeral: nextEphemeralFlag,
            })
          }
        }
      } else if (event.type === 'turn/end') {
        const turn = Number(event.data?.turn ?? 0)
        if (turn > 0) {
          const state = store.get(sessionId)
          if (state.pendingEphemeralTurns.includes(turn)) {
            store.save(sessionId, {
              ...state,
              excludedTurns: [...state.excludedTurns, turn],
              pendingEphemeralTurns: state.pendingEphemeralTurns.filter((t) => t !== turn),
            })
          }
        }
      }
    } catch {
    }
  })

  ctx.on(
    'llm/stream',
    (options, next) => {
      if (options === null || typeof options !== 'object') return next()
      if (FILTERED.has(options)) return next()
      if (options.purpose !== undefined) return next()
      const sessionId = options.sessionId
      if (typeof sessionId !== 'string' || sessionId === '') return next()

      const sessions = serviceOf(ctx, 'sessions')
      const session = sessions?.get?.(sessionId)
      if (!session) return next()

      let filteredResult
      try {
        filteredResult = filterRequestMessages(options, session, store)
      } catch (err) {
        ctx.logger?.warn?.(`[dsh-context-selector] filter failed, passing through: ${err?.message ?? err}`)
        return next()
      }

      if (!filteredResult.changed) return next()

      const llm = serviceOf(ctx, 'llm')
      if (!llm || typeof llm.stream !== 'function') return next()

      const nextOptions = {
        ...options,
        messages: filteredResult.messages,
      }
      FILTERED.add(nextOptions)
      ctx.logger?.info?.(
        `[dsh-context-selector] session=${sessionId}: filtered messages ${options.messages.length} -> ${filteredResult.messages.length}`,
      )
      return llm.stream(nextOptions)
    },
    { prepend: true },
  )

  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(() => {
      const disposeState = webCtx.webServer.register({
        kind: 'exact',
        path: '/api/context-selector/state',
        handler: async (req, res) => {
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            writeJson(res, 405, { ok: false, error: 'method not allowed' })
            return
          }
          const url = new URL(req.url ?? '/', 'http://localhost')
          const sessionId = url.searchParams.get('sessionId') ?? ''
          if (sessionId === '') {
            writeJson(res, 400, { ok: false, error: 'missing sessionId' })
            return
          }
          const sessions = serviceOf(ctx, 'sessions')
          const session = sessions?.get?.(sessionId)
          writeJson(res, 200, buildClientPayload(ctx, sessionId, session, store))
        },
      })

      const disposeToggle = webCtx.webServer.register({
        kind: 'exact',
        path: '/api/context-selector/toggle',
        handler: async (req, res) => {
          if (req.method !== 'POST') {
            writeJson(res, 405, { ok: false, error: 'method not allowed' })
            return
          }
          try {
            const body = await readJsonBody(req)
            const sessionId = String(body?.sessionId ?? '')
            if (sessionId === '') {
              writeJson(res, 400, { ok: false, error: 'missing sessionId' })
              return
            }
            const sessions = serviceOf(ctx, 'sessions')
            const session = sessions?.get?.(sessionId)
            const payload = applyToggleAction(ctx, store, session, sessionId, body)
            writeJson(res, 200, payload)
          } catch (err) {
            writeJson(res, 400, {
              ok: false,
              error: err instanceof Error ? err.message : String(err),
            })
          }
        },
      })

      return () => {
        disposeState()
        disposeToggle()
      }
    }, 'dsh-context-selector: webServer routes')
  })

  ctx.inject(['commands'], (cmdCtx) => {
    cmdCtx.effect(() => {
      return cmdCtx.commands.register({
        name: 'ctx',
        description: '查看或设置后续发送携带的上下文（用法: /ctx all | /ctx none | /ctx last <N> | /ctx toggle <Turn> | /ctx once）',
        execute: async ({ agent, args }) => {
          const session = agent?.session
          const sessionId = String(session?.id ?? '')
          if (sessionId === '') {
            return { kind: 'error', text: '无法获取当前会话 ID' }
          }
          const tokens = String(args ?? '')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
          const sub = (tokens[0] ?? 'status').toLowerCase()
          if (sub === 'all') {
            const res = applyToggleAction(ctx, store, session, sessionId, { action: 'set-all', included: true })
            return { kind: 'success', text: `已勾选全部历史内容（共 ${res.turns.length} 轮将在后续请求中发送）。` }
          }
          if (sub === 'none') {
            const res = applyToggleAction(ctx, store, session, sessionId, { action: 'set-all', included: false })
            return { kind: 'success', text: `已取消勾选全部历史轮次（共排除 ${res.state.excludedTurns.length} 轮，下次发送不再携带）。` }
          }
          if (sub === 'last') {
            const n = Math.max(0, Number(tokens[1] ?? 3))
            const res = applyToggleAction(ctx, store, session, sessionId, { action: 'keep-last-n', count: n })
            return { kind: 'success', text: `已设置为仅携带最近 ${n} 轮对话（已排除 ${res.state.excludedTurns.length} 轮）。` }
          }
          if (sub === 'toggle') {
            const t = Number(tokens[1])
            if (!Number.isInteger(t) || t <= 0) {
              return { kind: 'error', text: '请指定有效的轮次编号，例如: /ctx toggle 1' }
            }
            const res = applyToggleAction(ctx, store, session, sessionId, { action: 'toggle-turn', turn: t })
            const isExcluded = res.state.excludedTurns.includes(t)
            return {
              kind: 'success',
              text: isExcluded
                ? `第 ${t} 轮已取消勾选：下次发送将不携带第 ${t} 轮上下文。`
                : `第 ${t} 轮已勾选：后续发送将正常携带第 ${t} 轮上下文。`,
            }
          }
          if (sub === 'once') {
            const current = store.get(sessionId)
            const nextVal = !current.nextTurnEphemeral
            applyToggleAction(ctx, store, session, sessionId, { action: 'set-next-ephemeral', ephemeral: nextVal })
            return {
              kind: 'success',
              text: nextVal
                ? '已开启「下一轮仅发送一次」：你接下来发送的下一段对话在完成后会自动取消勾选，后续不再携带。'
                : '已关闭「下一轮仅发送一次」：接下来发送的对话将默认保留在后续上下文中。',
            }
          }
          const snapshot = buildClientPayload(ctx, sessionId, session, store)
          const total = snapshot.turns.length
          const excluded = snapshot.state.excludedTurns
          const excludedCalls = snapshot.state.excludedCallIds.length
          const excludedMsgs = snapshot.state.excludedMessageIds.length
          return {
            kind: 'success',
            text: `当前共 ${total} 轮对话：整轮排除 [${excluded.join(', ') || '无'}]，单条消息排除 ${excludedMsgs} 条，单条工具调用排除 ${excludedCalls} 条（预计节省 ~${snapshot.tokenStats.savedTokens} tokens）。`,
          }
        },
      })
    }, 'dsh-context-selector: /ctx command')
  })
}

export default { name, inject, apply }
