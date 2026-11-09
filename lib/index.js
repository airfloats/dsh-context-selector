import { randomUUID } from 'node:crypto'
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
    excludedSystemOrders: [],
    systemPresetOverride: null,
    customSystemPrompt: '',
    customSystemMode: 'append',
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

  resolveAncestorState(sessionId, sessionObj = null, sessionsSvc = null) {
    try {
      let curSession = sessionObj ?? sessionsSvc?.get?.(sessionId)
      const visited = new Set([String(sessionId)])
      for (let depth = 0; depth < 8 && curSession; depth += 1) {
        const parentId = String(
          curSession?.header?.parentSession ??
            curSession?.header?.forkedFrom ??
            '',
        )
        if (!parentId || visited.has(parentId)) break
        visited.add(parentId)
        const parentFile = this.filePath(parentId)
        if (this.cache.has(parentId) || existsSync(parentFile)) {
          const pState = this.get(parentId)
          if (pState) return pState
        }
        curSession = sessionsSvc?.get?.(parentId)
      }
    } catch {}
    return null
  }

  get(sessionId, sessionObj = null, sessionsSvc = null) {
    const key = String(sessionId)
    const cached = this.cache.get(key)
    if (cached !== undefined) {
      if (!cached.systemPresetOverride && (sessionObj || sessionsSvc)) {
        const anc = this.resolveAncestorState(key, sessionObj, sessionsSvc)
        if (anc?.systemPresetOverride) {
          return this.save(key, {
            ...cached,
            systemPresetOverride: anc.systemPresetOverride,
            customSystemPrompt: cached.customSystemPrompt || anc.customSystemPrompt || '',
            customSystemMode: cached.customSystemMode || anc.customSystemMode || 'append',
          })
        }
      }
      return cached
    }
    const file = this.filePath(key)
    if (!existsSync(file)) {
      const pState = this.resolveAncestorState(key, sessionObj, sessionsSvc)
      if (pState) {
        const inherited = {
          ...defaultSessionState(),
          excludedTurns: normalizeNumberArray(pState.excludedTurns),
          excludedMessageIds: normalizeStringArray(pState.excludedMessageIds),
          excludedCallIds: normalizeStringArray(pState.excludedCallIds),
          excludedSystemOrders: normalizeNumberArray(pState.excludedSystemOrders),
          systemPresetOverride: pState.systemPresetOverride ?? null,
          customSystemPrompt: pState.customSystemPrompt ?? '',
          customSystemMode: pState.customSystemMode ?? 'append',
        }
        return this.save(key, inherited)
      }
      const init = defaultSessionState()
      this.cache.set(key, init)
      return init
    }
    try {
      const parsed = JSON.parse(readFileSync(file, 'utf8'))
      let presetOverride =
        typeof parsed?.systemPresetOverride === 'string' && parsed.systemPresetOverride.trim() !== ''
          ? parsed.systemPresetOverride.trim()
          : null
      if (!presetOverride && (sessionObj || sessionsSvc)) {
        const anc = this.resolveAncestorState(key, sessionObj, sessionsSvc)
        if (anc?.systemPresetOverride) {
          presetOverride = anc.systemPresetOverride
        }
      }
      const state = {
        excludedTurns: normalizeNumberArray(parsed?.excludedTurns),
        excludedMessageIds: normalizeStringArray(parsed?.excludedMessageIds),
        excludedCallIds: normalizeStringArray(parsed?.excludedCallIds),
        excludedSystemOrders: normalizeNumberArray(parsed?.excludedSystemOrders),
        systemPresetOverride: presetOverride,
        customSystemPrompt: typeof parsed?.customSystemPrompt === 'string' ? parsed.customSystemPrompt : '',
        customSystemMode: parsed?.customSystemMode === 'replace' ? 'replace' : 'append',
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
      excludedSystemOrders: normalizeNumberArray(nextState.excludedSystemOrders),
      systemPresetOverride:
        typeof nextState.systemPresetOverride === 'string' && nextState.systemPresetOverride.trim() !== ''
          ? nextState.systemPresetOverride.trim()
          : null,
      customSystemPrompt: typeof nextState.customSystemPrompt === 'string' ? nextState.customSystemPrompt : '',
      customSystemMode: nextState.customSystemMode === 'replace' ? 'replace' : 'append',
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

  quickPhrasesFilePath() {
    return join(this.baseDir, '_quick_phrases.json')
  }

  getQuickPhrasesConfig() {
    const defaultItems = [
      { text: '你好' },
      { text: '继续' },
      { text: '看一下现在有什么发现' },
      { text: '帮我直接改好并验证' },
    ]
    const file = this.quickPhrasesFilePath()
    if (!existsSync(file)) return { items: defaultItems }
    try {
      const parsed = JSON.parse(readFileSync(file, 'utf8'))
      const rawItems = Array.isArray(parsed?.items) ? parsed.items : []
      const items = rawItems
        .map((it) => {
          if (typeof it === 'string') return { text: it.trim() }
          if (it && typeof it === 'object') return { text: String(it.text ?? '').trim() }
          return null
        })
        .filter((it) => it && it.text.length > 0)
      return { items: items.length > 0 ? items : defaultItems }
    } catch {
      return { items: defaultItems }
    }
  }

  saveQuickPhrasesConfig(nextCfg) {
    const cur = this.getQuickPhrasesConfig()
    const merged = {
      items: Array.isArray(nextCfg?.items) ? nextCfg.items : cur.items,
      updatedAt: Date.now(),
    }
    const file = this.quickPhrasesFilePath()
    const tmp = `${file}.tmp`
    try {
      mkdirSync(this.baseDir, { recursive: true })
      writeFileSync(tmp, `${JSON.stringify(merged, null, 2)}\n`, 'utf8')
      try {
        renameSync(tmp, file)
      } catch {
        writeFileSync(file, `${JSON.stringify(merged, null, 2)}\n`, 'utf8')
      }
    } catch {}
    return merged
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
  if (srcKind === 'compact-checkpoint') return 'checkpoint'
  if (PROTECTED_USER_SOURCES.has(srcKind)) return 'protected'
  if (AMBIENT_SNAPSHOT_SOURCES.has(srcKind)) return 'ambient'
  const text = extractMessageText(msg?.content).trim()
  if (text.includes('<compacted-summary>')) return 'checkpoint'
  if (srcKind !== 'user') {
    if (
      text.startsWith('Current runtime context.') ||
      text.startsWith('<system-reminder>') ||
      text.startsWith('<available_skills>')
    ) {
      return 'ambient'
    }
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
  const summaryById = new Map()
  const prunedByOrigSeq = new Map()
  const checkpoints = []

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
        surfaceMessages: 0,
        compactedById: null,
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
    if (ev.type === 'compaction/summary') {
      const cid = String(ev.data?.compactionId ?? '')
      if (cid !== '') {
        summaryById.set(cid, {
          compactionId: cid,
          shadowedSeqs: Array.isArray(ev.data?.shadowedSeqs) ? ev.data.shadowedSeqs : [],
          shadowedRange: ev.data?.shadowedRange ?? null,
          shadowedTokenCount: Number(ev.data?.shadowedTokenCount ?? 0),
          provider: String(ev.data?.provider ?? ''),
          model: String(ev.data?.model ?? ''),
          time: ev.time ?? Date.now(),
        })
      }
      continue
    }
    if (ev.type === 'compaction/prune') {
      const pSeqs = Array.isArray(ev.data?.shadowedSeqs) ? ev.data.shadowedSeqs : []
      const pTok = Number(ev.data?.shadowedTokenCount ?? 0)
      for (const s of pSeqs) {
        prunedByOrigSeq.set(s, { originalSeq: s, originalTokens: pTok })
      }
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
          onSurface: true,
          pruned: false,
          originalTokens: null,
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

    const onSurface = !hasSurfaceInfo || (typeof ev.seq === 'number' && surfaceSeqs.has(ev.seq))

    if (ev.type === 'user/message') {
      const msg = ev.data
      if (!msg || typeof msg.id !== 'string') continue
      const uKind = classifyUserMessage(msg)
      const rawText = extractMessageText(msg.content)
      const chars = rawText.length
      const tokens = estimateMessageTokens(msg)

      if (uKind === 'checkpoint') {
        const compactionId = String(msg?.source?.compactionId ?? '')
        const sumInfo = summaryById.get(compactionId)
        const coveredTurnSet = new Set()
        if (sumInfo && Array.isArray(sumInfo.shadowedSeqs)) {
          for (const sSeq of sumInfo.shadowedSeqs) {
            const tNum = seqToTurn.get(sSeq)
            if (tNum !== undefined && tNum > 0) coveredTurnSet.add(tNum)
          }
        }
        if (coveredTurnSet.size === 0 && Array.isArray(ev.sourceEventSeqs)) {
          for (const sSeq of ev.sourceEventSeqs) {
            const tNum = seqToTurn.get(sSeq)
            if (tNum !== undefined && tNum > 0) coveredTurnSet.add(tNum)
          }
        }
        const coveredTurns = [...coveredTurnSet].sort((a, b) => a - b)
        for (const ct of coveredTurns) {
          const r = ensureTurn(ct)
          if (r) r.compactedById = compactionId || msg.id
        }
        const cpIncluded = onSurface && !excludedMsgSet.has(msg.id)
        if (onSurface) {
          totalConversationTokens += tokens
          if (!cpIncluded) savedTokens += tokens
        }
        const summaryTextClean = rawText
          .replace(/^[\s\S]*?<compacted-summary>\s*/i, '')
          .replace(/\s*<\/compacted-summary>[\s\S]*$/i, '')
          .trim()
        const cpMeta = {
          id: msg.id,
          compactionId: compactionId || msg.id,
          seq: ev.seq,
          turn: resolvedTurn,
          onSurface,
          included: cpIncluded,
          individuallyExcluded: excludedMsgSet.has(msg.id),
          coveredTurns,
          shadowedTokenCount: sumInfo?.shadowedTokenCount ?? 0,
          tokens,
          chars,
          preview: oneLinePreview(summaryTextClean || rawText, 120),
          fullText: summaryTextClean || rawText,
        }
        checkpoints.push(cpMeta)
        messageIdToMeta.set(msg.id, {
          id: msg.id,
          seq: ev.seq,
          turn: resolvedTurn,
          step: 1,
          role: 'user',
          kind: 'checkpoint',
          onSurface,
          preview: cpMeta.preview,
          chars,
          tokens,
        })
        continue
      }

      if (uKind === 'user' && onSurface) {
        totalConversationTokens += tokens
      }
      const meta = {
        id: msg.id,
        seq: ev.seq,
        turn: resolvedTurn,
        step: 1,
        role: 'user',
        kind: uKind,
        onSurface,
        preview: oneLinePreview(rawText),
        chars,
        tokens,
      }
      messageIdToMeta.set(msg.id, meta)
      if (uKind === 'user' && resolvedTurn > 0) {
        const tr = ensureTurn(resolvedTurn)
        if (tr) {
          tr.messages.push(meta)
          if (onSurface) tr.surfaceMessages += 1
        }
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
            onSurface,
            pruned: prevCall?.pruned ?? false,
            originalTokens: prevCall?.originalTokens ?? null,
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
      if (onSurface) {
        totalConversationTokens += tokens
      }
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
        onSurface,
        preview: previewText,
        toolNames,
        callIds,
        chars,
        tokens,
      }
      messageIdToMeta.set(msg.id, meta)
      if (resolvedTurn > 0) {
        const tr = ensureTurn(resolvedTurn)
        if (tr) {
          tr.messages.push(meta)
          if (onSurface) tr.surfaceMessages += 1
        }
      }
    } else if (ev.type === 'tool/result') {
      const msg = ev.data?.message
      if (!msg || typeof msg.id !== 'string') continue
      const step = Number(ev.data?.step ?? 1)
      const callId = String(msg.toolCallId ?? msg.source?.callId ?? '')
      const rawText = extractMessageText(msg.content)
      const chars = rawText.length
      const tokens = estimateMessageTokens(msg)

      let isReplacement = false
      let pruneInfo = null
      if (ev.surfaceOp && typeof ev.surfaceOp === 'object' && ev.surfaceOp.op === 'replace') {
        isReplacement = true
        pruneInfo = prunedByOrigSeq.get(ev.surfaceOp.startSeq) ?? null
      }
      if (!onSurface && !isReplacement) {
        const existingCall = callIdToMeta.get(callId)
        if (callId !== '' && existingCall && !existingCall.toolMessageId) {
          const shadowedCall = {
            ...existingCall,
            toolMessageId: msg.id,
            resultPreview: oneLinePreview(rawText, 80),
            chars: (existingCall.chars ?? 0) + chars,
            tokens: (existingCall.tokens ?? 0) + tokens,
            onSurface: false,
          }
          callIdToMeta.set(callId, shadowedCall)
          if (shadowedCall.turn > 0) {
            const turnRow = ensureTurn(shadowedCall.turn)
            if (turnRow) {
              const idx = turnRow.calls.findIndex((c) => c.callId === callId)
              if (idx === -1) turnRow.calls.push(shadowedCall)
              else turnRow.calls[idx] = shadowedCall
            }
          }
        }
        continue
      }
      if (!onSurface) continue

      totalConversationTokens += tokens
      const existingCall = callIdToMeta.get(callId)
      const toolName = existingCall?.toolName ?? 'tool'
      const isPruned =
        Boolean(pruneInfo) ||
        rawText.includes('[... tool result middle pruned ...]')
      const baseCallTokens = existingCall?.assistantMessageId ? 20 : 0
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
          chars: baseCallTokens * 4 + chars,
          tokens: baseCallTokens + tokens,
          onSurface: true,
          pruned: isPruned,
          originalTokens: pruneInfo?.originalTokens ?? existingCall?.originalTokens ?? null,
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
        onSurface: true,
        pruned: isPruned,
        originalTokens: pruneInfo?.originalTokens ?? null,
        toolCallId: callId,
        toolName,
        summary: existingCall?.summary ?? toolName,
        preview: oneLinePreview(rawText) || `[${toolName} 结果]`,
        chars,
        tokens,
      }
      messageIdToMeta.set(msg.id, meta)
      if (resolvedTurn > 0) {
        const tr = ensureTurn(resolvedTurn)
        if (tr) {
          tr.messages.push(meta)
          tr.surfaceMessages += 1
        }
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
      const compacted =
        hasSurfaceInfo &&
        (Boolean(row.compactedById) ||
          (checkpoints.length > 0 && row.messages.length > 0 && row.surfaceMessages === 0))
      const turnIncluded = !compacted && !excludedTurnSet.has(row.turn)
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
        const msgCompacted = compacted || m.onSurface === false
        const isCallExcluded = m.role === 'tool' && m.toolCallId && excludedCallSet.has(m.toolCallId)
        const allAssistantCallsExcluded =
          m.role === 'assistant' &&
          !m.hasVisibleText &&
          Array.isArray(m.callIds) &&
          m.callIds.length > 0 &&
          m.callIds.every((cid) => excludedCallSet.has(cid))
        const msgIncluded =
          !msgCompacted &&
          turnIncluded &&
          !excludedMsgSet.has(m.id) &&
          !isCallExcluded &&
          !allAssistantCallsExcluded
        if (!msgCompacted && !msgIncluded) {
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
          onSurface: m.onSurface !== false,
          compacted: msgCompacted,
          pruned: Boolean(m.pruned),
          originalTokens: m.originalTokens ?? null,
          included: msgIncluded,
          individuallyExcluded: excludedMsgSet.has(m.id) || Boolean(isCallExcluded),
        }
      })

      savedTokens += turnSavedTokens

      const detailedCalls = row.calls.map((c) => {
        const callCompacted = compacted || c.onSurface === false
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
          onSurface: c.onSurface !== false,
          compacted: callCompacted,
          pruned: Boolean(c.pruned),
          originalTokens: c.originalTokens ?? null,
          included: !callCompacted && turnIncluded && !callExcluded,
          individuallyExcluded: callExcluded,
        }
      })

      const outgoingIds = userMsgs.map((m) => m.id)
      const outgoingIncluded =
        !compacted &&
        turnIncluded &&
        (outgoingIds.length === 0 || outgoingIds.some((id) => !excludedMsgSet.has(id)))

      const incomingIds = row.messages.filter((m) => m.role !== 'user').map((m) => m.id)
      const incomingCalls = row.calls.map((c) => c.callId)
      const incomingIncluded =
        !compacted &&
        turnIncluded &&
        (incomingIds.length === 0 ||
          incomingIds.some((id) => !excludedMsgSet.has(id)) ||
          incomingCalls.some((cid) => !excludedCallSet.has(cid)))

      return {
        turn: row.turn,
        status: row.status,
        compacted,
        compactedById: row.compactedById ?? null,
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
    checkpoints,
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

  let state = store.get(sessionId, session)
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
  const excludedSysOrders = new Set(state.excludedSystemOrders ?? [])
  const hasCustomSys =
    Boolean(state.systemPresetOverride) ||
    excludedSysOrders.size > 0 ||
    (typeof state.customSystemPrompt === 'string' && state.customSystemPrompt.trim() !== '')

  if (
    excludedTurns.size === 0 &&
    excludedMsgs.size === 0 &&
    excludedCalls.size === 0 &&
    !hasCustomSys
  ) {
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
    if (msg.role === 'developer') {
      out.push(msg)
      continue
    }
    if (msg.role === 'system') {
      if (!hasCustomSys) {
        out.push(msg)
        continue
      }
      let sysText = extractMessageText(msg.content)
      if (state.customSystemMode === 'replace' && state.customSystemPrompt && state.customSystemPrompt.trim() !== '') {
        sysText = state.customSystemPrompt.trim()
      } else {
        if (excludedSysOrders.size > 0) {
          const paras = sysText
            .split(/\n{2,}/)
            .map((p) => p.trim())
            .filter(Boolean)
          if (paras.length > 1) {
            sysText = paras.filter((_p, idx) => !excludedSysOrders.has(idx + 1)).join('\n\n')
          } else if (excludedSysOrders.has(1)) {
            sysText = ''
          }
        }
        if (state.customSystemPrompt && state.customSystemPrompt.trim() !== '') {
          sysText = sysText
            ? `${sysText}\n\n${state.customSystemPrompt.trim()}`
            : state.customSystemPrompt.trim()
        }
      }
      changed = true
      if (sysText.trim() !== '') {
        out.push({
          ...msg,
          content: [{ type: 'text', text: sysText }],
        })
      }
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

function buildContextInspectorPayload(ctx, sessionId, session, store) {
  const sessionsSvc = serviceOf(ctx, 'sessions')
  const state = store.get(sessionId, session, sessionsSvc)
  if (!session) {
    return {
      ok: true,
      sessionId,
      system: { totalTokens: 0, totalChars: 0, items: [] },
      tools: { totalTokens: 0, totalChars: 0, items: [] },
      messages: { totalTokens: 0, savedTokens: 0, totalChars: 0, items: [] },
    }
  }

  const events = typeof session.snapshotEvents === 'function' ? session.snapshotEvents() : []
  const surfaceNodes = Array.isArray(session.surface?.nodes) ? session.surface.nodes : []
  const surfaceSet = new Set(surfaceNodes)
  const hasSurface = surfaceSet.size > 0
  const analysis = analyzeSessionLog(session, state)

  const excludedTurnSet = new Set(state.excludedTurns ?? [])
  const excludedMsgSet = new Set(state.excludedMessageIds ?? [])
  const excludedCallSet = new Set(state.excludedCallIds ?? [])
  for (const [cid, cMeta] of analysis.callIdToMeta.entries()) {
    if (cMeta.toolMessageId && excludedMsgSet.has(cMeta.toolMessageId)) {
      excludedCallSet.add(cid)
    }
  }

  const seqToTurn = new Map()
  let curTurn = 0
  let curStep = 1
  const seqToStep = new Map()
  const compactionSummariesBySeq = new Map()
  for (const ev of events) {
    if (!ev || typeof ev !== 'object') continue
    if (ev.type === 'turn/start') {
      const t = Number(ev.data?.turn ?? 0)
      if (t > 0) {
        curTurn = t
        curStep = 1
      }
      continue
    }
    if (ev.type === 'step/start') {
      const s = Number(ev.data?.step ?? 1)
      if (s > 0) curStep = s
      continue
    }
    if (ev.type === 'compaction/summary') {
      compactionSummariesBySeq.set(ev.seq, ev.data)
      continue
    }
    const expTurn = typeof ev.data?.turn === 'number' ? ev.data.turn : undefined
    let rTurn = expTurn ?? curTurn
    if (rTurn === 0 && Array.isArray(ev.sourceEventSeqs)) {
      for (const sSeq of ev.sourceEventSeqs) {
        const mapped = seqToTurn.get(sSeq)
        if (mapped) {
          rTurn = mapped
          break
        }
      }
    }
    if (typeof ev.seq === 'number') {
      if (rTurn > 0) seqToTurn.set(ev.seq, rTurn)
      seqToStep.set(ev.seq, Number(ev.data?.step ?? curStep))
    }
  }

  const orderedSurfaceEvents = hasSurface
    ? surfaceNodes
        .map((seq) => (typeof session.eventAt === 'function' ? session.eventAt(seq) : events.find((e) => e?.seq === seq)))
        .filter(Boolean)
    : events.filter((e) =>
        ['system/message', 'developer/message', 'user/message', 'assistant/message', 'tool/result'].includes(e?.type),
      )

  const systemItems = []
  let systemTotalTokens = 0
  let systemTotalChars = 0

  const messageItems = []
  let messagesTotalTokens = 0
  let messagesSavedTokens = 0
  let messagesTotalChars = 0

  let sysOrder = 0
  let msgOrder = 0

  for (const ev of orderedSurfaceEvents) {
    const seq = ev.seq
    const turn = seqToTurn.get(seq) ?? 0
    const step = seqToStep.get(seq) ?? 1
    const derived =
      typeof session.deriveEventMessage === 'function'
        ? session.deriveEventMessage(ev)
        : ev.type === 'user/message'
          ? ev.data
          : ev.data?.message
    if (!derived) continue

    if (ev.type === 'system/message') {
      const text = extractMessageText(derived.content)
      const tokens = estimateMessageTokens(derived)
      const chars = text.length
      const excludedSysSet = new Set(state.excludedSystemOrders ?? [])
      const paragraphs = text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
      if (paragraphs.length > 1) {
        paragraphs.forEach((secText, idx) => {
          const orderNum = ++sysOrder
          const inc = !excludedSysSet.has(orderNum)
          const firstLine = secText.split('\n')[0].trim()
          const secTokens = Math.ceil(secText.length / CHARS_PER_TOKEN)
          if (inc) systemTotalTokens += secTokens
          systemTotalChars += secText.length
          systemItems.push({
            order: orderNum,
            seq,
            included: inc,
            canToggle: true,
            title: `段落 #${idx + 1} · ${oneLinePreview(firstLine, 60)}`,
            category: '系统提示词分段',
            chars: secText.length,
            tokens: secTokens,
            preview: oneLinePreview(secText, 120),
            content: secText,
          })
        })
      } else {
        const orderNum = ++sysOrder
        const inc = !excludedSysSet.has(orderNum)
        if (inc) systemTotalTokens += tokens
        systemTotalChars += chars
        systemItems.push({
          order: orderNum,
          seq,
          included: inc,
          canToggle: true,
          title: `系统提示词 (seq #${seq})`,
          category: 'System Prompt',
          chars,
          tokens,
          preview: oneLinePreview(text, 120),
          content: text,
        })
      }
      continue
    }

    const msgId = typeof derived.id === 'string' ? derived.id : `seq-${seq}`
    const tokens = estimateMessageTokens(derived)
    let rawText = extractMessageText(derived.content)
    const turnExcluded = turn > 0 && excludedTurnSet.has(turn)

    if (ev.type === 'developer/message') {
      const devText = rawText || JSON.stringify(derived.content, null, 2)
      messagesTotalTokens += tokens
      messagesTotalChars += devText.length
      messageItems.push({
        order: ++msgOrder,
        seq,
        id: msgId,
        turn,
        step,
        role: 'developer',
        category: '开发者指令 / 工具动态挂载',
        badge: 'Developer',
        included: true,
        canToggle: false,
        tokens,
        chars: devText.length,
        title: oneLinePreview(devText, 80) || 'Developer Message',
        content: devText,
      })
      continue
    }

    if (ev.type === 'user/message') {
      const srcKind = String(derived.source?.kind ?? derived.source?.plugin ?? '')
      const uKind = classifyUserMessage(derived)
      const isCheckpoint = uKind === 'checkpoint' || srcKind === 'compact-checkpoint' || rawText.includes('<compacted-summary>')
      const isProtected = uKind === 'protected'
      const isAmbient = uKind === 'ambient'
      const msgExcluded = !isProtected && (( !isCheckpoint && turnExcluded) || excludedMsgSet.has(msgId))
      const included = !msgExcluded

      let category = '我发送的消息 (User)'
      let badge = turn > 0 ? `第 ${turn} 轮 · 提问` : '提问'
      let extraMeta = null

      if (isCheckpoint) {
        category = '上下文压缩检查点 (Compaction Summary)'
        badge = '📦 压缩摘要'
        if (ev.surfaceOp && typeof ev.surfaceOp === 'object') {
          extraMeta = `替换原表面节点 seq ${ev.surfaceOp.startSeq} ~ ${ev.surfaceOp.endSeq}`
        }
      } else if (srcKind === 'agent-instructions') {
        category = '项目级指令 (AGENTS.md / CLAUDE.md)'
        badge = '📌 指令注入'
      } else if (srcKind === 'skill-catalog') {
        category = '技能目录快照 (Available Skills)'
        badge = '🧰 技能目录'
      } else if (isAmbient) {
        category = `环境状态快照 (${srcKind || 'runtime-context'})`
        badge = '🌐 环境上下文'
      }

      if (included) {
        messagesTotalTokens += tokens
      } else {
        messagesSavedTokens += tokens
      }
      messagesTotalChars += rawText.length

      messageItems.push({
        order: ++msgOrder,
        seq,
        id: msgId,
        turn,
        step,
        role: 'user',
        subKind: isCheckpoint ? 'checkpoint' : isProtected ? 'protected' : isAmbient ? 'ambient' : 'user',
        category,
        badge,
        extraMeta,
        included,
        canToggle: !isProtected && typeof derived.id === 'string',
        tokens,
        chars: rawText.length,
        title: oneLinePreview(rawText, 90) || category,
        content: rawText,
      })
      continue
    }

    if (ev.type === 'assistant/message') {
      const blocks = Array.isArray(derived.content) ? derived.content : []
      const textParts = []
      const reasoningParts = []
      const toolCalls = []

      for (const b of blocks) {
        if (!b || typeof b !== 'object') continue
        if (b.type === 'text' && typeof b.text === 'string' && b.text.trim()) {
          textParts.push(b.text)
        } else if (b.type === 'reasoning' && typeof b.text === 'string' && b.text.trim()) {
          reasoningParts.push(b.text)
        } else if (b.type === 'tool-call') {
          toolCalls.push(b)
        }
      }

      const callIds = toolCalls.map((tc) => String(tc.id ?? '')).filter(Boolean)
      const allCallsExcluded =
        textParts.length === 0 &&
        callIds.length > 0 &&
        callIds.every((cid) => excludedCallSet.has(cid))
      const msgExcluded = turnExcluded || excludedMsgSet.has(msgId) || allCallsExcluded
      const included = !msgExcluded

      if (included) {
        messagesTotalTokens += tokens
      } else {
        messagesSavedTokens += tokens
      }

      const fullSections = []
      if (reasoningParts.length > 0) {
        fullSections.push(`【思考过程 (Reasoning)】\n${reasoningParts.join('\n\n')}`)
      }
      if (textParts.length > 0) {
        fullSections.push(`【正式回复 (Text)】\n${textParts.join('\n\n')}`)
      }
      if (toolCalls.length > 0) {
        const tcText = toolCalls
          .map((tc) => `调用工具: ${tc.name} (id=${tc.id})\n参数: ${tc.arguments}`)
          .join('\n\n')
        fullSections.push(`【发起工具调用 (${toolCalls.length} 项)】\n${tcText}`)
      }
      const fullContent = fullSections.join('\n\n────────────────────\n\n') || JSON.stringify(blocks, null, 2)
      messagesTotalChars += fullContent.length

      const toolSummary = toolCalls.map((tc) => tc.name).join(', ')
      const titlePreview =
        oneLinePreview(textParts.join(' '), 85) ||
        (toolSummary ? `发起工具调用: ${toolSummary}` : oneLinePreview(reasoningParts.join(' '), 85)) ||
        'Assistant 消息'

      messageItems.push({
        order: ++msgOrder,
        seq,
        id: msgId,
        turn,
        step,
        role: 'assistant',
        subKind: textParts.length > 0 ? 'assistant-reply' : 'assistant-step',
        category: textParts.length > 0 ? 'AI 回复与推理 (Assistant)' : 'AI 步进调用 (Assistant Tool Call)',
        badge: turn > 0 ? `第 ${turn} 轮 · Step ${step} · AI` : 'AI 回复',
        included,
        canToggle: true,
        tokens,
        chars: fullContent.length,
        title: titlePreview,
        content: fullContent,
      })
      continue
    }

    if (ev.type === 'tool/result') {
      const callId = String(derived.toolCallId ?? derived.source?.callId ?? '')
      const callMeta = analysis.callIdToMeta.get(callId)
      const toolName = callMeta?.toolName ?? 'tool'
      const isPruned = rawText.includes('[... tool result middle pruned ...]') || (ev.surfaceOp && ev.surfaceOp !== 'append')
      const msgExcluded =
        turnExcluded ||
        excludedMsgSet.has(msgId) ||
        (callId !== '' && excludedCallSet.has(callId))
      const included = !msgExcluded

      if (included) {
        messagesTotalTokens += tokens
      } else {
        messagesSavedTokens += tokens
      }
      messagesTotalChars += rawText.length

      messageItems.push({
        order: ++msgOrder,
        seq,
        id: msgId,
        callId,
        turn,
        step,
        role: 'tool',
        subKind: isPruned ? 'tool-pruned' : 'tool-result',
        category: isPruned ? `工具返回结果 [已被系统裁剪中间段] (${toolName})` : `工具返回结果 (${toolName})`,
        badge: turn > 0 ? `第 ${turn} 轮 · 工具 · ${toolName}` : `工具 · ${toolName}`,
        extraMeta: isPruned ? '✂️ 超过 8192 字符阈值，中间段已被自动裁剪' : null,
        included,
        canToggle: true,
        tokens,
        chars: rawText.length,
        title: callMeta?.summary ?? `${toolName} · ${oneLinePreview(rawText, 72)}`,
        content: rawText,
      })
    }
  }

  const header = typeof session.requestHeader === 'function' ? session.requestHeader() : null
  const rawTools = Array.isArray(header?.tools) ? header.tools : []
  let toolsTotalTokens = 0
  let toolsTotalChars = 0
  const toolItems = rawTools.map((tool, idx) => {
    const rawJson = JSON.stringify(tool, null, 2)
    const chars = rawJson.length
    const tok = Math.ceil(JSON.stringify(tool).length / CHARS_PER_TOKEN)
    toolsTotalChars += chars
    toolsTotalTokens += tok
    const propKeys =
      tool?.parameters && typeof tool.parameters === 'object' && tool.parameters.properties
        ? Object.keys(tool.parameters.properties)
        : []
    return {
      order: idx + 1,
      name: String(tool?.name ?? `tool_${idx + 1}`),
      deferLoading: Boolean(tool?.deferLoading),
      paramCount: propKeys.length,
      paramNames: propKeys,
      chars,
      tokens: tok,
      preview: oneLinePreview(tool?.description ?? '', 100),
      description: String(tool?.description ?? ''),
      schemaJson: rawJson,
    }
  })
  if (rawTools.length > 0) {
    toolsTotalTokens += BLOCK_OVERHEAD
  }

  return {
    ok: true,
    sessionId,
    modelConfig: header?.config ?? null,
    system: {
      totalTokens: systemTotalTokens,
      totalChars: systemTotalChars,
      count: systemItems.length,
      items: systemItems,
    },
    tools: {
      totalTokens: toolsTotalTokens,
      totalChars: toolsTotalChars,
      count: toolItems.length,
      items: toolItems,
    },
    messages: {
      totalTokens: messagesTotalTokens,
      savedTokens: messagesSavedTokens,
      totalChars: messagesTotalChars,
      count: messageItems.length,
      items: messageItems,
    },
  }
}

function buildClientPayload(ctx, sessionId, session, store) {
  const sessionsSvc = serviceOf(ctx, 'sessions')
  const state = store.get(sessionId, session, sessionsSvc)
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

    let availablePresets = []
    try {
      const agentPresets = serviceOf(ctx, 'agentPresets')
      if (agentPresets && agentPresets.definitions instanceof Map) {
        for (const [id, rec] of agentPresets.definitions.entries()) {
          const cfg = rec?.config ?? {}
          availablePresets.push({
            id: String(id),
            name: String(cfg.name || id),
            description: String(cfg.description || ''),
          })
        }
      }
    } catch {}

    let activePreset = null
    try {
      const projections = serviceOf(ctx, 'sessionProjections')
      if (projections && session) {
        activePreset = projections.stateOf(session, 'agentPreset') ?? session?.header?.agentPreset ?? null
      }
      if (state.systemPresetOverride && state.systemPresetOverride !== 'custom') {
        if (activePreset !== state.systemPresetOverride && session && typeof session.append === 'function') {
          try {
            session.append('agent-preset/selected', { agentPreset: state.systemPresetOverride })
          } catch {}
        }
        activePreset = state.systemPresetOverride
      }
    } catch {}

  const qpCfg = store.getQuickPhrasesConfig()

  return {
    ok: true,
    sessionId,
    activePreset,
    availablePresets,
    quickPhrases: {
      items: qpCfg.items,
    },
    state: {
      excludedTurns: state.excludedTurns,
      excludedMessageIds: state.excludedMessageIds,
      excludedCallIds: state.excludedCallIds,
      excludedSystemOrders: state.excludedSystemOrders ?? [],
      systemPresetOverride: state.systemPresetOverride ?? null,
      customSystemPrompt: state.customSystemPrompt ?? '',
      customSystemMode: state.customSystemMode ?? 'append',
      nextTurnEphemeral: state.nextTurnEphemeral,
      pendingEphemeralTurns: state.pendingEphemeralTurns,
      revision: state.revision,
      updatedAt: state.updatedAt,
    },
    turns: analysis.turns,
    checkpoints: analysis.checkpoints ?? [],
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
  const sessionsSvc = serviceOf(ctx, 'sessions')
  const current = store.get(sessionId, session, sessionsSvc)
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
  } else if (action === 'exclude-before-turn') {
    const fromTurn = Number(body?.turn)
    if (!Number.isInteger(fromTurn) || fromTurn <= 0) throw new Error('invalid turn number')
    const mode = String(body?.mode ?? 'cutoff')
    const allTurnNums = analysis.turns.map((t) => t.turn)
    if (mode === 'only-above') {
      const excludedSet = new Set(current.excludedTurns)
      for (const t of allTurnNums) {
        if (t < fromTurn) excludedSet.add(t)
      }
      store.save(sessionId, {
        ...current,
        excludedTurns: [...excludedSet],
      })
    } else {
      const excludedTurns = allTurnNums.filter((t) => t < fromTurn)
      const keptTurnSet = new Set(allTurnNums.filter((t) => t >= fromTurn))
      const keptMsgIds = new Set()
      const keptCallIds = new Set()
      for (const row of analysis.turns) {
        if (keptTurnSet.has(row.turn)) {
          for (const m of row.messages) keptMsgIds.add(m.id)
          for (const c of row.calls) keptCallIds.add(c.callId)
        }
      }
      store.save(sessionId, {
        ...current,
        excludedTurns,
        excludedMessageIds: current.excludedMessageIds.filter((id) => !keptMsgIds.has(id)),
        excludedCallIds: current.excludedCallIds.filter((cid) => !keptCallIds.has(cid)),
      })
    }
  } else if (action === 'exclude-older-tools') {
    const keepRecentTurns = Math.max(0, Number(body?.keepRecentTurns ?? 1))
    const allTurnNums = analysis.turns.map((t) => t.turn)
    const recentTurnSet = new Set(keepRecentTurns === 0 ? [] : allTurnNums.slice(-keepRecentTurns))
    const excludedCallSet = new Set(current.excludedCallIds)
    const excludedMsgSet = new Set(current.excludedMessageIds)
    for (const row of analysis.turns) {
      if (recentTurnSet.has(row.turn)) continue
      for (const c of row.calls) {
        excludedCallSet.add(c.callId)
        if (c.toolMessageId) excludedMsgSet.add(c.toolMessageId)
      }
    }
    store.save(sessionId, {
      ...current,
      excludedCallIds: [...excludedCallSet],
      excludedMessageIds: [...excludedMsgSet],
    })
  } else if (action === 'set-next-ephemeral') {
    const ephemeral = Boolean(body?.ephemeral)
    store.save(sessionId, {
      ...current,
      nextTurnEphemeral: ephemeral,
    })
  } else if (action === 'toggle-system-section') {
    const orderNum = Number(body?.order)
    if (!Number.isInteger(orderNum) || orderNum <= 0) throw new Error('invalid system section order')
    const set = new Set(current.excludedSystemOrders ?? [])
    const shouldInclude = typeof body?.included === 'boolean' ? body.included : set.has(orderNum)
    if (shouldInclude) set.delete(orderNum)
    else set.add(orderNum)
    store.save(sessionId, {
      ...current,
      excludedSystemOrders: [...set],
    })
  } else if (action === 'set-system-override') {
    const presetOverride =
      typeof body?.systemPresetOverride === 'string' && body.systemPresetOverride.trim() !== ''
        ? body.systemPresetOverride.trim()
        : body?.systemPresetOverride === null
          ? null
          : current.systemPresetOverride
    const customPrompt =
      typeof body?.customSystemPrompt === 'string'
        ? body.customSystemPrompt
        : current.customSystemPrompt
    const customMode =
      body?.customSystemMode === 'replace' || body?.customSystemMode === 'append'
        ? body.customSystemMode
        : current.customSystemMode
    const resetExcludedOrders = Boolean(body?.resetExcludedOrders)
    store.save(sessionId, {
      ...current,
      systemPresetOverride: presetOverride,
      customSystemPrompt: customPrompt,
      customSystemMode: customMode,
      excludedSystemOrders: resetExcludedOrders ? [] : current.excludedSystemOrders,
    })
    if (presetOverride && presetOverride !== 'custom') {
      try {
        const agents = serviceOf(ctx, 'agents')
        const agentPresets = serviceOf(ctx, 'agentPresets')
        const agent = agents?.get?.(sessionId)
        if (agent && agentPresets && typeof agentPresets.recompose === 'function') {
          agentPresets.recompose(agent.ctx, presetOverride).catch(() => {})
        }
        if (session && typeof session.append === 'function') {
          session.append('agent-preset/selected', { agentPreset: presetOverride })
        }
      } catch {}
    }
  } else if (action === 'set-quick-phrases') {
    const rawItems = Array.isArray(body?.items) ? body.items : Array.isArray(body?.phrases) ? body.phrases : null
    if (rawItems !== null) {
      const normalized = rawItems
        .map((it) => {
          const t = typeof it === 'string' ? it.trim() : String(it?.text ?? '').trim()
          return t ? { text: t } : null
        })
        .filter(Boolean)
      if (normalized.length > 0) store.saveQuickPhrasesConfig({ items: normalized })
    }
  } else {
    throw new Error(`unknown action "${action}"`)
  }

  return buildClientPayload(ctx, sessionId, session, store)
}

export function apply(ctx) {
  const dshHome = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  const store = new ContextSelectorStore(join(dshHome, 'context-selector'))
  const turnStartedAtBySession = new Map()

  ctx.on('session/event', (session, event) => {
    try {
      const sessionId = String(session?.id ?? '')
      if (sessionId === '' || !event) return
      if (event.type === 'turn/start') {
        turnStartedAtBySession.set(sessionId, Date.now())
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

  const wrapSystemPromptAssemble = () => {
    try {
      const sysPrompt = serviceOf(ctx, 'systemPrompt')
      if (!sysPrompt || typeof sysPrompt.assemble !== 'function' || sysPrompt.__ctxSelWrapped) return
      const origAssemble = sysPrompt.assemble
      sysPrompt.__ctxSelWrapped = true
      sysPrompt.assemble = async function (context = {}) {
        try {
          const agent = context?.agent
          const sid = String(agent?.session?.id ?? '')
          if (sid !== '' && agent?.ctx) {
            const st = store.get(sid)
            if (st?.systemPresetOverride && st.systemPresetOverride !== 'custom') {
              const agentPresets = serviceOf(ctx, 'agentPresets')
              if (
                agentPresets &&
                typeof agentPresets.recompose === 'function' &&
                typeof agentPresets.composedPreset === 'function'
              ) {
                const curPreset = agentPresets.composedPreset(agent.ctx)
                if (curPreset !== st.systemPresetOverride) {
                  await agentPresets.recompose(agent.ctx, st.systemPresetOverride)
                  try {
                    const projections = serviceOf(ctx, 'sessionProjections')
                    const curLogged = projections?.stateOf?.(agent.session, 'agentPreset')
                    if (curLogged !== st.systemPresetOverride) {
                      agent.session.append('agent-preset/selected', { agentPreset: st.systemPresetOverride })
                    }
                  } catch {}
                }
              }
            }
          }
        } catch {}
        return origAssemble.call(this, context)
      }
    } catch {}
  }

  wrapSystemPromptAssemble()

  ctx.on(
    'agent/pre-step',
    async ({ agent }, next) => {
      wrapSystemPromptAssemble()
      try {
        const sid = String(agent?.session?.id ?? '')
        if (sid !== '') {
          const st = store.get(sid)
          if (st?.systemPresetOverride && st.systemPresetOverride !== 'custom') {
            const agentPresets = serviceOf(ctx, 'agentPresets')
            if (agentPresets && typeof agentPresets.recompose === 'function' && typeof agentPresets.composedPreset === 'function') {
              const curPreset = agentPresets.composedPreset(agent.ctx)
              if (curPreset !== st.systemPresetOverride) {
                await agentPresets.recompose(agent.ctx, st.systemPresetOverride)
                try {
                  agent.session.append('agent-preset/selected', { agentPreset: st.systemPresetOverride })
                } catch {}
              }
            }
          }
        }
      } catch {}

      const agentPresets = serviceOf(ctx, 'agentPresets')
      const compaction =
        serviceOf(ctx, 'compaction') ??
        (agentPresets && typeof agentPresets.serviceFor === 'function'
          ? agentPresets.serviceFor(agent, 'compaction')
          : undefined)
      if (!compaction || typeof compaction.compactIfNeeded !== 'function' || compaction.__ctxSelWrapped) {
        return next()
      }
      const origCompactIfNeeded = compaction.compactIfNeeded
      const origSummarize = typeof compaction.summarize === 'function' ? compaction.summarize : null
      compaction.__ctxSelWrapped = true
      if (origSummarize) {
        compaction.summarize = async function (input, targetAgent, signal) {
          try {
            const sid = String(targetAgent?.session?.id ?? '')
            if (sid !== '' && input && Array.isArray(input.messages)) {
              const filtered = filterRequestMessages(
                { sessionId: sid, messages: input.messages },
                targetAgent.session,
                store,
              )
              if (filtered.changed) {
                input = { ...input, messages: filtered.messages }
              }
            }
          } catch {}
          return origSummarize.call(this, input, targetAgent, signal)
        }
      }
      compaction.compactIfNeeded = async function (targetAgent, trigger, signal) {
        if (trigger === 'pressure') {
          try {
            const sid = String(targetAgent?.session?.id ?? '')
            if (sid !== '') {
              const payload = buildClientPayload(ctx, sid, targetAgent.session, store)
              const adj = payload?.tokenStats?.adjustedPressure
              const saved = payload?.tokenStats?.savedTokens ?? 0
              if (saved > 0 && adj && adj.contextWindow > 0) {
                const effRatio = (adj.projectedTokens ?? adj.pressureTokens ?? 0) / adj.contextWindow
                const thresholdRatio = Number(this.config?.thresholdRatio ?? 0.8)
                if (effRatio < thresholdRatio * 0.95) {
                  ctx.logger?.info?.(
                    `[dsh-context-selector] session=${sid}: skipped premature pressure compaction (effective ratio ${(effRatio * 100).toFixed(1)}% after saving ~${saved} tokens)`,
                  )
                  return null
                }
              }
            }
          } catch {}
        }
        return origCompactIfNeeded.call(this, targetAgent, trigger, signal)
      }
      return next()
    },
    { prepend: true },
  )

  ctx.on(
    'llm/stream',
    (options, next) => {
      if (options === null || typeof options !== 'object') return next()
      if (FILTERED.has(options)) return next()
      if (options.purpose !== undefined && options.purpose !== 'compaction') return next()
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
        `[dsh-context-selector] session=${sessionId} (purpose=${options.purpose ?? 'chat'}): filtered messages ${options.messages.length} -> ${filteredResult.messages.length}`,
      )
      return llm.stream(nextOptions)
    },
    { prepend: true },
  )

  ctx.inject(['clientModules'], (cmCtx) => {
    cmCtx.effect(() => {
      const checkRebuilt = () => {
        try {
          cmCtx.clientModules?.rebuilt?.('dsh-plugin-subagent-delete')
          cmCtx.clientModules?.rebuilt?.('dsh-context-selector')
          cmCtx.clientModules?.rebuilt?.('@leetoners/dsh-ui-subagent-monitor')
        } catch {}
      }
      checkRebuilt()
      const timer = setInterval(checkRebuilt, 1500)
      timer.unref?.()
      return () => clearInterval(timer)
    }, 'dsh-context-selector: rebuild-client-bundles')
  })

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
          const includeInspector = url.searchParams.get('inspect') === '1'
          if (sessionId === '') {
            writeJson(res, 400, { ok: false, error: 'missing sessionId' })
            return
          }
          const sessions = serviceOf(ctx, 'sessions')
          const session = sessions?.get?.(sessionId)
          if (includeInspector) {
            writeJson(res, 200, buildContextInspectorPayload(ctx, sessionId, session, store))
            return
          }
          writeJson(res, 200, buildClientPayload(ctx, sessionId, session, store))
        },
      })

      const disposeQuickPhrases = webCtx.webServer.register({
        kind: 'exact',
        path: '/api/context-selector/quick-phrases',
        handler: async (req, res) => {
          try {
            if (req.method === 'POST') {
              const body = await readJsonBody(req)
              applyToggleAction(ctx, store, null, 'default', { ...body, action: 'set-quick-phrases' })
            }
            const cfg = store.getQuickPhrasesConfig()
            writeJson(res, 200, { ok: true, items: cfg.items, phrases: cfg.items.map((it) => it.text) })
          } catch (err) {
            writeJson(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) })
          }
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

      const disposeInspect = webCtx.webServer.register({
        kind: 'exact',
        path: '/api/context-selector/inspect',
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
          writeJson(res, 200, buildContextInspectorPayload(ctx, sessionId, session, store))
        },
      })

      const polyfillAndWsGuard = '<script>'
        + 'if (typeof WebSocket === "function" && !window.__dshWsKeepAliveInstalled__) {'
        + 'window.__dshWsKeepAliveInstalled__ = true;'
        + 'const OrigWS = WebSocket;'
        + 'let activeMuxCount = 0;'
        + 'let reconnectTimer = null;'
        + 'const triggerAutoReconnect = function() {'
        + 'if (reconnectTimer) clearTimeout(reconnectTimer);'
        + 'reconnectTimer = setTimeout(function() {'
        + 'reconnectTimer = null;'
        + 'if (activeMuxCount === 0 && window.__dshConnectionHandle__ && typeof window.__dshConnectionHandle__.reconnect === "function") {'
        + 'try { window.__dshConnectionHandle__.reconnect(); } catch {}'
        + '}'
        + '}, 600);'
        + '};'
        + 'window.WebSocket = function(url, protocols) {'
        + 'const ws = protocols !== undefined ? new OrigWS(url, protocols) : new OrigWS(url);'
        + 'if (typeof url === "string" && url.includes("/api/remote.mux")) {'
        + 'activeMuxCount++;'
        + 'let kaTimer = null;'
        + 'const clearKa = function() { if (kaTimer) { clearInterval(kaTimer); kaTimer = null; } };'
        + 'ws.addEventListener("open", function() {'
        + 'clearKa();'
        + 'kaTimer = setInterval(function() {'
        + 'if (ws.readyState === 1) {'
        + 'try { ws.send(JSON.stringify({ type: "cancel", streamId: "__keepalive__" })); } catch {}'
        + '}'
        + '}, 15000);'
        + '});'
        + 'ws.addEventListener("error", clearKa);'
        + 'ws.addEventListener("close", function(ev) {'
        + 'clearKa();'
        + 'activeMuxCount = Math.max(0, activeMuxCount - 1);'
        + 'if (ev && (ev.code === 4000 || ev.code === 1000)) return;'
        + 'triggerAutoReconnect();'
        + '});'
        + '}'
        + 'return ws;'
        + '};'
        + 'window.WebSocket.prototype = OrigWS.prototype;'
        + 'Object.assign(window.WebSocket, OrigWS);'
        + 'if (typeof document !== "undefined") {'
        + 'document.addEventListener("visibilitychange", function() {'
        + 'if (document.visibilityState === "visible") triggerAutoReconnect();'
        + '});'
        + '}'
        + 'window.addEventListener("online", triggerAutoReconnect);'
        + 'window.addEventListener("focus", triggerAutoReconnect);'
        + 'setInterval(function() {'
        + 'if (activeMuxCount === 0) triggerAutoReconnect();'
        + '}, 25000);'
        + '}'
        + 'if (typeof crypto !== "undefined" && typeof crypto.randomUUID !== "function") {'
        + 'crypto.randomUUID = function () {'
        + 'var b = crypto.getRandomValues(new Uint8Array(16));'
        + 'b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;'
        + 'var h = "";'
        + 'for (var i = 0; i < 16; i++) h += (i === 4 || i === 6 || i === 8 || i === 10 ? "-" : "") + b[i].toString(16).padStart(2, "0");'
        + 'return h;'
        + '};'
        + '}'
        + '</script>'

      const mobileOverrideStyle = `<style id="dsh-mobile-gateway-fix">
.smn-mobile-fab,
button.smn-mobile-fab,
.smn-trigger,
button.smn-trigger {
  background: #2563eb !important;
  background-color: #2563eb !important;
  color: #ffffff !important;
  border: 1px solid #3b82f6 !important;
  -webkit-text-fill-color: #ffffff !important;
}
.smn-mobile-fab *,
.smn-trigger * {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}
.smn-mobile-fab .smn-trigger-badge,
.smn-trigger .smn-trigger-badge {
  background: rgba(255, 255, 255, 0.24) !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}
@media (max-width: 768px) {
  .OMoRSG_menuAnchor,
  .OMoRSG_split,
  [data-open-target] {
    display: none !important;
  }
  .smn-mobile-fab {
    position: fixed !important;
    top: 44px !important;
    right: 44px !important;
    padding: 3px 10px !important;
    border-radius: 8px !important;
    font-size: 12px !important;
    line-height: 16px !important;
    font-weight: 600 !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35) !important;
  }
  .pI_x6G_frame:not([data-sidebar-collapsed]) ~ .smn-mobile-fab,
  body:has(.pI_x6G_frame:not([data-sidebar-collapsed])) .smn-mobile-fab {
    display: none !important;
  }
  .pI_x6G_frame,
  .pI_x6G_frame[data-sidebar-collapsed] {
    grid-template-columns: 0px minmax(0px, 1fr) minmax(0px, 0px) !important;
  }
  .pI_x6G_frame .pI_x6G_handle[data-side="sidebar"] {
    display: none !important;
    pointer-events: none !important;
  }
  .pI_x6G_frame[data-sidebar-collapsed] .pI_x6G_sidebarCol,
  .pI_x6G_frame[data-sidebar-collapsed] .hHd-Xa_root {
    width: 0px !important;
    min-width: 0px !important;
    max-width: 0px !important;
    padding: 0px !important;
    margin: 0px !important;
    border: none !important;
    background: transparent !important;
    overflow: visible !important;
    pointer-events: none !important;
  }
  .pI_x6G_frame[data-sidebar-collapsed] .hHd-Xa_logoRow > *:not(.hHd-Xa_toggle),
  .pI_x6G_frame[data-sidebar-collapsed] .hHd-Xa_newSession,
  .pI_x6G_frame[data-sidebar-collapsed] .hHd-Xa_panelList,
  .pI_x6G_frame[data-sidebar-collapsed] .hHd-Xa_regionArea,
  .pI_x6G_frame[data-sidebar-collapsed] .hHd-Xa_footArea {
    display: none !important;
    pointer-events: none !important;
  }
  .pI_x6G_frame[data-sidebar-collapsed] .hHd-Xa_toggle {
    position: fixed !important;
    left: 10px !important;
    top: 10px !important;
    z-index: 2147482998 !important;
    width: 34px !important;
    height: 34px !important;
    border-radius: 9px !important;
    background: transparent !important;
    color: var(--dsw-alias-label-primary, #0f172a) !important;
    border: none !important;
    box-shadow: none !important;
    pointer-events: auto !important;
  }
  .pI_x6G_frame[data-sidebar-collapsed] .hHd-Xa_toggle .hHd-Xa_railMark,
  .pI_x6G_frame[data-sidebar-collapsed] .hHd-Xa_toggle:hover .hHd-Xa_railMark {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .pI_x6G_frame[data-sidebar-collapsed] .hHd-Xa_toggle .hHd-Xa_railMark svg {
    width: 26px !important;
    height: auto !important;
  }
  .pI_x6G_frame[data-sidebar-collapsed] .hHd-Xa_toggle .hHd-Xa_panelIcon,
  .pI_x6G_frame[data-sidebar-collapsed] .hHd-Xa_toggle:hover .hHd-Xa_panelIcon {
    display: none !important;
  }
  .pI_x6G_frame:not([data-sidebar-collapsed]) .pI_x6G_sidebarCol {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    bottom: 0 !important;
    width: min(84vw, 310px) !important;
    z-index: 2147483001 !important;
    box-shadow: 12px 0 36px rgba(0, 0, 0, 0.55) !important;
    pointer-events: auto !important;
  }
  .pI_x6G_frame:not([data-sidebar-collapsed]) .hHd-Xa_root {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
  }
  .pI_x6G_overlayLayer,
  ._root_w1urq_2,
  ._root_o6lrb_6,
  ._toast_z9yog_6,
  ._toast_l6cvn_6,
  ._portal_1aoad_44,
  ._portal_4ub78_41,
  [role="dialog"],
  [role="menu"] {
    z-index: 2147483005 !important;
  }
  body[data-dsh-silent-menu="true"] ._portal_1aoad_44,
  body[data-dsh-silent-menu="true"] ._portal_4ub78_41,
  body[data-dsh-silent-menu="true"] [role="menu"] {
    opacity: 0 !important;
    pointer-events: none !important;
  }
  .YDXeBa_projectRow,
  .YDXeBa_sessionRow {
    min-height: 40px !important;
    padding: 4px 10px !important;
    touch-action: pan-y !important;
    -webkit-user-drag: none !important;
    user-select: none !important;
    -webkit-user-select: none !important;
  }
  .YDXeBa_sessionRow {
    position: relative !important;
    overflow: hidden !important;
  }
  .YDXeBa_sessionRow[data-swipe-open="true"],
  .YDXeBa_sessionRow[data-swiping="true"] {
    background: #eef1f6 !important;
  }
  body[data-ds-dark-theme] .YDXeBa_sessionRow[data-swipe-open="true"],
  body[data-ds-dark-theme] .YDXeBa_sessionRow[data-swiping="true"],
  [data-theme="dark"] .YDXeBa_sessionRow[data-swipe-open="true"],
  [data-theme="dark"] .YDXeBa_sessionRow[data-swiping="true"] {
    background: #24262b !important;
  }
  .YDXeBa_projectRow .YDXeBa_rowActions {
    display: inline-flex !important;
    gap: 4px !important;
  }
  .YDXeBa_sessionRow .YDXeBa_rowActions {
    display: inline-flex !important;
    position: absolute !important;
    right: 8px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    opacity: 0 !important;
    pointer-events: none !important;
    width: 1px !important;
    height: 1px !important;
    overflow: hidden !important;
  }
  .YDXeBa_sessionRow .YDXeBa_time {
    display: inline-block !important;
    opacity: 0.75 !important;
  }
  .dsh-swipe-actions {
    position: absolute !important;
    top: 0 !important;
    bottom: 0 !important;
    right: 0 !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 4px !important;
    padding: 0 6px 0 14px !important;
    z-index: 8 !important;
    background: linear-gradient(90deg, rgba(238, 241, 246, 0) 0%, #eef1f6 12%, #eef1f6 100%) !important;
    transform: translate3d(calc(100% + 6px + var(--dsh-swipe-offset, 0px)), 0, 0);
    transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
    will-change: transform;
    pointer-events: none !important;
  }
  body[data-ds-dark-theme] .dsh-swipe-actions,
  [data-theme="dark"] .dsh-swipe-actions {
    background: linear-gradient(90deg, rgba(36, 38, 43, 0) 0%, #24262b 12%, #24262b 100%) !important;
  }
  .YDXeBa_sessionRow[data-swiping="true"] > .dsh-swipe-actions {
    transition: none !important;
  }
  .YDXeBa_sessionRow[data-swipe-open="true"] > .dsh-swipe-actions {
    pointer-events: auto !important;
  }
  .YDXeBa_sessionRow[data-swipe-open="true"]:not([data-swiping="true"]) > .dsh-swipe-actions {
    transform: translate3d(0, 0, 0) !important;
  }
  .dsh-swipe-btn {
    appearance: none !important;
    -webkit-appearance: none !important;
    border: none !important;
    border-radius: 6px !important;
    height: 28px !important;
    padding: 0 8px !important;
    font-size: 12px !important;
    line-height: 1 !important;
    font-weight: 600 !important;
    color: #ffffff !important;
    -webkit-text-fill-color: #ffffff !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    white-space: nowrap !important;
    cursor: pointer !important;
    user-select: none !important;
    -webkit-user-select: none !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.14) !important;
    flex: none !important;
  }
  .dsh-swipe-btn:active {
    opacity: 0.85 !important;
    transform: scale(0.96) !important;
  }
  .dsh-swipe-btn-pin {
    background: #2563eb !important;
  }
  .dsh-swipe-btn-rename {
    background: #64748b !important;
  }
  .dsh-swipe-btn-fork {
    background: #0ea5e9 !important;
  }
  .dsh-swipe-btn-archive {
    background: #ef4444 !important;
  }
  .EvIC1a_scroll {
    padding: 12px 16px !important;
  }
  .EvIC1a_column,
  .hWmORq_root,
  .hWmORq_body {
    width: 100% !important;
    max-width: 100% !important;
    margin-left: 0 !important;
    padding-left: 0 !important;
    box-sizing: border-box !important;
    overflow-wrap: break-word !important;
  }
  .dsh-ctx-inline-wrap,
  .dsh-ctx-inline-reply-pill {
    display: none !important;
  }
  html, body, #root, .pI_x6G_frame, .pI_x6G_centerCol, .wSkVaW_root, .wSkVaW_body, .wSkVaW_embeddedBody, .wSkVaW_scrollBody {
    max-width: 100vw !important;
    overflow-x: hidden !important;
    -webkit-text-size-adjust: 100% !important;
    text-size-adjust: 100% !important;
  }
  .wSkVaW_body, .wSkVaW_embeddedBody {
    --dsh-composer-side-clearance: 10px !important;
    --dsh-chat-content-width: 100% !important;
    --dsh-composer-card-max-width: 100% !important;
  }
  .wSkVaW_scrollBody {
    scrollbar-gutter: auto !important;
    margin-right: 0 !important;
  }
  .wSkVaW_root[data-phase="active"] .wSkVaW_scrollBody > [data-slot="conversation.session"],
  .wSkVaW_embeddedBody[data-content-phase="active"] .wSkVaW_scrollBody > [data-slot="conversation.session"] {
    display: flex !important;
    flex-direction: column !important;
    flex: 1 0 auto !important;
    min-height: auto !important;
  }
  .wSkVaW_root[data-phase="active"] .wSkVaW_composerSeat,
  .wSkVaW_embeddedBody[data-content-phase="active"] .wSkVaW_composerSeat {
    margin-top: auto !important;
    transform: translate3d(0, 0, 0);
    transition: transform 0.24s cubic-bezier(0.2, 0.9, 0.2, 1) !important;
    will-change: transform !important;
  }
  body[data-dsh-kb-open="true"] .wSkVaW_root[data-phase="active"] .wSkVaW_composerSeat,
  body[data-dsh-kb-open="true"] .wSkVaW_embeddedBody[data-content-phase="active"] .wSkVaW_composerSeat {
    transform: translate3d(0, calc(-1 * var(--dsh-kb-offset, 0px)), 0) !important;
    transition: transform 0.16s cubic-bezier(0.2, 0.9, 0.2, 1) !important;
    will-change: transform !important;
  }
  body[data-dsh-kb-open="true"] .uV2eYG_dock {
    display: none !important;
  }
  body[data-dsh-kb-open="true"] .uV2eYG_root {
    padding-bottom: 2px !important;
  }
  .wSkVaW_root[data-phase="hero"] .wSkVaW_scrollBody,
  .wSkVaW_embeddedBody[data-content-phase="hero"] .wSkVaW_scrollBody {
    justify-content: flex-start !important;
    padding-top: 32px !important;
  }
  .pXSMma_root {
    height: auto !important;
    padding: 0 12px !important;
    box-sizing: border-box !important;
  }
  .wSkVaW_composerHero {
    width: 100% !important;
    max-width: 100vw !important;
    box-sizing: border-box !important;
    padding-left: 10px !important;
    padding-right: 10px !important;
  }
  [data-composer-seat] {
    width: 100% !important;
    max-width: 100vw !important;
    box-sizing: border-box !important;
    padding-left: 10px !important;
    padding-right: 10px !important;
  }
  .uV2eYG_root,
  .uV2eYG_hero {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
  .uV2eYG_card {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
    overflow: visible !important;
    gap: 4px !important;
    padding-top: 6px !important;
    border-radius: 16px !important;
  }
  .uV2eYG_overlayAnchor {
    z-index: 2147483000 !important;
    overflow: visible !important;
  }
  .uV2eYG_hero .uV2eYG_overlayAnchor {
    top: 100% !important;
    bottom: auto !important;
  }
  ._3e4SsG_menu,
  [data-trigger-menu] {
    z-index: 2147483000 !important;
    background: var(--dsw-alias-bg-layer-2, #ffffff) !important;
    border: 1px solid var(--dsw-alias-border-l2, rgba(15, 23, 42, 0.12)) !important;
    border-radius: 14px !important;
    box-shadow: 0 12px 36px rgba(15, 23, 42, 0.22) !important;
  }
  body[data-ds-dark-theme] ._3e4SsG_menu,
  body[data-ds-dark-theme] [data-trigger-menu],
  [data-theme="dark"] ._3e4SsG_menu,
  [data-theme="dark"] [data-trigger-menu] {
    background: #1f2430 !important;
    border-color: rgba(148, 163, 184, 0.26) !important;
    box-shadow: 0 14px 40px rgba(0, 0, 0, 0.55) !important;
  }
  .uV2eYG_hero ._3e4SsG_menu,
  .uV2eYG_hero [data-trigger-menu] {
    top: 6px !important;
    bottom: auto !important;
    max-height: min(340px, calc(100dvh - 260px)) !important;
  }
  .uV2eYG_root:not(.uV2eYG_hero) ._3e4SsG_menu,
  .uV2eYG_root:not(.uV2eYG_hero) [data-trigger-menu] {
    bottom: calc(100% + 6px) !important;
    top: auto !important;
    max-height: min(340px, calc(100dvh - 180px)) !important;
  }
  ._3e4SsG_viewport {
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    touch-action: pan-y !important;
  }
  .uV2eYG_scroll,
  .uV2eYG_grow {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    margin-right: 0 !important;
    box-sizing: border-box !important;
  }
  .uV2eYG_input,
  .uV2eYG_hero .uV2eYG_input,
  .uV2eYG_input *,
  [data-composer-input],
  [data-composer-input] *,
  [contenteditable="true"],
  input,
  textarea,
  select {
    font-size: 16px !important;
  }
  .uV2eYG_input,
  .uV2eYG_hero .uV2eYG_input {
    min-height: 28px !important;
    padding: 2px 10px 0 12px !important;
    font-size: 16px !important;
    line-height: 22px !important;
  }
  .uV2eYG_placeholder,
  .uV2eYG_hero .uV2eYG_placeholder {
    inset: 2px 10px auto 12px !important;
    font-size: 15px !important;
    line-height: 22px !important;
    white-space: nowrap !important;
    text-overflow: ellipsis !important;
    overflow: hidden !important;
    display: block !important;
    -webkit-line-clamp: unset !important;
    line-clamp: unset !important;
  }
  .uV2eYG_row {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
    flex-wrap: nowrap !important;
    justify-content: space-between !important;
    gap: 4px !important;
    padding: 2px 6px 5px !important;
    align-items: center !important;
    overflow: visible !important;
    container-type: normal !important;
    --dsh-composer-model-text-display: none !important;
    --dsh-composer-model-icon-display: inline-flex !important;
  }
  .uV2eYG_tools {
    flex: 1 1 0% !important;
    min-width: 0 !important;
    overflow: visible !important;
    gap: 2px !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
  }
  .uV2eYG_tools::-webkit-scrollbar {
    display: none !important;
  }
  .uV2eYG_modes,
  .uV2eYG_standardControls,
  .dsh-ctx-sel-toolbar-group {
    gap: 2px !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    flex-shrink: 0 !important;
  }
  .uV2eYG_trailing {
    flex: 0 0 auto !important;
    margin-left: auto !important;
    gap: 4px !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
  }
  .uV2eYG_add,
  .uV2eYG_row button.uV2eYG_add {
    flex: 0 0 26px !important;
    width: 26px !important;
    height: 26px !important;
    padding: 0 !important;
  }
  .iWlSmW_trigger,
  .uV2eYG_row button.iWlSmW_trigger {
    flex: 0 0 26px !important;
    width: 26px !important;
    height: 26px !important;
    padding: 0 !important;
    justify-content: center !important;
  }
  .iWlSmW_trigger .iWlSmW_triggerLabel,
  .iWlSmW_trigger .iWlSmW_chevron {
    display: none !important;
  }
  .uV2eYG_modes > button:not(._7KE1Ra_trigger):not(.uV2eYG_primary):not(.uV2eYG_add):not(.iWlSmW_trigger),
  .uV2eYG_standardControls > button:not(._7KE1Ra_trigger):not(.uV2eYG_primary):not(.uV2eYG_add):not(.iWlSmW_trigger),
  .dsh-ctx-toolbar-btn {
    height: 26px !important;
    padding: 0 4px !important;
    font-size: 11px !important;
    line-height: 16px !important;
    gap: 2px !important;
    flex-shrink: 0 !important;
  }
  .dsh-ctx-quick-popover {
    position: fixed !important;
    left: 10px !important;
    right: 10px !important;
    bottom: 68px !important;
    width: auto !important;
    max-width: calc(100vw - 20px) !important;
    box-sizing: border-box !important;
    padding: 10px 10px !important;
    border-radius: 14px !important;
    gap: 8px !important;
  }
  .dsh-ctx-quick-popover .dsh-ctx-pop-head {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 6px !important;
    flex-wrap: nowrap !important;
    width: 100% !important;
    padding: 0 2px !important;
    box-sizing: border-box !important;
  }
  .dsh-ctx-quick-popover .dsh-ctx-pop-title {
    display: inline-flex !important;
    align-items: center !important;
    gap: 4px !important;
    flex-wrap: nowrap !important;
    min-width: 0 !important;
    font-size: 13px !important;
    line-height: 20px !important;
  }
  .dsh-ctx-quick-popover .dsh-ctx-pop-title > span:first-child {
    display: inline-flex !important;
    align-items: center !important;
    white-space: nowrap !important;
    line-height: 20px !important;
  }
  .dsh-ctx-quick-popover .dsh-ctx-pop-stat {
    display: none !important;
  }
  .dsh-ctx-quick-popover .dsh-her-tag-btn,
  .dsh-ctx-quick-popover .dsh-zh-tag-btn {
    height: 20px !important;
    padding: 0 7px !important;
    margin: 0 !important;
    border-radius: 999px !important;
    font-size: 11px !important;
    line-height: 18px !important;
    font-weight: 600 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    box-sizing: border-box !important;
    flex-shrink: 0 !important;
  }
  .dsh-ctx-quick-popover .dsh-ctx-pop-head > div:last-child {
    display: inline-flex !important;
    align-items: center !important;
    gap: 4px !important;
    flex-shrink: 0 !important;
    margin-left: auto !important;
  }
  .dsh-ctx-quick-popover .dsh-ctx-hc-btn {
    height: 20px !important;
    padding: 0 7px !important;
    border-radius: 6px !important;
    font-size: 11px !important;
    line-height: 18px !important;
    font-weight: 500 !important;
    white-space: nowrap !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    box-sizing: border-box !important;
  }
  .dsh-ctx-quick-popover .dsh-ctx-close-x {
    width: 20px !important;
    height: 20px !important;
    padding: 0 !important;
    border-radius: 6px !important;
    font-size: 11px !important;
    line-height: 1 !important;
    flex: 0 0 20px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    box-sizing: border-box !important;
  }
  .dsh-ctx-quick-popover .dsh-ctx-quick-add-row {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 6px !important;
    width: 100% !important;
    padding: 4px 8px !important;
    border-radius: 8px !important;
    border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.22)) !important;
    background: var(--dsw-alias-bg-base, rgba(128,128,128,0.04)) !important;
    box-sizing: border-box !important;
  }
  .dsh-ctx-quick-popover .dsh-ctx-quick-input {
    flex: 1 1 0% !important;
    min-width: 0 !important;
    height: 22px !important;
    padding: 0 2px !important;
    border: none !important;
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    font-size: 13px !important;
    line-height: 22px !important;
    box-sizing: border-box !important;
  }
  .dsh-ctx-quick-popover .dsh-ctx-quick-add-row .dsh-ctx-quick-mini-btn {
    height: 22px !important;
    min-width: 38px !important;
    padding: 0 8px !important;
    border-radius: 5px !important;
    font-size: 11px !important;
    line-height: 20px !important;
    font-weight: 500 !important;
    flex-shrink: 0 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    box-sizing: border-box !important;
  }
  .dsh-ctx-quick-popover .dsh-ctx-quick-list {
    gap: 4px !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  .dsh-ctx-quick-popover .dsh-ctx-quick-item {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    width: 100% !important;
    padding: 4px 8px !important;
    border-radius: 8px !important;
    gap: 6px !important;
    box-sizing: border-box !important;
  }
  .dsh-ctx-quick-popover .dsh-ctx-quick-send-btn {
    height: 22px !important;
    padding: 0 !important;
    font-size: 12.5px !important;
    line-height: 22px !important;
    flex: 1 1 0% !important;
    min-width: 0 !important;
    display: inline-flex !important;
    align-items: center !important;
  }
  .dsh-ctx-quick-popover .dsh-ctx-quick-actions {
    display: inline-flex !important;
    align-items: center !important;
    gap: 4px !important;
    flex-shrink: 0 !important;
  }
  .dsh-ctx-quick-popover .dsh-ctx-quick-actions .dsh-ctx-quick-mini-btn {
    height: 22px !important;
    min-width: 38px !important;
    padding: 0 8px !important;
    border-radius: 5px !important;
    font-size: 11px !important;
    line-height: 20px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    box-sizing: border-box !important;
  }
  .uV2eYG_row svg:not(._7KE1Ra_triggerIcon),
  .dsh-ctx-toolbar-btn svg {
    width: 13px !important;
    height: 13px !important;
  }
  ._7KE1Ra_trigger,
  .uV2eYG_row button._7KE1Ra_trigger {
    flex: 0 0 28px !important;
    width: 28px !important;
    height: 28px !important;
    min-width: 28px !important;
    max-width: 28px !important;
    padding: 0 !important;
    justify-content: center !important;
    align-items: center !important;
    border-radius: 8px !important;
    background: var(--dsw-alias-interactive-bg-hover, rgba(128, 128, 128, 0.08)) !important;
    color: var(--dsw-alias-label-primary) !important;
  }
  ._7KE1Ra_triggerLabel,
  ._7KE1Ra_triggerEffort,
  ._7KE1Ra_chevron {
    display: none !important;
  }
  ._7KE1Ra_triggerIcon {
    display: inline-flex !important;
    width: 16px !important;
    height: 16px !important;
  }
  ._7KE1Ra_trigger[aria-busy="true"] ._7KE1Ra_triggerIcon {
    display: none !important;
  }
  .uV2eYG_primary,
  .uV2eYG_row button.uV2eYG_primary {
    flex: 0 0 28px !important;
    width: 28px !important;
    height: 28px !important;
    min-width: 28px !important;
    padding: 0 !important;
    transform: none !important;
  }
  .uV2eYG_primary svg {
    width: 14px !important;
    height: 14px !important;
  }
  .VOzbGW_overlay {
    align-items: flex-end !important;
  }
  .VOzbGW_panel {
    width: 100vw !important;
    max-width: 100vw !important;
    height: 88dvh !important;
    max-height: 88dvh !important;
    border-radius: 18px 18px 0 0 !important;
    flex-direction: column !important;
    overflow: hidden !important;
  }
  .VOzbGW_nav {
    width: 100% !important;
    padding: 14px 12px 8px !important;
    gap: 10px !important;
    border-bottom: 1px solid var(--dsw-alias-border-l2, rgba(148, 163, 184, 0.2)) !important;
    flex: none !important;
  }
  .VOzbGW_navTitle {
    padding: 0 4px !important;
    font-size: 16px !important;
    font-weight: 600 !important;
  }
  .VOzbGW_navList {
    flex-direction: row !important;
    overflow-x: auto !important;
    overflow-y: hidden !important;
    gap: 6px !important;
    padding-bottom: 2px !important;
    scrollbar-width: none !important;
  }
  .VOzbGW_navList::-webkit-scrollbar {
    display: none !important;
  }
  .VOzbGW_navCell {
    flex: none !important;
    height: 34px !important;
    padding: 0 12px !important;
    border-radius: 999px !important;
    font-size: 13px !important;
    white-space: nowrap !important;
  }
  .VOzbGW_navLabel {
    overflow: visible !important;
    text-overflow: clip !important;
  }
  .VOzbGW_header {
    position: absolute !important;
    top: 10px !important;
    right: 10px !important;
    height: auto !important;
    padding: 0 !important;
    z-index: 10 !important;
  }
  .VOzbGW_content {
    flex: 1 1 0% !important;
    min-height: 0 !important;
    width: 100% !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .VOzbGW_options {
    flex: 1 1 0% !important;
    min-height: 0 !important;
    padding: 12px 16px calc(84px + env(safe-area-inset-bottom, 24px)) !important;
    width: 100% !important;
    box-sizing: border-box !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    -webkit-overflow-scrolling: touch !important;
    overscroll-behavior: contain !important;
    touch-action: pan-y !important;
  }
  [data-slot="settings.general.item"] > * {
    flex-wrap: wrap !important;
    gap: 10px !important;
  }
}
</style>
<script id="dsh-mobile-touch-nav">(() => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__dshMobileSwipeInstalled) return;
  window.__dshMobileSwipeInstalled = true;
  const removeLegacyOverride = () => {
    const legacy = document.getElementById('dsh-mobile-override');
    if (legacy) legacy.remove();
  };
  removeLegacyOverride();
  document.addEventListener('DOMContentLoaded', removeLegacyOverride);
  const isMobile = () => window.innerWidth <= 768 || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

  const lockViewportMeta = () => {
    const vp = document.querySelector('meta[name="viewport"]');
    const desired = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover';
    if (vp && vp.getAttribute('content') !== desired) {
      vp.setAttribute('content', desired);
    }
  };
  lockViewportMeta();

  const isEditableFocused = () => {
    const a = document.activeElement;
    return a instanceof HTMLElement && (a.isContentEditable || a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.hasAttribute('data-composer-input'));
  };
  let maxViewportHeight = typeof window !== 'undefined' ? (window.visualViewport ? window.visualViewport.height : window.innerHeight) : 0;
  let kbTrackRaf = null;
  let kbTrackEndAt = 0;
  const setKbOpenState = (open, offsetPx) => {
    if (!document.body) return;
    if (open && offsetPx > 0) {
      if (document.body.getAttribute('data-dsh-kb-open') !== 'true') {
        document.body.setAttribute('data-dsh-kb-open', 'true');
      }
      const val = offsetPx + 'px';
      if (document.body.style.getPropertyValue('--dsh-kb-offset') !== val) {
        document.body.style.setProperty('--dsh-kb-offset', val);
      }
    } else {
      if (document.body.hasAttribute('data-dsh-kb-open')) {
        document.body.removeAttribute('data-dsh-kb-open');
      }
      document.body.style.setProperty('--dsh-kb-offset', '0px');
    }
  };
  const syncMobileKeyboardViewport = () => {
    if (!isMobile()) {
      setKbOpenState(false, 0);
      return;
    }
    const vv = window.visualViewport;
    const focused = isEditableFocused();
    if (!vv || !focused) {
      setKbOpenState(false, 0);
      return;
    }
    if (vv.height > maxViewportHeight) maxViewportHeight = vv.height;
    const layoutH = Math.max(window.innerHeight || 0, document.documentElement ? document.documentElement.clientHeight : 0, maxViewportHeight, vv.height);
    const kbHeight = layoutH - vv.height;
    const rawOffset = Math.max(0, Math.round(layoutH - (vv.height + vv.offsetTop)));
    if (kbHeight > 110 && rawOffset > 40) {
      setKbOpenState(true, rawOffset);
    } else {
      setKbOpenState(false, 0);
    }
  };
  const startKbFrameTracker = (durationMs = 360) => {
    kbTrackEndAt = Math.max(kbTrackEndAt, Date.now() + durationMs);
    if (kbTrackRaf !== null) return;
    const tick = () => {
      resetMobileWindowScroll();
      if (Date.now() < kbTrackEndAt) {
        kbTrackRaf = requestAnimationFrame(tick);
      } else {
        kbTrackRaf = null;
      }
    };
    kbTrackRaf = requestAnimationFrame(tick);
  };
  const resetMobileWindowScroll = () => {
    if (!isMobile()) return;
    if (window.scrollX !== 0 || window.scrollY !== 0) {
      window.scrollTo(0, 0);
    }
    if (document.documentElement && (document.documentElement.scrollLeft !== 0 || document.documentElement.scrollTop !== 0)) {
      document.documentElement.scrollLeft = 0;
      document.documentElement.scrollTop = 0;
    }
    if (document.body && (document.body.scrollLeft !== 0 || document.body.scrollTop !== 0)) {
      document.body.scrollLeft = 0;
      document.body.scrollTop = 0;
    }
    syncMobileKeyboardViewport();
  };
  const restoreAfterKeyboardDismiss = () => {
    if (!isMobile()) return;
    setKbOpenState(false, 0);
    resetMobileWindowScroll();
    startKbFrameTracker(320);
  };
  window.addEventListener('scroll', resetMobileWindowScroll, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      resetMobileWindowScroll();
    }, { passive: true });
    window.visualViewport.addEventListener('scroll', resetMobileWindowScroll, { passive: true });
  }
  document.addEventListener('focusin', () => {
    if (!isMobile()) return;
    resetMobileWindowScroll();
    startKbFrameTracker(420);
  }, true);
  document.addEventListener('focusout', () => {
    if (!isMobile()) return;
    setKbOpenState(false, 0);
    resetMobileWindowScroll();
    startKbFrameTracker(360);
  }, true);
  document.addEventListener('gesturestart', (e) => { if (isMobile()) e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturechange', (e) => { if (isMobile()) e.preventDefault(); }, { passive: false });
  document.addEventListener('gestureend', (e) => { if (isMobile()) e.preventDefault(); }, { passive: false });

  document.addEventListener('pointerdown', (e) => {
    if (!isMobile() || !e.isTrusted) return;
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t.closest('[data-composer-seat]') || t.closest('[data-composer-card]') || t.closest('[data-composer-input]') || t.closest('[data-dsh-image-editor]') || t.closest('.dsh-ctx-quick-popover') || t.closest('.dsh-doc-ask-float') || t.closest('.dsh-doc-ask-menu') || t.closest('.dsh-doc-header-ask-btn') || t.closest('[role="dialog"]') || t.closest('[role="menu"]') || t.closest('[role="listbox"]')) {
      return;
    }
    const a = document.activeElement;
    if (a instanceof HTMLElement && !a.hasAttribute('data-composer-composing') && (a.hasAttribute('data-composer-input') || a.isContentEditable)) {
      a.blur();
      setTimeout(restoreAfterKeyboardDismiss, 60);
    }
  }, { passive: true });

  const ensureEnterKeyHint = (e) => {
    if (!isMobile()) return;
    const t = e && e.target;
    if (t instanceof HTMLElement && t.hasAttribute('data-composer-input')) {
      if (t.getAttribute('enterkeyhint') !== 'enter') {
        t.setAttribute('enterkeyhint', 'enter');
      }
    }
  };
  document.addEventListener('focusin', ensureEnterKeyHint, true);

  document.addEventListener('keydown', (e) => {
    if (!isMobile()) return;
    if (e.key !== 'Enter') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t instanceof Element && (t.closest('[data-composer-input]') || t.closest('.smn-chat-input'))) {
      try {
        Object.defineProperty(e, 'shiftKey', { get: () => true, configurable: true });
      } catch {}
    }
  }, true);

  document.addEventListener('dblclick', (e) => {
    if (!isMobile()) return;
    if (e.__dshAllowRename) return;
    const t = e.target;
    if (t instanceof Element && t.closest('[data-row-key^="session:"]')) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);

  let touchStartPos = null;
  let lastFastOpenAt = 0;
  let lastScrollAt = 0;
  let activeSwipeRow = null;
  let swipeState = null;
  let lastSwipeEndAt = 0;

  const closeSwipeRow = (row) => {
    if (!row) return;
    row.removeAttribute('data-swipe-open');
    row.removeAttribute('data-swiping');
    row.style.setProperty('--dsh-swipe-offset', '0px');
    if (activeSwipeRow === row) activeSwipeRow = null;
  };

  const closeAllSwipeRows = (exceptRow = null) => {
    if (activeSwipeRow && activeSwipeRow !== exceptRow) {
      closeSwipeRow(activeSwipeRow);
    }
    const openRows = document.querySelectorAll('.YDXeBa_sessionRow[data-swipe-open="true"], .YDXeBa_sessionRow[data-swiping="true"]');
    for (const r of openRows) {
      if (r !== exceptRow) closeSwipeRow(r);
    }
  };

  const findRowNativeControls = (row) => {
    const actionsEl = row.querySelector('.YDXeBa_rowActions');
    if (!actionsEl) return null;
    const buttons = Array.from(actionsEl.querySelectorAll('button'));
    const pinBtn = buttons.find((b) => {
      const label = b.getAttribute('aria-label') || '';
      return label.includes('置顶') || /pin/i.test(label);
    }) || null;
    const archiveBtn = buttons.find((b) => {
      const label = b.getAttribute('aria-label') || '';
      return label.includes('归档') || /archive/i.test(label);
    }) || null;
    const menuBtn = buttons.find((b) => b !== pinBtn && b !== archiveBtn) || null;
    return { actionsEl, pinBtn, archiveBtn, menuBtn };
  };

  const triggerMenuAction = (menuBtn, keywords) => {
    if (!menuBtn) return;
    document.body.setAttribute('data-dsh-silent-menu', 'true');
    menuBtn.click();
    let attempts = 0;
    const tryClickItem = () => {
      attempts += 1;
      const items = Array.from(document.querySelectorAll('[role="menu"] button, ._list_1aoad_8 button'));
      const matched = items.find((el) => {
        const txt = (el.textContent || '').trim().toLowerCase();
        return keywords.some((kw) => txt.includes(kw.toLowerCase()));
      });
      if (matched) {
        matched.click();
        setTimeout(() => document.body.removeAttribute('data-dsh-silent-menu'), 80);
        return;
      }
      if (attempts < 8) {
        requestAnimationFrame(tryClickItem);
      } else {
        document.body.removeAttribute('data-dsh-silent-menu');
      }
    };
    requestAnimationFrame(tryClickItem);
  };

  const ensureSwipeDrawer = (row) => {
    const controls = findRowNativeControls(row);
    if (!controls) return null;
    const isEn = document.documentElement.lang === 'en';
    const pinLabelAttr = controls.pinBtn ? (controls.pinBtn.getAttribute('aria-label') || '') : '';
    const isPinned = pinLabelAttr.includes('取消置顶') || /unpin/i.test(pinLabelAttr) || Boolean(row.querySelector('.YDXeBa_pinIndicator'));
    const archiveLabelAttr = controls.archiveBtn ? (controls.archiveBtn.getAttribute('aria-label') || '') : '';
    const isArchived = archiveLabelAttr.includes('取消归档') || /unarchive/i.test(archiveLabelAttr) || row.classList.contains('YDXeBa_archived');

    let drawer = row.querySelector(':scope > .dsh-swipe-actions');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.className = 'dsh-swipe-actions';
      const swallow = (ev) => {
        ev.stopPropagation();
      };
      drawer.addEventListener('pointerdown', swallow);
      drawer.addEventListener('pointerup', swallow);
      drawer.addEventListener('touchstart', swallow, { passive: true });
      drawer.addEventListener('touchend', swallow);
      drawer.addEventListener('click', (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
      });
      drawer.addEventListener('dblclick', (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
      });
      row.appendChild(drawer);
    }

    drawer.innerHTML = '';

    const makeBtn = (cls, text, onTap) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dsh-swipe-btn ' + cls;
      btn.textContent = text;
      let handled = false;
      const invoke = (ev) => {
        if (ev) {
          ev.stopImmediatePropagation();
          ev.stopPropagation();
          ev.preventDefault();
        }
        if (handled) return;
        handled = true;
        setTimeout(() => { handled = false; }, 320);
        lastSwipeEndAt = Date.now();
        closeSwipeRow(row);
        onTap();
      };
      btn.__dshInvoke = invoke;
      btn.addEventListener('pointerdown', (ev) => {
        ev.stopPropagation();
        lastSwipeEndAt = Date.now();
      });
      btn.addEventListener('touchstart', (ev) => {
        ev.stopPropagation();
        lastSwipeEndAt = Date.now();
      }, { passive: true });
      btn.addEventListener('pointerup', invoke);
      btn.addEventListener('touchend', invoke, { passive: false });
      btn.addEventListener('click', invoke, true);
      return btn;
    };

    if (controls.pinBtn && !isArchived) {
      drawer.appendChild(makeBtn(
        'dsh-swipe-btn-pin',
        isPinned ? (isEn ? 'Unpin' : '取消置顶') : (isEn ? 'Pin' : '置顶'),
        () => {
          const latest = findRowNativeControls(row);
          if (latest && latest.pinBtn) latest.pinBtn.click();
        }
      ));
    }

    if (controls.menuBtn) {
      drawer.appendChild(makeBtn(
        'dsh-swipe-btn-rename',
        isEn ? 'Rename' : '重命名',
        () => {
          const latest = findRowNativeControls(row);
          if (latest && latest.menuBtn) triggerMenuAction(latest.menuBtn, ['重命名', 'rename']);
        }
      ));
    }

    if (!isArchived && controls.menuBtn) {
      drawer.appendChild(makeBtn(
        'dsh-swipe-btn-fork',
        isEn ? 'Fork' : '分叉',
        () => {
          const latest = findRowNativeControls(row);
          if (latest && latest.menuBtn) triggerMenuAction(latest.menuBtn, ['分叉', 'fork']);
        }
      ));
    }

    if (controls.archiveBtn) {
      drawer.appendChild(makeBtn(
        'dsh-swipe-btn-archive',
        isArchived ? (isEn ? 'Unarchive' : '取消归档') : (isEn ? 'Archive' : '归档'),
        () => {
          const latest = findRowNativeControls(row);
          if (latest && latest.archiveBtn) latest.archiveBtn.click();
        }
      ));
    }

    return drawer;
  };

  const startSwipe = (clientX, clientY, target) => {
    if (!(target instanceof Element)) return;
    if (target.closest('.dsh-swipe-actions') || target.closest('.YDXeBa_rowActions')) {
      return;
    }
    const sessionRow = target.closest('.YDXeBa_sessionRow[data-row-key^="session:"]');
    if (!sessionRow) {
      closeAllSwipeRows(null);
      return;
    }
    if (activeSwipeRow && activeSwipeRow !== sessionRow) {
      closeAllSwipeRows(sessionRow);
    }
    const drawer = ensureSwipeDrawer(sessionRow);
    if (!drawer) return;
    const width = Math.max(148, drawer.offsetWidth + 6);
    const wasOpen = sessionRow.getAttribute('data-swipe-open') === 'true';
    swipeState = {
      row: sessionRow,
      startX: clientX,
      startY: clientY,
      startOffset: wasOpen ? -width : 0,
      currentOffset: wasOpen ? -width : 0,
      maxOffset: width,
      wasOpen,
      axis: null,
    };
  };

  const moveSwipe = (clientX, clientY, rawEvent) => {
    if (!swipeState) return;
    const dx = clientX - swipeState.startX;
    const dy = clientY - swipeState.startY;
    if (swipeState.axis === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dx) > Math.abs(dy) * 1.15) {
        swipeState.axis = 'x';
        swipeState.row.setAttribute('data-swiping', 'true');
        if (touchStartPos) touchStartPos.moved = true;
      } else {
        swipeState.axis = 'y';
        if (swipeState.wasOpen) closeSwipeRow(swipeState.row);
        swipeState = null;
        return;
      }
    }
    if (swipeState.axis !== 'x') return;
    if (rawEvent && rawEvent.cancelable) rawEvent.preventDefault();
    if (touchStartPos) touchStartPos.moved = true;
    lastScrollAt = Date.now();
    let next = swipeState.startOffset + dx;
    if (next > 0) next = 0;
    if (next < -swipeState.maxOffset) {
      next = -swipeState.maxOffset + (next + swipeState.maxOffset) * 0.2;
    }
    swipeState.currentOffset = next;
    swipeState.row.style.setProperty('--dsh-swipe-offset', Math.round(next) + 'px');
  };

  const endSwipe = () => {
    if (!swipeState) return;
    const state = swipeState;
    swipeState = null;
    state.row.removeAttribute('data-swiping');
    if (state.axis !== 'x') {
      if (state.wasOpen) {
        closeSwipeRow(state.row);
        lastSwipeEndAt = Date.now();
      }
      return;
    }
    lastSwipeEndAt = Date.now();
    lastScrollAt = Date.now();
    const threshold = state.wasOpen ? -(state.maxOffset - 28) : -Math.min(34, state.maxOffset * 0.22);
    if (state.currentOffset <= threshold) {
      state.row.setAttribute('data-swipe-open', 'true');
      state.row.style.setProperty('--dsh-swipe-offset', '-' + state.maxOffset + 'px');
      activeSwipeRow = state.row;
    } else {
      closeSwipeRow(state.row);
    }
  };

  document.addEventListener('touchstart', (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    const touch = e.touches[0];
    startSwipe(touch.clientX, touch.clientY, e.target);
  }, { passive: true, capture: true });

  document.addEventListener('touchmove', (e) => {
    if (!swipeState || !e.touches || e.touches.length !== 1) return;
    const touch = e.touches[0];
    moveSwipe(touch.clientX, touch.clientY, e);
  }, { passive: false, capture: true });

  document.addEventListener('touchend', () => {
    endSwipe();
  }, { passive: true, capture: true });

  document.addEventListener('touchcancel', () => {
    if (swipeState) {
      closeSwipeRow(swipeState.row);
      swipeState = null;
    }
  }, { passive: true, capture: true });

  document.addEventListener('scroll', (e) => {
    const t = e.target;
    if (t instanceof Element && (t.closest('.pI_x6G_sidebarCol') || t.getAttribute('role') === 'tree')) {
      lastScrollAt = Date.now();
      if (touchStartPos) touchStartPos.moved = true;
      if (!swipeState || swipeState.axis !== 'x') closeAllSwipeRows(null);
    }
  }, true);

  document.addEventListener('dragstart', (e) => {
    if (!isMobile()) return;
    const t = e.target;
    if (t instanceof Element && t.closest('[data-row-key]')) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);

  document.addEventListener('pointerdown', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (e.pointerType !== 'touch' && isMobile() && e.button === 0) {
      startSwipe(e.clientX, e.clientY, t);
    }
    if (e.pointerType !== 'touch') return;
    if (t.closest('.dsh-swipe-actions') || t.closest('.YDXeBa_rowActions')) {
      touchStartPos = null;
      return;
    }
    const row = t.closest('[data-row-key^="session:"], [data-row-key^="workspace:"], [data-row-key^="overflow:"]');
    if (!row) {
      touchStartPos = null;
      return;
    }
    if (row.getAttribute('data-swipe-open') === 'true') {
      touchStartPos = null;
      return;
    }
    const scroller = row.closest('[role="tree"]') || row.parentElement;
    touchStartPos = {
      x: e.clientX,
      y: e.clientY,
      scrollTop: scroller ? scroller.scrollTop : 0,
      scroller,
      row,
      moved: false,
      time: Date.now(),
    };
  }, true);

  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'touch' && swipeState) {
      moveSwipe(e.clientX, e.clientY, e);
      return;
    }
    if (e.pointerType !== 'touch' || !touchStartPos) return;
    const dx = Math.abs(e.clientX - touchStartPos.x);
    const dy = Math.abs(e.clientY - touchStartPos.y);
    const dScroll = touchStartPos.scroller ? Math.abs(touchStartPos.scroller.scrollTop - touchStartPos.scrollTop) : 0;
    if (dx > 6 || dy > 6 || dScroll > 2) {
      touchStartPos.moved = true;
      lastScrollAt = Date.now();
    }
  }, true);

  document.addEventListener('pointercancel', (e) => {
    if (e.pointerType !== 'touch' && swipeState) {
      closeSwipeRow(swipeState.row);
      swipeState = null;
    }
    if (touchStartPos) touchStartPos.moved = true;
    lastScrollAt = Date.now();
  }, true);

  document.addEventListener('pointerup', (e) => {
    const t = e.target;
    if (t instanceof Element && t.closest('.dsh-swipe-actions')) {
      const swipeBtn = t.closest('.dsh-swipe-btn');
      if (swipeBtn && typeof swipeBtn.__dshInvoke === 'function') {
        swipeBtn.__dshInvoke(e);
      } else {
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();
      }
      return;
    }
    if (e.pointerType !== 'touch' && swipeState) {
      endSwipe();
      return;
    }
    if (e.pointerType !== 'touch' || !touchStartPos) return;
    const state = touchStartPos;
    touchStartPos = null;
    const dScroll = state.scroller ? Math.abs(state.scroller.scrollTop - state.scrollTop) : 0;
    const dist = Math.hypot(e.clientX - state.x, e.clientY - state.y);
    const duration = Date.now() - state.time;

    if (state.moved || dist > 6 || dScroll > 2 || duration > 320 || Date.now() - lastScrollAt < 260 || Date.now() - lastSwipeEndAt < 450) {
      lastScrollAt = Date.now();
      return;
    }

    const rk = state.row.getAttribute('data-row-key') || '';
    if (rk.startsWith('session:')) {
      if (state.row.getAttribute('data-swipe-open') === 'true') {
        closeSwipeRow(state.row);
        return;
      }
      lastFastOpenAt = Date.now();
      state.row.click();
      if (isMobile()) {
        setTimeout(() => {
          const f = document.querySelector('.pI_x6G_frame');
          if (f && !f.hasAttribute('data-sidebar-collapsed')) {
            const toggleBtn = document.querySelector('.hHd-Xa_toggle');
            if (toggleBtn instanceof HTMLElement) toggleBtn.click();
          }
        }, 50);
      }
    }
  }, true);

  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const swipeBtn = t.closest('.dsh-swipe-btn');
    if (swipeBtn) {
      if (typeof swipeBtn.__dshInvoke === 'function') {
        swipeBtn.__dshInvoke(e);
      } else {
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();
      }
      return;
    }
    if (t.closest('.dsh-swipe-actions')) {
      e.stopImmediatePropagation();
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    if (t.closest('.YDXeBa_rowActions')) {
      return;
    }
    const anyTreeRow = t.closest('[data-row-key]');
    if (anyTreeRow && isMobile() && (Date.now() - lastScrollAt < 280 || Date.now() - lastSwipeEndAt < 450)) {
      e.stopImmediatePropagation();
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    const sessionRow = t.closest('[data-row-key^="session:"]');
    if (sessionRow && sessionRow.getAttribute('data-swipe-open') === 'true') {
      closeSwipeRow(sessionRow);
      e.stopImmediatePropagation();
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    if (sessionRow && e.isTrusted && Date.now() - lastFastOpenAt < 450) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    if (!isMobile()) return;
    const frame = document.querySelector('.pI_x6G_frame');
    if (!frame || frame.hasAttribute('data-sidebar-collapsed')) return;
    if (!t.closest('.pI_x6G_sidebarCol, .hHd-Xa_root, [role="menu"], [role="dialog"], [role="listbox"], .VOzbGW_overlay, .smn-panel, .smn-chat, .dsh-ws-touch-drag-ghost')) {
      e.stopImmediatePropagation();
      e.stopPropagation();
      e.preventDefault();
      const toggleBtn = document.querySelector('.hHd-Xa_toggle');
      if (toggleBtn instanceof HTMLElement) toggleBtn.click();
      return;
    }
    const newSessionBtn = t.closest('.hHd-Xa_newSession');
    const settingsBtn = t.closest('.VOzbGW_trigger, .hHd-Xa_settingsArea button');
    const panelNavBtn = t.closest('.hHd-Xa_panelList button');
    const subagentTriggerBtn = t.closest('.smn-trigger');
    if (sessionRow || newSessionBtn || settingsBtn || panelNavBtn || subagentTriggerBtn) {
      if (t.closest('.YDXeBa_rowActions') || t.closest('.dsh-swipe-actions')) return;
      setTimeout(() => {
        const f = document.querySelector('.pI_x6G_frame');
        if (f && !f.hasAttribute('data-sidebar-collapsed')) {
          const toggleBtn = document.querySelector('.hHd-Xa_toggle');
          if (toggleBtn instanceof HTMLElement) toggleBtn.click();
        }
      }, 50);
    }
  }, true);

})()</script>`

      const readProjcacheTitle = (sessionId) => {
        const dshRoot = process.env.DSH_HOME || join(homedir(), '.dsh')
        const dir = join(dshRoot, 'storages', 'session_projcache', 'sessions')
        const names = [`${sessionId}.json`]
        if (sessionId.startsWith('session-')) names.push(`${sessionId.slice('session-'.length)}.json`)
        for (const name of names) {
          try {
            const raw = readFileSync(join(dir, name), 'utf8')
            const title = JSON.parse(raw)?.record?.rows?.title?.val
            if (typeof title === 'string' && title.trim() !== '') return title.trim()
          } catch {}
        }
        return ''
      }

      const fallbackSessionTitle = (session) => {
        try {
          const evs = typeof session?.snapshotEvents === 'function' ? session.snapshotEvents() : []
          for (const ev of evs) {
            if (ev?.type !== 'user/message') continue
            const kind = String(ev?.data?.source?.kind ?? ev?.data?.source?.plugin ?? '')
            if (kind !== '' && kind !== 'user') continue
            const blocks = Array.isArray(ev?.data?.content) ? ev.data.content : []
            for (const blk of blocks) {
              if (blk?.type !== 'text' || typeof blk.text !== 'string') continue
              const clean = blk.text
                .replace(/【Four-Laws[\s\S]*$/m, '')
                .replace(/Current runtime context\.[\s\S]*$/m, '')
                .replace(/<system-reminder>[\s\S]*$/m, '')
                .trim()
              if (clean !== '') {
                const firstLine = clean.split(/\r?\n/)[0].trim()
                return firstLine.length > 42 ? `${firstLine.slice(0, 42)}…` : firstLine
              }
            }
          }
        } catch {}
        return ''
      }

      const disposeRunningSessions = webCtx.webServer.register({
        kind: 'exact',
        path: '/api/context-selector/running-sessions',
        handler: async (req, res) => {
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            writeJson(res, 405, { ok: false, error: 'method not allowed' })
            return
          }
          try {
            const sessionsSvc = serviceOf(ctx, 'sessions')
            const agentsSvc = serviceOf(ctx, 'agents')
            const workspaceRegistry = serviceOf(ctx, 'workspaceRegistry')
            const liveSessions = typeof sessionsSvc?.list === 'function' ? sessionsSvc.list() : []
            const workspaces = typeof workspaceRegistry?.list === 'function' ? workspaceRegistry.list() : []
            const archivedSet = new Set(workspaceRegistry?.archivedSessionIds ?? [])

            const rootOf = (sid) => {
              let cur = sessionsSvc?.get?.(sid)
              let hops = 0
              while (cur !== undefined && hops < 32) {
                const pid = cur.header?.parentSession
                if (!pid) return String(cur.id ?? cur.header?.id ?? sid)
                cur = sessionsSvc?.get?.(pid)
                hops += 1
              }
              return String(sid)
            }

            const subagentCounts = new Map()
            for (const session of liveSessions) {
              const id = String(session?.id ?? session?.header?.id ?? '')
              if (!id || !session?.header?.parentSession) continue
              const agent = agentsSvc?.get?.(id)
              if (agent?.status === 'running') {
                const rootId = rootOf(id)
                subagentCounts.set(rootId, (subagentCounts.get(rootId) ?? 0) + 1)
              }
            }

            const items = []
            for (const session of liveSessions) {
              const id = String(session?.id ?? session?.header?.id ?? '')
              if (!id || session?.header?.parentSession || archivedSet.has(id)) continue
              const agent = agentsSvc?.get?.(id)
              const running = agent?.status === 'running'
              const runningSubagentCount = subagentCounts.get(id) ?? 0
              const pendingTurn = agent?.inbox?.nextTurn?.length ?? 0
              const pendingStep = agent?.inbox?.nextStep?.length ?? 0
              if (!running && runningSubagentCount === 0 && pendingTurn === 0 && pendingStep === 0) continue

              let updatedAt = Number(session?.header?.createdAt) || Date.now()
              try {
                const evs = typeof session?.snapshotEvents === 'function' ? session.snapshotEvents() : []
                for (let i = evs.length - 1; i >= 0; i--) {
                  if (typeof evs[i]?.time === 'number' && Number.isFinite(evs[i].time)) {
                    updatedAt = evs[i].time
                    break
                  }
                }
              } catch {}

              const cwd = String(session?.header?.cwd ?? '')
              const ws = workspaces.find((w) => (Array.isArray(w.sessionIds) && w.sessionIds.includes(id)) || (cwd !== '' && w.path === cwd))
              const wsTitle = ws?.title ?? ''
              const title = readProjcacheTitle(id) || fallbackSessionTitle(session) || wsTitle || id

              items.push({
                sessionId: id,
                title,
                cwd,
                workspaceId: ws?.workspaceId ?? '',
                workspaceTitle: wsTitle,
                updatedAt,
                createdAt: Number(session?.header?.createdAt) || updatedAt,
                agentAvailable: Boolean(agent),
                running,
                runningSubagentCount,
                pendingTurn,
                pendingStep,
                blank: false,
              })
            }

            items.sort((a, b) => Number(b.running) - Number(a.running) || b.updatedAt - a.updatedAt)
            writeJson(res, 200, {
              ok: true,
              now: Date.now(),
              items,
            })
          } catch (err) {
            writeJson(res, 500, {
              ok: false,
              error: err instanceof Error ? err.message : String(err),
              items: [],
            })
          }
        },
      })

      const disposeTapIndex = webCtx.webServer.tapIndex((html) => {
        const cleanedHtml = html
          .replace(/<style id="dsh-mobile-override">[\s\S]*?<\/style>\s*(?:<script>[\s\S]*?<\/script>)?/gi, '')
          .replace(/<style id="dsh-mobile-gateway-fix">[\s\S]*?<\/style>/gi, '')
          .replace(/<script id="dsh-mobile-touch-nav">[\s\S]*?<\/script>/gi, '')
        const withPolyfill = cleanedHtml.replace(/<head(?:\s[^>]*)?>/i, (m) => `${m}${polyfillAndWsGuard}`)
        return withPolyfill.replace('</head>', `${mobileOverrideStyle}</head>`)
      })

      return () => {
        disposeState()
        disposeQuickPhrases()
        disposeToggle()
        disposeInspect()
        disposeRunningSessions()
        disposeTapIndex()
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
          if (sub === 'from' || sub === 'since') {
            const t = Number(tokens[1])
            if (!Number.isInteger(t) || t <= 0) {
              return { kind: 'error', text: '请指定起始轮次编号，例如: /ctx from 5（表示第 5 轮之前的全部不发）' }
            }
            const res = applyToggleAction(ctx, store, session, sessionId, { action: 'exclude-before-turn', turn: t })
            return {
              kind: 'success',
              text: `已设置从第 ${t} 轮起携带：第 1 ~ ${t - 1} 轮已全部取消勾选（共排除 ${res.state.excludedTurns.length} 轮，预计省 ~${res.tokenStats.savedTokens} tokens）。`,
            }
          }
          if (sub === 'notools') {
            const keepN = tokens[1] !== undefined ? Math.max(0, Number(tokens[1])) : 1
            const res = applyToggleAction(ctx, store, session, sessionId, {
              action: 'exclude-older-tools',
              keepRecentTurns: keepN,
            })
            return {
              kind: 'success',
              text: `已一键取消勾选历史过程工具记录（仅保留最近 ${keepN} 轮工具输出，预计省 ~${res.tokenStats.savedTokens} tokens）。`,
            }
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
