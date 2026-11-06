window.__ModuleLoader__.load({
  id: 'dsh-context-selector',
  factory: function (require) {
    'use strict'
    var React = require('react')
    var h = React.createElement
    var useState = React.useState
    var useEffect = React.useEffect
    var useCallback = React.useCallback
    var useSyncExternalStore = React.useSyncExternalStore

    var NS = 'contextSelector'
    var BIND_REV = 'v1.4.0'

    var zh = {
      'turn.outgoing': '我发出去的',
      'turn.incoming': '接收到的',
      'turn.number': '第 {turn} 轮',
      'toolbar.ephemeralOff': '本轮计入后续',
      'toolbar.ephemeralOn': '本轮仅发一次',
      'toolbar.ephemeralTip': '勾选时：本次发送的内容会保留在后续上下文中；取消勾选：本次正常发送，但下一次发消息时自动不带本轮',
      'toolbar.panelBtn': '上下文管理 ({included}/{total})',
      'toolbar.panelBtnExcluded': '上下文: 已省 ~{tokens} tok',
      'dock.title': '上下文勾选总览（勾选 = 携带，取消勾选 = 不携带）',
      'dock.subtitle': '你也可以直接在对话界面每行的最左侧勾选/取消勾选，上下文占用率会实时同步变化',
      'dock.selectAll': '全部勾选 (全携带)',
      'dock.selectNone': '全部取消 (全不带)',
      'dock.keepLast3': '仅带最近 3 轮',
      'dock.keepLast1': '仅带最近 1 轮',
      'dock.close': '收起',
      'dock.empty': '当前会话暂无历史对话段。',
      'role.user': '我发出的',
      'role.assistant': '接收回复',
      'role.tool': '过程工具',
    }

    var en = {
      'turn.outgoing': 'Sent (User)',
      'turn.incoming': 'Received (Assistant)',
      'turn.number': 'Turn {turn}',
      'toolbar.ephemeralOff': 'Keep in context',
      'toolbar.ephemeralOn': 'Send once only',
      'toolbar.ephemeralTip': 'When checked, this prompt stays in future context; when unchecked, it is sent now but omitted on the next turn',
      'toolbar.panelBtn': 'Context ({included}/{total})',
      'toolbar.panelBtnExcluded': 'Context: saved ~{tokens} tok',
      'dock.title': 'Context Selector Overview (Checked = Included, Unchecked = Excluded)',
      'dock.subtitle': 'You can also check or uncheck any row directly on the left side of the conversation',
      'dock.selectAll': 'Check All',
      'dock.selectNone': 'Uncheck All',
      'dock.keepLast3': 'Keep Last 3',
      'dock.keepLast1': 'Keep Last 1',
      'dock.close': 'Close',
      'dock.empty': 'No conversation turns yet.',
      'role.user': 'Sent',
      'role.assistant': 'Received',
      'role.tool': 'Tool',
    }

    var CSS_TEXT = [
      '.dsh-ctx-sel-checkbox {',
      '  width: 15px;',
      '  height: 15px;',
      '  margin: 0;',
      '  cursor: pointer;',
      '  flex: none;',
      '  accent-color: var(--dsw-alias-state-business-primary, #2563eb);',
      '  pointer-events: auto;',
      '}',
      '.dsh-ctx-sel-badge {',
      '  font-size: 11px;',
      '  padding: 1px 6px;',
      '  border-radius: var(--dsw-radius-sm, 4px);',
      '  background: var(--dsw-alias-interactive-bg-hover);',
      '  color: var(--dsw-alias-label-tertiary);',
      '  text-decoration: none;',
      '}',
      '.dsh-ctx-sel-detail-btn {',
      '  border: 0.5px solid var(--dsw-alias-border-l2);',
      '  border-radius: var(--dsw-radius-sm, 6px);',
      '  background: transparent;',
      '  color: var(--dsw-alias-label-tertiary);',
      '  padding: 2px 8px;',
      '  font-size: 11px;',
      '  line-height: 18px;',
      '  cursor: pointer;',
      '}',
      '.dsh-ctx-sel-detail-btn:hover {',
      '  background: var(--dsw-alias-interactive-bg-hover);',
      '  color: var(--dsw-alias-label-primary);',
      '}',
      '.dsh-ctx-sel-msg-list {',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 4px;',
      '  padding: 8px 10px;',
      '  border-radius: var(--dsw-radius-md, 8px);',
      '  border: 0.5px solid var(--dsw-alias-border-l1);',
      '  background: var(--dsw-alias-bg-layer-1);',
      '}',
      '.dsh-ctx-sel-msg-item {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '  font-size: 12px;',
      '  line-height: 18px;',
      '  color: var(--dsw-alias-label-secondary);',
      '  cursor: pointer;',
      '}',
      '.dsh-ctx-sel-msg-item[data-excluded="true"] .dsh-ctx-sel-msg-preview {',
      '  text-decoration: line-through;',
      '  color: var(--dsw-alias-label-tertiary);',
      '}',
      '.dsh-ctx-sel-msg-role {',
      '  flex: none;',
      '  font-size: 11px;',
      '  padding: 0 5px;',
      '  border-radius: 4px;',
      '  border: 0.5px solid var(--dsw-alias-border-l2);',
      '  color: var(--dsw-alias-label-tertiary);',
      '}',
      '.dsh-ctx-sel-msg-preview {',
      '  flex: 1;',
      '  min-width: 0;',
      '  overflow: hidden;',
      '  text-overflow: ellipsis;',
      '  white-space: nowrap;',
      '}',
      '.dsh-ctx-sel-toolbar-group {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '}',
      '.dsh-ctx-sel-pill {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 5px;',
      '  height: 28px;',
      '  padding: 0 9px;',
      '  border-radius: var(--dsw-radius-sm, 6px);',
      '  border: 0.5px solid var(--dsw-alias-border-l2);',
      '  background: transparent;',
      '  color: var(--dsw-alias-label-secondary);',
      '  font-size: 12px;',
      '  line-height: 20px;',
      '  cursor: pointer;',
      '  white-space: nowrap;',
      '  user-select: none;',
      '}',
      '.dsh-ctx-sel-pill:hover {',
      '  background: var(--dsw-alias-interactive-bg-hover);',
      '  color: var(--dsw-alias-label-primary);',
      '}',
      '.dsh-ctx-sel-pill[data-active="true"] {',
      '  border-color: var(--dsw-alias-state-business-primary, #2563eb);',
      '  color: var(--dsw-alias-label-primary);',
      '  background: var(--dsw-alias-interactive-bg-hover);',
      '}',
      '.dsh-ctx-sel-dock {',
      '  box-sizing: border-box;',
      '  width: 100%;',
      '  margin-bottom: 8px;',
      '  padding: 10px 14px;',
      '  border-radius: var(--dsw-radius-lg, 12px);',
      '  border: 0.5px solid var(--dsw-alias-border-l2);',
      '  background: var(--dsw-alias-bg-layer-1);',
      '  color: var(--dsw-alias-label-primary);',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 8px;',
      '}',
      '.dsh-ctx-sel-dock-header {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  gap: 8px;',
      '  flex-wrap: wrap;',
      '}',
      '.dsh-ctx-sel-dock-title {',
      '  font-size: 13px;',
      '  font-weight: 500;',
      '  color: var(--dsw-alias-label-primary);',
      '}',
      '.dsh-ctx-sel-dock-subtitle {',
      '  font-size: 11px;',
      '  color: var(--dsw-alias-label-tertiary);',
      '}',
      '.dsh-ctx-sel-dock-actions {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '  flex-wrap: wrap;',
      '}',
      '.dsh-ctx-sel-action-btn {',
      '  border: 0.5px solid var(--dsw-alias-border-l2);',
      '  border-radius: var(--dsw-radius-sm, 6px);',
      '  background: transparent;',
      '  color: var(--dsw-alias-label-secondary);',
      '  padding: 2px 8px;',
      '  font-size: 11px;',
      '  line-height: 18px;',
      '  cursor: pointer;',
      '}',
      '.dsh-ctx-sel-action-btn:hover {',
      '  background: var(--dsw-alias-interactive-bg-hover);',
      '  color: var(--dsw-alias-label-primary);',
      '}',
      '.dsh-ctx-sel-dock-list {',
      '  max-height: 240px;',
      '  overflow-y: auto;',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 6px;',
      '}',
      '.dsh-ctx-sel-dock-turn {',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 4px;',
      '  padding: 6px 10px;',
      '  border-radius: var(--dsw-radius-md, 8px);',
      '  border: 0.5px solid var(--dsw-alias-border-l1);',
      '}',
      '.dsh-ctx-sel-dock-turn-main {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '  font-size: 12px;',
      '  flex-wrap: wrap;',
      '}',
      '.dsh-ctx-sel-dock-turn-text {',
      '  flex: 1;',
      '  min-width: 140px;',
      '  overflow: hidden;',
      '  text-overflow: ellipsis;',
      '  white-space: nowrap;',
      '  color: var(--dsw-alias-label-secondary);',
      '}',
      '.dsh-ctx-sel-dock-turn[data-excluded="true"] .dsh-ctx-sel-dock-turn-text {',
      '  text-decoration: line-through;',
      '  color: var(--dsw-alias-label-tertiary);',
      '}',
      '.dsh-ctx-sel-check-label {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 5px;',
      '  padding: 2px 8px;',
      '  border-radius: var(--dsw-radius-sm, 6px);',
      '  border: 0.5px solid var(--dsw-alias-border-l2);',
      '  background: var(--dsw-alias-bg-layer-1);',
      '  color: var(--dsw-alias-label-secondary);',
      '  cursor: pointer;',
      '  user-select: none;',
      '}',
      '[data-chat-call-id], [data-chat-flow-kind="assistant-step"][data-chat-group-part="reasoning"] {',
      '  display: flex !important;',
      '  align-items: flex-start !important;',
      '  gap: 6px !important;',
      '}',
      '[data-chat-call-id] > :not(.dsh-ctx-inline-wrap), [data-chat-flow-kind="assistant-step"][data-chat-group-part="reasoning"] > :not(.dsh-ctx-inline-wrap) {',
      '  flex: 1 1 auto !important;',
      '  min-width: 0 !important;',
      '}',
      '[data-chat-flow-kind="user"][data-chat-node-key], [data-chat-flow-kind="steering"][data-chat-node-key] {',
      '  display: flex !important;',
      '  flex-direction: row !important;',
      '  align-items: center !important;',
      '  gap: 8px !important;',
      '}',
      '[data-chat-flow-kind="user"][data-chat-node-key] > :not(.dsh-ctx-user-left-check), [data-chat-flow-kind="steering"][data-chat-node-key] > :not(.dsh-ctx-user-left-check) {',
      '  flex: 1 1 auto !important;',
      '  min-width: 0 !important;',
      '}',
      '.dsh-ctx-user-left-check {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 5px;',
      '  flex: none;',
      '  padding: 3px 8px;',
      '  border-radius: 6px;',
      '  border: 0.5px solid var(--dsw-alias-border-l2);',
      '  background: var(--dsw-alias-bg-layer-1);',
      '  color: var(--dsw-alias-label-secondary);',
      '  font-size: 12px;',
      '  line-height: 18px;',
      '  cursor: pointer;',
      '  user-select: none;',
      '  z-index: 5;',
      '}',
      '.dsh-ctx-user-left-check:hover {',
      '  background: var(--dsw-alias-interactive-bg-hover);',
      '  color: var(--dsw-alias-label-primary);',
      '}',
      '.dsh-ctx-user-left-check[data-excluded="true"] {',
      '  border-color: var(--dsw-alias-state-warning-primary, #d97706);',
      '  color: var(--dsw-alias-label-tertiary);',
      '}',
      '.dsh-ctx-inline-wrap {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  flex: none;',
      '  height: 24px;',
      '  padding: 0 3px;',
      '  cursor: pointer;',
      '  user-select: none;',
      '  position: relative;',
      '  z-index: 10;',
      '}',
      '.dsh-ctx-inline-reply-pill {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 5px;',
      '  padding: 3px 8px;',
      '  margin-bottom: 6px;',
      '  border-radius: 6px;',
      '  border: 0.5px solid var(--dsw-alias-border-l2);',
      '  background: var(--dsw-alias-bg-layer-1);',
      '  color: var(--dsw-alias-label-secondary);',
      '  font-size: 12px;',
      '  line-height: 18px;',
      '  cursor: pointer;',
      '  user-select: none;',
      '  align-self: flex-start;',
      '  z-index: 5;',
      '}',
      '.dsh-ctx-inline-reply-pill:hover {',
      '  color: var(--dsw-alias-label-primary);',
      '  background: var(--dsw-alias-interactive-bg-hover);',
      '}',
      '.dsh-ctx-inline-reply-pill[data-excluded="true"] {',
      '  border-color: var(--dsw-alias-state-warning-primary, #d97706);',
      '  color: var(--dsw-alias-label-tertiary);',
      '}',
      '.dsh-ctx-row-excluded > :not(.dsh-ctx-inline-wrap):not(.dsh-ctx-inline-reply-pill):not(.dsh-ctx-user-left-check) {',
      '  opacity: 0.38;',
      '  transition: opacity 0.15s;',
      '}',
      '.dsh-ctx-group-head-row {',
      '  display: flex !important;',
      '  align-items: center !important;',
      '  gap: 6px !important;',
      '}',
      '[data-chat-flow-kind="turn-process"] {',
      '  display: flex !important;',
      '  align-items: center !important;',
      '  gap: 6px !important;',
      '}',
      '[data-chat-flow-kind="turn-process"] > button {',
      '  flex: 1 1 auto !important;',
      '}',
    ].join('\n')

    function formatTokensCount(tokens) {
      if (typeof tokens !== 'number' || !Number.isFinite(tokens) || tokens <= 0) return '0'
      if (tokens < 1000) return String(Math.round(tokens))
      return (tokens / 1000).toFixed(1) + 'k'
    }

    function guardCheckboxWrapperEvents(wrapperEl) {
      var stopOnly = function (e) {
        e.stopPropagation()
      }
      wrapperEl.addEventListener('pointerdown', stopOnly)
      wrapperEl.addEventListener('mousedown', stopOnly)
      wrapperEl.addEventListener('touchstart', stopOnly)
      wrapperEl.addEventListener('click', stopOnly)
    }

    function SessionContextController(sessionId, getSessionsService) {
      this.sessionId = sessionId
      this.getSessionsService = getSessionsService
      this.listeners = new Set()
      this.disposed = false
      this.timer = null
      this.inflight = false
      this.syntheticSeqCounter = 900000000
      this.snapshot = {
        loaded: false,
        drawerOpen: false,
        state: {
          excludedTurns: [],
          excludedMessageIds: [],
          excludedCallIds: [],
          nextTurnEphemeral: false,
          pendingEphemeralTurns: [],
          revision: 0,
        },
        turns: [],
        turnMap: new Map(),
        msgMap: new Map(),
        callMap: new Map(),
        tokenStats: null,
      }
    }

    SessionContextController.prototype.subscribe = function (listener) {
      var self = this
      this.listeners.add(listener)
      this.ensurePolling()
      return function () {
        self.listeners.delete(listener)
        if (self.listeners.size === 0 && self.timer !== null) {
          clearInterval(self.timer)
          self.timer = null
        }
      }
    }

    SessionContextController.prototype.getSnapshot = function () {
      return this.snapshot
    }

    SessionContextController.prototype.emit = function () {
      for (var listener of Array.from(this.listeners)) {
        try {
          listener()
        } catch {}
      }
    }

    SessionContextController.prototype.syncLiveContextMeter = function (tokenStats) {
      if (!tokenStats) return
      try {
        var sessionsSvc = this.getSessionsService ? this.getSessionsService() : null
        if (!sessionsSvc || typeof sessionsSvc.binding !== 'function') return
        var binding = sessionsSvc.binding(this.sessionId)
        var projections = binding && binding.session ? binding.session.projections : null
        if (!projections || typeof projections.apply !== 'function') return

        this.syntheticSeqCounter += 1
        var nextSeq = Math.max(
          this.syntheticSeqCounter,
          (projections.seqOf ? projections.seqOf('contextPressure') || 0 : 0) + 1,
          (projections.seqOf ? projections.seqOf('contextBreakdown') || 0 : 0) + 1,
        )
        this.syntheticSeqCounter = nextSeq

        if (tokenStats.adjustedPressure) {
          projections.apply('contextPressure', tokenStats.adjustedPressure, nextSeq)
        }
        if (tokenStats.adjustedBreakdown) {
          projections.apply('contextBreakdown', tokenStats.adjustedBreakdown, nextSeq)
        }
      } catch {}
    }

    SessionContextController.prototype.applyPayload = function (data) {
      if (!data || data.ok !== true) return
      var turns = Array.isArray(data.turns) ? data.turns : []
      var turnMap = new Map()
      var msgMap = new Map()
      var callMap = new Map()
      for (var i = 0; i < turns.length; i++) {
        var tr = turns[i]
        turnMap.set(tr.turn, tr)
        var msgs = Array.isArray(tr.messages) ? tr.messages : []
        for (var j = 0; j < msgs.length; j++) {
          msgMap.set(msgs[j].id, msgs[j])
        }
        var calls = Array.isArray(tr.calls) ? tr.calls : []
        for (var k = 0; k < calls.length; k++) {
          callMap.set(calls[k].callId, calls[k])
        }
      }
      this.snapshot = {
        loaded: true,
        drawerOpen: this.snapshot.drawerOpen,
        state: data.state || this.snapshot.state,
        turns: turns,
        turnMap: turnMap,
        msgMap: msgMap,
        callMap: callMap,
        tokenStats: data.tokenStats || null,
      }
      if (data.tokenStats) {
        this.syncLiveContextMeter(data.tokenStats)
      }
      this.emit()
      syncInlineChatCheckboxes(this)
    }

    SessionContextController.prototype.refresh = function () {
      var self = this
      if (this.disposed || this.inflight || !this.sessionId) return Promise.resolve()
      this.inflight = true
      var url = '/api/context-selector/state?sessionId=' + encodeURIComponent(this.sessionId)
      return fetch(url, { headers: { accept: 'application/json' } })
        .then(function (res) {
          return res.ok ? res.json() : null
        })
        .then(function (data) {
          if (!self.disposed && data) self.applyPayload(data)
        })
        .catch(function () {})
        .finally(function () {
          self.inflight = false
        })
    }

    SessionContextController.prototype.sendAction = function (payload) {
      var self = this
      if (this.disposed || !this.sessionId) return Promise.resolve()
      var body = Object.assign({ sessionId: this.sessionId }, payload)
      return fetch('/api/context-selector/toggle', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then(function (res) {
          return res.ok ? res.json() : null
        })
        .then(function (data) {
          if (!self.disposed && data) self.applyPayload(data)
        })
        .catch(function () {})
    }

    SessionContextController.prototype.toggleDrawer = function () {
      this.snapshot = Object.assign({}, this.snapshot, {
        drawerOpen: !this.snapshot.drawerOpen,
      })
      this.emit()
      if (this.snapshot.drawerOpen) {
        this.refresh()
      }
    }

    SessionContextController.prototype.ensurePolling = function () {
      var self = this
      if (!this.snapshot.loaded) {
        this.refresh()
      }
      if (this.timer === null && !this.disposed) {
        this.timer = setInterval(function () {
          if (self.listeners.size > 0) self.refresh()
        }, 2000)
      }
    }

    SessionContextController.prototype.dispose = function () {
      this.disposed = true
      if (this.timer !== null) {
        clearInterval(this.timer)
        this.timer = null
      }
      this.listeners.clear()
    }

    function useControllerSnapshot(controller) {
      var sub = useCallback(
        function (cb) {
          return controller.subscribe(cb)
        },
        [controller],
      )
      var get = useCallback(
        function () {
          return controller.getSnapshot()
        },
        [controller],
      )
      return useSyncExternalStore(sub, get)
    }

    function parseInputMessageId(nodeKey) {
      if (typeof nodeKey !== 'string') return null
      var prefix = '13:input-message'
      if (nodeKey.indexOf(prefix) === 0) {
        return nodeKey.slice(prefix.length)
      }
      return null
    }

    function parseAssistantStepCoords(nodeKey) {
      if (typeof nodeKey !== 'string') return null
      var prefix = '14:assistant-step'
      if (nodeKey.indexOf(prefix) === 0) {
        var rest = nodeKey.slice(prefix.length)
        var parts = rest.split(':')
        if (parts.length === 2) {
          return { turn: Number(parts[0]), step: Number(parts[1]) }
        }
      }
      return null
    }

    function syncInlineChatCheckboxes(controller) {
      if (typeof document === 'undefined' || !controller) return
      var snap = controller.getSnapshot()
      if (!snap.loaded) return

      /* Remove any leftover bottom turnTail bars from older versions */
      var oldTailBars = document.querySelectorAll('.dsh-ctx-sel-turn-bar')
      for (var tb = 0; tb < oldTailBars.length; tb++) {
        if (oldTailBars[tb].parentNode) oldTailBars[tb].parentNode.removeChild(oldTailBars[tb])
      }

      /* 1. Every tool call row: [data-chat-call-id] */
      var callNodes = document.querySelectorAll('[data-chat-call-id]')
      for (var i = 0; i < callNodes.length; i++) {
        var callEl = callNodes[i]
        var callId = callEl.getAttribute('data-chat-call-id')
        if (!callId) continue
        var callInfo = snap.callMap.get(callId)
        var parentTurn = Number(
          (callEl.closest('[data-chat-turn]') && callEl.closest('[data-chat-turn]').getAttribute('data-chat-turn')) ||
            (callInfo ? callInfo.turn : 0),
        )
        var isTurnExcl = (snap.state.excludedTurns || []).indexOf(parentTurn) !== -1
        var isCallExcl = (snap.state.excludedCallIds || []).indexOf(callId) !== -1
        var isIncluded = callInfo ? callInfo.included : !isTurnExcl && !isCallExcl

        var wrap = callEl.querySelector(':scope > .dsh-ctx-inline-wrap')
        if (wrap && wrap.getAttribute('data-ctx-rev') !== BIND_REV) {
          wrap.parentNode.removeChild(wrap)
          wrap = null
        }
        if (!wrap) {
          wrap = document.createElement('label')
          wrap.className = 'dsh-ctx-inline-wrap'
          wrap.setAttribute('data-ctx-rev', BIND_REV)
          wrap.title = '勾选 = 下次发送携带此条工具结果；取消勾选 = 下次不发此条'
          var cb = document.createElement('input')
          cb.type = 'checkbox'
          cb.className = 'dsh-ctx-sel-checkbox'
          wrap.appendChild(cb)
          guardCheckboxWrapperEvents(wrap)
          callEl.insertBefore(wrap, callEl.firstChild)
        }
        var inputEl = wrap.querySelector('input')
        if (inputEl) {
          inputEl.__ctxController = controller
          inputEl.__ctxCallId = callId
          inputEl.onchange = function (e) {
            e.stopPropagation()
            var ctrl = this.__ctxController
            var cid = this.__ctxCallId
            var checked = this.checked
            callEl.classList.toggle('dsh-ctx-row-excluded', !checked)
            if (ctrl && cid) {
              ctrl.sendAction({
                action: 'toggle-call',
                callId: cid,
                included: checked,
              })
            }
          }
          if (inputEl.checked !== isIncluded) {
            inputEl.checked = isIncluded
          }
        }
        callEl.classList.toggle('dsh-ctx-row-excluded', !isIncluded)
      }

      /* 2. Every user message row: left-side checkbox only */
      var userNodes = document.querySelectorAll(
        '[data-chat-flow-kind="user"][data-chat-node-key], [data-chat-flow-kind="steering"][data-chat-node-key]',
      )
      for (var u = 0; u < userNodes.length; u++) {
        var userEl = userNodes[u]
        var oldRightPill = userEl.querySelector('.dsh-ctx-inline-user-pill')
        if (oldRightPill && oldRightPill.parentNode) {
          oldRightPill.parentNode.removeChild(oldRightPill)
        }

        var nodeKey = userEl.getAttribute('data-chat-node-key')
        var msgId = parseInputMessageId(nodeKey)
        if (!msgId) continue
        var msgInfo = snap.msgMap.get(msgId)
        var turnNum = Number(userEl.getAttribute('data-chat-turn') || (msgInfo ? msgInfo.turn : 0))
        var turnExcluded = (snap.state.excludedTurns || []).indexOf(turnNum) !== -1
        var msgExcluded = (snap.state.excludedMessageIds || []).indexOf(msgId) !== -1
        var userIncluded = !turnExcluded && !msgExcluded

        var leftCheck = userEl.querySelector(':scope > .dsh-ctx-user-left-check')
        if (leftCheck && leftCheck.getAttribute('data-ctx-rev') !== BIND_REV) {
          leftCheck.parentNode.removeChild(leftCheck)
          leftCheck = null
        }
        if (!leftCheck) {
          leftCheck = document.createElement('label')
          leftCheck.className = 'dsh-ctx-user-left-check'
          leftCheck.setAttribute('data-ctx-rev', BIND_REV)
          leftCheck.title = '勾选 = 下次发送携带我发出的这条消息；取消勾选 = 下次不携带'
          var lcb = document.createElement('input')
          lcb.type = 'checkbox'
          lcb.className = 'dsh-ctx-sel-checkbox'
          var ltxt = document.createElement('span')
          leftCheck.appendChild(lcb)
          leftCheck.appendChild(ltxt)
          guardCheckboxWrapperEvents(leftCheck)
          userEl.insertBefore(leftCheck, userEl.firstChild)
        }
        var lInput = leftCheck.querySelector('input')
        var lSpan = leftCheck.querySelector('span')
        if (lInput) {
          lInput.__ctxController = controller
          lInput.__ctxMsgId = msgId
          lInput.__ctxTurn = turnNum
          lInput.onchange = function (e) {
            e.stopPropagation()
            var ctrl = this.__ctxController
            var mid = this.__ctxMsgId
            var bTurn = this.__ctxTurn
            var checked = this.checked
            if (!ctrl || !mid) return
            if (
               bTurn > 0 &&
              (ctrl.getSnapshot().state.excludedTurns || []).indexOf(bTurn) !== -1 &&
              checked
            ) {
              ctrl.sendAction({
                action: 'toggle-outgoing',
                turn: bTurn,
                included: true,
              })
            } else {
              ctrl.sendAction({
                action: 'toggle-message',
                messageId: mid,
                included: checked,
              })
            }
          }
          if (lInput.checked !== userIncluded) {
            lInput.checked = userIncluded
          }
        }
        if (lSpan) {
          lSpan.textContent = userIncluded ? '我发出的' : '我发出的 (已排除)'
        }
        leftCheck.setAttribute('data-excluded', !userIncluded ? 'true' : 'false')
        userEl.classList.toggle('dsh-ctx-row-excluded', !userIncluded)
      }

      /* 3. Assistant response & reasoning rows */
      var assistantNodes = document.querySelectorAll('[data-chat-flow-kind="assistant-step"][data-chat-node-key]')
      for (var a = 0; a < assistantNodes.length; a++) {
        var asstEl = assistantNodes[a]
        var groupPart = asstEl.getAttribute('data-chat-group-part')
        var aKey = asstEl.getAttribute('data-chat-node-key')
        var coords = parseAssistantStepCoords(aKey)
        if (!coords) continue
        var tInfo = snap.turnMap.get(coords.turn)
        if (!tInfo) continue
        var stepAsstMsg = null
        var tMsgs = tInfo.messages || []
        for (var mIdx = 0; mIdx < tMsgs.length; mIdx++) {
          if (tMsgs[mIdx].role === 'assistant' && tMsgs[mIdx].step === coords.step) {
            stepAsstMsg = tMsgs[mIdx]
            break
          }
        }
        if (!stepAsstMsg) continue
        var aIncluded = stepAsstMsg.included

        if (groupPart === 'reasoning') {
          var rWrap = asstEl.querySelector(':scope > .dsh-ctx-inline-wrap')
          if (rWrap && rWrap.getAttribute('data-ctx-rev') !== BIND_REV) {
            rWrap.parentNode.removeChild(rWrap)
            rWrap = null
          }
          if (!rWrap) {
            rWrap = document.createElement('label')
            rWrap.className = 'dsh-ctx-inline-wrap'
            rWrap.setAttribute('data-ctx-rev', BIND_REV)
            rWrap.title = '勾选 = 下次发送携带此步思考与消息；取消勾选 = 下次不携带'
            var rcb = document.createElement('input')
            rcb.type = 'checkbox'
            rcb.className = 'dsh-ctx-sel-checkbox'
            rWrap.appendChild(rcb)
            guardCheckboxWrapperEvents(rWrap)
            asstEl.insertBefore(rWrap, asstEl.firstChild)
          }
          var rInput = rWrap.querySelector('input')
          if (rInput) {
            rInput.__ctxController = controller
            rInput.__ctxMsgId = stepAsstMsg.id
            rInput.onchange = function (e) {
              e.stopPropagation()
              var ctrl = this.__ctxController
              if (ctrl && this.__ctxMsgId) {
                ctrl.sendAction({
                  action: 'toggle-message',
                  messageId: this.__ctxMsgId,
                  included: this.checked,
                })
              }
            }
            if (rInput.checked !== aIncluded) {
              rInput.checked = aIncluded
            }
          }
          asstEl.classList.toggle('dsh-ctx-row-excluded', !aIncluded)
          continue
        }

        var rPill = asstEl.querySelector(':scope > .dsh-ctx-inline-reply-pill')
        if (rPill && rPill.getAttribute('data-ctx-rev') !== BIND_REV) {
          rPill.parentNode.removeChild(rPill)
          rPill = null
        }
        if (!rPill) {
          rPill = document.createElement('label')
          rPill.className = 'dsh-ctx-inline-reply-pill'
          rPill.setAttribute('data-ctx-rev', BIND_REV)
          rPill.title = '勾选 = 下次发送携带这段接收到的回复；取消勾选 = 下次不携带'
          var acb = document.createElement('input')
          acb.type = 'checkbox'
          acb.className = 'dsh-ctx-sel-checkbox'
          var atxt = document.createElement('span')
          rPill.appendChild(acb)
          rPill.appendChild(atxt)
          guardCheckboxWrapperEvents(rPill)
          asstEl.insertBefore(rPill, asstEl.firstChild)
        }
        var aInput = rPill.querySelector('input')
        var aSpan = rPill.querySelector('span')
        if (aInput) {
          aInput.__ctxController = controller
          aInput.__ctxMsgId = stepAsstMsg.id
          aInput.__ctxTurn = coords.turn
          aInput.onchange = function (e) {
            e.stopPropagation()
            var ctrl = this.__ctxController
            var mid = this.__ctxMsgId
            var bTurn = this.__ctxTurn
            var checked = this.checked
            if (!ctrl || !mid) return
            if (
              bTurn > 0 &&
              (ctrl.getSnapshot().state.excludedTurns || []).indexOf(bTurn) !== -1 &&
              checked
            ) {
              ctrl.sendAction({
                action: 'toggle-incoming',
                turn: bTurn,
                included: true,
              })
            } else {
              ctrl.sendAction({
                action: 'toggle-message',
                messageId: mid,
                included: checked,
              })
            }
          }
          if (aInput.checked !== aIncluded) {
            aInput.checked = aIncluded
          }
        }
        if (aSpan) {
          aSpan.textContent = aIncluded
            ? '接收到的回复 (~' + formatTokensCount(stepAsstMsg.tokens) + ' tok)'
            : '接收到的回复 (已排除, 省 ~' + formatTokensCount(stepAsstMsg.tokens) + ' tok)'
        }
        rPill.setAttribute('data-excluded', !aIncluded ? 'true' : 'false')
        asstEl.classList.toggle('dsh-ctx-row-excluded', !aIncluded)
      }

      /* 4. Step process group header: ^ 已写入文件, 执行了命令... */
      var groupNodes = document.querySelectorAll('[data-step-process][data-chat-turn]')
      for (var g = 0; g < groupNodes.length; g++) {
        var groupEl = groupNodes[g]
        var gTurn = Number(groupEl.getAttribute('data-chat-turn') || 0)
        if (!(gTurn > 0)) continue
        var gtInfo = snap.turnMap.get(gTurn)
        if (!gtInfo) continue
        var gCalls = gtInfo.calls || []
        if (gCalls.length === 0) continue

        var domCallNodes = groupEl.querySelectorAll('[data-chat-call-id]')
        var groupCallIds = []
        for (var dc = 0; dc < domCallNodes.length; dc++) {
          var cid = domCallNodes[dc].getAttribute('data-chat-call-id')
          if (cid) groupCallIds.push(cid)
        }
        if (groupCallIds.length === 0) {
          for (var gc = 0; gc < gCalls.length; gc++) groupCallIds.push(gCalls[gc].callId)
        }

        var anyCallIncluded = false
        for (var ci = 0; ci < groupCallIds.length; ci++) {
          var cObj = snap.callMap.get(groupCallIds[ci])
          if (cObj ? cObj.included : (snap.state.excludedCallIds || []).indexOf(groupCallIds[ci]) === -1) {
            anyCallIncluded = true
            break
          }
        }

        var headerBtn = groupEl.querySelector('button[data-process-activity]')
        if (headerBtn && headerBtn.parentElement) {
          var headerParent = headerBtn.parentElement
          headerParent.classList.add('dsh-ctx-group-head-row')
          var gWrap = headerParent.querySelector(':scope > .dsh-ctx-inline-wrap')
          if (gWrap && gWrap.getAttribute('data-ctx-rev') !== BIND_REV) {
            gWrap.parentNode.removeChild(gWrap)
            gWrap = null
          }
          if (!gWrap) {
            gWrap = document.createElement('label')
            gWrap.className = 'dsh-ctx-inline-wrap'
            gWrap.setAttribute('data-ctx-rev', BIND_REV)
            gWrap.title = '勾选 = 携带本组过程工具记录；取消勾选 = 排除本组全部工具记录'
            var gcb = document.createElement('input')
            gcb.type = 'checkbox'
            gcb.className = 'dsh-ctx-sel-checkbox'
            gWrap.appendChild(gcb)
            guardCheckboxWrapperEvents(gWrap)
            headerParent.insertBefore(gWrap, headerBtn)
          }
          var gInput = gWrap.querySelector('input')
          if (gInput) {
            gInput.__ctxController = controller
            gInput.__ctxGroupEl = groupEl
            gInput.__ctxTurn = gTurn
            gInput.onchange = function (e) {
              e.stopPropagation()
              var ctrl = this.__ctxController
              var bGroupEl = this.__ctxGroupEl
              var bTurn = this.__ctxTurn
              if (!ctrl || !bGroupEl) return
              var currentSnap = ctrl.getSnapshot()
              var turnData = currentSnap.turnMap.get(bTurn)
              var currentCalls = []
              var domCalls = bGroupEl.querySelectorAll('[data-chat-call-id]')
              for (var idx = 0; idx < domCalls.length; idx++) {
                var idAttr = domCalls[idx].getAttribute('data-chat-call-id')
                if (idAttr) currentCalls.push(idAttr)
              }
              if (currentCalls.length === 0 && turnData && Array.isArray(turnData.calls)) {
                for (var idx2 = 0; idx2 < turnData.calls.length; idx2++) {
                  currentCalls.push(turnData.calls[idx2].callId)
                }
              }
              ctrl.sendAction({
                action: 'toggle-batch',
                callIds: currentCalls,
                included: this.checked,
              })
            }
            if (gInput.checked !== anyCallIncluded) {
              gInput.checked = anyCallIncluded
            }
          }
        }
      }

      /* 5. Outer turn-process bar: 已完成，用时 X分Y秒 ^ */
      var turnProcessNodes = document.querySelectorAll('[data-chat-flow-kind="turn-process"][data-chat-turn]')
      for (var tp = 0; tp < turnProcessNodes.length; tp++) {
        var tpEl = turnProcessNodes[tp]
        var tpTurn = Number(tpEl.getAttribute('data-chat-turn') || 0)
        if (!(tpTurn > 0)) continue
        var tpTurnInfo = snap.turnMap.get(tpTurn)
        if (!tpTurnInfo) continue
        var tpCalls = tpTurnInfo.calls || []
        if (tpCalls.length === 0) continue

        var anyTpCallIncluded = false
        for (var tci = 0; tci < tpCalls.length; tci++) {
          if (tpCalls[tci].included) {
            anyTpCallIncluded = true
            break
          }
        }

        var tpWrap = tpEl.querySelector(':scope > .dsh-ctx-inline-wrap')
        if (tpWrap && tpWrap.getAttribute('data-ctx-rev') !== BIND_REV) {
          tpWrap.parentNode.removeChild(tpWrap)
          tpWrap = null
        }
        if (!tpWrap) {
          tpWrap = document.createElement('label')
          tpWrap.className = 'dsh-ctx-inline-wrap'
          tpWrap.setAttribute('data-ctx-rev', BIND_REV)
          tpWrap.title = '勾选 = 携带本轮全部过程工具调用；取消勾选 = 排除本轮全部过程工具调用'
          var tpcb = document.createElement('input')
          tpcb.type = 'checkbox'
          tpcb.className = 'dsh-ctx-sel-checkbox'
          tpWrap.appendChild(tpcb)
          guardCheckboxWrapperEvents(tpWrap)
          tpEl.insertBefore(tpWrap, tpEl.firstChild)
        }
        var tpInput = tpWrap.querySelector('input')
        if (tpInput) {
          tpInput.__ctxController = controller
          tpInput.__ctxTurn = tpTurn
          tpInput.onchange = function (e) {
            e.stopPropagation()
            var ctrl = this.__ctxController
            var bTurn = this.__ctxTurn
            if (!ctrl) return
            var currentSnap = ctrl.getSnapshot()
            var turnData = currentSnap.turnMap.get(bTurn)
            var allTurnCalls = []
            if (turnData && Array.isArray(turnData.calls)) {
              for (var idx3 = 0; idx3 < turnData.calls.length; idx3++) {
                allTurnCalls.push(turnData.calls[idx3].callId)
              }
            }
            ctrl.sendAction({
              action: 'toggle-batch',
              callIds: allTurnCalls,
              included: this.checked,
            })
          }
          if (tpInput.checked !== anyTpCallIncluded) {
            tpInput.checked = anyTpCallIncluded
          }
        }
      }
    }

    function ComposerToolbarControls(props) {
      var controller = props.controller
      var t = props.t
      var snap = useControllerSnapshot(controller)

      useEffect(
        function () {
          syncInlineChatCheckboxes(controller)
        },
        [controller, snap],
      )

      var totalTurns = snap.turns.length
      var excludedCount = (snap.state.excludedTurns || []).length
      var includedCount = Math.max(0, totalTurns - excludedCount)
      var savedTokens = snap.tokenStats ? snap.tokenStats.savedTokens || 0 : 0
      var keepNextInContext = !snap.state.nextTurnEphemeral

      var onToggleEphemeral = function (e) {
        e.stopPropagation()
        controller.sendAction({
          action: 'set-next-ephemeral',
          ephemeral: keepNextInContext,
        })
      }

      var onToggleDrawer = function () {
        controller.toggleDrawer()
      }

      var panelText =
        savedTokens > 0
          ? t('toolbar.panelBtnExcluded', { tokens: formatTokensCount(savedTokens) })
          : t('toolbar.panelBtn', {
              included: String(includedCount),
              total: String(totalTurns),
            })

      return h(
        'div',
        { className: 'dsh-ctx-sel-toolbar-group' },
        h(
          'label',
          {
            className: 'dsh-ctx-sel-pill',
            'data-active': !keepNextInContext ? 'true' : undefined,
            title: t('toolbar.ephemeralTip'),
          },
          h('input', {
            type: 'checkbox',
            className: 'dsh-ctx-sel-checkbox',
            checked: keepNextInContext,
            onChange: onToggleEphemeral,
          }),
          h('span', null, keepNextInContext ? t('toolbar.ephemeralOff') : t('toolbar.ephemeralOn')),
        ),
        h(
          'button',
          {
            type: 'button',
            className: 'dsh-ctx-sel-pill',
            'data-active': snap.drawerOpen || savedTokens > 0 ? 'true' : undefined,
            onClick: onToggleDrawer,
          },
          h('span', null, panelText),
        ),
      )
    }

    function ComposerContextDock(props) {
      var controller = props.controller
      var t = props.t
      var snap = useControllerSnapshot(controller)
      var expandedTurnsState = useState({})
      var expandedTurns = expandedTurnsState[0]
      var setExpandedTurns = expandedTurnsState[1]

      if (!snap.drawerOpen) return null

      var turns = snap.turns || []

      var toggleExpand = function (turnNum) {
        var next = Object.assign({}, expandedTurns)
        next[turnNum] = !next[turnNum]
        setExpandedTurns(next)
      }

      return h(
        'section',
        {
          className: 'dsh-ctx-sel-dock',
          'aria-label': t('dock.title'),
        },
        h(
          'div',
          { className: 'dsh-ctx-sel-dock-header' },
          h(
            'div',
            null,
            h('div', { className: 'dsh-ctx-sel-dock-title' }, t('dock.title')),
            h('div', { className: 'dsh-ctx-sel-dock-subtitle' }, t('dock.subtitle')),
          ),
          h(
            'div',
            { className: 'dsh-ctx-sel-dock-actions' },
            h(
              'button',
              {
                type: 'button',
                className: 'dsh-ctx-sel-action-btn',
                onClick: function () {
                  controller.sendAction({ action: 'set-all', included: true })
                },
              },
              t('dock.selectAll'),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'dsh-ctx-sel-action-btn',
                onClick: function () {
                  controller.sendAction({ action: 'set-all', included: false })
                },
              },
              t('dock.selectNone'),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'dsh-ctx-sel-action-btn',
                onClick: function () {
                  controller.sendAction({ action: 'keep-last-n', count: 3 })
                },
              },
              t('dock.keepLast3'),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'dsh-ctx-sel-action-btn',
                onClick: function () {
                  controller.sendAction({ action: 'keep-last-n', count: 1 })
                },
              },
              t('dock.keepLast1'),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'dsh-ctx-sel-action-btn',
                onClick: function () {
                  controller.toggleDrawer()
                },
              },
              t('dock.close'),
            ),
          ),
        ),
        turns.length === 0
          ? h('div', { className: 'dsh-ctx-sel-dock-subtitle' }, t('dock.empty'))
          : h(
              'div',
              { className: 'dsh-ctx-sel-dock-list' },
              turns.map(function (row) {
                var isExpanded = Boolean(expandedTurns[row.turn])
                var calls = Array.isArray(row.calls) ? row.calls : []
                var msgs = Array.isArray(row.messages) ? row.messages : []
                return h(
                  'div',
                  {
                    key: row.turn,
                    className: 'dsh-ctx-sel-dock-turn',
                    'data-excluded': !row.included ? 'true' : undefined,
                  },
                  h(
                    'div',
                    { className: 'dsh-ctx-sel-dock-turn-main' },
                    h(
                      'span',
                      { style: { fontWeight: 600, flex: 'none' } },
                      t('turn.number', { turn: String(row.turn) }),
                    ),
                    h(
                      'label',
                      {
                        className: 'dsh-ctx-sel-check-label',
                        'data-excluded': !row.outgoingIncluded ? 'true' : undefined,
                      },
                      h('input', {
                        type: 'checkbox',
                        className: 'dsh-ctx-sel-checkbox',
                        checked: row.outgoingIncluded,
                        onChange: function () {
                          controller.sendAction({
                            action: 'toggle-outgoing',
                            turn: row.turn,
                            included: !row.outgoingIncluded,
                          })
                        },
                      }),
                      h('span', null, t('turn.outgoing')),
                    ),
                    h(
                      'label',
                      {
                        className: 'dsh-ctx-sel-check-label',
                        'data-excluded': !row.incomingIncluded ? 'true' : undefined,
                      },
                      h('input', {
                        type: 'checkbox',
                        className: 'dsh-ctx-sel-checkbox',
                        checked: row.incomingIncluded,
                        onChange: function () {
                          controller.sendAction({
                            action: 'toggle-incoming',
                            turn: row.turn,
                            included: !row.incomingIncluded,
                          })
                        },
                      }),
                      h('span', null, t('turn.incoming')),
                    ),
                    h(
                      'span',
                      { className: 'dsh-ctx-sel-dock-turn-text' },
                      row.userPreview + (row.assistantPreview ? ' → ' + row.assistantPreview : ''),
                    ),
                    h(
                      'span',
                      { className: 'dsh-ctx-sel-badge' },
                      '~' + formatTokensCount(row.tokenCount) + ' tok',
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'dsh-ctx-sel-detail-btn',
                        onClick: function () {
                          toggleExpand(row.turn)
                        },
                      },
                      '小项(' + String(calls.length + msgs.filter(function (m) { return m.role !== 'tool' }).length) + ')' + (isExpanded ? '▲' : '▼'),
                    ),
                  ),
                  isExpanded
                    ? h(
                        'div',
                        { className: 'dsh-ctx-sel-msg-list' },
                        msgs
                          .filter(function (m) {
                            return m.role === 'user'
                          })
                          .map(function (m) {
                            return h(
                              'label',
                              {
                                key: 'u-' + m.id,
                                className: 'dsh-ctx-sel-msg-item',
                                'data-excluded': !m.included ? 'true' : undefined,
                              },
                              h('input', {
                                type: 'checkbox',
                                className: 'dsh-ctx-sel-checkbox',
                                checked: m.included,
                                onChange: function () {
                                  controller.sendAction({
                                    action: 'toggle-message',
                                    messageId: m.id,
                                    included: !m.included,
                                  })
                                },
                              }),
                              h('span', { className: 'dsh-ctx-sel-msg-role' }, t('role.user')),
                              h('span', { className: 'dsh-ctx-sel-msg-preview' }, m.preview || '(空)'),
                              h('span', { className: 'dsh-ctx-sel-badge' }, '~' + formatTokensCount(m.tokens) + ' tok'),
                            )
                          }),
                        calls.map(function (c) {
                          return h(
                            'label',
                            {
                              key: 'c-' + c.callId,
                              className: 'dsh-ctx-sel-msg-item',
                              'data-excluded': !c.included ? 'true' : undefined,
                            },
                            h('input', {
                              type: 'checkbox',
                              className: 'dsh-ctx-sel-checkbox',
                              checked: c.included,
                              onChange: function () {
                                controller.sendAction({
                                  action: 'toggle-call',
                                  callId: c.callId,
                                  included: !c.included,
                                })
                              },
                            }),
                            h('span', { className: 'dsh-ctx-sel-msg-role' }, '过程 · ' + c.toolName),
                            h(
                              'span',
                              { className: 'dsh-ctx-sel-msg-preview' },
                              c.summary + (c.resultPreview ? ' → ' + c.resultPreview : ''),
                            ),
                            h('span', { className: 'dsh-ctx-sel-badge' }, '~' + formatTokensCount(c.tokens) + ' tok'),
                          )
                        }),
                        msgs
                          .filter(function (m) {
                            return m.role === 'assistant' && m.kind === 'assistant'
                          })
                          .map(function (m) {
                            return h(
                              'label',
                              {
                                key: 'a-' + m.id,
                                className: 'dsh-ctx-sel-msg-item',
                                'data-excluded': !m.included ? 'true' : undefined,
                              },
                              h('input', {
                                type: 'checkbox',
                                className: 'dsh-ctx-sel-checkbox',
                                checked: m.included,
                                onChange: function () {
                                  controller.sendAction({
                                    action: 'toggle-message',
                                    messageId: m.id,
                                    included: !m.included,
                                  })
                                },
                              }),
                              h('span', { className: 'dsh-ctx-sel-msg-role' }, t('role.assistant')),
                              h('span', { className: 'dsh-ctx-sel-msg-preview' }, m.preview || '(空)'),
                              h('span', { className: 'dsh-ctx-sel-badge' }, '~' + formatTokensCount(m.tokens) + ' tok'),
                            )
                          }),
                      )
                    : null,
                )
              }),
            ),
      )
    }

    return {
      inject: ['slots', 'locale'],
      apply: function (ctx) {
        ctx.effect(function () {
          return ctx.locale.register(NS, { zh: zh, en: en })
        }, 'dsh-context-selector: locale')

        ctx.effect(function () {
          if (typeof document === 'undefined') return function () {}
          var styleId = 'dsh-context-selector-styles'
          var existing = document.querySelector('style[data-plugin-css="' + styleId + '"]')
          if (existing) {
            existing.textContent = CSS_TEXT
            return function () {}
          }
          var tag = document.createElement('style')
          tag.dataset.plugin = 'dsh-context-selector'
          tag.dataset.pluginCss = styleId
          tag.textContent = CSS_TEXT
          document.head.appendChild(tag)
          return function () {
            if (tag.parentNode) tag.parentNode.removeChild(tag)
          }
        }, 'dsh-context-selector: styles')

        var controllers = new Map()
        var activeSessionId = null

        var getSessionsService = function () {
          try {
            return ctx.get ? ctx.get('sessions') : ctx.sessions
          } catch {
            return null
          }
        }

        var controllerFor = function (sessionId) {
          var key = String(sessionId || '')
          activeSessionId = key
          var ctrl = controllers.get(key)
          if (!ctrl) {
            ctrl = new SessionContextController(key, getSessionsService)
            controllers.set(key, ctrl)
          }
          return ctrl
        }

        ctx.effect(function () {
          if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
            return function () {}
          }
          var rafId = null
          var observer = new MutationObserver(function () {
            if (rafId !== null) return
            rafId = requestAnimationFrame(function () {
              rafId = null
              if (activeSessionId && controllers.has(activeSessionId)) {
                syncInlineChatCheckboxes(controllers.get(activeSessionId))
              }
            })
          })
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['hidden', 'aria-expanded'],
          })
          return function () {
            observer.disconnect()
            if (rafId !== null) cancelAnimationFrame(rafId)
          }
        }, 'dsh-context-selector: inline-dom-observer')

        ctx.effect(function () {
          return function () {
            for (var ctrl of controllers.values()) {
              ctrl.dispose()
            }
            controllers.clear()
          }
        }, 'dsh-context-selector: controllers')

        ctx.slots.inject('conversation.input.left', function () {
          return ctx.slots.register(
            {
              name: 'conversation.input.left',
              id: 'context-selector-toolbar',
              order: 20,
              locale: NS,
              inject: function (sessionId) {
                return { controller: controllerFor(sessionId) }
              },
            },
            ComposerToolbarControls,
          )
        })

        ctx.slots.inject('conversation.input.dock', function () {
          return ctx.slots.register(
            {
              name: 'conversation.input.dock',
              id: 'context-selector-dock',
              order: 15,
              locale: NS,
              inject: function (sessionId) {
                return { controller: controllerFor(sessionId) }
              },
            },
            ComposerContextDock,
          )
        })
      },
    }
  },
})
