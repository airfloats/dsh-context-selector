window.__ModuleLoader__.load({
  id: 'dsh-context-selector',
  factory: function (require) {
    'use strict'
    var React = require('react')
    var h = React.createElement
    var useState = React.useState
    var useEffect = React.useEffect
    var useRef = React.useRef
    var useCallback = React.useCallback
    var useSyncExternalStore = React.useSyncExternalStore

    var NS = 'contextSelector'
    var BIND_REV = 'v2.9.3'
    var activeSessionId = null
    var QUICK_PHRASES_STORAGE_KEY = 'dsh_ctx_quick_phrases_v1'
    var DEFAULT_QUICK_PHRASES = [
      '你好',
      '继续',
      '看一下现在有什么发现',
      '帮我直接改好并验证',
    ]

    var zh = {
      'turn.outgoing': '提问',
      'turn.incoming': '回复',
      'turn.number': '第 {turn} 轮',
      'toolbar.ephemeralOff': '本轮计入',
      'toolbar.ephemeralOn': '仅发一次',
      'toolbar.ephemeralTip': '默认「本轮计入」：本次发送保留在后续上下文中；切换为「仅发一次」：本次正常发送，但下一轮自动不带本轮',
      'toolbar.panelBtn': '上下文 {included}/{total}',
      'toolbar.panelBtnExcluded': '上下文 · 省 ~{tokens}',
      'dock.title': '上下文选择',
      'dock.selectAll': '全选',
      'dock.selectNone': '全不带',
      'dock.keepLast5': '近 5 轮',
      'dock.keepLast3': '近 3 轮',
      'dock.keepLast1': '近 1 轮',
      'dock.dropOldTools': '去旧工具',
      'dock.close': '关闭',
      'dock.empty': '当前会话暂无历史轮次',
      'dock.cutoffBtn': '仅从此轮起',
      'role.user': '我说的',
      'role.assistant': 'AI 回复',
      'role.tool': '过程工具',
      'ask.selection': '向 AI 询问选中内容',
      'ask.quoteSelection': '引用选中内容到对话',
      'ask.file': '向 AI 询问此文档 ({name})',
      'ask.directory': '向 AI 询问此目录 ({name})',
      'ask.refFile': '仅引用文档 (@{name}) 到输入框',
      'ask.copySelection': '复制选中内容',
      'ask.copyPath': '复制路径',
      'ask.floatAsk': '询问 AI',
      'ask.floatQuote': '引用提问',
      'ask.headerBtn': '询问此文档',
    }

    var en = {
      'turn.outgoing': 'Prompt',
      'turn.incoming': 'Reply',
      'turn.number': 'Turn {turn}',
      'toolbar.ephemeralOff': 'Keep turn',
      'toolbar.ephemeralOn': 'Send once',
      'toolbar.ephemeralTip': 'Keep turn: stays in future context; Send once: sent now but omitted on the next turn',
      'toolbar.panelBtn': 'Context {included}/{total}',
      'toolbar.panelBtnExcluded': 'Saved ~{tokens}',
      'dock.title': 'Context Selector',
      'dock.selectAll': 'All',
      'dock.selectNone': 'None',
      'dock.keepLast5': 'Last 5',
      'dock.keepLast3': 'Last 3',
      'dock.keepLast1': 'Last 1',
      'dock.dropOldTools': 'No Old Tools',
      'dock.close': 'Close',
      'dock.empty': 'No conversation turns yet.',
      'dock.cutoffBtn': 'Keep from here',
      'role.user': 'User',
      'role.assistant': 'Assistant',
      'role.tool': 'Tools',
      'ask.selection': 'Ask AI about selection',
      'ask.quoteSelection': 'Quote selection to chat',
      'ask.file': 'Ask AI about document ({name})',
      'ask.directory': 'Ask AI about folder ({name})',
      'ask.refFile': 'Insert @{name} into composer',
      'ask.copySelection': 'Copy selection',
      'ask.copyPath': 'Copy path',
      'ask.floatAsk': 'Ask AI',
      'ask.floatQuote': 'Quote',
      'ask.headerBtn': 'Ask AI',
    }

    var SVG_CHECK_CIRCLE =
      '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.25"/><path d="M5.3 8.1L7.1 9.9L10.8 6.2"/></svg>'
    var SVG_EXCLUDED_CIRCLE =
      '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.25"/><path d="M5.5 8h5"/></svg>'
    var SVG_CUTOFF_UP =
      '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.5h10"/><path d="M8 13V6.5"/><path d="M5.2 9.2L8 6.4l2.8 2.8"/></svg>'

    var CSS_TEXT = [
      '@keyframes dshCtxPopIn {',
      '  from { opacity: 0; transform: translateY(6px) scale(0.985); }',
      '  to { opacity: 1; transform: translateY(0) scale(1); }',
      '}',
      '@keyframes dshCtxHoverIn {',
      '  from { opacity: 0; transform: translateX(-4px); }',
      '  to { opacity: 1; transform: translateX(0); }',
      '}',
      '@keyframes dshCtxFlash {',
      '  0%, 100% { box-shadow: none; }',
      '  30% { box-shadow: 0 0 0 2px var(--dsw-alias-state-business-primary, #2563eb); border-radius: 10px; }',
      '}',
      '.dsh-ctx-flash-highlight {',
      '  animation: dshCtxFlash 1.2s ease-out;',
      '}',
      '.dsh-ctx-sel-checkbox {',
      '  appearance: none;',
      '  -webkit-appearance: none;',
      '  width: 14px;',
      '  height: 14px;',
      '  margin: 0;',
      '  border-radius: 4px;',
      '  border: 1.35px solid var(--dsw-alias-border-l3, rgba(128, 128, 128, 0.45));',
      '  background-color: transparent;',
      '  cursor: pointer;',
      '  flex: none;',
      '  pointer-events: auto;',
      '  transition: background-color 0.12s, border-color 0.12s, opacity 0.12s;',
      '  position: relative;',
      '}',
      '.dsh-ctx-sel-checkbox:hover {',
      '  border-color: var(--dsw-alias-state-business-primary, #2563eb);',
      '}',
      '.dsh-ctx-sel-checkbox:checked {',
      '  background-color: var(--dsw-alias-state-business-primary, #2563eb);',
      '  border-color: var(--dsw-alias-state-business-primary, #2563eb);',
      '  background-image: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 12 12\' fill=\'none\'%3E%3Cpath d=\'M2.5 6.2L4.8 8.5L9.5 3.6\' stroke=\'white\' stroke-width=\'1.7\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E");',
      '  background-size: 11px 11px;',
      '  background-position: center;',
      '  background-repeat: no-repeat;',
      '}',
      '.dsh-ctx-sel-checkbox[data-partial="true"], .dsh-ctx-sel-checkbox:indeterminate {',
      '  background-color: var(--dsw-alias-state-business-primary, #2563eb) !important;',
      '  border-color: var(--dsw-alias-state-business-primary, #2563eb) !important;',
      '  background-image: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 12 12\' fill=\'none\'%3E%3Cpath d=\'M2.6 6H9.4\' stroke=\'white\' stroke-width=\'1.9\' stroke-linecap=\'round\'/%3E%3C/svg%3E") !important;',
      '  background-size: 11px 11px !important;',
      '  background-position: center !important;',
      '  background-repeat: no-repeat !important;',
      '}',
      '[data-chat-call-id]:not([hidden]):has(> .dsh-ctx-inline-wrap), [data-chat-flow-kind="assistant-step"][data-chat-group-part="reasoning"]:not([hidden]):has(> .dsh-ctx-inline-wrap) {',
      '  display: flex !important;',
      '  align-items: flex-start !important;',
      '  gap: 6px !important;',
      '}',
      '[data-chat-call-id]:has(> .dsh-ctx-inline-wrap) > :not(.dsh-ctx-inline-wrap), [data-chat-call-id]:has(> .dsh-ctx-inline-wrap) > [data-slot] > *, [data-chat-flow-kind="assistant-step"][data-chat-group-part="reasoning"]:has(> .dsh-ctx-inline-wrap) > :not(.dsh-ctx-inline-wrap), [data-chat-flow-kind="assistant-step"][data-chat-group-part="reasoning"]:has(> .dsh-ctx-inline-wrap) > [data-slot] > * {',
      '  flex: 1 1 auto !important;',
      '  min-width: 0 !important;',
      '}',
      '.dsh-ctx-inline-wrap {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  flex: none;',
      '  height: 22px;',
      '  padding: 0 2px;',
      '  cursor: pointer;',
      '  user-select: none;',
      '  position: relative;',
      '  z-index: 1;',
      '  opacity: 0.52;',
      '  transition: opacity 0.12s;',
      '}',
      '[data-composer-seat] {',
      '  z-index: 30 !important;',
      '}',
      '[data-composer-card] {',
      '  z-index: 25 !important;',
      '}',
      '.dsh-ctx-inline-wrap:hover, [data-chat-call-id]:hover > .dsh-ctx-inline-wrap, [data-chat-flow-kind="assistant-step"][data-chat-group-part="reasoning"]:hover > .dsh-ctx-inline-wrap {',
      '  opacity: 1;',
      '}',
      '.dsh-ctx-user-actions {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 2px;',
      '  position: relative;',
      '}',
      '.dsh-ctx-user-actions::before {',
      '  content: "";',
      '  width: 1px;',
      '  height: 11px;',
      '  background: var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.25));',
      '  margin: 0 3px;',
      '  flex: none;',
      '}',
      '[data-ctx-pinned-bar="true"] [data-clock="start"] {',
      '  opacity: 1 !important;',
      '}',
      '.dsh-ctx-icon-action {',
      '  position: relative;',
      '  display: inline-flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  gap: 4px;',
      '  min-width: 28px;',
      '  height: 28px;',
      '  padding: 0 6px;',
      '  border: none;',
      '  border-radius: var(--dsw-radius-sm, 6px);',
      '  background: transparent;',
      '  color: var(--dsw-alias-label-tertiary);',
      '  font-size: 12px;',
      '  line-height: 18px;',
      '  cursor: pointer;',
      '  user-select: none;',
      '  white-space: nowrap;',
      '  transition: background-color 0.12s, color 0.12s;',
      '}',
      '.dsh-ctx-icon-action:hover {',
      '  background: var(--dsw-alias-interactive-bg-hover);',
      '  color: var(--dsw-alias-label-primary);',
      '}',
      '.dsh-ctx-icon-action[data-status="excluded"] {',
      '  height: 22px;',
      '  padding: 0 8px;',
      '  border-radius: 999px;',
      '  background: rgba(217, 119, 6, 0.12);',
      '  color: var(--dsw-alias-state-warning-primary, #d97706);',
      '  font-size: 11.5px;',
      '  font-weight: 500;',
      '}',
      '.dsh-ctx-icon-action[data-status="cutoff"] {',
      '  height: 22px;',
      '  padding: 0 8px;',
      '  border-radius: 999px;',
      '  background: rgba(37, 99, 235, 0.11);',
      '  color: var(--dsw-alias-state-business-primary, #2563eb);',
      '  font-size: 11.5px;',
      '  font-weight: 500;',
      '}',
      '.dsh-ctx-icon-action[data-ctx-tip]::after {',
      '  content: attr(data-ctx-tip);',
      '  position: absolute;',
      '  bottom: calc(100% + 6px);',
      '  right: 0;',
      '  padding: 4px 8px;',
      '  border-radius: 6px;',
      '  background: var(--dsw-alias-bg-inverse, rgba(24, 24, 27, 0.92));',
      '  color: var(--dsw-alias-label-inverse, #ffffff);',
      '  font-size: 11.5px;',
      '  font-weight: 400;',
      '  line-height: 16px;',
      '  white-space: nowrap;',
      '  pointer-events: none;',
      '  opacity: 0;',
      '  transform: translateY(2px);',
      '  transition: opacity 0.12s, transform 0.12s;',
      '  z-index: 60;',
      '  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);',
      '}',
      '.dsh-ctx-icon-action[data-ctx-tip]:hover::after {',
      '  opacity: 1;',
      '  transform: translateY(0);',
      '}',
      '.dsh-ctx-inline-reply-pill {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 5px;',
      '  height: 22px;',
      '  padding: 0 7px;',
      '  margin-bottom: 4px;',
      '  border-radius: 999px;',
      '  border: none;',
      '  background: transparent;',
      '  color: var(--dsw-alias-label-tertiary);',
      '  font-size: 11.5px;',
      '  line-height: 18px;',
      '  cursor: pointer;',
      '  user-select: none;',
      '  align-self: flex-start;',
      '  opacity: 0.62;',
      '  transition: opacity 0.12s, background-color 0.12s, color 0.12s;',
      '  z-index: 1;',
      '}',
      '.dsh-ctx-inline-reply-pill:hover {',
      '  opacity: 1;',
      '  color: var(--dsw-alias-label-primary);',
      '  background: var(--dsw-alias-interactive-bg-hover);',
      '}',
      '.dsh-ctx-inline-reply-pill[data-excluded="true"] {',
      '  opacity: 1;',
      '  background: rgba(217, 119, 6, 0.12);',
      '  color: var(--dsw-alias-state-warning-primary, #d97706);',
      '}',
      '.dsh-ctx-row-excluded > :not(.dsh-ctx-inline-wrap):not(.dsh-ctx-inline-reply-pill), .dsh-ctx-row-excluded > [data-slot] > * {',
      '  opacity: 0.38;',
      '  transition: opacity 0.15s;',
      '}',
      '.dsh-ctx-group-head-row:not([hidden]) {',
      '  display: flex !important;',
      '  align-items: center !important;',
      '  gap: 6px !important;',
      '}',
      '[data-chat-flow-kind="turn-process"]:not([hidden]):has(button[data-turn-process]) {',
      '  display: flex !important;',
      '  align-items: center !important;',
      '  gap: 6px !important;',
      '}',
      '[data-chat-flow-kind="turn-process"] > button, [data-chat-flow-kind="turn-process"] > [data-slot] > button {',
      '  flex: 1 1 auto !important;',
      '  min-width: 0 !important;',
      '}',
      '.dsh-ctx-sel-toolbar-group {',
      '  position: relative;',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 4px;',
      '}',
      '.dsh-ctx-toolbar-btn {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 5px;',
      '  height: 28px;',
      '  padding: 0 8px;',
      '  border-radius: var(--dsw-radius-sm, 6px);',
      '  border: none;',
      '  background: transparent;',
      '  color: var(--dsw-alias-label-secondary);',
      '  font-size: 13px;',
      '  font-weight: 500;',
      '  line-height: 20px;',
      '  cursor: pointer;',
      '  white-space: nowrap;',
      '  user-select: none;',
      '  transition: background-color 0.12s, color 0.12s;',
      '}',
      '.dsh-ctx-toolbar-btn:hover {',
      '  background: var(--dsw-alias-interactive-bg-hover);',
      '  color: var(--dsw-alias-label-primary);',
      '}',
      '.dsh-ctx-toolbar-btn[data-active="true"] {',
      '  color: var(--dsw-alias-state-business-primary, #2563eb);',
      '  background: rgba(37, 99, 235, 0.08);',
      '}',
      '.dsh-ctx-toolbar-btn[data-ephemeral="true"] {',
      '  color: var(--dsw-alias-state-warning-primary, #d97706);',
      '  background: rgba(217, 119, 6, 0.10);',
      '}',
      '.dsh-ctx-icon-only-btn {',
      '  width: 28px;',
      '  padding: 0;',
      '  justify-content: center;',
      '  flex: 0 0 28px;',
      '}',
      '@media (max-width: 768px) {',
      '  .uV2eYG_card .uV2eYG_row {',
      '    padding: 2px 4px 5px !important;',
      '    gap: 2px !important;',
      '  }',
      '  .uV2eYG_card .uV2eYG_row .uV2eYG_tools {',
      '    gap: 1px !important;',
      '  }',
      '  .uV2eYG_card .uV2eYG_row .uV2eYG_trailing {',
      '    gap: 3px !important;',
      '  }',
      '  .uV2eYG_card .uV2eYG_row button.uV2eYG_add {',
      '    flex: 0 0 24px !important;',
      '    width: 24px !important;',
      '    height: 24px !important;',
      '  }',
      '  .uV2eYG_card .uV2eYG_row button.dsh-composer-img-edit-trigger {',
      '    flex: 0 0 22px !important;',
      '    width: 22px !important;',
      '    height: 24px !important;',
      '  }',
      '  .uV2eYG_card .uV2eYG_row button.iWlSmW_trigger {',
      '    flex: 0 0 22px !important;',
      '    width: 22px !important;',
      '    height: 24px !important;',
      '  }',
      '  .uV2eYG_card .uV2eYG_row .dsh-ctx-sel-toolbar-group {',
      '    gap: 1px !important;',
      '  }',
      '  .uV2eYG_card .uV2eYG_row .dsh-ctx-sel-toolbar-group .dsh-ctx-toolbar-btn {',
      '    height: 24px !important;',
      '    padding: 0 2px !important;',
      '    font-size: 10.5px !important;',
      '    letter-spacing: -0.3px !important;',
      '    gap: 1px !important;',
      '  }',
      '  .uV2eYG_card .uV2eYG_row .dsh-ctx-sel-toolbar-group .dsh-ctx-toolbar-btn:not(.dsh-ctx-icon-only-btn) svg {',
      '    width: 11px !important;',
      '    height: 11px !important;',
      '  }',
      '  .uV2eYG_card .uV2eYG_row .dsh-ctx-sel-toolbar-group .dsh-ctx-icon-only-btn {',
      '    width: 22px !important;',
      '    height: 24px !important;',
      '    padding: 0 !important;',
      '    flex: 0 0 22px !important;',
      '    justify-content: center !important;',
      '  }',
      '  .uV2eYG_card .uV2eYG_row .dsh-ctx-sel-toolbar-group .dsh-ctx-icon-only-btn svg {',
      '    width: 14px !important;',
      '    height: 14px !important;',
      '  }',
      '  .uV2eYG_card .uV2eYG_row .dsh-ctx-toolbar-chevron {',
      '    display: none !important;',
      '  }',
      '}',
      '.dsh-ctx-toolbar-chevron {',
      '  display: inline-flex;',
      '  transition: transform 0.14s ease;',
      '  opacity: 0.7;',
      '}',
      '.dsh-ctx-toolbar-chevron[data-open="true"] {',
      '  transform: rotate(180deg);',
      '}',
      '.dsh-ctx-popover-wrap {',
      '  position: absolute;',
      '  bottom: calc(100% + 10px);',
      '  left: 0;',
      '  z-index: 400;',
      '  display: flex;',
      '  align-items: flex-start;',
      '  gap: 10px;',
      '  pointer-events: none;',
      '}',
      '.dsh-ctx-popover {',
      '  pointer-events: auto;',
      '  box-sizing: border-box;',
      '  width: 356px;',
      '  max-width: calc(100vw - 32px);',
      '  padding: 12px;',
      '  border-radius: 14px;',
      '  border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.22));',
      '  background: var(--dsw-alias-bg-layer-1, #ffffff);',
      '  box-shadow: 0 14px 40px -8px rgba(0, 0, 0, 0.20), 0 4px 12px -2px rgba(0, 0, 0, 0.08);',
      '  color: var(--dsw-alias-label-primary);',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 10px;',
      '  animation: dshCtxPopIn 0.14s cubic-bezier(0.16, 1, 0.3, 1);',
      '}',
      '.dsh-ctx-pop-header, .dsh-ctx-pop-head {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  gap: 8px;',
      '  flex-wrap: nowrap;',
      '  width: 100%;',
      '  box-sizing: border-box;',
      '}',
      '.dsh-ctx-pop-title-group {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '  min-width: 0;',
      '}',
      '.dsh-ctx-pop-title {',
      '  font-size: 13.5px;',
      '  font-weight: 600;',
      '  line-height: 24px;',
      '  color: var(--dsw-alias-label-primary);',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '  flex-wrap: nowrap;',
      '  min-width: 0;',
      '}',
      '.dsh-ctx-pop-stat {',
      '  font-size: 11px;',
      '  font-weight: 500;',
      '  line-height: 22px;',
      '  height: 24px;',
      '  padding: 0 8px;',
      '  border-radius: 999px;',
      '  background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.1));',
      '  color: var(--dsw-alias-label-secondary);',
      '  white-space: nowrap;',
      '  display: inline-flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  box-sizing: border-box;',
      '}',
      '.dsh-ctx-pop-stat[data-saved="true"] {',
      '  background: rgba(37, 99, 235, 0.10);',
      '  color: var(--dsw-alias-state-business-primary, #2563eb);',
      '  font-weight: 500;',
      '}',
      '.dsh-ctx-pop-head-right {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 4px;',
      '}',
      '.dsh-ctx-view-switch {',
      '  display: inline-flex;',
      '  padding: 2px;',
      '  border-radius: 7px;',
      '  background: var(--dsw-alias-interactive-bg-hover);',
      '}',
      '.dsh-ctx-view-opt {',
      '  border: none;',
      '  background: transparent;',
      '  color: var(--dsw-alias-label-tertiary);',
      '  font-size: 11px;',
      '  line-height: 16px;',
      '  padding: 2px 7px;',
      '  border-radius: 5px;',
      '  cursor: pointer;',
      '}',
      '.dsh-ctx-view-opt[data-active="true"] {',
      '  background: var(--dsw-alias-bg-layer-1, #ffffff);',
      '  color: var(--dsw-alias-label-primary);',
      '  font-weight: 500;',
      '  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);',
      '}',
      '.dsh-ctx-pop-close, .dsh-ctx-close-x {',
      '  width: 24px;',
      '  height: 24px;',
      '  border: none;',
      '  border-radius: 6px;',
      '  background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.08));',
      '  color: var(--dsw-alias-label-secondary);',
      '  font-size: 12px;',
      '  line-height: 1;',
      '  display: inline-flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  cursor: pointer;',
      '  flex-shrink: 0;',
      '  transition: background-color 0.12s, color 0.12s;',
      '}',
      '.dsh-ctx-pop-close:hover, .dsh-ctx-close-x:hover {',
      '  background: rgba(239, 68, 68, 0.12);',
      '  color: #ef4444;',
      '}',
      '.dsh-ctx-presets {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 4px;',
      '  flex-wrap: wrap;',
      '}',
      '.dsh-ctx-preset-chip {',
      '  border: none;',
      '  border-radius: 6px;',
      '  background: var(--dsw-alias-interactive-bg-hover);',
      '  color: var(--dsw-alias-label-secondary);',
      '  padding: 3px 8px;',
      '  font-size: 11.5px;',
      '  line-height: 16px;',
      '  cursor: pointer;',
      '  transition: background-color 0.12s, color 0.12s;',
      '}',
      '.dsh-ctx-preset-chip:hover {',
      '  background: rgba(37, 99, 235, 0.12);',
      '  color: var(--dsw-alias-state-business-primary, #2563eb);',
      '}',
      '.dsh-ctx-capsule-grid {',
      '  display: grid;',
      '  grid-template-columns: repeat(3, minmax(0, 1fr));',
      '  gap: 6px;',
      '  max-height: 220px;',
      '  overflow-y: auto;',
      '  padding: 1px;',
      '}',
      '.dsh-ctx-capsule {',
      '  position: relative;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  gap: 5px;',
      '  height: 32px;',
      '  padding: 0 8px;',
      '  border-radius: 8px;',
      '  border: 1px solid var(--dsw-alias-border-l1, rgba(128, 128, 128, 0.16));',
      '  background: transparent;',
      '  color: var(--dsw-alias-label-primary);',
      '  font-size: 12px;',
      '  cursor: pointer;',
      '  user-select: none;',
      '  transition: border-color 0.12s, background-color 0.12s, opacity 0.12s;',
      '}',
      '.dsh-ctx-capsule:hover, .dsh-ctx-capsule[data-hovered="true"] {',
      '  border-color: var(--dsw-alias-state-business-primary, #2563eb);',
      '  background: var(--dsw-alias-interactive-bg-hover);',
      '}',
      '.dsh-ctx-capsule[data-excluded="true"] {',
      '  opacity: 0.48;',
      '  border-style: dashed;',
      '}',
      '.dsh-ctx-capsule-left {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '  min-width: 0;',
      '}',
      '.dsh-ctx-capsule-num {',
      '  font-weight: 600;',
      '  font-size: 12px;',
      '  white-space: nowrap;',
      '}',
      '.dsh-ctx-capsule-tok {',
      '  font-size: 10.5px;',
      '  color: var(--dsw-alias-label-tertiary);',
      '  white-space: nowrap;',
      '}',
      '.dsh-ctx-compact-list {',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 3px;',
      '  max-height: 230px;',
      '  overflow-y: auto;',
      '}',
      '.dsh-ctx-compact-row {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '  height: 30px;',
      '  min-height: 30px;',
      '  flex-shrink: 0;',
      '  padding: 0 8px;',
      '  border-radius: 8px;',
      '  cursor: pointer;',
      '  user-select: none;',
      '  font-size: 12px;',
      '  transition: background-color 0.1s, opacity 0.12s;',
      '}',
      '.dsh-ctx-compact-row:hover, .dsh-ctx-compact-row[data-hovered="true"] {',
      '  background: var(--dsw-alias-interactive-bg-hover);',
      '}',
      '.dsh-ctx-compact-row[data-excluded="true"] {',
      '  opacity: 0.45;',
      '}',
      '.dsh-ctx-compact-row[data-excluded="true"] .dsh-ctx-compact-title {',
      '  text-decoration: line-through;',
      '}',
      '.dsh-ctx-compact-turn {',
      '  flex: none;',
      '  font-weight: 600;',
      '  font-size: 11.5px;',
      '  color: var(--dsw-alias-label-secondary);',
      '  min-width: 26px;',
      '}',
      '.dsh-ctx-compact-title {',
      '  flex: 1;',
      '  min-width: 0;',
      '  overflow: hidden;',
      '  text-overflow: ellipsis;',
      '  white-space: nowrap;',
      '  color: var(--dsw-alias-label-primary);',
      '}',
      '.dsh-ctx-compact-cut {',
      '  flex: none;',
      '  border: none;',
      '  background: transparent;',
      '  color: var(--dsw-alias-label-tertiary);',
      '  padding: 2px 4px;',
      '  border-radius: 5px;',
      '  cursor: pointer;',
      '  opacity: 0;',
      '  display: inline-flex;',
      '  align-items: center;',
      '  transition: opacity 0.1s, background-color 0.1s, color 0.1s;',
      '}',
      '.dsh-ctx-compact-row:hover .dsh-ctx-compact-cut, .dsh-ctx-compact-cut[data-active="true"] {',
      '  opacity: 1;',
      '}',
      '.dsh-ctx-compact-cut:hover, .dsh-ctx-compact-cut[data-active="true"] {',
      '  color: var(--dsw-alias-state-business-primary, #2563eb);',
      '  background: rgba(37, 99, 235, 0.10);',
      '}',
      '.dsh-ctx-pop-hint {',
      '  font-size: 11px;',
      '  color: var(--dsw-alias-label-tertiary);',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  padding-top: 2px;',
      '  border-top: 0.5px solid var(--dsw-alias-border-l1, rgba(128, 128, 128, 0.14));',
      '}',
      '.dsh-ctx-hover-card {',
      '  position: absolute;',
      '  left: calc(100% + 8px);',
      '  top: 0;',
      '  pointer-events: auto;',
      '  box-sizing: border-box;',
      '  width: 300px;',
      '  max-width: calc(100vw - 24px);',
      '  max-height: min(360px, calc(100dvh - 110px));',
      '  overflow-y: auto;',
      '  overflow-x: hidden;',
      '  padding: 11px 12px;',
      '  border-radius: 14px;',
      '  border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.22));',
      '  background: var(--dsw-alias-bg-layer-1, #ffffff);',
      '  box-shadow: 0 14px 40px -8px rgba(0, 0, 0, 0.22), 0 4px 12px -2px rgba(0, 0, 0, 0.08);',
      '  color: var(--dsw-alias-label-primary);',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 7px;',
      '  z-index: 420;',
      '  animation: dshCtxHoverIn 0.12s ease-out;',
      '}',
      '.dsh-ctx-hover-card::before {',
      '  content: "";',
      '  position: absolute;',
      '  left: -18px;',
      '  top: -40px;',
      '  bottom: -40px;',
      '  width: 22px;',
      '  pointer-events: auto;',
      '}',
      '@media (max-width: 768px) {',
      '  html, body {',
      '    overflow-x: hidden !important;',
      '    overscroll-behavior-x: none !important;',
      '  }',
      '  .wSkVaW_root[data-phase="active"] .wSkVaW_scrollBody > [data-slot="conversation.session"],',
      '  .wSkVaW_embeddedBody[data-content-phase="active"] .wSkVaW_scrollBody > [data-slot="conversation.session"] {',
      '    display: flex !important;',
      '    flex-direction: column !important;',
      '    flex: 1 0 auto !important;',
      '    min-height: auto !important;',
      '  }',
      '  .wSkVaW_root[data-phase="active"] .wSkVaW_composerSeat,',
      '  .wSkVaW_embeddedBody[data-content-phase="active"] .wSkVaW_composerSeat {',
      '    margin-top: auto !important;',
      '    transform: translate3d(0, 0, 0);',
      '    transition: transform 0.24s cubic-bezier(0.2, 0.9, 0.2, 1) !important;',
      '    will-change: transform !important;',
      '  }',
      '  body[data-dsh-kb-open="true"] .wSkVaW_root[data-phase="active"] .wSkVaW_composerSeat,',
      '  body[data-dsh-kb-open="true"] .wSkVaW_embeddedBody[data-content-phase="active"] .wSkVaW_composerSeat {',
      '    transform: translate3d(0, calc(-1 * var(--dsh-kb-offset, 0px)), 0) !important;',
      '    transition: transform 0.16s cubic-bezier(0.2, 0.9, 0.2, 1) !important;',
      '    will-change: transform !important;',
      '  }',
      '  body[data-dsh-kb-open="true"] .uV2eYG_dock {',
      '    display: none !important;',
      '  }',
      '  body[data-dsh-kb-open="true"] .uV2eYG_root {',
      '    padding-bottom: 2px !important;',
      '  }',
      '  .dsh-ctx-sel-toolbar-group {',
      '    gap: 2px;',
      '    flex-wrap: wrap;',
      '    max-width: 100%;',
      '  }',
      '  .dsh-ctx-toolbar-btn {',
      '    height: 26px;',
      '    padding: 0 6px;',
      '    font-size: 12px;',
      '    gap: 3px;',
      '  }',
      '  .dsh-ctx-popover-wrap {',
      '    position: fixed !important;',
      '    left: 8px !important;',
      '    right: 8px !important;',
      '    bottom: 64px !important;',
      '    width: calc(100vw - 16px) !important;',
      '    max-width: calc(100vw - 16px) !important;',
      '    max-height: calc(100dvh - 84px) !important;',
      '    flex-direction: column !important;',
      '    align-items: stretch !important;',
      '    justify-content: flex-end !important;',
      '    gap: 6px !important;',
      '    z-index: 2147483630 !important;',
      '    overflow-x: hidden !important;',
      '    overscroll-behavior: contain !important;',
      '    touch-action: pan-y !important;',
      '  }',
      '  .dsh-ctx-popover {',
      '    width: 100% !important;',
      '    max-width: 100% !important;',
      '    max-height: 44dvh !important;',
      '    overflow-y: auto !important;',
      '    overflow-x: hidden !important;',
      '    overscroll-behavior: contain !important;',
      '    touch-action: pan-y !important;',
      '    padding: 8px 10px !important;',
      '    gap: 6px !important;',
      '    border-radius: 12px !important;',
      '  }',
      '  .dsh-ctx-hover-card {',
      '    width: 100% !important;',
      '    max-width: 100% !important;',
      '    max-height: 26dvh !important;',
      '    overflow-y: auto !important;',
      '    overflow-x: hidden !important;',
      '    overscroll-behavior: contain !important;',
      '    touch-action: pan-y !important;',
      '    padding: 8px 10px !important;',
      '    gap: 4px !important;',
      '    border-radius: 12px !important;',
      '  }',
      '  .dsh-ctx-capsule-grid {',
      '    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;',
      '    gap: 4px !important;',
      '    max-height: 152px !important;',
      '    overflow-x: hidden !important;',
      '    overscroll-behavior: contain !important;',
      '    touch-action: pan-y !important;',
      '  }',
      '  .dsh-ctx-capsule {',
      '    height: 26px !important;',
      '    padding: 0 6px !important;',
      '    font-size: 11px !important;',
      '    border-radius: 6px !important;',
      '  }',
      '  .dsh-ctx-compact-list {',
      '    gap: 2px !important;',
      '    max-height: 156px !important;',
      '    overflow-x: hidden !important;',
      '    overscroll-behavior: contain !important;',
      '    touch-action: pan-y !important;',
      '  }',
      '  .dsh-ctx-compact-row, .dsh-ctx-capsule, .dsh-ctx-hc-block, .dsh-ctx-hc-tools-list {',
      '    max-width: 100% !important;',
      '    box-sizing: border-box !important;',
      '    flex-shrink: 0 !important;',
      '    touch-action: pan-y !important;',
      '    -webkit-user-drag: none !important;',
      '  }',
      '  .dsh-ctx-inline-cp-divider, .dsh-ctx-cp-row, .dsh-ctx-sys-bar {',
      '    max-width: 100% !important;',
      '    box-sizing: border-box !important;',
      '    flex-shrink: 0 !important;',
      '    flex-wrap: wrap !important;',
      '    word-break: break-word !important;',
      '    touch-action: pan-y !important;',
      '  }',
      '  .dsh-ctx-sys-bar {',
      '    padding: 4px 7px !important;',
      '    gap: 4px !important;',
      '    border-radius: 7px !important;',
      '  }',
      '  .dsh-ctx-sys-row {',
      '    flex-wrap: nowrap !important;',
      '    gap: 4px !important;',
      '  }',
      '  .dsh-ctx-sys-select {',
      '    height: 22px !important;',
      '    font-size: 11px !important;',
      '    padding: 0 4px !important;',
      '    flex: 1 1 auto !important;',
      '    min-width: 0 !important;',
      '    max-width: none !important;',
      '  }',
      '  .dsh-ctx-cp-row > label {',
      '    min-width: 0 !important;',
      '    flex: 1 1 100% !important;',
      '    white-space: normal !important;',
      '    word-break: break-word !important;',
      '  }',
      '  .dsh-ctx-compact-row {',
      '    height: 28px !important;',
      '    min-height: 28px !important;',
      '    flex: 0 0 28px !important;',
      '    padding: 0 4px !important;',
      '    gap: 6px !important;',
      '    font-size: 11.5px !important;',
      '  }',
      '  .dsh-ctx-compact-cut {',
      '    opacity: 1 !important;',
      '    padding: 1px 5px !important;',
      '    font-size: 10.5px !important;',
      '    background: var(--dsw-alias-interactive-bg-hover) !important;',
      '  }',
      '  .dsh-ctx-sel-checkbox {',
      '    width: 14px !important;',
      '    height: 14px !important;',
      '  }',
      '  .dsh-ctx-presets {',
      '    gap: 3px !important;',
      '  }',
      '  .dsh-ctx-preset-chip {',
      '    padding: 2px 7px !important;',
      '    font-size: 11px !important;',
      '    line-height: 15px !important;',
      '  }',
      '  .dsh-ctx-quick-popover {',
      '    position: fixed !important;',
      '    left: 10px !important;',
      '    right: 10px !important;',
      '    bottom: 68px !important;',
      '    width: auto !important;',
      '    max-width: calc(100vw - 20px) !important;',
      '    max-height: 70dvh !important;',
      '    box-sizing: border-box !important;',
      '    padding: 12px 14px !important;',
      '    border-radius: 16px !important;',
      '    overflow-x: hidden !important;',
      '    overscroll-behavior: contain !important;',
      '    touch-action: pan-y !important;',
      '    z-index: 2147483630 !important;',
      '  }',
      '  .dsh-ctx-hc-text {',
      '    -webkit-line-clamp: 2 !important;',
      '  }',
      '  .dsh-ctx-pop-hint {',
      '    font-size: 10.5px !important;',
      '    flex-wrap: wrap !important;',
      '    gap: 4px !important;',
      '  }',
      '}',
      '@media (hover: none), (pointer: coarse) {',
      '  .dsh-ctx-compact-cut {',
      '    opacity: 1 !important;',
      '  }',
      '  .dsh-ctx-inline-wrap {',
      '    opacity: 0.85 !important;',
      '  }',
      '}',
      '.dsh-ctx-hc-head {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  gap: 6px;',
      '}',
      '.dsh-ctx-hc-title {',
      '  font-size: 12.5px;',
      '  font-weight: 600;',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '}',
      '.dsh-ctx-hc-actions {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 4px;',
      '}',
      '.dsh-ctx-hc-btn {',
      '  border: none;',
      '  border-radius: 6px;',
      '  background: var(--dsw-alias-interactive-bg-hover);',
      '  color: var(--dsw-alias-label-secondary);',
      '  padding: 2px 7px;',
      '  font-size: 11px;',
      '  line-height: 16px;',
      '  cursor: pointer;',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 3px;',
      '}',
      '.dsh-ctx-hc-btn:hover {',
      '  background: rgba(37, 99, 235, 0.12);',
      '  color: var(--dsw-alias-state-business-primary, #2563eb);',
      '}',
      '.dsh-ctx-hc-block {',
      '  padding: 5px 8px;',
      '  border-radius: 7px;',
      '  background: var(--dsw-alias-interactive-bg-hover);',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 3px;',
      '}',
      '.dsh-ctx-hc-block[data-excluded="true"] {',
      '  opacity: 0.48;',
      '}',
      '.dsh-ctx-hc-block-top {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  gap: 6px;',
      '  font-size: 11px;',
      '  color: var(--dsw-alias-label-tertiary);',
      '}',
      '.dsh-ctx-hc-role {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 5px;',
      '  font-weight: 600;',
      '  color: var(--dsw-alias-label-secondary);',
      '  cursor: pointer;',
      '  flex: none;',
      '}',
      '.dsh-ctx-hc-inline-preview {',
      '  flex: 1;',
      '  min-width: 0;',
      '  font-size: 11.5px;',
      '  line-height: 16px;',
      '  color: var(--dsw-alias-label-primary);',
      '  overflow: hidden;',
      '  text-overflow: ellipsis;',
      '  white-space: nowrap;',
      '  cursor: pointer;',
      '}',
      '.dsh-ctx-hc-inline-dock {',
      '  margin-top: 2px;',
      '  padding-top: 6px;',
      '  border-top: 1px dashed var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.22));',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 4px;',
      '}',
      '.dsh-ctx-hc-text {',
      '  font-size: 11.5px;',
      '  line-height: 16px;',
      '  color: var(--dsw-alias-label-primary);',
      '  display: -webkit-box;',
      '  -webkit-line-clamp: 3;',
      '  -webkit-box-orient: vertical;',
      '  overflow: hidden;',
      '  word-break: break-word;',
      '}',
      '.dsh-ctx-hc-tools-list {',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 3px;',
      '  max-height: 110px;',
      '  overflow-y: auto;',
      '  margin-top: 2px;',
      '  padding-top: 4px;',
      '  border-top: 0.5px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.2));',
      '}',
      '.dsh-ctx-hc-tool-item {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '  font-size: 11px;',
      '  line-height: 16px;',
      '  color: var(--dsw-alias-label-secondary);',
      '  cursor: pointer;',
      '}',
      '.dsh-ctx-hc-tool-item[data-excluded="true"] span {',
      '  text-decoration: line-through;',
      '  opacity: 0.6;',
      '}',
      '.dsh-doc-ask-menu {',
      '  position: fixed;',
      '  z-index: 2147483640;',
      '  min-width: 220px;',
      '  max-width: 340px;',
      '  padding: 5px;',
      '  border-radius: var(--dsw-radius-lg, 10px);',
      '  border: 0.5px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.28));',
      '  background: var(--dsw-specific-menu, var(--dsw-alias-bg-layer-2, #ffffff));',
      '  backdrop-filter: var(--dsw-menu-backdrop-filter, blur(16px));',
      '  box-shadow: var(--dsw-elevation-prominent, 0 8px 28px rgba(0,0,0,0.18));',
      '  color: var(--dsw-alias-label-primary, #111827);',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 2px;',
      '  font-family: var(--dsw-font, sans-serif);',
      '  font-size: 13px;',
      '  line-height: 20px;',
      '  user-select: none;',
      '}',
      'body[data-ds-dark-theme] .dsh-doc-ask-menu {',
      '  background: var(--dsw-specific-menu, var(--dsw-alias-bg-layer-2, #1f2430));',
      '  color: var(--dsw-alias-label-primary, #f3f4f6);',
      '  box-shadow: 0 10px 32px rgba(0,0,0,0.45);',
      '}',
      '.dsh-doc-ask-menu-header {',
      '  padding: 4px 10px 3px;',
      '  font-size: 11px;',
      '  color: var(--dsw-alias-label-tertiary, #6b7280);',
      '  overflow: hidden;',
      '  text-overflow: ellipsis;',
      '  white-space: nowrap;',
      '  border-bottom: 0.5px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.16));',
      '  margin-bottom: 2px;',
      '}',
      '.dsh-doc-ask-menu-item {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '  width: 100%;',
      '  padding: 6px 10px;',
      '  border: none;',
      '  border-radius: var(--dsw-radius-sm, 6px);',
      '  background: transparent;',
      '  color: inherit;',
      '  font: inherit;',
      '  text-align: left;',
      '  cursor: pointer;',
      '  box-sizing: border-box;',
      '}',
      '.dsh-doc-ask-menu-item:hover, .dsh-doc-ask-menu-item:focus-visible {',
      '  background: var(--dsw-alias-interactive-bg-hover, rgba(37,99,235,0.1));',
      '  outline: none;',
      '}',
      '.dsh-doc-ask-menu-item[data-primary="true"] {',
      '  color: var(--dsw-alias-state-business-primary, #2563eb);',
      '  font-weight: 500;',
      '}',
      '.dsh-doc-ask-menu-sep {',
      '  height: 1px;',
      '  margin: 3px 6px;',
      '  background: var(--dsw-alias-border-l1, rgba(128,128,128,0.18));',
      '}',
      '.dsh-doc-ask-float {',
      '  position: fixed;',
      '  z-index: 2147483635;',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 2px;',
      '  padding: 3px 4px;',
      '  border-radius: 999px;',
      '  border: 0.5px solid var(--dsw-alias-border-l3, rgba(128,128,128,0.28));',
      '  background: var(--dsw-alias-button-floating-fill, var(--dsw-alias-bg-layer-2, #ffffff));',
      '  box-shadow: var(--dsw-elevation-panel, 0 4px 16px rgba(0,0,0,0.16));',
      '  color: var(--dsw-alias-label-primary, #111827);',
      '  font-family: var(--dsw-font, sans-serif);',
      '  font-size: 12px;',
      '  line-height: 18px;',
      '  user-select: none;',
      '}',
      'body[data-ds-dark-theme] .dsh-doc-ask-float {',
      '  background: var(--dsw-alias-button-floating-fill, var(--dsw-alias-bg-layer-2, #1f2430));',
      '  color: var(--dsw-alias-label-primary, #f3f4f6);',
      '  box-shadow: 0 6px 20px rgba(0,0,0,0.45);',
      '}',
      '.dsh-doc-ask-float-btn {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 4px;',
      '  padding: 3px 9px;',
      '  border: none;',
      '  border-radius: 999px;',
      '  background: transparent;',
      '  color: inherit;',
      '  font: inherit;',
      '  font-weight: 500;',
      '  cursor: pointer;',
      '  white-space: nowrap;',
      '}',
      '.dsh-doc-ask-float-btn:hover {',
      '  background: var(--dsw-alias-button-floating-hover, var(--dsw-alias-interactive-bg-hover, rgba(37,99,235,0.12)));',
      '}',
      '.dsh-doc-ask-float-btn[data-primary="true"] {',
      '  color: var(--dsw-alias-state-business-primary, #2563eb);',
      '}',
      '.dsh-doc-ask-float-div {',
      '  width: 1px;',
      '  height: 12px;',
      '  background: var(--dsw-alias-border-l2, rgba(128,128,128,0.25));',
      '}',
      '.dsh-doc-header-ask-btn {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 4px;',
      '  height: 24px;',
      '  padding: 0 8px;',
      '  margin-right: 4px;',
      '  border-radius: var(--dsw-radius-sm, 6px);',
      '  border: 0.5px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.28));',
      '  background: transparent;',
      '  color: var(--dsw-alias-state-business-primary, #2563eb);',
      '  font-size: 12px;',
      '  font-weight: 500;',
      '  line-height: 18px;',
      '  cursor: pointer;',
      '  white-space: nowrap;',
      '  flex: none;',
      '}',
      '.dsh-doc-header-ask-btn:hover {',
      '  background: var(--dsw-alias-interactive-bg-hover, rgba(37,99,235,0.1));',
      '}',
      'span[data-composer-chip="reference"] > span[title^="❝"], span[data-composer-chip="context-quote"] > span {',
      '  background: rgba(217, 119, 6, 0.12) !important;',
      '  color: var(--dsw-alias-state-warning-primary, #d97706) !important;',
      '  border: 0.5px solid rgba(217, 119, 6, 0.35) !important;',
      '  border-radius: 6px !important;',
      '  padding: 1px 7px !important;',
      '  margin: 0 2px !important;',
      '  max-width: 240px !important;',
      '  font-size: 12.5px !important;',
      '  line-height: 19px !important;',
      '  vertical-align: baseline !important;',
      '}',
      'body[data-ds-dark-theme] span[data-composer-chip="reference"] > span[title^="❝"], body[data-ds-dark-theme] span[data-composer-chip="context-quote"] > span {',
      '  background: rgba(245, 158, 11, 0.16) !important;',
      '  color: #fbbf24 !important;',
      '  border-color: rgba(245, 158, 11, 0.4) !important;',
      '}',
      'span[data-composer-chip="reference"] > span[title^="❝"] > span:first-child, span[data-composer-chip="context-quote"] > span > span:first-child {',
      '  display: none !important;',
      '}',
      '@media (max-width: 768px), (pointer: coarse) {',
      '  span[data-composer-chip="reference"] > span[title^="❝"], span[data-composer-chip="context-quote"] > span {',
      '    max-width: calc(100vw - 56px) !important;',
      '    display: inline-flex !important;',
      '    align-items: center !important;',
      '    padding: 2px 8px !important;',
      '    margin: 0 0 2px 0 !important;',
      '    border-radius: 8px !important;',
      '  }',
      '  .uV2eYG_input p:has(span[data-composer-chip="reference"]) + p {',
      '    margin-top: 3px !important;',
      '    min-height: 22px !important;',
      '  }',
      '}',
      '[data-ctx-meter-enhanced="true"] {',
      '  width: min(440px, 100vw - 24px) !important;',
      '  max-height: min(620px, 100dvh - 36px) !important;',
      '  display: flex !important;',
      '  flex-direction: column !important;',
      '  overflow: hidden !important;',
      '}',
      '.dsh-ctx-meter-row-interactive {',
      '  cursor: pointer !important;',
      '  border-radius: 6px !important;',
      '  padding: 4px 6px !important;',
      '  margin: 0 -6px !important;',
      '  transition: background-color 0.12s !important;',
      '  user-select: none !important;',
      '}',
      '.dsh-ctx-meter-row-interactive:hover {',
      '  background: var(--dsw-alias-interactive-bg-hover, rgba(37, 99, 235, 0.08)) !important;',
      '}',
      '.dsh-ctx-meter-row-interactive[data-active="true"] {',
      '  background: rgba(37, 99, 235, 0.12) !important;',
      '  color: var(--dsw-alias-label-primary) !important;',
      '  font-weight: 500 !important;',
      '}',
      '.dsh-ctx-meter-chevron {',
      '  display: inline-block;',
      '  margin-left: 5px;',
      '  font-size: 10px;',
      '  color: var(--dsw-alias-label-tertiary);',
      '  transition: transform 0.15s ease;',
      '}',
      '.dsh-ctx-meter-row-interactive[data-active="true"] .dsh-ctx-meter-chevron {',
      '  transform: rotate(90deg);',
      '  color: var(--dsw-alias-state-business-primary, #2563eb);',
      '}',
      '.dsh-ctx-meter-hint {',
      '  margin-top: 6px;',
      '  font-size: 11px;',
      '  color: var(--dsw-alias-label-tertiary);',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '}',
      '.dsh-ctx-inspector {',
      '  margin-top: 8px;',
      '  padding-top: 8px;',
      '  border-top: 0.5px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.25));',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 6px;',
      '  min-height: 0;',
      '  flex: 1 1 auto;',
      '  overflow: hidden;',
      '}',
      '.dsh-ctx-inspector-head {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  gap: 8px;',
      '  flex-wrap: wrap;',
      '}',
      '.dsh-ctx-inspector-title {',
      '  font-size: 12px;',
      '  font-weight: 600;',
      '  color: var(--dsw-alias-label-primary);',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '}',
      '.dsh-ctx-inspector-tabs {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 3px;',
      '  background: var(--dsw-alias-interactive-bg-hover);',
      '  padding: 2px;',
      '  border-radius: 6px;',
      '}',
      '.dsh-ctx-inspector-tab {',
      '  border: none;',
      '  background: transparent;',
      '  color: var(--dsw-alias-label-tertiary);',
      '  font-size: 11px;',
      '  line-height: 16px;',
      '  padding: 2px 7px;',
      '  border-radius: 4px;',
      '  cursor: pointer;',
      '}',
      '.dsh-ctx-inspector-tab[data-active="true"] {',
      '  background: var(--dsw-alias-bg-layer-1, #ffffff);',
      '  color: var(--dsw-alias-label-primary);',
      '  font-weight: 600;',
      '  box-shadow: 0 1px 2px rgba(0,0,0,0.08);',
      '}',
      '.dsh-ctx-inspector-filter-bar {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 4px;',
      '  flex-wrap: wrap;',
      '}',
      '.dsh-ctx-inspector-chip {',
      '  border: 0.5px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.25));',
      '  background: transparent;',
      '  color: var(--dsw-alias-label-secondary);',
      '  font-size: 10.5px;',
      '  line-height: 15px;',
      '  padding: 1px 6px;',
      '  border-radius: 999px;',
      '  cursor: pointer;',
      '}',
      '.dsh-ctx-inspector-chip[data-active="true"] {',
      '  border-color: var(--dsw-alias-state-business-primary, #2563eb);',
      '  color: var(--dsw-alias-state-business-primary, #2563eb);',
      '  background: rgba(37, 99, 235, 0.1);',
      '  font-weight: 500;',
      '}',
      '.dsh-ctx-inspector-list {',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 5px;',
      '  max-height: 360px;',
      '  overflow-y: auto;',
      '  padding-right: 2px;',
      '}',
      '.dsh-ctx-inspector-card {',
      '  border: 0.5px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.22));',
      '  border-radius: 8px;',
      '  background: var(--dsw-alias-bg-layer-1, rgba(128,128,128,0.04));',
      '  padding: 6px 8px;',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 4px;',
      '}',
      '.dsh-ctx-inspector-card[data-excluded="true"] {',
      '  opacity: 0.5;',
      '}',
      '.dsh-ctx-inspector-card-top {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '  cursor: pointer;',
      '  user-select: none;',
      '}',
      '.dsh-ctx-inspector-seq {',
      '  font-size: 10.5px;',
      '  font-weight: 600;',
      '  font-variant-numeric: tabular-nums;',
      '  color: var(--dsw-alias-label-tertiary);',
      '  background: var(--dsw-alias-interactive-bg-hover);',
      '  padding: 0 5px;',
      '  border-radius: 4px;',
      '  flex: none;',
      '}',
      '.dsh-ctx-inspector-badge {',
      '  font-size: 10.5px;',
      '  padding: 0 5px;',
      '  border-radius: 4px;',
      '  border: 0.5px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.28));',
      '  color: var(--dsw-alias-label-secondary);',
      '  white-space: nowrap;',
      '  flex: none;',
      '}',
      '.dsh-ctx-inspector-badge[data-kind="checkpoint"] {',
      '  color: #d97706;',
      '  border-color: rgba(217, 119, 6, 0.45);',
      '  background: rgba(217, 119, 6, 0.1);',
      '}',
      '.dsh-ctx-inspector-badge[data-kind="user"] {',
      '  color: #2563eb;',
      '  border-color: rgba(37, 99, 235, 0.35);',
      '  background: rgba(37, 99, 235, 0.08);',
      '}',
      '.dsh-ctx-inspector-badge[data-kind="assistant-reply"] {',
      '  color: #059669;',
      '  border-color: rgba(5, 150, 105, 0.35);',
      '  background: rgba(5, 150, 105, 0.08);',
      '}',
      '.dsh-ctx-inspector-badge[data-kind="tool-result"], .dsh-ctx-inspector-badge[data-kind="tool-pruned"] {',
      '  color: #7c3aed;',
      '  border-color: rgba(124, 58, 237, 0.35);',
      '  background: rgba(124, 58, 237, 0.08);',
      '}',
      '.dsh-ctx-inspector-item-title {',
      '  flex: 1;',
      '  min-width: 0;',
      '  overflow: hidden;',
      '  text-overflow: ellipsis;',
      '  white-space: nowrap;',
      '  font-size: 11.5px;',
      '  color: var(--dsw-alias-label-primary);',
      '}',
      '.dsh-ctx-inspector-tok {',
      '  font-size: 11px;',
      '  font-variant-numeric: tabular-nums;',
      '  color: var(--dsw-alias-label-tertiary);',
      '  flex: none;',
      '}',
      '.dsh-ctx-inspector-meta {',
      '  font-size: 10.5px;',
      '  color: var(--dsw-alias-state-warning-primary, #d97706);',
      '}',
      '.dsh-ctx-inspector-pre {',
      '  margin: 2px 0 0;',
      '  padding: 6px 8px;',
      '  border-radius: 6px;',
      '  background: var(--dsw-alias-bg-base, rgba(0,0,0,0.04));',
      '  border: 0.5px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.18));',
      '  font-family: var(--dsw-font-mono, ui-monospace, monospace);',
      '  font-size: 11px;',
      '  line-height: 1.5;',
      '  white-space: pre-wrap;',
      '  word-break: break-word;',
      '  max-height: 220px;',
      '  overflow-y: auto;',
      '  color: var(--dsw-alias-label-primary);',
      '  user-select: text;',
      '}',
      '.dsh-ctx-capsule[data-compacted="true"] {',
      '  border-style: dashed;',
      '  border-color: rgba(217, 119, 6, 0.45);',
      '  background: rgba(217, 119, 6, 0.06);',
      '  opacity: 0.72;',
      '}',
      '.dsh-ctx-compact-row[data-compacted="true"] {',
      '  border-left: 2px dashed rgba(217, 119, 6, 0.55);',
      '  background: rgba(217, 119, 6, 0.05);',
      '  opacity: 0.76;',
      '}',
      '.dsh-ctx-compacted-tag {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 3px;',
      '  font-size: 10px;',
      '  line-height: 14px;',
      '  padding: 0 5px;',
      '  border-radius: 4px;',
      '  color: #d97706;',
      '  background: rgba(217, 119, 6, 0.12);',
      '  border: 0.5px solid rgba(217, 119, 6, 0.35);',
      '  white-space: nowrap;',
      '  flex: none;',
      '}',
      '.dsh-ctx-pruned-tag {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 2px;',
      '  font-size: 10px;',
      '  line-height: 14px;',
      '  padding: 0 4px;',
      '  border-radius: 4px;',
      '  color: #7c3aed;',
      '  background: rgba(124, 58, 237, 0.1);',
      '  border: 0.5px solid rgba(124, 58, 237, 0.32);',
      '  white-space: nowrap;',
      '  flex: none;',
      '}',
      '.dsh-ctx-cp-banner {',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 5px;',
      '  padding: 7px 9px;',
      '  border-radius: 9px;',
      '  border: 0.5px solid rgba(217, 119, 6, 0.42);',
      '  background: rgba(217, 119, 6, 0.08);',
      '}',
      '.dsh-ctx-cp-banner[data-excluded="true"] {',
      '  opacity: 0.48;',
      '  border-style: dashed;',
      '}',
      '.dsh-ctx-cp-row {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  gap: 6px;',
      '  font-size: 11.5px;',
      '}',
      '.dsh-ctx-cp-preview {',
      '  margin: 2px 0 0;',
      '  padding: 6px 8px;',
      '  border-radius: 6px;',
      '  background: var(--dsw-alias-bg-base, rgba(0,0,0,0.04));',
      '  border: 0.5px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.18));',
      '  font-family: var(--dsw-font-mono, ui-monospace, monospace);',
      '  font-size: 11px;',
      '  line-height: 15px;',
      '  max-height: 150px;',
      '  overflow-y: auto;',
      '  white-space: pre-wrap;',
      '  word-break: break-word;',
      '  color: var(--dsw-alias-label-secondary);',
      '}',
      '.dsh-ctx-inline-cp-divider {',
      '  grid-column: 1 / -1;',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 4px;',
      '  margin: 4px 0;',
      '  padding: 7px 10px;',
      '  border-radius: 9px;',
      '  border: 1px solid rgba(217, 119, 6, 0.5);',
      '  background: linear-gradient(90deg, rgba(217, 119, 6, 0.14), rgba(217, 119, 6, 0.06));',
      '  box-shadow: 0 1px 4px rgba(217, 119, 6, 0.1);',
      '}',
      '.dsh-ctx-inline-cp-divider[data-excluded="true"] {',
      '  opacity: 0.48;',
      '  border-style: dashed;',
      '}',
      '.dsh-ctx-sel-checkbox:disabled {',
      '  opacity: 0.38;',
      '  cursor: not-allowed;',
      '  border-style: dashed;',
      '}',
      '.dsh-ctx-sys-bar {',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 6px;',
      '  padding: 7px 9px;',
      '  border-radius: 9px;',
      '  border: 0.5px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.25));',
      '  background: var(--dsw-alias-interactive-bg-hover, rgba(37,99,235,0.05));',
      '}',
      '.dsh-ctx-sys-row {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  gap: 6px;',
      '  flex-wrap: wrap;',
      '  font-size: 11.5px;',
      '}',
      '.dsh-ctx-sys-select {',
      '  height: 24px;',
      '  padding: 0 6px;',
      '  border-radius: 6px;',
      '  border: 0.5px solid var(--dsw-alias-border-l3, rgba(128,128,128,0.35));',
      '  background: var(--dsw-alias-bg-layer-1, #ffffff);',
      '  color: var(--dsw-alias-label-primary);',
      '  font-size: 11.5px;',
      '  cursor: pointer;',
      '  max-width: 195px;',
      '}',
      'body[data-ds-dark-theme] .dsh-ctx-sys-select {',
      '  background: var(--dsw-alias-bg-layer-2, #1f2430);',
      '  color: var(--dsw-alias-label-primary, #f3f4f6);',
      '}',
      '.dsh-ctx-sys-textarea {',
      '  width: 100%;',
      '  min-height: 76px;',
      '  max-height: 180px;',
      '  box-sizing: border-box;',
      '  padding: 6px 8px;',
      '  border-radius: 6px;',
      '  border: 0.5px solid var(--dsw-alias-border-l3, rgba(128,128,128,0.35));',
      '  background: var(--dsw-alias-bg-layer-1, #ffffff);',
      '  color: var(--dsw-alias-label-primary);',
      '  font-family: var(--dsw-font-mono, ui-monospace, monospace);',
      '  font-size: 11px;',
      '  line-height: 1.45;',
      '  resize: vertical;',
      '}',
      'body[data-ds-dark-theme] .dsh-ctx-sys-textarea {',
      '  background: var(--dsw-alias-bg-layer-2, #1f2430);',
      '  color: var(--dsw-alias-label-primary, #f3f4f6);',
      '}',
      '.dsh-ctx-quick-popover {',
      '  position: absolute;',
      '  bottom: calc(100% + 10px);',
      '  left: 0;',
      '  z-index: 125;',
      '  box-sizing: border-box;',
      '  width: 360px;',
      '  max-width: calc(100vw - 20px);',
      '  padding: 10px 10px;',
      '  border-radius: 14px;',
      '  border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.22));',
      '  background: var(--dsw-alias-bg-layer-1, #ffffff);',
      '  box-shadow: 0 14px 40px -8px rgba(15,23,42,0.22), 0 4px 12px -2px rgba(15,23,42,0.08);',
      '  color: var(--dsw-alias-label-primary, #111827);',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 8px;',
      '  animation: dshCtxPopIn 0.14s cubic-bezier(0.16, 1, 0.3, 1);',
      '  user-select: none;',
      '}',
      'body[data-ds-dark-theme] .dsh-ctx-quick-popover {',
      '  background: var(--dsw-alias-bg-layer-2, #1f2430);',
      '  color: var(--dsw-alias-label-primary, #f3f4f6);',
      '  border-color: rgba(148, 163, 184, 0.24);',
      '  box-shadow: 0 16px 44px rgba(0,0,0,0.52);',
      '}',
      '.dsh-ctx-quick-list {',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 4px;',
      '  max-height: 256px;',
      '  overflow-y: auto;',
      '  overflow-x: hidden;',
      '  padding: 0;',
      '  margin: 0;',
      '}',
      '.dsh-ctx-quick-item {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  width: 100%;',
      '  gap: 6px;',
      '  padding: 4px 8px;',
      '  border-radius: 8px;',
      '  border: 1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.14));',
      '  background: var(--dsw-alias-bg-base, rgba(128,128,128,0.035));',
      '  box-sizing: border-box;',
      '  min-width: 0;',
      '  transition: background-color 0.14s ease, border-color 0.14s ease;',
      '}',
      '.dsh-ctx-quick-item:hover {',
      '  background: var(--dsw-alias-interactive-bg-hover, rgba(37,99,235,0.07));',
      '  border-color: rgba(37,99,235,0.32);',
      '}',
      '.dsh-ctx-quick-send-btn {',
      '  flex: 1 1 0%;',
      '  min-width: 0;',
      '  height: 22px;',
      '  border: none;',
      '  background: transparent;',
      '  color: var(--dsw-alias-label-primary);',
      '  font: inherit;',
      '  font-size: 12.5px;',
      '  line-height: 22px;',
      '  text-align: left;',
      '  cursor: pointer;',
      '  overflow: hidden;',
      '  text-overflow: ellipsis;',
      '  white-space: nowrap;',
      '  padding: 0;',
      '  display: inline-flex;',
      '  align-items: center;',
      '}',
      '.dsh-ctx-quick-send-btn:hover {',
      '  color: var(--dsw-alias-state-business-primary, #2563eb);',
      '}',
      '.dsh-ctx-quick-actions {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 4px;',
      '  flex: none;',
      '}',
      '.dsh-ctx-quick-mini-btn {',
      '  border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.24));',
      '  border-radius: 5px;',
      '  background: var(--dsw-alias-bg-layer-1, rgba(255,255,255,0.65));',
      '  color: var(--dsw-alias-label-secondary);',
      '  font-size: 11px;',
      '  line-height: 20px;',
      '  height: 22px;',
      '  min-width: 38px;',
      '  padding: 0 8px;',
      '  display: inline-flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  white-space: nowrap;',
      '  cursor: pointer;',
      '  flex-shrink: 0;',
      '  box-sizing: border-box;',
      '  transition: all 0.12s ease;',
      '}',
      'body[data-ds-dark-theme] .dsh-ctx-quick-mini-btn {',
      '  background: rgba(255,255,255,0.05);',
      '}',
      '.dsh-ctx-quick-mini-btn:hover {',
      '  background: rgba(37,99,235,0.12);',
      '  border-color: rgba(37,99,235,0.35);',
      '  color: var(--dsw-alias-state-business-primary, #2563eb);',
      '}',
      '.dsh-ctx-quick-mini-btn[data-primary="true"] {',
      '  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);',
      '  border-color: #2563eb;',
      '  color: #ffffff;',
      '  font-weight: 500;',
      '  box-shadow: 0 1px 2px rgba(37, 99, 235, 0.25);',
      '}',
      '.dsh-ctx-quick-mini-btn[data-primary="true"]:hover {',
      '  opacity: 0.92;',
      '  color: #ffffff;',
      '}',
      '.dsh-ctx-quick-add-row {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  gap: 6px;',
      '  width: 100%;',
      '  padding: 4px 8px;',
      '  border-radius: 8px;',
      '  border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.22));',
      '  background: var(--dsw-alias-bg-base, rgba(128,128,128,0.04));',
      '  box-sizing: border-box;',
      '  min-width: 0;',
      '}',
      '.dsh-ctx-quick-add-row:focus-within {',
      '  border-color: #2563eb;',
      '  background: var(--dsw-alias-bg-layer-1, #ffffff);',
      '  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.14);',
      '}',
      'body[data-ds-dark-theme] .dsh-ctx-quick-add-row:focus-within {',
      '  background: rgba(15, 23, 42, 0.75);',
      '}',
      '.dsh-ctx-quick-input {',
      '  flex: 1 1 0%;',
      '  min-width: 0;',
      '  height: 22px;',
      '  padding: 0 2px;',
      '  border: none;',
      '  border-radius: 0;',
      '  background: transparent;',
      '  color: var(--dsw-alias-label-primary);',
      '  font-size: 12.5px;',
      '  line-height: 22px;',
      '  box-sizing: border-box;',
      '  outline: none;',
      '}',
      '.dsh-ctx-quick-input:focus {',
      '  border: none;',
      '  background: transparent;',
      '  box-shadow: none;',
      '}',
      'body[data-ds-dark-theme] .dsh-ctx-quick-input {',
      '  background: transparent;',
      '  color: var(--dsw-alias-label-primary, #f3f4f6);',
      '}',
      'body[data-ds-dark-theme] .dsh-ctx-quick-input:focus {',
      '  background: transparent;',
      '}',
      '.dsh-ctx-settings-row {',
      '  border-bottom: 0.5px solid var(--dsw-alias-border-l2);',
      '  padding: 16px 0;',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 10px;',
      '}',
      '.dsh-ctx-settings-head {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  gap: 16px;',
      '}',
      '.dsh-ctx-settings-title {',
      '  font-size: 14px;',
      '  line-height: 20px;',
      '  font-weight: 500;',
      '  color: var(--dsw-alias-label-primary);',
      '}',
      '.dsh-ctx-settings-desc {',
      '  color: var(--dsw-alias-label-secondary);',
      '  margin-top: 4px;',
      '  font-size: 12px;',
      '  line-height: 18px;',
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

    function scrollToTurnInChat(turnNum) {
      if (typeof document === 'undefined') return
      var target =
        document.querySelector('[data-chat-flow-kind="user"][data-chat-turn="' + String(turnNum) + '"]') ||
        document.querySelector('[data-chat-turn="' + String(turnNum) + '"]')
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        target.classList.remove('dsh-ctx-flash-highlight')
        void target.offsetWidth
        target.classList.add('dsh-ctx-flash-highlight')
        setTimeout(function () {
          target.classList.remove('dsh-ctx-flash-highlight')
        }, 1300)
      }
    }

    var quickPhrasesSubscribers = new Set()

    function readQuickPhrases() {
      try {
        if (typeof localStorage !== 'undefined') {
          var raw = localStorage.getItem(QUICK_PHRASES_STORAGE_KEY)
          if (raw) {
            var parsed = JSON.parse(raw)
            if (Array.isArray(parsed) && parsed.length > 0) {
              var cleaned = parsed
                .map(function (x) {
                  return String(x || '').trim()
                })
                .filter(Boolean)
              if (cleaned.length > 0) return cleaned
            }
          }
        }
      } catch {}
      return DEFAULT_QUICK_PHRASES.slice()
    }

    var cachedQuickPhrases = readQuickPhrases()

    function notifyQuickPhrasesChanged() {
      quickPhrasesSubscribers.forEach(function (fn) {
        try {
          fn()
        } catch {}
      })
    }

    function writeQuickPhrases(list, syncServerSessionId) {
      var cleaned = Array.isArray(list)
        ? list
            .map(function (x) {
              return String(x || '').trim()
            })
            .filter(Boolean)
        : []
      if (cleaned.length === 0) cleaned = DEFAULT_QUICK_PHRASES.slice()
      cachedQuickPhrases = cleaned
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(QUICK_PHRASES_STORAGE_KEY, JSON.stringify(cleaned))
        }
      } catch {}
      notifyQuickPhrasesChanged()
      if (syncServerSessionId) {
        fetch('/api/context-selector/toggle', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            sessionId: syncServerSessionId,
            action: 'set-quick-phrases',
            phrases: cleaned,
          }),
        }).catch(function () {})
      }
      return cleaned
    }

    function subscribeQuickPhrases(cb) {
      quickPhrasesSubscribers.add(cb)
      return function () {
        quickPhrasesSubscribers.delete(cb)
      }
    }

    function getQuickPhrasesSnapshot() {
      return cachedQuickPhrases
    }

    function useQuickPhrases() {
      return useSyncExternalStore(subscribeQuickPhrases, getQuickPhrasesSnapshot)
    }

    function SessionContextController(sessionId, getSessionsService) {
      this.sessionId = sessionId
      this.getSessionsService = getSessionsService
      this.listeners = new Set()
      this.disposed = false
      this.timer = null
      this.inflight = false
      this.lastClickedCallId = null
      this.lastClickedTurn = null
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

        var adjP = tokenStats.adjustedPressure
        var adjB = tokenStats.adjustedBreakdown
        if (adjP && adjB) {
          var sumB = (adjB.systemTokens || 0) + (adjB.toolsTokens || 0) + (adjB.messageTokens || 0)
          var curU = adjP.projectedTokens || adjP.pressureTokens || 0
          if (sumB > 0 && curU < sumB * 0.5) {
            adjP = Object.assign({}, adjP, {
              pressureTokens: sumB,
              projectedTokens: sumB,
            })
          }
        }

        var curLiveP = projections.stateOf ? projections.stateOf('contextPressure') : null
        var curLiveU = curLiveP ? curLiveP.projectedTokens || curLiveP.pressureTokens || 0 : -1
        var targetU = adjP ? adjP.projectedTokens || adjP.pressureTokens || 0 : -1
        var pJson = JSON.stringify([adjP, adjB])
        if (this.__lastSyncedMeterJson === pJson && curLiveU === targetU) return
        this.__lastSyncedMeterJson = pJson

        this.syntheticSeqCounter += 1
        var nextSeq = Math.max(
          this.syntheticSeqCounter,
          (projections.seqOf ? projections.seqOf('contextPressure') || 0 : 0) + 1,
          (projections.seqOf ? projections.seqOf('contextBreakdown') || 0 : 0) + 1,
        )
        this.syntheticSeqCounter = nextSeq

        if (adjP) {
          projections.apply('contextPressure', adjP, nextSeq)
        }
        if (adjB) {
          projections.apply('contextBreakdown', adjB, nextSeq)
        }
      } catch {}
    }

    var PRESET_SYSTEM_TEMPLATES = [
      {
        id: 'standard',
        name: '标准模式 (standard)',
        mode: 'append',
        prompt: '',
      },
      {
        id: 'cordis',
        name: '创造模式 (cordis · 插件与预设开发)',
        mode: 'append',
        prompt: '',
      },
      {
        id: 'ptc',
        name: 'PTC 模式 (ptc · 程序化工具调用)',
        mode: 'append',
        prompt: '',
      },
      {
        id: 'minimal',
        name: '极简模式 (minimal)',
        mode: 'append',
        prompt: '',
      },
      {
        id: 'subagent-control',
        name: '子代理管控 (subagent-control)',
        mode: 'append',
        prompt: '',
      },
    ]

    function buildEffectivePresetList(snap) {
      var list = PRESET_SYSTEM_TEMPLATES.slice()
      var seen = new Set(
        list.map(function (x) {
          return x.id
        }),
      )
      var dynamic = (snap && Array.isArray(snap.availablePresets) && snap.availablePresets) || []
      for (var i = 0; i < dynamic.length; i++) {
        var dp = dynamic[i]
        if (dp && dp.id && !seen.has(dp.id)) {
          seen.add(dp.id)
          list.push({
            id: dp.id,
            name: dp.name && dp.name !== dp.id ? dp.name + ' (' + dp.id + ')' : dp.id,
            mode: 'append',
            prompt: '',
          })
        }
      }
      return list
    }

    function findPresetTemplate(presetId) {
      for (var i = 0; i < PRESET_SYSTEM_TEMPLATES.length; i++) {
        if (PRESET_SYSTEM_TEMPLATES[i].id === presetId) return PRESET_SYSTEM_TEMPLATES[i]
      }
      return null
    }

    function readLocalSysOverride(sessionId, getSessionsService) {
      if (!sessionId || typeof localStorage === 'undefined') return null
      try {
        var raw = localStorage.getItem('dsh_ctx_sys_override_' + String(sessionId))
        if (raw) {
          var parsed = JSON.parse(raw)
          if (parsed && typeof parsed === 'object') return parsed
        }
        if (typeof getSessionsService === 'function') {
          var sSvc = getSessionsService()
          var snap = sSvc && sSvc.list && typeof sSvc.list.getSnapshot === 'function' ? sSvc.list.getSnapshot() : null
          var byId = (snap && snap.byId) || {}
          var curId = String(sessionId)
          var visited = new Set([curId])
          for (var depth = 0; depth < 8 && curId; depth++) {
            var item = byId[curId]
            var parentId = item && (item.parentSessionId || item.parentId) ? String(item.parentSessionId || item.parentId) : ''
            if (!parentId || visited.has(parentId)) break
            visited.add(parentId)
            var pRaw = localStorage.getItem('dsh_ctx_sys_override_' + parentId)
            if (pRaw) {
              var pParsed = JSON.parse(pRaw)
              if (pParsed && typeof pParsed === 'object' && (pParsed.systemPresetOverride || pParsed.customSystemPrompt)) {
                localStorage.setItem('dsh_ctx_sys_override_' + String(sessionId), JSON.stringify(pParsed))
                return pParsed
              }
            }
            curId = parentId
          }
        }
        return null
      } catch {
        return null
      }
    }

    function writeLocalSysOverride(sessionId, obj) {
      if (!sessionId || typeof localStorage === 'undefined') return
      try {
        localStorage.setItem('dsh_ctx_sys_override_' + String(sessionId), JSON.stringify(obj || {}))
      } catch {}
    }

    function readLocalRestoredTurns(sessionId) {
      if (!sessionId || typeof localStorage === 'undefined') return []
      try {
        var raw = localStorage.getItem('dsh_ctx_restored_turns_' + String(sessionId))
        if (!raw) return []
        var parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed
          .map(function (x) {
            return Number(x)
          })
          .filter(function (n) {
            return Number.isInteger(n) && n > 0
          })
      } catch {
        return []
      }
    }

    function writeLocalRestoredTurns(sessionId, arr) {
      if (!sessionId || typeof localStorage === 'undefined') return
      try {
        var clean = Array.isArray(arr)
          ? arr
              .map(function (x) {
                return Number(x)
              })
              .filter(function (n) {
                return Number.isInteger(n) && n > 0
              })
          : []
        localStorage.setItem('dsh_ctx_restored_turns_' + String(sessionId), JSON.stringify(clean))
      } catch {}
    }

    function syncSessionPresetBadge(getSessionsService, sessionId, presetId) {
      if (!sessionId) return
      try {
        var sSvc = getSessionsService ? getSessionsService() : null
        var binding = sSvc && typeof sSvc.binding === 'function' ? sSvc.binding(sessionId) : null
        var projections = binding && binding.session ? binding.session.projections : null
        if (projections && typeof projections.apply === 'function' && presetId && presetId !== 'custom') {
          var nextSeq = (projections.seqOf ? projections.seqOf('agentPreset') || 0 : 0) + 1
          projections.apply('agentPreset', presetId, nextSeq)
        }
        if (sSvc && sSvc.list && typeof sSvc.list.getSnapshot === 'function') {
          var snap = sSvc.list.getSnapshot()
          var entry = snap && snap.byId ? snap.byId[sessionId] : null
          if (entry && entry.projectionValues && presetId && presetId !== 'custom') {
            entry.projectionValues.agentPreset = presetId
          }
        }
      } catch {}
    }

    function readClientSessionEvents(getSessionsService, sessionId) {
      try {
        var sSvc = getSessionsService ? getSessionsService() : null
        var binding = sSvc && typeof sSvc.binding === 'function' ? sSvc.binding(sessionId) : null
        var evSource =
          (binding && binding.session && binding.session.eventSource) ||
          (binding && binding.eventSource) ||
          null
        var win = evSource && typeof evSource.getSnapshot === 'function' ? evSource.getSnapshot() : null
        var rawEntries = win && Array.isArray(win.entries) ? win.entries : []
        var out = []
        for (var i = 0; i < rawEntries.length; i++) {
          var item = rawEntries[i]
          if (!item) continue
          var ev = item.event && typeof item.event === 'object' ? item.event : item
          if (ev && typeof ev.type === 'string') out.push(ev)
        }
        return out
      } catch {
        return []
      }
    }

    function enrichPayloadWithClientEvents(getSessionsService, sessionId, data) {
      if (!data || typeof data !== 'object') return data
      var existingTurns = Array.isArray(data.turns) ? data.turns : []
      var existingCheckpoints = Array.isArray(data.checkpoints) ? data.checkpoints : []
      var excludedTurnsArr = (data.state && data.state.excludedTurns) || []
      var excludedMsgIds = (data.state && data.state.excludedMessageIds) || []
      var excludedCallIdsArr = (data.state && data.state.excludedCallIds) || []

      if (existingTurns.length > 0 && existingCheckpoints.length === 0) {
        var anyComp = false
        for (var chk = 0; chk < existingTurns.length; chk++) {
          if (existingTurns[chk].compacted || existingTurns[chk].wasCompacted) {
            anyComp = true
            break
          }
        }
        if (!anyComp) {
          var checkEvs = readClientSessionEvents(getSessionsService, sessionId)
          for (var ce = 0; ce < checkEvs.length; ce++) {
            var cev0 = checkEvs[ce]
            if (cev0 && (cev0.type === 'compaction/summary' || (cev0.surfaceOp && cev0.surfaceOp !== 'append'))) {
              anyComp = true
              break
            }
          }
        }
        if (!anyComp) {
          var fastTurns = existingTurns.map(function (exRow) {
            var turnNotExcl = excludedTurnsArr.indexOf(exRow.turn) === -1
            var rowMsgs = Array.isArray(exRow.messages) ? exRow.messages : []
            var rowCalls = Array.isArray(exRow.calls) ? exRow.calls : []
            var fixedCalls = rowCalls.map(function (c) {
              var cComp = c.onSurface === false
              var tMsgExcl = c.toolMessageId ? excludedMsgIds.indexOf(c.toolMessageId) !== -1 : false
              var cExcl = excludedCallIdsArr.indexOf(c.callId) !== -1 || tMsgExcl
              return Object.assign({}, c, {
                compacted: cComp,
                included: !cComp && turnNotExcl && !cExcl,
                individuallyExcluded: cExcl,
              })
            })
            var asstMsgs = rowMsgs.filter(function (m) {
              return m.role === 'assistant'
            })
            var replyMsgIds =
              Array.isArray(exRow.replyIds) && exRow.replyIds.length > 0
                ? exRow.replyIds
                : asstMsgs.length > 0
                  ? [asstMsgs[asstMsgs.length - 1].id]
                  : []
            var computedReplyInc =
              turnNotExcl &&
              (replyMsgIds.length === 0
                ? false
                : replyMsgIds.some(function (id) {
                    return excludedMsgIds.indexOf(id) === -1
                  }))
            var computedToolsInc =
              turnNotExcl &&
              fixedCalls.some(function (c) {
                return c.included
              })
            var computedAllToolsInc =
              turnNotExcl &&
              fixedCalls.length > 0 &&
              fixedCalls.every(function (c) {
                return c.included
              })
            var computedOutInc = Boolean(exRow.outgoingIncluded)
            var computedTurnInc = turnNotExcl && (computedOutInc || computedReplyInc || computedToolsInc)
            var hasOut = Array.isArray(exRow.outgoingIds) && exRow.outgoingIds.length > 0
            var hasRep = replyMsgIds.length > 0
            var hasTls = fixedCalls.length > 0
            var allPartsInc =
              computedTurnInc &&
              (!hasOut || computedOutInc) &&
              (!hasRep || computedReplyInc) &&
              (!hasTls || computedAllToolsInc)
            var computedPartial = computedTurnInc && !allPartsInc
            return Object.assign({}, exRow, {
              calls: fixedCalls,
              replyIds: replyMsgIds,
              replyIncluded: computedReplyInc,
              toolsIncluded: computedToolsInc,
              allToolsIncluded: computedAllToolsInc,
              partialIncluded: computedPartial,
              included: computedTurnInc,
              outgoingIncluded: computedOutInc,
              incomingIncluded: computedReplyInc,
            })
          })
          return Object.assign({}, data, { turns: fastTurns })
        }
      }

      var events = readClientSessionEvents(getSessionsService, sessionId)
      if (events.length === 0) return data
      var existingTurnMap = new Map()
      for (var tIdx = 0; tIdx < existingTurns.length; tIdx++) {
        existingTurnMap.set(existingTurns[tIdx].turn, existingTurns[tIdx])
      }

      var foldNodes = []
      var findIdx = function (seqVal) {
        for (var k = 0; k < foldNodes.length; k++) {
          if (foldNodes[k].seq === seqVal) return k
        }
        return -1
      }

      var curTurn = 0
      var seqToTurn = new Map()
      var summaryById = new Map()
      var allTurnsData = new Map()
      var ensureLocalTurn = function (tNum) {
        if (!(tNum > 0)) return null
        var r = allTurnsData.get(tNum)
        if (!r) {
          r = {
            turn: tNum,
            status: 'completed',
            userPreview: '',
            assistantPreview: '',
            tokenCount: 0,
            charCount: 0,
            messages: [],
            calls: [],
            compacted: false,
            compactedById: null,
          }
          allTurnsData.set(tNum, r)
        }
        return r
      }

      for (var i = 0; i < events.length; i++) {
        var ev = events[i]
        if (ev.type === 'turn/start') {
          var tn = Number((ev.data && ev.data.turn) || 0)
          if (tn > 0) {
            curTurn = tn
            ensureLocalTurn(tn)
          }
          continue
        }
        if (ev.type === 'compaction/start' || ev.type === 'compaction/end') {
          continue
        }
        if (ev.type === 'compaction/summary' && ev.data) {
          var cid = String(ev.data.compactionId || '')
          if (cid) {
            summaryById.set(cid, {
              compactionId: cid,
              shadowedSeqs: Array.isArray(ev.data.shadowedSeqs) ? ev.data.shadowedSeqs : [],
              shadowedRange: ev.data.shadowedRange || null,
              shadowedTokenCount: Number(ev.data.shadowedTokenCount || 0),
            })
          }
          continue
        }
        var isSurf =
          ev.surfaceOp !== undefined &&
          (ev.type === 'system/message' ||
            ev.type === 'developer/message' ||
            ev.type === 'user/message' ||
            ev.type === 'assistant/message' ||
            ev.type === 'tool/result')
        var expT = ev.data && typeof ev.data.turn === 'number' ? ev.data.turn : curTurn
        if (expT === 0 && Array.isArray(ev.sourceEventSeqs)) {
          for (var s = 0; s < ev.sourceEventSeqs.length; s++) {
            var mT = seqToTurn.get(ev.sourceEventSeqs[s])
            if (mT > 0) {
              expT = mT
              break
            }
          }
        }
        var isCheckpointEv =
          ev.type === 'user/message' &&
          ev.data &&
          (String((ev.data.source && (ev.data.source.kind || ev.data.source.plugin)) || '') === 'compact-checkpoint' ||
            (ev.surfaceOp && ev.surfaceOp.op === 'replace'))
        if (typeof ev.seq === 'number' && expT > 0 && isSurf && !isCheckpointEv) {
          seqToTurn.set(ev.seq, expT)
        }

        if (ev.type === 'user/message' && ev.data) {
          var uMsg = ev.data
          var sKind = String((uMsg.source && (uMsg.source.kind || uMsg.source.plugin)) || '')
          var uText = ''
          if (Array.isArray(uMsg.content)) {
            for (var ub = 0; ub < uMsg.content.length; ub++) {
              if (uMsg.content[ub] && uMsg.content[ub].type === 'text' && uMsg.content[ub].text) {
                uText += uMsg.content[ub].text + '\n'
              }
            }
          }
          uText = uText.trim()
          var isRegularUser =
            sKind !== 'compact-checkpoint' &&
            sKind !== 'agent-instructions' &&
            sKind !== 'skill-catalog' &&
            sKind !== 'runtime-context' &&
            sKind !== 'time-context' &&
            sKind !== 'plan-mode' &&
            uText.indexOf('<compacted-summary>') === -1 &&
            (sKind === 'user' ||
              (uText.indexOf('Current runtime context.') !== 0 &&
                uText.indexOf('<system-reminder>') !== 0))
          if (isRegularUser && expT > 0) {
            var lt = ensureLocalTurn(expT)
            var uTok = Math.ceil(uText.length / 4) + 4
            if (lt) {
              if (!lt.userPreview) lt.userPreview = uText.replace(/\s+/g, ' ').slice(0, 96)
              lt.tokenCount += uTok
              lt.messages.push({
                id: uMsg.id,
                seq: ev.seq,
                turn: expT,
                step: 1,
                role: 'user',
                kind: 'user',
                preview: uText.replace(/\s+/g, ' ').slice(0, 96),
                tokens: uTok,
                chars: uText.length,
              })
            }
          }
        } else if (ev.type === 'assistant/message' && ev.data && ev.data.message && expT > 0) {
          var aMsg = ev.data.message
          var aStep = Number(ev.data.step || 1)
          var aText = ''
          if (Array.isArray(aMsg.content)) {
            for (var ab = 0; ab < aMsg.content.length; ab++) {
              if (aMsg.content[ab] && aMsg.content[ab].type === 'text' && aMsg.content[ab].text) {
                aText += aMsg.content[ab].text + '\n'
              }
            }
          }
          aText = aText.trim()
          var aTok = Math.ceil(JSON.stringify(aMsg.content || []).length / 4) + 4
          var lt2 = ensureLocalTurn(expT)
          if (lt2) {
            if (aText) lt2.assistantPreview = aText.replace(/\s+/g, ' ').slice(0, 96)
            lt2.tokenCount += aTok
            lt2.messages.push({
              id: aMsg.id,
              seq: ev.seq,
              turn: expT,
              step: aStep,
              role: 'assistant',
              kind: aText ? 'assistant' : 'assistant-tool',
              preview: aText ? aText.replace(/\s+/g, ' ').slice(0, 96) : '(过程调用)',
              tokens: aTok,
              chars: aText.length,
            })
          }
        } else if (ev.type === 'tool/result' && ev.data && ev.data.message && expT > 0) {
          var tMsg = ev.data.message
          var tTok = Math.ceil(JSON.stringify(tMsg.content || []).length / 4) + 4
          var lt3 = ensureLocalTurn(expT)
          if (lt3) lt3.tokenCount += tTok
        }

        var isSurf =
          ev.surfaceOp !== undefined &&
          (ev.type === 'system/message' ||
            ev.type === 'developer/message' ||
            ev.type === 'user/message' ||
            ev.type === 'assistant/message' ||
            ev.type === 'tool/result')
        if (!isSurf) continue
        if (ev.surfaceOp === 'append') {
          foldNodes.push(ev)
        } else if (ev.surfaceOp && ev.surfaceOp.op === 'replace') {
          var sIdx = findIdx(ev.surfaceOp.startSeq)
          var eIdx = findIdx(ev.surfaceOp.endSeq)
          if (sIdx !== -1 && eIdx !== -1 && sIdx <= eIdx) {
            foldNodes.splice(sIdx, eIdx - sIdx + 1, ev)
          } else {
            foldNodes.push(ev)
          }
        }
      }

      var surfaceSeqSet = new Set()
      for (var f = 0; f < foldNodes.length; f++) {
        if (typeof foldNodes[f].seq === 'number') surfaceSeqSet.add(foldNodes[f].seq)
      }

      var excludedMsgIds = (data.state && data.state.excludedMessageIds) || []
      var clientCheckpoints = []
      for (var eIdx2 = 0; eIdx2 < events.length; eIdx2++) {
        var cev = events[eIdx2]
        if (cev.type !== 'user/message' || !cev.data) continue
        var cMsg = cev.data
        var cKind = String((cMsg.source && (cMsg.source.kind || cMsg.source.plugin)) || '')
        var cRaw = ''
        if (Array.isArray(cMsg.content)) {
          for (var cb2 = 0; cb2 < cMsg.content.length; cb2++) {
            if (cMsg.content[cb2] && cMsg.content[cb2].text) cRaw += cMsg.content[cb2].text + '\n'
          }
        }
        if (cKind !== 'compact-checkpoint' && cRaw.indexOf('<compacted-summary>') === -1) continue
        var compId = String((cMsg.source && cMsg.source.compactionId) || cMsg.id || '')
        var sInfo = summaryById.get(compId)
        var covSet = new Set()
        if (sInfo && Array.isArray(sInfo.shadowedSeqs) && sInfo.shadowedSeqs.length > 0) {
          for (var ss = 0; ss < sInfo.shadowedSeqs.length; ss++) {
            var st = seqToTurn.get(sInfo.shadowedSeqs[ss])
            if (st > 0) covSet.add(st)
          }
        }
        if (covSet.size === 0 && cev.surfaceOp && cev.surfaceOp.op === 'replace') {
          for (var rSeq = cev.surfaceOp.startSeq; rSeq <= cev.surfaceOp.endSeq; rSeq++) {
            var rt = seqToTurn.get(rSeq)
            if (rt > 0) covSet.add(rt)
          }
        }
        if (covSet.size === 0 && Array.isArray(cev.sourceEventSeqs)) {
          for (var ss2 = 0; ss2 < cev.sourceEventSeqs.length; ss2++) {
            var st2 = seqToTurn.get(cev.sourceEventSeqs[ss2])
            if (st2 > 0) covSet.add(st2)
          }
        }
        var covTurns = Array.from(covSet)
          .filter(function (tVal) {
            var exTurnObj = existingTurnMap.get(tVal)
            if (exTurnObj && exTurnObj.compacted === false && !exTurnObj.wasCompacted && !exTurnObj.restored) {
              var localT = allTurnsData.get(tVal)
              if (localT && Array.isArray(localT.messages) && localT.messages.length > 0) {
                var anyStillOnSurface = localT.messages.some(function (m) {
                  return surfaceSeqSet.has(m.seq)
                })
                if (anyStillOnSurface) return false
              }
            }
            return true
          })
          .sort(function (a, b) {
            return a - b
          })
        var afterTurn = covTurns.length > 0 ? covTurns[covTurns.length - 1] : seqToTurn.get(cev.seq) || 0
        var cleanSum = cRaw
          .replace(/^[\s\S]*?<compacted-summary>\s*/i, '')
          .replace(/\s*<\/compacted-summary>[\s\S]*$/i, '')
          .trim()
        var cpTok = Math.ceil(cRaw.length / 4) + 4
        var cpInc = surfaceSeqSet.has(cev.seq) && excludedMsgIds.indexOf(cMsg.id) === -1
        clientCheckpoints.push({
          id: cMsg.id,
          compactionId: compId,
          seq: cev.seq,
          turn: afterTurn,
          afterTurn: afterTurn,
          onSurface: surfaceSeqSet.has(cev.seq),
          included: cpInc,
          coveredTurns: covTurns,
          shadowedTokenCount: (sInfo && sInfo.shadowedTokenCount) || 0,
          tokens: cpTok,
          chars: cRaw.length,
          preview: (cleanSum || cRaw).replace(/\s+/g, ' ').slice(0, 120),
          fullText: cleanSum || cRaw,
        })
      }
      if (clientCheckpoints.length === 0 && Array.isArray(data.checkpoints) && data.checkpoints.length > 0) {
        clientCheckpoints = data.checkpoints.map(function (cpItem) {
          var cpInc2 = cpItem.onSurface !== false && excludedMsgIds.indexOf(cpItem.id) === -1
          return Object.assign({}, cpItem, {
            included: cpInc2,
            afterTurn:
              cpItem.afterTurn ||
              (Array.isArray(cpItem.coveredTurns) && cpItem.coveredTurns.length > 0
                ? cpItem.coveredTurns[cpItem.coveredTurns.length - 1]
                : cpItem.turn || 0),
          })
        })
      }

      var compactedTurnsMap = new Map()
      for (var cpi = 0; cpi < clientCheckpoints.length; cpi++) {
        var cpObj = clientCheckpoints[cpi]
        var cTurns = cpObj.coveredTurns || []
        for (var cti = 0; cti < cTurns.length; cti++) {
          compactedTurnsMap.set(cTurns[cti], cpObj)
        }
      }

      var excludedTurnsArr = (data.state && data.state.excludedTurns) || []
      var serverRestoredArr = (data.state && data.state.restoredTurns) || []
      var localRestoredArr = readLocalRestoredTurns(sessionId)
      var restoredTurnsArr = serverRestoredArr.length > 0 ? serverRestoredArr : localRestoredArr
      var excludedCallIdsArr = (data.state && data.state.excludedCallIds) || []
      var mergedTurnsMap = new Map()
      for (var et = 0; et < existingTurns.length; et++) {
        var exRow = existingTurns[et]
        var ownerCp = compactedTurnsMap.get(exRow.turn) || null
        var wasComp = Boolean(exRow.wasCompacted || exRow.compacted || ownerCp)
        var cpUnchecked = Boolean(ownerCp && !ownerCp.included)
        var isExplicitlyExcluded = excludedTurnsArr.indexOf(exRow.turn) !== -1
        var isRestored =
          wasComp &&
          !isExplicitlyExcluded &&
          (Boolean(exRow.restored) || restoredTurnsArr.indexOf(exRow.turn) !== -1 || cpUnchecked)
        var isComp = wasComp && !isRestored
        var turnNotExcl = !isComp && !isExplicitlyExcluded
        var rowMsgs = Array.isArray(exRow.messages) ? exRow.messages : []
        var rowCalls = Array.isArray(exRow.calls) ? exRow.calls : []
        var fixedCalls = rowCalls.map(function (c) {
          var cComp = isComp || (!isRestored && c.onSurface === false)
          var tMsgExcl = c.toolMessageId ? excludedMsgIds.indexOf(c.toolMessageId) !== -1 : false
          var cExcl = excludedCallIdsArr.indexOf(c.callId) !== -1 || tMsgExcl
          return Object.assign({}, c, {
            compacted: cComp,
            restored: isRestored,
            included: !cComp && turnNotExcl && !cExcl,
            individuallyExcluded: cExcl,
          })
        })
        var asstMsgs = rowMsgs.filter(function (m) {
          return m.role === 'assistant'
        })
        var replyMsgIds = Array.isArray(exRow.replyIds) && exRow.replyIds.length > 0
          ? exRow.replyIds
          : asstMsgs.length > 0
            ? [asstMsgs[asstMsgs.length - 1].id]
            : []
        var computedReplyInc =
          turnNotExcl &&
          (replyMsgIds.length === 0
            ? false
            : replyMsgIds.some(function (id) {
                return excludedMsgIds.indexOf(id) === -1
              }))
        var computedToolsInc =
          turnNotExcl &&
          fixedCalls.some(function (c) {
            return c.included
          })
        var computedAllToolsInc =
          turnNotExcl &&
          fixedCalls.length > 0 &&
          fixedCalls.every(function (c) {
            return c.included
          })
        var outIds = Array.isArray(exRow.outgoingIds) ? exRow.outgoingIds : []
        var computedOutInc = isComp
          ? false
          : turnNotExcl &&
            (outIds.length === 0
              ? true
              : outIds.some(function (id) {
                  return excludedMsgIds.indexOf(id) === -1
                }))
        var fixedMsgs = rowMsgs.map(function (m) {
          var mComp = isComp || (!isRestored && m.onSurface === false)
          var mExcl = excludedMsgIds.indexOf(m.id) !== -1
          return Object.assign({}, m, {
            compacted: mComp,
            restored: isRestored,
            included: !mComp && turnNotExcl && !mExcl,
          })
        })
        var computedTurnInc = turnNotExcl && (computedOutInc || computedReplyInc || computedToolsInc)
        var hasOut2 = outIds.length > 0
        var hasRep2 = replyMsgIds.length > 0
        var hasTls2 = fixedCalls.length > 0
        var allPartsInc2 =
          computedTurnInc &&
          (!hasOut2 || computedOutInc) &&
          (!hasRep2 || computedReplyInc) &&
          (!hasTls2 || computedAllToolsInc)
        var computedPartial2 = computedTurnInc && !allPartsInc2
        mergedTurnsMap.set(
          exRow.turn,
          Object.assign({}, exRow, {
            compacted: isComp,
            wasCompacted: wasComp,
            restored: isRestored,
            compactedById: exRow.compactedById || (ownerCp && (ownerCp.compactionId || ownerCp.id)) || null,
            messages: fixedMsgs,
            calls: fixedCalls,
            replyIds: replyMsgIds,
            replyIncluded: isComp ? false : computedReplyInc,
            toolsIncluded: isComp ? false : computedToolsInc,
            allToolsIncluded: isComp ? false : computedAllToolsInc,
            partialIncluded: isComp ? false : computedPartial2,
            included: isComp ? false : computedTurnInc,
            outgoingIncluded: computedOutInc,
            incomingIncluded: isComp ? false : computedReplyInc,
          }),
        )
      }

      allTurnsData.forEach(function (localRow, tNum) {
        if (!mergedTurnsMap.has(tNum)) {
          var ownerCp2 = compactedTurnsMap.get(tNum) || null
          if (!ownerCp2) return
          var cpUnchecked2 = Boolean(ownerCp2 && !ownerCp2.included)
          var isExpExcl2 = excludedTurnsArr.indexOf(tNum) !== -1
          var isRest2 = !isExpExcl2 && (restoredTurnsArr.indexOf(tNum) !== -1 || cpUnchecked2)
          var isComp2 = !isRest2
          var turnInc2 = isRest2 && !isExpExcl2
          mergedTurnsMap.set(tNum, {
            turn: tNum,
            status: localRow.status,
            compacted: isComp2,
            wasCompacted: true,
            restored: isRest2,
            compactedById: (ownerCp2 && (ownerCp2.compactionId || ownerCp2.id)) || 'compacted',
            included: turnInc2,
            outgoingIncluded: turnInc2,
            replyIncluded: turnInc2,
            incomingIncluded: turnInc2,
            outgoingIds: localRow.messages
              .filter(function (m) {
                return m.role === 'user'
              })
              .map(function (m) {
                return m.id
              }),
            incomingIds: localRow.messages
              .filter(function (m) {
                return m.role !== 'user'
              })
              .map(function (m) {
                return m.id
              }),
            incomingCallIds: [],
            userPreview: localRow.userPreview || '(第 ' + tNum + ' 轮提问)',
            assistantPreview: localRow.assistantPreview || '',
            tokenCount: localRow.tokenCount,
            charCount: localRow.charCount,
            savedTokens: 0,
            messages: localRow.messages.map(function (m) {
              return Object.assign({}, m, { compacted: isComp2, restored: isRest2, included: turnInc2 })
            }),
            calls: [],
          })
        }
      })

      var finalTurns = Array.from(mergedTurnsMap.values()).sort(function (a, b) {
        return a.turn - b.turn
      })

      var nextTokenStats = data.tokenStats ? Object.assign({}, data.tokenStats) : null
      if (nextTokenStats) {
        var deltaTokens = 0
        var activeIncludedTokens = 0
        for (var ftIdx = 0; ftIdx < finalTurns.length; ftIdx++) {
          var ft = finalTurns[ftIdx]
          if (ft.included) {
            activeIncludedTokens += Math.max(0, (ft.tokenCount || 0) - (ft.savedTokens || 0))
          }
          if (ft.wasCompacted) {
            if (ft.included) {
              deltaTokens -= ft.tokenCount || 0
            }
          } else {
            if (!ft.included) {
              deltaTokens += ft.tokenCount || 0
            } else {
              deltaTokens += ft.savedTokens || 0
            }
          }
        }
        for (var cpIdx2 = 0; cpIdx2 < clientCheckpoints.length; cpIdx2++) {
          var cpItem2 = clientCheckpoints[cpIdx2]
          if (cpItem2.included) {
            activeIncludedTokens += cpItem2.tokens || 0
          }
          if (cpItem2.onSurface && !cpItem2.included) {
            deltaTokens += cpItem2.tokens || 0
          }
        }
        nextTokenStats.savedTokens = deltaTokens
        var rawP = nextTokenStats.rawPressure
        var rawB = nextTokenStats.rawBreakdown
        var sysTok = rawB && typeof rawB === 'object' ? rawB.systemTokens || 0 : 0
        var toolsTok = rawB && typeof rawB === 'object' ? rawB.toolsTokens || 0 : 0
        var rawMsgTok = rawB && typeof rawB === 'object' ? rawB.messageTokens || 0 : 0
        var effMsgTok = Math.max(activeIncludedTokens, Math.max(0, rawMsgTok - deltaTokens))
        if (rawB && typeof rawB === 'object') {
          nextTokenStats.adjustedBreakdown = {
            systemTokens: sysTok,
            toolsTokens: toolsTok,
            messageTokens: effMsgTok,
          }
        }
        if (rawP && typeof rawP === 'object') {
          var baseUsed = rawP.projectedTokens || rawP.pressureTokens || 0
          var sysTools = sysTok + toolsTok
          var rawTotalH = sysTools + rawMsgTok
          var sumBreakdownNow = sysTools + effMsgTok
          var nextUsed = sumBreakdownNow
          if (baseUsed > 0 && rawTotalH > 0 && baseUsed >= rawTotalH * 0.5) {
            var scale = baseUsed / rawTotalH
            nextUsed = Math.max(Math.round(sysTools * scale), Math.round(baseUsed - deltaTokens * scale))
          }
          if (nextUsed < sumBreakdownNow * 0.6) {
            nextUsed = sumBreakdownNow
          }
          nextTokenStats.adjustedPressure = Object.assign({}, rawP, {
            contextWindow: rawP.contextWindow || 1000000,
            pressureTokens: nextUsed,
            projectedTokens: nextUsed,
          })
        }
      }

      return Object.assign({}, data, {
        turns: finalTurns,
        checkpoints: clientCheckpoints,
        tokenStats: nextTokenStats || data.tokenStats,
      })
    }

    SessionContextController.prototype.applyPayload = function (rawData) {
      if (!rawData || rawData.ok !== true) return
      var self = this
      var localSys = readLocalSysOverride(this.sessionId, this.getSessionsService)
      var serverPreset = rawData.state && rawData.state.systemPresetOverride
      if (localSys && localSys.systemPresetOverride && !serverPreset && !this.__syncedLocalPreset) {
        this.__syncedLocalPreset = true
        fetch('/api/context-selector/toggle', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            sessionId: self.sessionId,
            action: 'set-system-override',
            systemPresetOverride: localSys.systemPresetOverride,
            customSystemPrompt: localSys.customSystemPrompt || '',
            customSystemMode: localSys.customSystemMode || 'append',
          }),
        }).catch(function () {})
      }
      if (localSys && rawData.state) {
        if (rawData.state.systemPresetOverride === undefined) {
          rawData.state.systemPresetOverride = localSys.systemPresetOverride || null
        }
        if (rawData.state.customSystemPrompt === undefined) {
          rawData.state.customSystemPrompt = localSys.customSystemPrompt || ''
        }
        if (rawData.state.customSystemMode === undefined) {
          rawData.state.customSystemMode = localSys.customSystemMode || 'append'
        }
        if (!Array.isArray(rawData.state.excludedSystemOrders)) {
          rawData.state.excludedSystemOrders = Array.isArray(localSys.excludedSystemOrders)
            ? localSys.excludedSystemOrders
            : []
        }
      }
      var data = enrichPayloadWithClientEvents(this.getSessionsService, this.sessionId, rawData)
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
      var mergedState = Object.assign({}, this.snapshot.state, data.state || {})
      if (localSys) {
        if (localSys.updatedAt && (!mergedState.sysUpdatedAt || localSys.updatedAt >= mergedState.sysUpdatedAt)) {
          mergedState.systemPresetOverride = localSys.systemPresetOverride || null
          mergedState.customSystemPrompt = localSys.customSystemPrompt || ''
          mergedState.customSystemMode = localSys.customSystemMode || 'append'
          mergedState.excludedSystemOrders = Array.isArray(localSys.excludedSystemOrders)
            ? localSys.excludedSystemOrders
            : []
          mergedState.sysUpdatedAt = localSys.updatedAt
        }
      }
      if (mergedState.systemPresetOverride) {
        syncSessionPresetBadge(this.getSessionsService, this.sessionId, mergedState.systemPresetOverride)
      }
      this.snapshot = {
        loaded: true,
        drawerOpen: this.snapshot.drawerOpen,
        activePreset: data.activePreset || this.snapshot.activePreset || null,
        availablePresets: Array.isArray(data.availablePresets)
          ? data.availablePresets
          : this.snapshot.availablePresets || [],
        state: mergedState,
        turns: turns,
        checkpoints: Array.isArray(data.checkpoints) ? data.checkpoints : [],
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
      if (payload && payload.action === 'uncompact-checkpoint') {
        var cpId = String(payload.checkpointId || '')
        var restoreRaw = payload.restoreRaw !== false
        var curSnap0 = this.snapshot
        var cps0 = (curSnap0 && Array.isArray(curSnap0.checkpoints) && curSnap0.checkpoints) || []
        var targetCps = cpId
          ? cps0.filter(function (c) {
              return c.id === cpId || c.compactionId === cpId
            })
          : cps0
        var curRestored = readLocalRestoredTurns(this.sessionId)
        var restSet = new Set(curRestored)
        var curExclMsgs0 =
          curSnap0 && curSnap0.state && Array.isArray(curSnap0.state.excludedMessageIds)
            ? curSnap0.state.excludedMessageIds.slice()
            : []
        var curExclTurns0 =
          curSnap0 && curSnap0.state && Array.isArray(curSnap0.state.excludedTurns)
            ? curSnap0.state.excludedTurns.slice()
            : []
        var covTurnsToUnexclude = []
        for (var ci0 = 0; ci0 < targetCps.length; ci0++) {
          var cpObj0 = targetCps[ci0]
          var covArr0 = cpObj0.coveredTurns || []
          if (restoreRaw) {
            if (curExclMsgs0.indexOf(cpObj0.id) === -1) curExclMsgs0.push(cpObj0.id)
            for (var ct0 = 0; ct0 < covArr0.length; ct0++) {
              var tNum0 = covArr0[ct0]
              restSet.add(tNum0)
              covTurnsToUnexclude.push(tNum0)
              var exIdx = curExclTurns0.indexOf(tNum0)
              if (exIdx !== -1) curExclTurns0.splice(exIdx, 1)
            }
          } else {
            var mIdx0 = curExclMsgs0.indexOf(cpObj0.id)
            if (mIdx0 !== -1) curExclMsgs0.splice(mIdx0, 1)
            for (var ct1 = 0; ct1 < covArr0.length; ct1++) {
              restSet.delete(covArr0[ct1])
            }
          }
        }
        var nextRestArr = Array.from(restSet).sort(function (a, b) {
          return a - b
        })
        writeLocalRestoredTurns(this.sessionId, nextRestArr)
        if (curSnap0) {
          var fakeRaw = {
            ok: true,
            sessionId: this.sessionId,
            activePreset: curSnap0.activePreset,
            availablePresets: curSnap0.availablePresets,
            turns: curSnap0.turns,
            checkpoints: cps0.map(function (c) {
              var isTarget = targetCps.some(function (tc) {
                return tc.id === c.id
              })
              return isTarget ? Object.assign({}, c, { included: !restoreRaw }) : c
            }),
            state: Object.assign({}, curSnap0.state, {
              excludedTurns: curExclTurns0,
              restoredTurns: nextRestArr,
              excludedMessageIds: curExclMsgs0,
            }),
            tokenStats: curSnap0.tokenStats,
          }
          this.applyPayload(fakeRaw)
        }
        var targetCpId = targetCps[0] ? targetCps[0].id : cpId
        if (!targetCpId) return Promise.resolve()
        return fetch('/api/context-selector/toggle', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            sessionId: this.sessionId,
            action: 'toggle-message',
            messageId: targetCpId,
            included: !restoreRaw,
          }),
        })
          .then(function (res) {
            return res && res.ok ? res.json() : null
          })
          .then(function (data) {
            if (!self.disposed && data) self.applyPayload(data)
          })
          .catch(function () {})
      }
      if (payload && payload.action === 'toggle-turn' && Number.isInteger(payload.turn)) {
        var tNumToggle = payload.turn
        var tRowToggle = this.snapshot && this.snapshot.turnMap ? this.snapshot.turnMap.get(tNumToggle) : null
        var shouldIncToggle =
          typeof payload.included === 'boolean' ? payload.included : !(tRowToggle && tRowToggle.included)
        var localRest = new Set(readLocalRestoredTurns(this.sessionId))
        if (shouldIncToggle && tRowToggle && (tRowToggle.wasCompacted || tRowToggle.compacted || tRowToggle.restored)) {
          localRest.add(tNumToggle)
          writeLocalRestoredTurns(this.sessionId, Array.from(localRest))
        } else if (!shouldIncToggle && localRest.has(tNumToggle)) {
          localRest.delete(tNumToggle)
          writeLocalRestoredTurns(this.sessionId, Array.from(localRest))
        }
      }
      if (payload && payload.action === 'exclude-before-turn' && Number.isInteger(payload.turn)) {
        var cutTurn = payload.turn
        var curSnap = this.snapshot
        if (curSnap && Array.isArray(curSnap.turns)) {
          var nextExclTurns = []
          var nextRestTurns = []
          var keepMsgIds = []
          var keepCallIds = []
          for (var ti = 0; ti < curSnap.turns.length; ti++) {
            var trItem = curSnap.turns[ti]
            if (trItem.turn < cutTurn) {
              nextExclTurns.push(trItem.turn)
            } else {
              if (trItem.wasCompacted || trItem.compacted || trItem.restored) {
                nextRestTurns.push(trItem.turn)
              }
              var ms = trItem.messages || []
              for (var mi = 0; mi < ms.length; mi++) keepMsgIds.push(ms[mi].id)
              var cs = trItem.calls || []
              for (var ci2 = 0; ci2 < cs.length; ci2++) keepCallIds.push(cs[ci2].callId)
            }
          }
          var curExclMsgs = (curSnap.state && curSnap.state.excludedMessageIds) ? curSnap.state.excludedMessageIds.slice() : []
          var cps = Array.isArray(curSnap.checkpoints) ? curSnap.checkpoints : []
          for (var cpi2 = 0; cpi2 < cps.length; cpi2++) {
            var cp0 = cps[cpi2]
            var cov0 = cp0.coveredTurns || []
            if (cov0.some(function (t0) { return t0 < cutTurn })) {
              if (curExclMsgs.indexOf(cp0.id) === -1) curExclMsgs.push(cp0.id)
            }
          }
          curExclMsgs = curExclMsgs.filter(function (id) {
            return keepMsgIds.indexOf(id) === -1
          })
          var curExclCalls = ((curSnap.state && curSnap.state.excludedCallIds) || []).filter(function (cid) {
            return keepCallIds.indexOf(cid) === -1
          })
          this.snapshot = Object.assign({}, curSnap, {
            state: Object.assign({}, curSnap.state, {
              excludedTurns: nextExclTurns,
              restoredTurns: nextRestTurns,
              excludedMessageIds: curExclMsgs,
              excludedCallIds: curExclCalls,
            }),
          })
          writeLocalRestoredTurns(this.sessionId, nextRestTurns)
        }
      }
      if (payload && payload.action === 'toggle-outgoing' && Number.isInteger(payload.turn)) {
        var tRowOut = this.snapshot && this.snapshot.turnMap ? this.snapshot.turnMap.get(payload.turn) : null
        if (tRowOut && Array.isArray(tRowOut.outgoingIds) && tRowOut.outgoingIds.length > 0) {
          payload = {
            action: 'toggle-batch',
            turn: payload.turn,
            messageIds: tRowOut.outgoingIds,
            callIds: [],
            included: Boolean(payload.included),
          }
        }
      }
      if (payload && payload.action === 'toggle-reply' && Number.isInteger(payload.turn)) {
        var tRow = this.snapshot && this.snapshot.turnMap ? this.snapshot.turnMap.get(payload.turn) : null
        if (tRow) {
          var rIds = Array.isArray(tRow.replyIds) && tRow.replyIds.length > 0
            ? tRow.replyIds
            : (tRow.messages || [])
                .filter(function (m) {
                  return m.role === 'assistant'
                })
                .slice(-1)
                .map(function (m) {
                  return m.id
                })
          if (rIds.length > 0) {
            payload = {
              action: 'toggle-batch',
              turn: payload.turn,
              messageIds: rIds,
              callIds: [],
              included: Boolean(payload.included),
            }
          }
        }
      }
      if (
        payload &&
        this.snapshot &&
        this.snapshot.state &&
        payload.included === true &&
        (payload.action === 'toggle-call' || payload.action === 'toggle-batch' || payload.action === 'toggle-message')
      ) {
        var targetTurn = Number(payload.turn || 0)
        if (!targetTurn) {
          if (payload.action === 'toggle-call' && payload.callId && this.snapshot.callMap) {
            var cInfo = this.snapshot.callMap.get(payload.callId)
            if (cInfo && cInfo.turn) targetTurn = cInfo.turn
          } else if (payload.action === 'toggle-message' && payload.messageId && this.snapshot.msgMap) {
            var mInfo = this.snapshot.msgMap.get(payload.messageId)
            if (mInfo && mInfo.turn) targetTurn = mInfo.turn
          } else if (payload.action === 'toggle-batch') {
            var firstCid = Array.isArray(payload.callIds) && payload.callIds[0]
            var firstMid = Array.isArray(payload.messageIds) && payload.messageIds[0]
            if (firstCid && this.snapshot.callMap && this.snapshot.callMap.get(firstCid)) {
              targetTurn = this.snapshot.callMap.get(firstCid).turn || 0
            } else if (firstMid && this.snapshot.msgMap && this.snapshot.msgMap.get(firstMid)) {
              targetTurn = this.snapshot.msgMap.get(firstMid).turn || 0
            }
          }
        }
        var trObj = targetTurn > 0 && this.snapshot.turnMap ? this.snapshot.turnMap.get(targetTurn) : null
        var isTargetExcludedOrCompacted =
          targetTurn > 0 &&
          ((Array.isArray(this.snapshot.state.excludedTurns) &&
            this.snapshot.state.excludedTurns.indexOf(targetTurn) !== -1) ||
            Boolean(trObj && trObj.compacted))
        if (isTargetExcludedOrCompacted && trObj) {
          if (trObj.wasCompacted || trObj.compacted) {
            var localRestSet = new Set(readLocalRestoredTurns(this.sessionId))
            localRestSet.add(targetTurn)
            writeLocalRestoredTurns(this.sessionId, Array.from(localRestSet))
          }
          var allMIds = (trObj.messages || [])
            .filter(function (m) {
              return m.role !== 'tool'
            })
            .map(function (m) {
              return m.id
            })
          var allCIds = (trObj.calls || []).map(function (c) {
            return c.callId
          })
          var origPayload = Object.assign({}, payload)
          return fetch('/api/context-selector/toggle', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              sessionId: this.sessionId,
              action: 'toggle-turn',
              turn: targetTurn,
              included: true,
            }),
          })
            .then(function () {
              return fetch('/api/context-selector/toggle', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                  sessionId: self.sessionId,
                  action: 'toggle-batch',
                  messageIds: allMIds,
                  callIds: allCIds,
                  included: false,
                }),
              })
            })
            .then(function () {
              return fetch('/api/context-selector/toggle', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(Object.assign({ sessionId: self.sessionId }, origPayload)),
              })
            })
            .then(function (res) {
              return res && res.ok ? res.json() : null
            })
            .then(function (data) {
              if (!self.disposed && data) self.applyPayload(data)
            })
            .catch(function () {})
        }
      }
      if (payload && (payload.action === 'set-system-override' || payload.action === 'toggle-system-section')) {
        var curSt = Object.assign({}, this.snapshot.state)
        var prevLocal = readLocalSysOverride(this.sessionId) || {}
        var nextLocal = {
          systemPresetOverride:
            payload.systemPresetOverride !== undefined
              ? payload.systemPresetOverride
              : curSt.systemPresetOverride !== undefined
                ? curSt.systemPresetOverride
                : prevLocal.systemPresetOverride || null,
          customSystemPrompt:
            payload.customSystemPrompt !== undefined
              ? payload.customSystemPrompt
              : curSt.customSystemPrompt !== undefined
                ? curSt.customSystemPrompt
                : prevLocal.customSystemPrompt || '',
          customSystemMode:
            payload.customSystemMode !== undefined
              ? payload.customSystemMode
              : curSt.customSystemMode || prevLocal.customSystemMode || 'append',
          excludedSystemOrders: Array.isArray(curSt.excludedSystemOrders)
            ? curSt.excludedSystemOrders.slice()
            : Array.isArray(prevLocal.excludedSystemOrders)
              ? prevLocal.excludedSystemOrders.slice()
              : [],
          appliedPresetId: prevLocal.appliedPresetId || null,
          appliedPromptHash: prevLocal.appliedPromptHash || '',
          updatedAt: Date.now(),
        }
        if (payload.resetExcludedOrders) {
          nextLocal.excludedSystemOrders = []
        }
        if (payload.action === 'toggle-system-section' && Number.isInteger(payload.order)) {
          var ord = payload.order
          var idxOrd = nextLocal.excludedSystemOrders.indexOf(ord)
          if (payload.included) {
            if (idxOrd !== -1) nextLocal.excludedSystemOrders.splice(idxOrd, 1)
          } else {
            if (idxOrd === -1) nextLocal.excludedSystemOrders.push(ord)
          }
        }
        writeLocalSysOverride(this.sessionId, nextLocal)
        if (nextLocal.systemPresetOverride) {
          syncSessionPresetBadge(this.getSessionsService, this.sessionId, nextLocal.systemPresetOverride)
        }
        this.snapshot = Object.assign({}, this.snapshot, {
          state: Object.assign({}, curSt, {
            systemPresetOverride: nextLocal.systemPresetOverride,
            customSystemPrompt: nextLocal.customSystemPrompt,
            customSystemMode: nextLocal.customSystemMode,
            excludedSystemOrders: nextLocal.excludedSystemOrders,
            sysUpdatedAt: nextLocal.updatedAt,
          }),
        })
        this.emit()
      }
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

    SessionContextController.prototype.setDrawerOpen = function (open) {
      var next = Boolean(open)
      if (this.snapshot.drawerOpen === next) return
      this.snapshot = Object.assign({}, this.snapshot, {
        drawerOpen: next,
      })
      this.emit()
      if (next) {
        this.refresh()
      }
    }

    SessionContextController.prototype.toggleDrawer = function () {
      this.setDrawerOpen(!this.snapshot.drawerOpen)
    }

    SessionContextController.prototype.ensurePolling = function () {
      var self = this
      if (!this.snapshot.loaded) {
        this.refresh()
      }
      if (this.timer === null && !this.disposed) {
        this.timer = setInterval(function () {
          if (typeof document !== 'undefined' && document.hidden) return
          if (self.listeners.size > 0 && self.sessionId === activeSessionId) {
            self.refresh()
          }
        }, 5000)
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

    function isEarlierAllExcluded(snap, turnNum) {
      if (!(turnNum > 1)) return false
      var excludedSet = snap.state.excludedTurns || []
      for (var t = 1; t < turnNum; t++) {
        if (snap.turnMap.has(t) && excludedSet.indexOf(t) === -1) {
          return false
        }
      }
      return true
    }

    function syncInlineChatCheckboxes(controller) {
      if (typeof document === 'undefined' || !controller) return
      var snap = controller.getSnapshot()
      if (!snap.loaded) return

      /* Clean up any legacy v1.5 DOM elements */
      var legacySelectors = '.dsh-ctx-sel-turn-bar, .dsh-ctx-user-left-box, .dsh-ctx-user-left-check, .dsh-ctx-inline-user-pill'
      var oldEls = document.querySelectorAll(legacySelectors)
      for (var lb = 0; lb < oldEls.length; lb++) {
        if (oldEls[lb].parentNode) oldEls[lb].parentNode.removeChild(oldEls[lb])
      }

      /* 0. Helper: check whether a flow item actually rendered visible native content */
      var styleTag = document.querySelector('style[data-plugin-css="dsh-context-selector-styles"]')
      if (styleTag && styleTag.textContent !== CSS_TEXT) {
        styleTag.textContent = CSS_TEXT
      }
      var hasVisibleNativeContent = function (containerEl) {
        if (!containerEl) return false
        if (containerEl.hasAttribute && (containerEl.hasAttribute('hidden') || containerEl.getAttribute('aria-hidden') === 'true')) {
          return false
        }
        var checkSubtree = function (root) {
          if (!root) return false
          if (root.hasAttribute && (root.hasAttribute('hidden') || root.getAttribute('aria-hidden') === 'true' || root.getAttribute('role') === 'status')) {
            return false
          }
          if (root.tagName && /^(SVG|IMG|CANVAS|BUTTON|PRE|CODE|TABLE)$/i.test(root.tagName)) {
            return true
          }
          if (root.tagName === 'INPUT' && !(root.classList && root.classList.contains('dsh-ctx-sel-checkbox'))) {
            return true
          }
          var childNodes = root.childNodes || []
          for (var cIdx = 0; cIdx < childNodes.length; cIdx++) {
            var cn = childNodes[cIdx]
            if (cn.nodeType === 3) {
              if (String(cn.nodeValue || '').trim() !== '') return true
            } else if (cn.nodeType === 1) {
              if (
                cn.classList &&
                (cn.classList.contains('dsh-ctx-inline-wrap') ||
                  cn.classList.contains('dsh-ctx-inline-reply-pill') ||
                  cn.classList.contains('dsh-ctx-user-actions'))
              ) {
                continue
              }
              if (checkSubtree(cn)) return true
            }
          }
          return false
        }
        var slotEl = containerEl.querySelector(':scope > [data-slot="conversation.chat.node"]')
        if (slotEl) {
          return checkSubtree(slotEl)
        }
        return checkSubtree(containerEl)
      }

      /* 1. Every tool call row: [data-chat-call-id] (supports Shift+Click range toggle) */
      var callNodes = document.querySelectorAll('[data-chat-call-id]')
      for (var i = 0; i < callNodes.length; i++) {
        var callEl = callNodes[i]
        var callId = callEl.getAttribute('data-chat-call-id')
        if (!callId) continue
        if (!hasVisibleNativeContent(callEl)) {
          var staleCallWrap = callEl.querySelector(':scope > .dsh-ctx-inline-wrap')
          if (staleCallWrap && staleCallWrap.parentNode) staleCallWrap.parentNode.removeChild(staleCallWrap)
          continue
        }
        var callInfo = snap.callMap.get(callId)
        var parentTurn = Number(
          (callEl.closest('[data-chat-turn]') && callEl.closest('[data-chat-turn]').getAttribute('data-chat-turn')) ||
            (callInfo ? callInfo.turn : 0),
        )
        var isTurnExcl = (snap.state.excludedTurns || []).indexOf(parentTurn) !== -1
        var isCallExcl = (snap.state.excludedCallIds || []).indexOf(callId) !== -1
        var isCallCompacted = Boolean(callInfo && callInfo.compacted)
        var isCallPruned = Boolean(callInfo && callInfo.pruned)
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
          wrap.title = '勾选 = 携带；取消勾选 = 不发（按住 Shift 点击可连选）'
          var cb = document.createElement('input')
          cb.type = 'checkbox'
          cb.className = 'dsh-ctx-sel-checkbox'
          wrap.appendChild(cb)
          var badgeSpan = document.createElement('span')
          badgeSpan.className = 'dsh-ctx-call-meta-tag'
          wrap.appendChild(badgeSpan)
          guardCheckboxWrapperEvents(wrap)
          callEl.insertBefore(wrap, callEl.firstChild)
        }
        var inputEl = wrap.querySelector('input')
        var metaTagEl = wrap.querySelector('.dsh-ctx-call-meta-tag')
        if (metaTagEl) {
          var nextMetaClass = 'dsh-ctx-call-meta-tag'
          var nextMetaText = ''
          var nextWrapTitle = '勾选 = 携带；取消勾选 = 不发（按住 Shift 点击可连选）'
          if (isCallCompacted) {
            nextMetaClass = 'dsh-ctx-call-meta-tag dsh-ctx-compacted-tag'
            nextMetaText = '📦已归档'
            nextWrapTitle = '此条工具记录已被系统自动压缩进历史摘要中，原内容不再单独发送'
          } else if (isCallPruned) {
            nextMetaClass = 'dsh-ctx-call-meta-tag dsh-ctx-pruned-tag'
            nextMetaText = '✂️已裁剪'
            nextWrapTitle = '此条超长工具输出已被系统自动裁剪中间段（保留首尾），点击可彻底排除'
          }
          if (metaTagEl.className !== nextMetaClass) metaTagEl.className = nextMetaClass
          if (metaTagEl.textContent !== nextMetaText) metaTagEl.textContent = nextMetaText
          if (wrap.title !== nextWrapTitle) wrap.title = nextWrapTitle
        }
        if (inputEl) {
          inputEl.disabled = false
          inputEl.__ctxController = controller
          inputEl.__ctxCallId = callId
          inputEl.__ctxRowEl = callEl
          inputEl.onclick = function (e) {
            e.stopPropagation()
            if (this.disabled) return
            var ctrl = this.__ctxController
            var cid = this.__ctxCallId
            var checked = this.checked
            if (!ctrl || !cid) return
            if (e.shiftKey && ctrl.lastClickedCallId && ctrl.lastClickedCallId !== cid) {
              var allDomCalls = document.querySelectorAll('[data-chat-call-id]')
              var ids = []
              var inRange = false
              for (var idx = 0; idx < allDomCalls.length; idx++) {
                var cur = allDomCalls[idx].getAttribute('data-chat-call-id')
                if (cur === ctrl.lastClickedCallId || cur === cid) {
                  ids.push(cur)
                  inRange = !inRange
                  if (!inRange) break
                } else if (inRange && cur) {
                  ids.push(cur)
                }
              }
              if (ids.length > 1) {
                ctrl.lastClickedCallId = cid
                ctrl.sendAction({
                  action: 'toggle-batch',
                  callIds: ids,
                  included: checked,
                })
                return
              }
            }
            ctrl.lastClickedCallId = cid
            if (this.__ctxRowEl) this.__ctxRowEl.classList.toggle('dsh-ctx-row-excluded', !checked)
            ctrl.sendAction({
              action: 'toggle-call',
              callId: cid,
              included: checked,
            })
          }
          if (inputEl.checked !== isIncluded) {
            inputEl.checked = isIncluded
          }
        }
        callEl.classList.toggle('dsh-ctx-row-excluded', !isIncluded && !isCallCompacted)
      }

      /* 2. Every user message row: sleek ghost icon buttons integrated into the native [data-clock="start"] action bar */
      var userNodes = document.querySelectorAll(
        '[data-chat-flow-kind="user"][data-chat-node-key], [data-chat-flow-kind="steering"][data-chat-node-key]',
      )
      for (var u = 0; u < userNodes.length; u++) {
        var userEl = userNodes[u]
        var nodeKey = userEl.getAttribute('data-chat-node-key')
        var msgId = parseInputMessageId(nodeKey)
        if (!msgId) continue
        var msgInfo = snap.msgMap.get(msgId)
        var turnNum = Number(userEl.getAttribute('data-chat-turn') || (msgInfo ? msgInfo.turn : 0))
        var turnRowInfo = snap.turnMap.get(turnNum)
        var isUserCompacted = Boolean((msgInfo && msgInfo.compacted) || (turnRowInfo && turnRowInfo.compacted))
        var turnExcluded = (snap.state.excludedTurns || []).indexOf(turnNum) !== -1
        var msgExcluded = (snap.state.excludedMessageIds || []).indexOf(msgId) !== -1
        var userIncluded = !isUserCompacted && !turnExcluded && !msgExcluded
        var earlierAllExcl = isEarlierAllExcluded(snap, turnNum)

        var actionsHost = userEl.querySelector('[data-clock="start"]') || userEl
        var actGroup = actionsHost.querySelector('.dsh-ctx-user-actions')
        if (actGroup && actGroup.getAttribute('data-ctx-rev') !== BIND_REV) {
          actGroup.parentNode.removeChild(actGroup)
          actGroup = null
        }
        if (!actGroup) {
          actGroup = document.createElement('div')
          actGroup.className = 'dsh-ctx-user-actions'
          actGroup.setAttribute('data-ctx-rev', BIND_REV)

          var toggleBtn = document.createElement('button')
          toggleBtn.type = 'button'
          toggleBtn.className = 'dsh-ctx-icon-action dsh-ctx-msg-toggle'
          guardCheckboxWrapperEvents(toggleBtn)
          actGroup.appendChild(toggleBtn)

          if (turnNum > 1) {
            var cutBtn = document.createElement('button')
            cutBtn.type = 'button'
            cutBtn.className = 'dsh-ctx-icon-action dsh-ctx-msg-cutoff'
            guardCheckboxWrapperEvents(cutBtn)
            actGroup.appendChild(cutBtn)
          }

          actionsHost.appendChild(actGroup)
        }

        var toggleBtnEl = actGroup.querySelector('.dsh-ctx-msg-toggle')
        if (toggleBtnEl) {
          toggleBtnEl.__ctxController = controller
          toggleBtnEl.__ctxMsgId = msgId
          toggleBtnEl.__ctxTurn = turnNum
          toggleBtnEl.__ctxIncluded = userIncluded
          toggleBtnEl.__ctxCompacted = isUserCompacted
          var nextToggleStateKey = isUserCompacted ? 'compacted' : userIncluded ? 'included' : 'excluded'
          if (toggleBtnEl.getAttribute('data-ctx-render-key') !== nextToggleStateKey) {
            toggleBtnEl.setAttribute('data-ctx-render-key', nextToggleStateKey)
            if (isUserCompacted) {
              toggleBtnEl.setAttribute('data-status', 'excluded')
              toggleBtnEl.setAttribute('data-ctx-tip', '本轮已被系统自动压缩合入摘要，点击可打开上下文弹窗管理压缩摘要')
              toggleBtnEl.innerHTML = '<span>📦 已合入压缩摘要</span>'
            } else if (userIncluded) {
              toggleBtnEl.setAttribute('data-status', 'included')
              toggleBtnEl.setAttribute('data-ctx-tip', '已计入上下文 · 点击排除本条')
              toggleBtnEl.innerHTML = SVG_CHECK_CIRCLE
            } else {
              toggleBtnEl.setAttribute('data-status', 'excluded')
              toggleBtnEl.setAttribute('data-ctx-tip', '本条已排除 · 点击恢复携带')
              toggleBtnEl.innerHTML = SVG_EXCLUDED_CIRCLE + '<span>已排除</span>'
            }
          }
          toggleBtnEl.onclick = function (e) {
            e.stopPropagation()
            var ctrl = this.__ctxController
            if (!ctrl) return
            var mid = this.__ctxMsgId
            var bTurn = this.__ctxTurn
            if (this.__ctxCompacted && bTurn > 0) {
              ctrl.sendAction({
                action: 'toggle-turn',
                turn: bTurn,
                included: true,
              })
              return
            }
            var nextInc = !this.__ctxIncluded
            if (!mid) return
            if (
              bTurn > 0 &&
              (ctrl.getSnapshot().state.excludedTurns || []).indexOf(bTurn) !== -1 &&
              nextInc
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
                included: nextInc,
              })
            }
          }
        }

        var cutBtnEl = actGroup.querySelector('.dsh-ctx-msg-cutoff')
        if (cutBtnEl && turnNum > 1) {
          cutBtnEl.__ctxController = controller
          cutBtnEl.__ctxTurn = turnNum
          cutBtnEl.__ctxEarlierExcl = earlierAllExcl
          var nextCutKey = (earlierAllExcl ? 'cutoff:' : 'normal:') + String(turnNum)
          if (cutBtnEl.getAttribute('data-ctx-render-key') !== nextCutKey) {
            cutBtnEl.setAttribute('data-ctx-render-key', nextCutKey)
            if (earlierAllExcl) {
              cutBtnEl.setAttribute('data-status', 'cutoff')
              cutBtnEl.setAttribute('data-ctx-tip', '上方第 1~' + String(turnNum - 1) + ' 轮已排除 · 点击恢复全部')
              cutBtnEl.innerHTML = SVG_CUTOFF_UP + '<span>仅从此轮起</span>'
            } else {
              cutBtnEl.setAttribute('data-status', 'normal')
              cutBtnEl.setAttribute('data-ctx-tip', '仅从此轮起携带（一键排除上方旧历史）')
              cutBtnEl.innerHTML = SVG_CUTOFF_UP
            }
          }
          cutBtnEl.onclick = function (e) {
            e.stopPropagation()
            var ctrl = this.__ctxController
            var bTurn = this.__ctxTurn
            if (!ctrl || !(bTurn > 1)) return
            if (this.__ctxEarlierExcl) {
              ctrl.sendAction({
                action: 'set-all',
                included: true,
              })
            } else {
              ctrl.sendAction({
                action: 'exclude-before-turn',
                turn: bTurn,
                mode: 'cutoff',
              })
            }
          }
        }

        var nextPinnedBar = !userIncluded || earlierAllExcl ? 'true' : 'false'
        if (userEl.getAttribute('data-ctx-pinned-bar') !== nextPinnedBar) {
          userEl.setAttribute('data-ctx-pinned-bar', nextPinnedBar)
        }
        userEl.classList.toggle('dsh-ctx-row-excluded', !userIncluded)
      }

      /* 3. Assistant response & reasoning rows */
      var assistantNodes = document.querySelectorAll('[data-chat-flow-kind="assistant-step"][data-chat-node-key]')
      for (var a = 0; a < assistantNodes.length; a++) {
        var asstEl = assistantNodes[a]
        if (!hasVisibleNativeContent(asstEl)) {
          var staleRWrap = asstEl.querySelector(':scope > .dsh-ctx-inline-wrap')
          if (staleRWrap && staleRWrap.parentNode) staleRWrap.parentNode.removeChild(staleRWrap)
          var staleRPill = asstEl.querySelector(':scope > .dsh-ctx-inline-reply-pill')
          if (staleRPill && staleRPill.parentNode) staleRPill.parentNode.removeChild(staleRPill)
          asstEl.classList.remove('dsh-ctx-row-excluded')
          continue
        }
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
        var aCompacted = Boolean(stepAsstMsg.compacted || tInfo.compacted)
        var aIncluded = !aCompacted && stepAsstMsg.included

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
            rWrap.title = '勾选 = 携带此步思考与消息；取消勾选 = 不携带'
            var rcb = document.createElement('input')
            rcb.type = 'checkbox'
            rcb.className = 'dsh-ctx-sel-checkbox'
            rWrap.appendChild(rcb)
            guardCheckboxWrapperEvents(rWrap)
            asstEl.insertBefore(rWrap, asstEl.firstChild)
          }
          var rInput = rWrap.querySelector('input')
          if (rInput) {
            rInput.disabled = false
            rInput.__ctxController = controller
            rInput.__ctxMsgId = stepAsstMsg.id
            rInput.onchange = function (e) {
              e.stopPropagation()
              if (this.disabled) return
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
          asstEl.classList.toggle('dsh-ctx-row-excluded', !aIncluded && !aCompacted)
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
          rPill.title = '点击切换是否在后续上下文中携带此段回复'
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
          aInput.disabled = false
          aInput.__ctxController = controller
          aInput.__ctxMsgId = stepAsstMsg.id
          aInput.__ctxTurn = coords.turn
          aInput.onchange = function (e) {
            e.stopPropagation()
            if (this.disabled) return
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
          var nextASpanText = aCompacted
            ? '📦 已合入压缩摘要 (原 ~' + formatTokensCount(stepAsstMsg.tokens) + ' tok 已归档)'
            : aIncluded
              ? '~' + formatTokensCount(stepAsstMsg.tokens) + ' tok'
              : '回复已排除 · 省 ~' + formatTokensCount(stepAsstMsg.tokens)
          if (aSpan.textContent !== nextASpanText) {
            aSpan.textContent = nextASpanText
          }
        }
        var nextRPillExcl = !aIncluded ? 'true' : 'false'
        if (rPill.getAttribute('data-excluded') !== nextRPillExcl) {
          rPill.setAttribute('data-excluded', nextRPillExcl)
        }
        asstEl.classList.toggle('dsh-ctx-row-excluded', !aIncluded && !aCompacted)
      }

      /* 4. Step process group header */
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
          if (headerParent.hasAttribute('hidden') || groupEl.hasAttribute('hidden')) {
            var staleGWrap = headerParent.querySelector(':scope > .dsh-ctx-inline-wrap')
            if (staleGWrap && staleGWrap.parentNode) staleGWrap.parentNode.removeChild(staleGWrap)
            headerParent.classList.remove('dsh-ctx-group-head-row')
            continue
          }
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

      /* 5. Outer turn-process bar */
      var turnProcessNodes = document.querySelectorAll('[data-chat-flow-kind="turn-process"][data-chat-turn]')
      for (var tp = 0; tp < turnProcessNodes.length; tp++) {
        var tpEl = turnProcessNodes[tp]
        var tpBtn = tpEl.querySelector('button[data-turn-process]')
        if (!tpBtn || tpEl.hasAttribute('hidden')) {
          var staleTpWrap = tpEl.querySelector(':scope > .dsh-ctx-inline-wrap')
          if (staleTpWrap && staleTpWrap.parentNode) staleTpWrap.parentNode.removeChild(staleTpWrap)
          continue
        }
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

      /* 6. Inline Compaction Row: 上下文已压缩 · 已压缩 X 条历史记录 */
      var compIcons = document.querySelectorAll('[data-compaction-icon="context"]')
      var cpsList = Array.isArray(snap.checkpoints) ? snap.checkpoints : []
      for (var cIdx = 0; cIdx < compIcons.length; cIdx++) {
        var cIcon = compIcons[cIdx]
        var cBtn = cIcon.closest('button')
        var cRow = cBtn ? cBtn.parentElement : null
        if (!cBtn || !cRow) continue
        var matchedCp = cpsList[cIdx] || cpsList[cpsList.length - 1] || null
        cRow.style.display = 'flex'
        cRow.style.alignItems = 'center'
        cRow.style.gap = '6px'
        cBtn.style.flex = '1 1 auto'

        var cWrap = cRow.querySelector(':scope > .dsh-ctx-inline-wrap')
        if (cWrap && cWrap.getAttribute('data-ctx-rev') !== BIND_REV) {
          cWrap.parentNode.removeChild(cWrap)
          cWrap = null
        }
        if (!cWrap) {
          cWrap = document.createElement('div')
          cWrap.className = 'dsh-ctx-inline-wrap'
          cWrap.setAttribute('data-ctx-rev', BIND_REV)
          cWrap.style.opacity = '1'
          cWrap.style.gap = '6px'

          var cCb = document.createElement('input')
          cCb.type = 'checkbox'
          cCb.className = 'dsh-ctx-sel-checkbox'
          cCb.title = '勾选 = 发送此压缩摘要；取消勾选 = 不发送此压缩摘要'
          cWrap.appendChild(cCb)

          var uncompBtn = document.createElement('button')
          uncompBtn.type = 'button'
          uncompBtn.className = 'dsh-ctx-hc-btn'
          uncompBtn.style.whiteSpace = 'nowrap'
          uncompBtn.style.color = '#d97706'
          uncompBtn.style.border = '0.5px solid rgba(217, 119, 6, 0.45)'
          cWrap.appendChild(uncompBtn)

          guardCheckboxWrapperEvents(cWrap)
          cRow.insertBefore(cWrap, cBtn)
        }
        var cpCbEl = cWrap.querySelector('input')
        var uncompBtnEl = cWrap.querySelector('button')
        var cpIncludedVal = matchedCp ? Boolean(matchedCp.included) : true
        var restoredArr = (snap.state && snap.state.restoredTurns) || []
        var covTurnsArr = (matchedCp && matchedCp.coveredTurns) || []
        var isAllRestored =
          covTurnsArr.length > 0 &&
          covTurnsArr.every(function (tNum) {
            return restoredArr.indexOf(tNum) !== -1
          })
        if (cpCbEl) {
          cpCbEl.__ctxController = controller
          cpCbEl.__ctxCp = matchedCp
          if (cpCbEl.checked !== cpIncludedVal) {
            cpCbEl.checked = cpIncludedVal
          }
          cpCbEl.onchange = function (e) {
            e.stopPropagation()
            var ctrl = this.__ctxController
            var cpObj = this.__ctxCp
            if (!ctrl || !cpObj) return
            ctrl.sendAction({
              action: 'toggle-message',
              messageId: cpObj.id,
              included: this.checked,
            })
          }
        }
        if (uncompBtnEl) {
          uncompBtnEl.__ctxController = controller
          uncompBtnEl.__ctxCp = matchedCp
          uncompBtnEl.__ctxRestored = isAllRestored
          var nextUncompText = isAllRestored ? '✅ 已还原原始上下文 (点击恢复压缩)' : '🔓 取消压缩并还原原文'
          if (uncompBtnEl.textContent !== nextUncompText) {
            uncompBtnEl.textContent = nextUncompText
          }
          uncompBtnEl.title = isAllRestored
            ? '当前已取消压缩并恢复发送原始对话；点击可重新启用压缩摘要'
            : '点击取消本次压缩摘要，并自动将上方被压缩的历史原始对话恢复到下一次请求中'
          uncompBtnEl.onclick = function (e) {
            e.stopPropagation()
            var ctrl = this.__ctxController
            var cpObj = this.__ctxCp
            if (!ctrl) return
            ctrl.sendAction({
              action: 'uncompact-checkpoint',
              checkpointId: cpObj ? cpObj.id : '',
              restoreRaw: !this.__ctxRestored,
            })
          }
        }
        cBtn.style.opacity = cpIncludedVal ? '1' : '0.42'
        cBtn.style.textDecoration = cpIncludedVal ? 'none' : 'line-through'
      }
    }

    function HoverTurnPreviewCard(props) {
      var row = props.row
      var controller = props.controller
      var onMouseEnter = props.onMouseEnter
      var onMouseLeave = props.onMouseLeave
      var onClose = props.onClose
      var inlineDock = Boolean(props.inlineDock)
      var showToolsState = useState(false)
      var showTools = showToolsState[0]
      var setShowTools = showToolsState[1]
      var expandTextState = useState(false)
      var expandText = expandTextState[0]
      var setExpandText = expandTextState[1]

      if (!row) return null

      var calls = Array.isArray(row.calls) ? row.calls : []
      var anyToolIncluded = calls.some(function (c) {
        return c.included
      })
      var allToolsIncluded =
        calls.length > 0 &&
        calls.every(function (c) {
          return c.included
        })
      var partialToolsIncluded = anyToolIncluded && !allToolsIncluded
      var toolTokens = 0
      for (var i = 0; i < calls.length; i++) {
        toolTokens += calls[i].tokens || 0
      }

      var onToggleAllTurnTools = function (checked) {
        var cids = calls.map(function (c) {
          return c.callId
        })
        controller.sendAction({
          action: 'toggle-batch',
          turn: row.turn,
          callIds: cids,
          included: checked,
        })
      }

      var curReplyIncluded = row.replyIncluded !== undefined ? row.replyIncluded : row.incomingIncluded

      return h(
        inlineDock ? 'div' : 'aside',
        {
          ref: props.cardRef || undefined,
          className: inlineDock ? 'dsh-ctx-hc-inline-dock' : 'dsh-ctx-hover-card',
          style: props.style || undefined,
          onMouseEnter: onMouseEnter,
          onMouseLeave: onMouseLeave,
        },
        h(
          'div',
          { className: 'dsh-ctx-hc-head' },
          h(
            'div',
            { className: 'dsh-ctx-hc-title' },
            h('span', null, '第 ' + String(row.turn) + ' 轮'),
            row.compacted
              ? h('span', { className: 'dsh-ctx-compacted-tag' }, '📦 已压缩')
              : h(
                  'span',
                  { className: 'dsh-ctx-pop-stat' },
                  '~' + formatTokensCount(row.tokenCount) + ' tok',
                ),
          ),
          h(
            'div',
            { className: 'dsh-ctx-hc-actions' },
            row.turn > 1
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-ctx-hc-btn',
                    title: '将第 1 ~ ' + String(row.turn - 1) + ' 轮全部取消勾选，仅从本轮起携带',
                    onClick: function () {
                      controller.sendAction({
                        action: 'exclude-before-turn',
                        turn: row.turn,
                        mode: 'cutoff',
                      })
                    },
                  },
                  '↑从此起',
                )
              : null,
            h(
              'button',
              {
                type: 'button',
                className: 'dsh-ctx-hc-btn',
                title: '在聊天窗口中滚动定位到第 ' + String(row.turn) + ' 轮',
                onClick: function () {
                  scrollToTurnInChat(row.turn)
                },
              },
              '定位',
            ),
            onClose
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-ctx-hc-btn',
                    title: '收起细项',
                    onClick: onClose,
                  },
                  '收起 ✕',
                )
              : null,
          ),
        ),
        row.compacted
          ? h(
              'div',
              {
                className: 'dsh-ctx-cp-banner',
                style: { padding: '4px 8px' },
              },
              h(
                'div',
                { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' } },
                h(
                  'div',
                  { style: { fontSize: '11px', color: '#d97706', fontWeight: 600 } },
                  '📦 本轮已被压缩归档',
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-ctx-hc-btn',
                    style: { color: '#d97706', border: '0.5px solid rgba(217,119,6,0.45)', fontWeight: 600 },
                    onClick: function () {
                      controller.sendAction({
                        action: 'toggle-turn',
                        turn: row.turn,
                        included: true,
                      })
                    },
                  },
                  '🔓 还原原文',
                ),
              ),
            )
          : null,
        h(
          'div',
          {
            className: 'dsh-ctx-hc-block',
            'data-excluded': !row.outgoingIncluded ? 'true' : undefined,
          },
          h(
            'div',
            { className: 'dsh-ctx-hc-block-top' },
            h(
              'label',
              { className: 'dsh-ctx-hc-role' },
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
              h('span', null, '我说的'),
            ),
            h(
              'span',
              {
                className: 'dsh-ctx-hc-inline-preview',
                title: '点击展开/收起预览',
                onClick: function () {
                  setExpandText(!expandText)
                },
              },
              row.userPreview || '(无提问文本)',
            ),
            h(
              'span',
              { style: { flex: 'none', fontSize: '10.5px' } },
              row.outgoingIncluded ? '携带' : '排除',
            ),
          ),
          expandText
            ? h('div', { className: 'dsh-ctx-hc-text' }, row.userPreview || '(无提问文本)')
            : null,
        ),
        calls.length > 0
          ? h(
              'div',
              {
                className: 'dsh-ctx-hc-block',
                'data-excluded': !anyToolIncluded ? 'true' : undefined,
              },
              h(
                'div',
                { className: 'dsh-ctx-hc-block-top' },
                h(
                  'label',
                  { className: 'dsh-ctx-hc-role' },
                  h('input', {
                    type: 'checkbox',
                    className: 'dsh-ctx-sel-checkbox',
                    checked: anyToolIncluded,
                    'data-partial': partialToolsIncluded ? 'true' : undefined,
                    onChange: function (e) {
                      onToggleAllTurnTools(e.target.checked)
                    },
                  }),
                  h('span', null, '工具 (' + String(calls.length) + ') · ~' + formatTokensCount(toolTokens)),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-ctx-hc-btn',
                    onClick: function () {
                      setShowTools(!showTools)
                    },
                  },
                  showTools ? '收起 ▲' : '明细 ▼',
                ),
              ),
              showTools
                ? h(
                    'div',
                    { className: 'dsh-ctx-hc-tools-list' },
                    calls.map(function (c) {
                      return h(
                        'label',
                        {
                          key: c.callId,
                          className: 'dsh-ctx-hc-tool-item',
                          'data-excluded': !c.included ? 'true' : undefined,
                        },
                        h('input', {
                          type: 'checkbox',
                          className: 'dsh-ctx-sel-checkbox',
                          checked: c.included,
                          onChange: function () {
                            controller.sendAction({
                              action: 'toggle-call',
                              turn: row.turn,
                              callId: c.callId,
                              included: !c.included,
                            })
                          },
                        }),
                        h(
                          'span',
                          {
                            style: {
                              flex: 1,
                              minWidth: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            },
                          },
                          c.summary,
                        ),
                        c.pruned
                          ? h('span', { className: 'dsh-ctx-pruned-tag', title: '超过 8192 字符阈值，中间段已被系统自动裁剪' }, '✂️已精简')
                          : null,
                        h(
                          'span',
                          { style: { flex: 'none', color: 'var(--dsw-alias-label-tertiary)' } },
                          formatTokensCount(c.tokens),
                        ),
                      )
                    }),
                  )
                : null,
            )
          : null,
        h(
          'div',
          {
            className: 'dsh-ctx-hc-block',
            'data-excluded': !curReplyIncluded ? 'true' : undefined,
          },
          h(
            'div',
            { className: 'dsh-ctx-hc-block-top' },
            h(
              'label',
              { className: 'dsh-ctx-hc-role' },
              h('input', {
                type: 'checkbox',
                className: 'dsh-ctx-sel-checkbox',
                checked: curReplyIncluded,
                onChange: function () {
                  controller.sendAction({
                    action: 'toggle-reply',
                    turn: row.turn,
                    included: !curReplyIncluded,
                  })
                },
              }),
              h('span', null, 'AI 回复'),
            ),
            h(
              'span',
              {
                className: 'dsh-ctx-hc-inline-preview',
                title: '点击展开/收起预览',
                onClick: function () {
                  setExpandText(!expandText)
                },
              },
              row.assistantPreview || (row.status === 'running' ? '正在生成回复…' : '(仅工具调用)'),
            ),
            h(
              'span',
              { style: { flex: 'none', fontSize: '10.5px' } },
              curReplyIncluded ? '携带' : '排除',
            ),
          ),
          expandText
            ? h(
                'div',
                { className: 'dsh-ctx-hc-text' },
                row.assistantPreview || (row.status === 'running' ? '正在生成回复…' : '(仅工具调用)'),
              )
            : null,
        ),
      )
    }

    function FloatingContextPopover(props) {
      var controller = props.controller
      var snap = props.snap
      var t = props.t
      var viewModeState = useState(function () {
        try {
          return localStorage.getItem('dsh_ctx_view_mode') || 'capsule'
        } catch {
          return 'capsule'
        }
      })
      var viewMode = viewModeState[0]
      var setViewMode = viewModeState[1]

      var hoveredTurnState = useState(null)
      var hoveredTurn = hoveredTurnState[0]
      var setHoveredTurn = hoveredTurnState[1]
      var hoverCardPosState = useState({ top: 0, left: 364, width: 300 })
      var hoverCardPos = hoverCardPosState[0]
      var setHoverCardPos = hoverCardPosState[1]
      var hoverTimerRef = useRef(null)
      var switchTimerRef = useRef(null)
      var wrapRef = useRef(null)
      var hoverCardRef = useRef(null)
      var lastMousePosRef = useRef(null)
      var activeRowMousePosRef = useRef(null)
      var insideHoverCardRef = useRef(false)
      var scrollBodyRef = useRef(null)

      var expandedCpState = useState({})
      var expandedCp = expandedCpState[0]
      var setExpandedCp = expandedCpState[1]
      var checkpoints = Array.isArray(snap.checkpoints) ? snap.checkpoints : []

      var sysEditorOpenState = useState(false)
      var sysEditorOpen = sysEditorOpenState[0]
      var setSysEditorOpen = sysEditorOpenState[1]
      var curPresetOverride = (snap.state && snap.state.systemPresetOverride) || ''
      var curCustomPrompt = (snap.state && snap.state.customSystemPrompt) || ''
      var curCustomMode = (snap.state && snap.state.customSystemMode) || 'append'
      var draftPromptState = useState(curCustomPrompt)
      var draftPrompt = draftPromptState[0]
      var setDraftPrompt = draftPromptState[1]
      var draftModeState = useState(curCustomMode)
      var draftMode = draftModeState[0]
      var setDraftMode = draftModeState[1]

      useEffect(
        function () {
          setDraftPrompt((snap.state && snap.state.customSystemPrompt) || '')
          setDraftMode((snap.state && snap.state.customSystemMode) || 'append')
        },
        [snap.state && snap.state.customSystemPrompt, snap.state && snap.state.customSystemMode],
      )

      useEffect(
        function () {
          if (scrollBodyRef.current) {
            scrollBodyRef.current.scrollTop = scrollBodyRef.current.scrollHeight
          }
        },
        [viewMode],
      )

      var switchViewMode = function (mode) {
        setViewMode(mode)
        try {
          localStorage.setItem('dsh_ctx_view_mode', mode)
        } catch {}
      }

      var isMobileViewport = function () {
        if (typeof window === 'undefined') return false
        return (
          window.innerWidth <= 768 ||
          (window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches)
        )
      }

      var syncHoverCardPosition = useCallback(
        function (targetTurn) {
          var tNum = targetTurn !== undefined ? targetTurn : hoveredTurn
          if (tNum === null || isMobileViewport()) return
          var wrapEl = wrapRef.current
          if (!wrapEl) return
          var rowEl = wrapEl.querySelector('[data-ctx-turn="' + String(tNum) + '"]')
          if (!rowEl) return
          var wrapRect = wrapEl.getBoundingClientRect()
          var rowRect = rowEl.getBoundingClientRect()
          var cardEl = hoverCardRef.current
          var cardH = cardEl ? cardEl.offsetHeight : 148
          var rowTop = rowRect.top - wrapRect.top
          var rowBottom = rowRect.bottom - wrapRect.top
          var maxTop = Math.max(0, wrapRect.height - cardH)
          var nextTop = Math.max(0, Math.min(rowTop - 12, maxTop))
          if (nextTop + cardH < rowBottom) {
            nextTop = rowBottom - cardH
          }
          if (nextTop > rowTop) {
            nextTop = rowTop
          }

          var vpW = window.innerWidth || document.documentElement.clientWidth || 1024
          var popEl = wrapEl.querySelector('.dsh-ctx-popover')
          var popW = popEl ? popEl.offsetWidth : 356
          var baseLeft = popW + 8
          var desiredW = 300
          var availRight = vpW - (wrapRect.left + baseLeft) - 12
          var nextW = desiredW
          var nextLeft = baseLeft
          if (availRight < desiredW) {
            if (availRight >= 248) {
              nextW = Math.floor(availRight)
            } else {
              nextW = Math.max(240, Math.min(desiredW, vpW - 24))
              var rowRightInWrap = rowRect.right - wrapRect.left
              var maxAllowedLeft = Math.max(rowRightInWrap + 6, vpW - wrapRect.left - nextW - 10)
              nextLeft = Math.min(baseLeft, Math.round(maxAllowedLeft))
            }
          }

          setHoverCardPos({
            top: Math.round(nextTop),
            left: Math.round(nextLeft),
            width: Math.round(nextW),
          })
        },
        [hoveredTurn],
      )

      useEffect(
        function () {
          if (hoveredTurn === null || isMobileViewport()) return
          syncHoverCardPosition(hoveredTurn)
          var raf = requestAnimationFrame(function () {
            syncHoverCardPosition(hoveredTurn)
          })
          var onResize = function () {
            syncHoverCardPosition(hoveredTurn)
          }
          window.addEventListener('resize', onResize)
          return function () {
            cancelAnimationFrame(raf)
            window.removeEventListener('resize', onResize)
          }
        },
        [hoveredTurn, viewMode, syncHoverCardPosition],
      )

      var enterTurnHover = function (turnNum, e) {
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current)
          hoverTimerRef.current = null
        }
        if (switchTimerRef.current) {
          clearTimeout(switchTimerRef.current)
          switchTimerRef.current = null
        }
        if (isMobileViewport()) {
          setHoveredTurn(function (prev) {
            return prev === turnNum ? null : turnNum
          })
          return
        }
        if (hoveredTurn !== null && hoveredTurn !== turnNum && e && activeRowMousePosRef.current) {
          var dx = e.clientX - activeRowMousePosRef.current.x
          var dy = e.clientY - activeRowMousePosRef.current.y
          if (dx > 1 && Math.abs(dy) <= Math.max(44, dx * 3.5)) {
            switchTimerRef.current = setTimeout(function () {
              switchTimerRef.current = null
              if (!insideHoverCardRef.current) {
                if (e) {
                  activeRowMousePosRef.current = { x: e.clientX, y: e.clientY }
                }
                setHoveredTurn(turnNum)
                syncHoverCardPosition(turnNum)
              }
            }, 280)
            return
          }
        }
        if (e) {
          activeRowMousePosRef.current = { x: e.clientX, y: e.clientY }
        }
        setHoveredTurn(turnNum)
        syncHoverCardPosition(turnNum)
      }

      var leaveTurnHover = function (e) {
        if (isMobileViewport()) return
        if (e) {
          activeRowMousePosRef.current = { x: e.clientX, y: e.clientY }
        }
      }

      var leavePopoverWrap = function () {
        if (isMobileViewport()) return
        if (switchTimerRef.current) {
          clearTimeout(switchTimerRef.current)
          switchTimerRef.current = null
        }
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = setTimeout(function () {
          if (!insideHoverCardRef.current) {
            setHoveredTurn(null)
          }
        }, 420)
      }

      var enterPopoverWrap = function () {
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current)
          hoverTimerRef.current = null
        }
      }

      useEffect(function () {
        return function () {
          if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
          if (switchTimerRef.current) clearTimeout(switchTimerRef.current)
        }
      }, [])

      var turns = snap.turns || []
      var activeTurns = turns.filter(function (r) {
        return !r.compacted
      })
      var totalTurns = activeTurns.length
      var includedCount = activeTurns.filter(function (r) {
        return r.included
      }).length
      var savedTokens = snap.tokenStats ? snap.tokenStats.savedTokens || 0 : 0

      var activeHoverRow = null
      if (hoveredTurn !== null) {
        activeHoverRow = snap.turnMap.get(hoveredTurn) || null
      }

      var isMob = isMobileViewport()

      var handleTurnToggle = function (row, e) {
        var nextIncluded = !row.included
        if (e && e.shiftKey && controller.lastClickedTurn && controller.lastClickedTurn !== row.turn) {
          var startT = Math.min(controller.lastClickedTurn, row.turn)
          var endT = Math.max(controller.lastClickedTurn, row.turn)
          var msgIds = []
          var callIds = []
          for (var ti = 0; ti < turns.length; ti++) {
            var tr = turns[ti]
            if (tr.turn >= startT && tr.turn <= endT) {
              controller.sendAction({
                action: 'toggle-turn',
                turn: tr.turn,
                included: nextIncluded,
              })
            }
          }
          controller.lastClickedTurn = row.turn
          return
        }
        controller.lastClickedTurn = row.turn
        controller.sendAction({
          action: 'toggle-turn',
          turn: row.turn,
          included: nextIncluded,
        })
      }

      return h(
        'div',
        {
          ref: wrapRef,
          className: 'dsh-ctx-popover-wrap',
          onMouseEnter: enterPopoverWrap,
          onMouseLeave: leavePopoverWrap,
        },
        h(
          'section',
          {
            className: 'dsh-ctx-popover',
            'aria-label': t('dock.title'),
          },
          /* Header */
          h(
            'div',
            { className: 'dsh-ctx-pop-header' },
            h(
              'div',
              { className: 'dsh-ctx-pop-title-group' },
              h('span', { className: 'dsh-ctx-pop-title' }, t('dock.title')),
              h(
                'span',
                { className: 'dsh-ctx-pop-stat' },
                String(includedCount) + '/' + String(totalTurns) + ' 轮',
              ),
              savedTokens > 0
                ? h(
                    'span',
                    { className: 'dsh-ctx-pop-stat', 'data-saved': 'true' },
                    '已省 ~' + formatTokensCount(savedTokens),
                  )
                : null,
            ),
            h(
              'div',
              { className: 'dsh-ctx-pop-head-right' },
              h(
                'div',
                { className: 'dsh-ctx-view-switch' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-ctx-view-opt',
                    'data-active': viewMode === 'capsule' ? 'true' : undefined,
                    onClick: function () {
                      switchViewMode('capsule')
                    },
                  },
                  '胶囊',
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-ctx-view-opt',
                    'data-active': viewMode === 'list' ? 'true' : undefined,
                    onClick: function () {
                      switchViewMode('list')
                    },
                  },
                  '列表',
                ),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-ctx-pop-close',
                  title: t('dock.close'),
                  onClick: function () {
                    controller.setDrawerOpen(false)
                  },
                },
                '✕',
              ),
            ),
          ),
          /* Presets row */
          h(
            'div',
            { className: 'dsh-ctx-presets' },
            h(
              'button',
              {
                type: 'button',
                className: 'dsh-ctx-preset-chip',
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
                className: 'dsh-ctx-preset-chip',
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
                className: 'dsh-ctx-preset-chip',
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
                className: 'dsh-ctx-preset-chip',
                onClick: function () {
                  controller.sendAction({ action: 'keep-last-n', count: 5 })
                },
              },
              t('dock.keepLast5'),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'dsh-ctx-preset-chip',
                title: '保留所有对话文字，仅把旧轮次里的文件读取/搜索输出排除',
                onClick: function () {
                  controller.sendAction({ action: 'exclude-older-tools', keepRecentTurns: 1 })
                },
              },
              t('dock.dropOldTools'),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'dsh-ctx-preset-chip',
                onClick: function () {
                  controller.sendAction({ action: 'set-all', included: false })
                },
              },
              t('dock.selectNone'),
            ),
          ),
          /* System Prompt / Preset Switcher Bar */
          h(
            'div',
            { className: 'dsh-ctx-sys-bar' },
            h(
              'div',
              { className: 'dsh-ctx-sys-row' },
              h(
                'div',
                { style: { display: 'inline-flex', alignItems: 'center', gap: '5px', flex: '1 1 auto', minWidth: 0 } },
                h(
                  'span',
                  { style: { fontWeight: 600, color: 'var(--dsw-alias-label-primary)', whiteSpace: 'nowrap', flex: 'none' } },
                  '🎭 提示词:',
                ),
                h(
                  'select',
                  {
                    className: 'dsh-ctx-sys-select',
                    value: curPresetOverride,
                    title: '在已展开的会话中随时切换系统提示词模式（下一轮对话立即生效）',
                    onChange: function (e) {
                      var val = e.target.value
                      if (!val) {
                        setDraftPrompt('')
                        controller.sendAction({
                          action: 'set-system-override',
                          systemPresetOverride: null,
                          customSystemPrompt: '',
                          customSystemMode: 'append',
                        })
                        return
                      }
                      var tpl = findPresetTemplate(val)
                      var nextP = tpl ? tpl.prompt : draftPrompt
                      var nextM = tpl ? tpl.mode : draftMode
                      setDraftPrompt(nextP)
                      setDraftMode(nextM)
                      controller.sendAction({
                        action: 'set-system-override',
                        systemPresetOverride: val,
                        customSystemPrompt: nextP,
                        customSystemMode: nextM,
                      })
                    },
                  },
                  h(
                    'option',
                    { value: '' },
                    '默认 (' + (snap.activePreset || 'standard') + ')',
                  ),
                  buildEffectivePresetList(snap).map(function (item) {
                    return h('option', { key: item.id, value: item.id }, item.name)
                  }),
                  h('option', { value: 'custom' }, '✍️ 自定义系统提示词'),
                ),
              ),
              h(
                'div',
                { style: { display: 'inline-flex', alignItems: 'center', gap: '4px', flex: 'none' } },
                curPresetOverride || curCustomPrompt
                  ? h(
                      'span',
                      { className: 'dsh-ctx-pruned-tag', title: '当前会话已启用系统提示词覆盖/追加' },
                      '已生效',
                    )
                  : null,
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-ctx-hc-btn',
                    style: { whiteSpace: 'nowrap', padding: '2px 6px' },
                    onClick: function () {
                      setSysEditorOpen(!sysEditorOpen)
                    },
                  },
                  sysEditorOpen ? '收起 ▲' : '✏️ 编辑 ▼',
                ),
              ),
            ),
            sysEditorOpen
              ? h(
                  'div',
                  { style: { display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' } },
                  h(
                    'div',
                    { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', fontSize: '11px' } },
                    h(
                      'div',
                      { style: { display: 'inline-flex', alignItems: 'center', gap: '8px' } },
                      h(
                        'label',
                        { style: { display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' } },
                        h('input', {
                          type: 'radio',
                          name: 'dsh-sys-mode',
                          checked: draftMode !== 'replace',
                          onChange: function () {
                            setDraftMode('append')
                          },
                        }),
                        h('span', null, '追加到原系统提示词末尾'),
                      ),
                      h(
                        'label',
                        { style: { display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' } },
                        h('input', {
                          type: 'radio',
                          name: 'dsh-sys-mode',
                          checked: draftMode === 'replace',
                          onChange: function () {
                            setDraftMode('replace')
                          },
                        }),
                        h('span', null, '完全替换系统提示词'),
                      ),
                    ),
                  ),
                  h('textarea', {
                    className: 'dsh-ctx-sys-textarea',
                    placeholder: '输入要追加或替换的系统提示词内容…',
                    value: draftPrompt,
                    onChange: function (e) {
                      setDraftPrompt(e.target.value)
                    },
                  }),
                  h(
                    'div',
                    { style: { display: 'flex', justifyContent: 'flex-end', gap: '6px' } },
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'dsh-ctx-hc-btn',
                        onClick: function () {
                          setDraftPrompt('')
                          controller.sendAction({
                            action: 'set-system-override',
                            systemPresetOverride: null,
                            customSystemPrompt: '',
                            customSystemMode: 'append',
                            resetExcludedOrders: true,
                          })
                        },
                      },
                      '恢复默认',
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'dsh-ctx-hc-btn',
                        style: {
                          background: 'var(--dsw-alias-state-business-primary, #2563eb)',
                          color: '#fff',
                          fontWeight: 600,
                          padding: '3px 10px',
                        },
                        onClick: function () {
                          controller.sendAction({
                            action: 'set-system-override',
                            systemPresetOverride: curPresetOverride || (draftPrompt.trim() ? 'custom' : null),
                            customSystemPrompt: draftPrompt,
                            customSystemMode: draftMode,
                          })
                          setSysEditorOpen(false)
                        },
                      },
                      '保存并生效',
                    ),
                  ),
                )
              : null,
          ),
          /* Main body: Capsule Grid vs Compact List (with inline Compaction Dividers between turns) */
          turns.length === 0
            ? h('div', { className: 'dsh-ctx-pop-hint' }, t('dock.empty'))
            : viewMode === 'capsule'
              ? h(
                  'div',
                  {
                    ref: scrollBodyRef,
                    className: 'dsh-ctx-capsule-grid',
                    onScroll: function () {
                      syncHoverCardPosition()
                    },
                  },
                  turns.map(function (row, rIdx) {
                    var isHovered = activeHoverRow && activeHoverRow.turn === row.turn
                    var nextRow = turns[rIdx + 1]
                    var boundaryCps = checkpoints.filter(function (cp) {
                      var at =
                        cp.afterTurn ||
                        (Array.isArray(cp.coveredTurns) && cp.coveredTurns.length > 0
                          ? cp.coveredTurns[cp.coveredTurns.length - 1]
                          : 0)
                      if (at === row.turn) return true
                      if (!at && row.compacted && nextRow && !nextRow.compacted) return true
                      return false
                    })
                    return h(
                      React.Fragment,
                      { key: 'frag-cap-' + String(row.turn) },
                      h(
                        'div',
                        {
                          className: 'dsh-ctx-capsule',
                          'data-ctx-turn': String(row.turn),
                          'data-excluded': !row.included ? 'true' : undefined,
                          'data-compacted': row.compacted ? 'true' : undefined,
                          'data-hovered': isHovered ? 'true' : undefined,
                          title: row.compacted
                            ? '第 ' + String(row.turn) + ' 轮已在压缩前结束（原内容未勾选，由下方压缩摘要替代）'
                            : undefined,
                          onMouseEnter: function (e) {
                            if (!isMobileViewport()) enterTurnHover(row.turn, e)
                          },
                          onMouseMove: function (e) {
                            if (isHovered && !isMobileViewport()) {
                              activeRowMousePosRef.current = { x: e.clientX, y: e.clientY }
                            }
                          },
                          onMouseLeave: leaveTurnHover,
                          onClick: function (e) {
                            if (isMobileViewport()) {
                              enterTurnHover(row.turn)
                              return
                            }
                            handleTurnToggle(row, e)
                          },
                        },
                        h(
                          'div',
                          { className: 'dsh-ctx-capsule-left' },
                          h('input', {
                            type: 'checkbox',
                            className: 'dsh-ctx-sel-checkbox',
                            checked: row.included,
                            'data-partial': row.partialIncluded ? 'true' : undefined,
                            title: row.partialIncluded
                              ? '部分携带（仅携带本轮部分内容，如仅工具或仅提问）· 点击切换整轮'
                              : undefined,
                            onChange: function () {},
                            onClick: function (e) {
                              e.stopPropagation()
                              handleTurnToggle(row, e)
                            },
                          }),
                          h('span', { className: 'dsh-ctx-capsule-num' }, '#' + String(row.turn)),
                        ),
                        h(
                          'span',
                          { className: 'dsh-ctx-capsule-tok' },
                          row.compacted ? '已压缩' : row.restored ? '已还原 ' + formatTokensCount(row.tokenCount) : formatTokensCount(row.tokenCount),
                        ),
                      ),
                      boundaryCps.map(function (cp, cIdx) {
                        var isCpOpen = Boolean(expandedCp[cp.id])
                        var startT =
                          Array.isArray(cp.coveredTurns) && cp.coveredTurns.length > 0
                            ? cp.coveredTurns[0]
                            : 1
                        var endT = cp.afterTurn || row.turn
                        return h(
                          'div',
                          {
                            key: 'cp-div-cap-' + String(cp.id || cIdx),
                            className: 'dsh-ctx-inline-cp-divider',
                            'data-excluded': !cp.included ? 'true' : undefined,
                          },
                          h(
                            'div',
                            { className: 'dsh-ctx-cp-row' },
                            h(
                              'label',
                              {
                                style: {
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  color: '#d97706',
                                },
                                 title: '勾选 = 使用压缩摘要代替上方旧轮次；取消勾选 = 取消压缩并自动还原上方原始对话',
                              },
                              h('input', {
                                type: 'checkbox',
                                className: 'dsh-ctx-sel-checkbox',
                                checked: cp.included,
                                onChange: function (e) {
                                  controller.sendAction({
                                    action: 'uncompact-checkpoint',
                                    checkpointId: cp.id,
                                    restoreRaw: !e.target.checked,
                                  })
                                },
                              }),
                              h(
                                'span',
                                null,
                                cp.included
                                  ? '📦 ── 第 ' +
                                      String(endT) +
                                      ' 轮后已触发压缩：上方 #' +
                                      String(startT) +
                                      '~#' +
                                      String(endT) +
                                      ' 已由本摘要替代（取消勾选可还原原文）──'
                                  : '🔓 ── 已取消本次压缩：上方 #' +
                                      String(startT) +
                                      '~#' +
                                      String(endT) +
                                      ' 已恢复按原始对话发送 ──',
                              ),
                            ),
                            h(
                              'div',
                              { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } },
                              h(
                                'span',
                                { className: 'dsh-ctx-capsule-tok' },
                                (cp.shadowedTokenCount > 0
                                  ? '原 ~' + formatTokensCount(cp.shadowedTokenCount) + ' → '
                                  : '') +
                                  '~' +
                                  formatTokensCount(cp.tokens) +
                                  ' tok',
                              ),
                              h(
                                'button',
                                {
                                  type: 'button',
                                  className: 'dsh-ctx-hc-btn',
                                  onClick: function () {
                                    var next = Object.assign({}, expandedCp)
                                    next[cp.id] = !isCpOpen
                                    setExpandedCp(next)
                                  },
                                },
                                isCpOpen ? '收起 ▲' : '查看摘要 ▼',
                              ),
                              h(
                                'button',
                                {
                                  type: 'button',
                                  className: 'dsh-ctx-hc-btn',
                                  style: { color: '#d97706', border: '0.5px solid rgba(217,119,6,0.45)', fontWeight: 600 },
                                  title: '取消此次压缩摘要，并将上方被压缩的原始轮次恢复到发送上下文中',
                                  onClick: function () {
                                    controller.sendAction({
                                      action: 'uncompact-checkpoint',
                                      checkpointId: cp.id,
                                      restoreRaw: cp.included,
                                    })
                                  },
                                },
                                cp.included ? '🔓 取消压缩还原原文' : '📦 恢复使用压缩摘要',
                              ),
                            ),
                          ),
                          isCpOpen ? h('pre', { className: 'dsh-ctx-cp-preview' }, cp.fullText) : null,
                        )
                      }),
                    )
                  }),
                )
              : h(
                  'div',
                  {
                    ref: scrollBodyRef,
                    className: 'dsh-ctx-compact-list',
                    onScroll: function () {
                      syncHoverCardPosition()
                    },
                  },
                  turns.map(function (row, rIdx) {
                    var isHovered = activeHoverRow && activeHoverRow.turn === row.turn
                    var earlierExcl = isEarlierAllExcluded(snap, row.turn)
                    var nextRow = turns[rIdx + 1]
                    var boundaryCps = checkpoints.filter(function (cp) {
                      var at =
                        cp.afterTurn ||
                        (Array.isArray(cp.coveredTurns) && cp.coveredTurns.length > 0
                          ? cp.coveredTurns[cp.coveredTurns.length - 1]
                          : 0)
                      if (at === row.turn) return true
                      if (!at && row.compacted && nextRow && !nextRow.compacted) return true
                      return false
                    })
                    return h(
                      React.Fragment,
                      { key: 'frag-list-' + String(row.turn) },
                      h(
                        'div',
                        {
                          className: 'dsh-ctx-compact-row',
                          'data-ctx-turn': String(row.turn),
                          'data-excluded': !row.included ? 'true' : undefined,
                          'data-compacted': row.compacted ? 'true' : undefined,
                          'data-hovered': isHovered ? 'true' : undefined,
                          onMouseEnter: function (e) {
                            if (!isMobileViewport()) enterTurnHover(row.turn, e)
                          },
                          onMouseMove: function (e) {
                            if (isHovered && !isMobileViewport()) {
                              activeRowMousePosRef.current = { x: e.clientX, y: e.clientY }
                            }
                          },
                          onMouseLeave: leaveTurnHover,
                          onClick: function (e) {
                            if (isMobileViewport()) {
                              enterTurnHover(row.turn)
                              return
                            }
                            handleTurnToggle(row, e)
                          },
                        },
                        h('input', {
                          type: 'checkbox',
                          className: 'dsh-ctx-sel-checkbox',
                          checked: row.included,
                          'data-partial': row.partialIncluded ? 'true' : undefined,
                          title: row.partialIncluded
                            ? '部分携带（仅携带本轮部分内容，如仅工具或仅提问）· 点击切换整轮'
                            : undefined,
                          onChange: function () {},
                          onClick: function (e) {
                            e.stopPropagation()
                            handleTurnToggle(row, e)
                          },
                        }),
                        h('span', { className: 'dsh-ctx-compact-turn' }, '#' + String(row.turn)),
                        row.compacted
                          ? h('span', { className: 'dsh-ctx-compacted-tag' }, '已压缩替换')
                          : row.restored
                            ? h('span', { className: 'dsh-ctx-compacted-tag', style: { color: '#059669', borderColor: 'rgba(5,150,105,0.4)', background: 'rgba(5,150,105,0.1)' } }, '已还原原文')
                            : null,
                        h('span', { className: 'dsh-ctx-compact-title' }, row.userPreview),
                        h(
                          'span',
                          { className: 'dsh-ctx-capsule-tok' },
                          row.compacted
                            ? '原 ~' + formatTokensCount(row.tokenCount)
                            : formatTokensCount(row.tokenCount),
                        ),
                        !row.compacted && row.turn > 1
                          ? h(
                              'button',
                              {
                                type: 'button',
                                className: 'dsh-ctx-compact-cut',
                                'data-active': earlierExcl ? 'true' : undefined,
                                title: '仅从第 ' + String(row.turn) + ' 轮起携带（排除上方旧历史）',
                                onClick: function (e) {
                                  e.stopPropagation()
                                  controller.sendAction({
                                    action: 'exclude-before-turn',
                                    turn: row.turn,
                                    mode: 'cutoff',
                                  })
                                },
                              },
                              '↑从此起',
                            )
                          : null,
                      ),
                      boundaryCps.map(function (cp, cIdx) {
                        var isCpOpen = Boolean(expandedCp[cp.id])
                        var startT =
                          Array.isArray(cp.coveredTurns) && cp.coveredTurns.length > 0
                            ? cp.coveredTurns[0]
                            : 1
                        var endT = cp.afterTurn || row.turn
                        return h(
                          'div',
                          {
                            key: 'cp-div-list-' + String(cp.id || cIdx),
                            className: 'dsh-ctx-inline-cp-divider',
                            'data-excluded': !cp.included ? 'true' : undefined,
                          },
                          h(
                            'div',
                            { className: 'dsh-ctx-cp-row' },
                            h(
                              'label',
                              {
                                style: {
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  color: '#d97706',
                                },
                                title: '勾选 = 使用压缩摘要代替上方旧轮次；取消勾选 = 取消压缩并自动还原上方原始对话',
                              },
                              h('input', {
                                type: 'checkbox',
                                className: 'dsh-ctx-sel-checkbox',
                                checked: cp.included,
                                onChange: function (e) {
                                  controller.sendAction({
                                    action: 'uncompact-checkpoint',
                                    checkpointId: cp.id,
                                    restoreRaw: !e.target.checked,
                                  })
                                },
                              }),
                              h(
                                'span',
                                null,
                                cp.included
                                  ? '📦 ── 第 ' +
                                      String(endT) +
                                      ' 轮后已触发压缩：上方 #' +
                                      String(startT) +
                                      '~#' +
                                      String(endT) +
                                      ' 已由本摘要替代（取消勾选可还原原文）──'
                                  : '🔓 ── 已取消本次压缩：上方 #' +
                                      String(startT) +
                                      '~#' +
                                      String(endT) +
                                      ' 已恢复按原始对话发送 ──',
                              ),
                            ),
                            h(
                              'div',
                              { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } },
                              h(
                                'span',
                                { className: 'dsh-ctx-capsule-tok' },
                                (cp.shadowedTokenCount > 0
                                  ? '原 ~' + formatTokensCount(cp.shadowedTokenCount) + ' → '
                                  : '') +
                                  '~' +
                                  formatTokensCount(cp.tokens) +
                                  ' tok',
                              ),
                              h(
                                'button',
                                {
                                  type: 'button',
                                  className: 'dsh-ctx-hc-btn',
                                  onClick: function () {
                                    var next = Object.assign({}, expandedCp)
                                    next[cp.id] = !isCpOpen
                                    setExpandedCp(next)
                                  },
                                },
                                isCpOpen ? '收起 ▲' : '查看摘要 ▼',
                              ),
                              h(
                                'button',
                                {
                                  type: 'button',
                                  className: 'dsh-ctx-hc-btn',
                                  style: { color: '#d97706', border: '0.5px solid rgba(217,119,6,0.45)', fontWeight: 600 },
                                  title: '取消此次压缩摘要，并将上方被压缩的原始轮次恢复到发送上下文中',
                                  onClick: function () {
                                    controller.sendAction({
                                      action: 'uncompact-checkpoint',
                                      checkpointId: cp.id,
                                      restoreRaw: cp.included,
                                    })
                                  },
                                },
                                cp.included ? '🔓 取消压缩还原原文' : '📦 恢复使用压缩摘要',
                              ),
                            ),
                          ),
                          isCpOpen ? h('pre', { className: 'dsh-ctx-cp-preview' }, cp.fullText) : null,
                        )
                      }),
                    )
                  }),
                ),
          /* Inline docked turn detail on mobile (only when user taps a turn), or compact 1-line hint */
          isMob && activeHoverRow
            ? h(HoverTurnPreviewCard, {
                row: activeHoverRow,
                controller: controller,
                inlineDock: true,
                onClose: function () {
                  setHoveredTurn(null)
                },
              })
            : h(
                'div',
                { className: 'dsh-ctx-pop-hint' },
                h(
                  'span',
                  null,
                  isMob
                    ? '点勾选框开关整轮 · 轻触轮次展开细项（提问/工具/回复）'
                    : '悬停任意轮次可在右侧预览对话内容与细项开关',
                ),
                h('span', null, isMob ? '' : 'Shift+点击可连选'),
              ),
        ),
        /* Side Floating Preview Card for desktop hover only */
        !isMob && activeHoverRow
          ? h(HoverTurnPreviewCard, {
              cardRef: hoverCardRef,
              style: {
                top: String(hoverCardPos.top) + 'px',
                left: String(hoverCardPos.left) + 'px',
                width: String(hoverCardPos.width) + 'px',
              },
              row: activeHoverRow,
              controller: controller,
              onClose: function () {
                insideHoverCardRef.current = false
                setHoveredTurn(null)
              },
              onMouseEnter: function () {
                insideHoverCardRef.current = true
                if (hoverTimerRef.current) {
                  clearTimeout(hoverTimerRef.current)
                  hoverTimerRef.current = null
                }
                if (switchTimerRef.current) {
                  clearTimeout(switchTimerRef.current)
                  switchTimerRef.current = null
                }
              },
              onMouseLeave: function () {
                insideHoverCardRef.current = false
              },
            })
          : null,
      )
    }

    function QuickPhrasesEditorList(props) {
      var phrases = props.phrases
      var onSave = props.onSave
      var onSend = props.onSend
      var onInsert = props.onInsert
      var compact = Boolean(props.compact)

      var newTextState = useState('')
      var newText = newTextState[0]
      var setNewText = newTextState[1]

      var editingIdxState = useState(-1)
      var editingIdx = editingIdxState[0]
      var setEditingIdx = editingIdxState[1]

      var editingValState = useState('')
      var editingVal = editingValState[0]
      var setEditingVal = editingValState[1]

      var handleAdd = function () {
        var trimmed = String(newText || '').trim()
        if (!trimmed) return
        var next = phrases.concat([trimmed])
        onSave(next)
        setNewText('')
      }

      var handleDelete = function (idx) {
        var next = phrases.filter(function (_x, i) {
          return i !== idx
        })
        onSave(next)
      }

      var handleMove = function (idx, dir) {
        var target = idx + dir
        if (target < 0 || target >= phrases.length) return
        var next = phrases.slice()
        var tmp = next[idx]
        next[idx] = next[target]
        next[target] = tmp
        onSave(next)
      }

      var handleSaveEdit = function (idx) {
        var trimmed = String(editingVal || '').trim()
        if (!trimmed) return
        var next = phrases.slice()
        next[idx] = trimmed
        onSave(next)
        setEditingIdx(-1)
      }

      return h(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
        h(
          'div',
          { className: 'dsh-ctx-quick-list', style: compact ? { maxHeight: '220px' } : { maxHeight: '320px' } },
          phrases.map(function (phrase, idx) {
            var isEditing = editingIdx === idx
            return h(
              'div',
              { key: String(idx) + '-' + phrase, className: 'dsh-ctx-quick-item' },
              isEditing
                ? h(
                    'div',
                    { className: 'dsh-ctx-quick-add-row', style: { flex: 1 } },
                    h('input', {
                      type: 'text',
                      className: 'dsh-ctx-quick-input',
                      value: editingVal,
                      onChange: function (e) {
                        setEditingVal(e.target.value)
                      },
                      onKeyDown: function (e) {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleSaveEdit(idx)
                        } else if (e.key === 'Escape') {
                          setEditingIdx(-1)
                        }
                      },
                    }),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'dsh-ctx-quick-mini-btn',
                        'data-primary': 'true',
                        onClick: function () {
                          handleSaveEdit(idx)
                        },
                      },
                      '保存',
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'dsh-ctx-quick-mini-btn',
                        onClick: function () {
                          setEditingIdx(-1)
                        },
                      },
                      '取消',
                    ),
                  )
                : h(
                    React.Fragment,
                    null,
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'dsh-ctx-quick-send-btn',
                        title: onSend ? '点击直接发送: ' + phrase : phrase,
                        onClick: function () {
                          if (onSend) onSend(phrase)
                        },
                      },
                      h(
                        'span',
                        {
                          style: {
                            display: 'inline-block',
                            minWidth: '18px',
                            fontSize: '11px',
                            color: 'var(--dsw-alias-label-tertiary)',
                          },
                        },
                        String(idx + 1) + '.',
                      ),
                      phrase,
                    ),
                    h(
                      'div',
                      { className: 'dsh-ctx-quick-actions' },
                      onSend
                        ? h(
                            'button',
                            {
                              type: 'button',
                              className: 'dsh-ctx-quick-mini-btn',
                              'data-primary': 'true',
                              title: '直接发送此常用语',
                              onClick: function () {
                                onSend(phrase)
                              },
                            },
                            '发送',
                          )
                        : null,
                      onInsert
                        ? h(
                            'button',
                            {
                              type: 'button',
                              className: 'dsh-ctx-quick-mini-btn',
                              title: '填入输入框（不立即发送）',
                              onClick: function () {
                                onInsert(phrase)
                              },
                            },
                            '填入',
                          )
                        : null,
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'dsh-ctx-quick-mini-btn',
                          title: '上移',
                          disabled: idx === 0,
                          onClick: function () {
                            handleMove(idx, -1)
                          },
                        },
                        '↑',
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'dsh-ctx-quick-mini-btn',
                          title: '下移',
                          disabled: idx === phrases.length - 1,
                          onClick: function () {
                            handleMove(idx, 1)
                          },
                        },
                        '↓',
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'dsh-ctx-quick-mini-btn',
                          title: '修改',
                          onClick: function () {
                            setEditingIdx(idx)
                            setEditingVal(phrase)
                          },
                        },
                        '改',
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'dsh-ctx-quick-mini-btn',
                          title: '删除',
                          onClick: function () {
                            handleDelete(idx)
                          },
                        },
                        '删',
                      ),
                    ),
                  ),
            )
          }),
        ),
        h(
          'div',
          { className: 'dsh-ctx-quick-add-row' },
          h('input', {
            type: 'text',
            className: 'dsh-ctx-quick-input',
            placeholder: '新增常用对话（回车添加）…',
            value: newText,
            onChange: function (e) {
              setNewText(e.target.value)
            },
            onKeyDown: function (e) {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAdd()
              }
            },
          }),
          h(
            'button',
            {
              type: 'button',
              className: 'dsh-ctx-quick-mini-btn',
              'data-primary': 'true',
              onClick: handleAdd,
            },
            '+ 添加',
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dsh-ctx-quick-mini-btn',
              title: '恢复默认常用对话列表',
              onClick: function () {
                onSave(DEFAULT_QUICK_PHRASES.slice())
              },
            },
            '重置',
          ),
        ),
      )
    }

    var SWEET_VOICE_CATALOG = [
      {
        id: 'xiaoyi_sweet',
        label: '🎀 晓伊 · 元气甜妹',
        tags: '清脆灵动 · 听歌穿透力最强（推荐）',
        sample: '嗨！我是晓伊，你的专属甜美语音助手，现在声音已经调得更响亮清晰啦！',
      },
      {
        id: 'xiaoxiao_gentle',
        label: '🌸 晓晓 · 温柔知性甜音',
        tags: '柔和细腻 · 自然亲切',
        sample: '你好呀，我是晓晓，我已经帮你把今天的重要信息都整理好啦。',
      },
      {
        id: 'xiaomeng_dreamy',
        label: '🍬 晓梦 · 软萌梦幻少女',
        tags: '软糯治愈 · 乖巧甜润',
        sample: '收到啦！这件事就包在我和后台的小伙伴身上，弄好第一时间叫你哦。',
      },
      {
        id: 'xiaoshuang_lively',
        label: '✨ 晓双 · 俏皮精灵萌音',
        tags: '轻快抓耳 · 活力萌妹',
        sample: '叮咚！后台的子代理任务已经全部跑通啦，要不要现在看一眼结果呀？',
      },
      {
        id: 'hsiaochen_taiwan',
        label: '🧋 晓臻 · 台湾温柔甜姐',
        tags: '台腔酥软 · 温婉亲和',
        sample: '哈喽，这边的任务已经帮你安排下去了喔，有新的进展我再跟你说。',
      },
      {
        id: 'hsiaoyu_taiwan',
        label: '🍃 晓雨 · 台系清新甜妹',
        tags: '台系明快 · 清脆好听',
        sample: '没问题喔！我已经把这两个任务分派给后台子代理处理了，请放心交给我吧。',
      },
      {
        id: 'xiaobei_northeast',
        label: '🍒 晓北 · 爽朗甜酷少女',
        tags: '东北甜妹 · 热情利落',
        sample: '妥妥的！这活儿我已经派给子代理去干了，一会儿完事儿立马喊你！',
      },
      {
        id: 'hiugaai_cantonese',
        label: '🌺 晓佳 · 粤语港风甜音',
        tags: '粤语甜美 · 温柔御姐',
        sample: '早晨呀，今日嘅重要消息同埋待办事项我都同你整理好啦。',
      },
      {
        id: 'sapi_local_loud',
        label: '⚡ 本地极速超响女声',
        tags: '离线零延迟 · 3.8倍硬件压限',
        sample: '本地极速超响语音模式已激活，离线环境下依然保持最大响度输出。',
      },
    ]

    var SWEET_GAIN_OPTIONS = [
      { idx: 0, label: '🔊 350% 强力穿透（听歌推荐）', gain: 3.8, eqDb: 5.5 },
      { idx: 1, label: '🔊 500% 狂暴超响（大音量放歌）', gain: 5.5, eqDb: 6.5 },
      { idx: 2, label: '🔊 250% 均衡增强', gain: 2.6, eqDb: 4.5 },
      { idx: 3, label: '🔊 150% 轻柔室内', gain: 1.6, eqDb: 2.5 },
    ]

    var SWEET_SPEED_OPTIONS = [
      { idx: 0, label: '1.0x 自然语速（推荐）', sapiRate: 1, playbackRate: 1.0 },
      { idx: 1, label: '1.2x 干练轻快', sapiRate: 2, playbackRate: 1.1 },
      { idx: 2, label: '1.4x 高效倍速', sapiRate: 3, playbackRate: 1.25 },
      { idx: 3, label: '1.7x 极速速览', sapiRate: 4, playbackRate: 1.45 },
    ]

    var previewAudioEl = null
    var previewAudioCtx = null
    var previewGainNode = null
    var previewEqNode = null
    var activeBlobUrl = null
    var SILENT_WAV_DATA_URI =
      'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'

    function ensurePreviewAudioElement() {
      if (previewAudioEl === null && typeof Audio === 'function') {
        previewAudioEl = new Audio()
        previewAudioEl.preload = 'auto'
        previewAudioEl.volume = 1.0
        previewAudioEl.playsInline = true
        if (previewAudioEl.setAttribute) {
          previewAudioEl.setAttribute('playsinline', 'true')
          previewAudioEl.setAttribute('webkit-playsinline', 'true')
        }
        if (typeof document !== 'undefined' && document.body && !previewAudioEl.parentElement) {
          previewAudioEl.style.display = 'none'
          document.body.appendChild(previewAudioEl)
        }
      }
      return previewAudioEl
    }

    function unlockSweetVoiceAudio() {
      try {
        var el = ensurePreviewAudioElement()
        if (el && el.paused) {
          el.src = SILENT_WAV_DATA_URI
          var p = el.play()
          if (p && typeof p.then === 'function') {
            p.then(function () {
              if (el.src === SILENT_WAV_DATA_URI) {
                el.pause()
              }
            }).catch(function () {})
          }
        }
        if (previewAudioCtx !== null && previewAudioCtx.state === 'suspended') {
          previewAudioCtx.resume().catch(function () {})
        }
        if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
          try {
            window.speechSynthesis.resume()
          } catch {}
        }
      } catch {}
    }

    function speakWithWebSpeechFallback(text, playbackRate, onDone) {
      try {
        if (
          typeof window === 'undefined' ||
          !('speechSynthesis' in window) ||
          typeof SpeechSynthesisUtterance === 'undefined' ||
          !text
        ) {
          if (onDone) onDone()
          return
        }
        var synth = window.speechSynthesis
        try {
          synth.cancel()
          if (typeof synth.resume === 'function') synth.resume()
        } catch {}
        var utter = new SpeechSynthesisUtterance(String(text))
        utter.lang = 'zh-CN'
        utter.volume = 1.0
        utter.rate = Math.max(0.8, Math.min(2.0, Number(playbackRate) || 1.1))
        utter.pitch = 1.12
        var settled = false
        var finish = function () {
          if (settled) return
          settled = true
          if (fbTimer) clearTimeout(fbTimer)
          if (onDone) onDone()
        }
        var fbTimer = setTimeout(finish, Math.min(25000, Math.max(3500, String(text).length * 320 + 2000)))
        utter.onend = finish
        utter.onerror = finish
        synth.speak(utter)
      } catch {
        if (onDone) onDone()
      }
    }

    function base64ToBlobUrl(b64, mimeType) {
      try {
        if (!b64 || typeof atob !== 'function' || typeof Blob === 'undefined' || typeof URL === 'undefined') {
          return null
        }
        var bin = atob(b64)
        var len = bin.length
        if (len < 44) return null
        var bytes = new Uint8Array(len)
        for (var i = 0; i < len; i++) {
          bytes[i] = bin.charCodeAt(i)
        }
        var blob = new Blob([bytes], { type: mimeType || 'audio/mpeg' })
        return URL.createObjectURL(blob)
      } catch {
        return null
      }
    }

    function revokeActiveBlobUrl() {
      if (activeBlobUrl !== null) {
        var old = activeBlobUrl
        activeBlobUrl = null
        try {
          URL.revokeObjectURL(old)
        } catch {}
      }
    }

    function playSweetVoiceSample(voiceId, gainIdx, speedIdx, onDone) {
      unlockSweetVoiceAudio()
      var preset =
        SWEET_VOICE_CATALOG.find(function (p) {
          return p.id === voiceId
        }) || SWEET_VOICE_CATALOG[0]
      playSweetVoiceText(preset.sample, preset.id, gainIdx, speedIdx, onDone)
    }

    function playSweetVoiceText(text, voiceId, gainIdx, speedIdx, onDone, customUrl, audioBase64, audioMime) {
      try {
        var el = ensurePreviewAudioElement()
        var speedOpt = SWEET_SPEED_OPTIONS[speedIdx] || SWEET_SPEED_OPTIONS[0]
        var preset =
          SWEET_VOICE_CATALOG.find(function (p) {
            return p.id === voiceId
          }) || SWEET_VOICE_CATALOG[0]

        if (!el) {
          speakWithWebSpeechFallback(text, speedOpt.playbackRate, onDone)
          return
        }

        el.onended = null
        el.onerror = null
        el.pause()
        revokeActiveBlobUrl()

        if (previewAudioCtx !== null && previewAudioCtx.state === 'suspended') {
          try {
            previewAudioCtx.resume().catch(function () {})
          } catch {}
        }

        var ttsEndpointUrl =
          'api/subagent-monitor/tts?v=22&fast=1&voice=' +
          encodeURIComponent(preset.id) +
          '&rate=' +
          String(speedOpt.sapiRate) +
          '&text=' +
          encodeURIComponent(text)

        var blobUrl = audioBase64 ? base64ToBlobUrl(audioBase64, audioMime) : null
        if (blobUrl) activeBlobUrl = blobUrl

        var primaryUrl = blobUrl || customUrl || ttsEndpointUrl
        var backupUrl = blobUrl ? customUrl || ttsEndpointUrl : customUrl ? ttsEndpointUrl : null
        var triedBackup = false
        var finished = false

        var finishOnce = function () {
          if (finished) return
          finished = true
          if (safetyTimer) {
            clearTimeout(safetyTimer)
            safetyTimer = null
          }
          revokeActiveBlobUrl()
          if (onDone) onDone()
        }

        var tryFallbackOrFinish = function () {
          if (finished) return
          if (!triedBackup && backupUrl) {
            triedBackup = true
            try {
              el.src = backupUrl
              el.playbackRate = speedOpt.playbackRate
              el.play().catch(function () {
                speakWithWebSpeechFallback(text, speedOpt.playbackRate, finishOnce)
              })
              return
            } catch {}
          }
          speakWithWebSpeechFallback(text, speedOpt.playbackRate, finishOnce)
        }

        var safetyTimer = setTimeout(function () {
          safetyTimer = null
          finishOnce()
        }, Math.min(28000, Math.max(5500, String(text || '').length * 340 + 3000)))

        el.volume = 1.0
        el.onended = function () {
          finishOnce()
        }
        el.onerror = function () {
          tryFallbackOrFinish()
        }
        el.src = primaryUrl
        el.playbackRate = speedOpt.playbackRate
        var playPromise = el.play()
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {
            tryFallbackOrFinish()
          })
        }
      } catch {
        speakWithWebSpeechFallback(text, 1.1, onDone)
      }
    }

    function stopSweetVoiceAudio(closeAudioContext) {
      try {
        if (previewAudioEl !== null) {
          previewAudioEl.onended = null
          previewAudioEl.onerror = null
          previewAudioEl.pause()
          previewAudioEl.removeAttribute('src')
          previewAudioEl.load()
        }
        revokeActiveBlobUrl()
        if (closeAudioContext && previewAudioCtx !== null) {
          var ctxToClose = previewAudioCtx
          previewAudioCtx = null
          previewGainNode = null
          previewEqNode = null
          if (typeof ctxToClose.close === 'function') {
            ctxToClose.close().catch(function () {})
          }
        }
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel()
        }
      } catch {}
    }

    function LiveVoiceCallModal(props) {
      var onClose = props.onClose
      var onDispatchPrompt = props.onDispatchPrompt
      var sessionId = props.sessionId

      var voiceIdState = useState(function () {
        try {
          return window.localStorage.getItem('dsh_tts_voice_id_v1') || 'xiaoyi_sweet'
        } catch {
          return 'xiaoyi_sweet'
        }
      })
      var voiceId = voiceIdState[0]

      var gainIdxState = useState(function () {
        try {
          var g = Number(window.localStorage.getItem('dsh_tts_gain_idx_v1') || '0')
          return Number.isInteger(g) && g >= 0 && g < SWEET_GAIN_OPTIONS.length ? g : 0
        } catch {
          return 0
        }
      })
      var gainIdx = gainIdxState[0]

      var speedIdxState = useState(function () {
        try {
          var s = Number(window.localStorage.getItem('dsh_tts_speed_idx_v1') || '0')
          return Number.isInteger(s) && s >= 0 && s < SWEET_SPEED_OPTIONS.length ? s : 0
        } catch {
          return 0
        }
      })
      var speedIdx = speedIdxState[0]

      var curVoice =
        SWEET_VOICE_CATALOG.find(function (p) {
          return p.id === voiceId
        }) || SWEET_VOICE_CATALOG[0]
      var shortName = curVoice.label.replace(/^[^\u4e00-\u9fa5A-Za-z]+/, '').split(/[·\s]/)[0] || '晓伊'

      var callPhaseState = useState('listening')
      var callPhase = callPhaseState[0]
      var setCallPhase = callPhaseState[1]
      var callPhaseRef = useRef('listening')
      callPhaseRef.current = callPhase

      var micActiveState = useState(true)
      var micActive = micActiveState[0]
      var setMicActive = micActiveState[1]
      var micActiveRef = useRef(true)
      micActiveRef.current = micActive

      var liveInterimState = useState('')
      var liveInterim = liveInterimState[0]
      var setLiveInterim = liveInterimState[1]

      var manualInputState = useState('')
      var manualInput = manualInputState[0]
      var setManualInput = manualInputState[1]

      var historyState = useState([
        {
          role: 'assistant',
          content: '嗨！我是' + shortName + '，我在听呢，你可以随时停顿慢慢说，说完我再回你！',
        },
      ])
      var history = historyState[0]
      var setHistory = historyState[1]

      var recRef = useRef(null)
      var restartTimerRef = useRef(null)
      var watchdogTimerRef = useRef(null)
      var isMountedRef = useRef(true)
      var historyRef = useRef(history)
      historyRef.current = history
      var chatListRef = useRef(null)
      var silenceTimerRef = useRef(null)
      var accumulatedSpeechRef = useRef('')
      var currentSegmentRef = useRef('')
      var currentInstanceFullRef = useRef('')
      var pendingInterimRef = useRef('')
      var lastSubmittedTextRef = useRef('')
      var lastSubmittedAtRef = useRef(0)
      var consumedFullRef = useRef('')
      var inFlightUserTextRef = useRef('')
      var thinkingAbortRef = useRef(null)

      var clearSpeechBuffer = useCallback(function () {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = null
        }
        accumulatedSpeechRef.current = ''
        currentSegmentRef.current = ''
        pendingInterimRef.current = ''
        consumedFullRef.current = currentInstanceFullRef.current
        setLiveInterim('')
      }, [])

      var stopMicrophoneCompletely = useCallback(function (preserveBuffer) {
        if (!preserveBuffer) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }
          accumulatedSpeechRef.current = ''
          currentSegmentRef.current = ''
          pendingInterimRef.current = ''
        }
        if (restartTimerRef.current) {
          clearTimeout(restartTimerRef.current)
          restartTimerRef.current = null
        }
        consumedFullRef.current = ''
        currentInstanceFullRef.current = ''
        if (recRef.current) {
          var r = recRef.current
          recRef.current = null
          try {
            r.onresult = null
            r.onend = null
            r.onerror = null
            r.abort()
          } catch {}
          try {
            r.stop()
          } catch {}
        }
      }, [])

      var computePauseWaitMs = function (text) {
        var t = String(text || '').trim()
        if (!t) return 3500
        if (
          /(?:呃|嗯|啊|呢|吧|嘛|哦|噢|那个|就是|然后|还有|但是|不过|因为|所以|如果|比如|另外|而且|或者|第一|第二|首先|其次|再一个|就是说|的话)[，,、。…\s]*$/.test(
            t,
          ) ||
          /[，,、：:—…]\s*$/.test(t)
        ) {
          return 4800
        }
        if (t.length <= 5) {
          return 3800
        }
        return 3400
      }

      var commitBufferedUtterance = useCallback(function () {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = null
        }
        var fullToCommit = String(pendingInterimRef.current || '').trim()
        if (!fullToCommit) return
        consumedFullRef.current = currentInstanceFullRef.current
        accumulatedSpeechRef.current = ''
        currentSegmentRef.current = ''
        pendingInterimRef.current = ''
        setLiveInterim('')
        handleUserUtterance(fullToCommit)
      }, [])

      var scheduleSilenceCommit = useCallback(
        function (combinedText) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }
          var waitMs = computePauseWaitMs(combinedText)
          silenceTimerRef.current = setTimeout(function () {
            silenceTimerRef.current = null
            if (!isMountedRef.current) return
            var buffered = String(pendingInterimRef.current || '').trim()
            if (buffered) {
              consumedFullRef.current = currentInstanceFullRef.current
              accumulatedSpeechRef.current = ''
              currentSegmentRef.current = ''
              pendingInterimRef.current = ''
              setLiveInterim('')
              handleUserUtterance(buffered)
            }
          }, waitMs)
        },
        [],
      )

      var startMicrophone = useCallback(
        function (preserveBuffer) {
          stopMicrophoneCompletely(Boolean(preserveBuffer))
          if (!isMountedRef.current || !micActiveRef.current) return
          var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
          if (!SpeechRec) return
          try {
            var rec = new SpeechRec()
            rec.lang = 'zh-CN'
            rec.continuous = true
            rec.interimResults = true
            rec.maxAlternatives = 1
            consumedFullRef.current = ''
            currentInstanceFullRef.current = ''
            currentSegmentRef.current = ''
            rec.onresult = function (ev) {
              if (!isMountedRef.current || !micActiveRef.current) return
              var fullTranscript = ''
              for (var i = 0; i < ev.results.length; i++) {
                var seg = (ev.results[i] && ev.results[i][0] && ev.results[i][0].transcript) || ''
                fullTranscript += seg
              }
              currentInstanceFullRef.current = fullTranscript
              var delta = fullTranscript
              if (consumedFullRef.current && fullTranscript.indexOf(consumedFullRef.current) === 0) {
                delta = fullTranscript.slice(consumedFullRef.current.length)
              }
              var cleanDelta = delta.trim()
              if (!cleanDelta) return

              if (callPhaseRef.current === 'thinking') {
                if (thinkingAbortRef.current) {
                  try {
                    thinkingAbortRef.current.abort()
                  } catch {}
                  thinkingAbortRef.current = null
                }
                if (inFlightUserTextRef.current) {
                  var prevText = inFlightUserTextRef.current
                  inFlightUserTextRef.current = ''
                  accumulatedSpeechRef.current = prevText
                  lastSubmittedTextRef.current = ''
                  setHistory(function (prev) {
                    if (prev.length > 0 && prev[prev.length - 1].role === 'user') {
                      return prev.slice(0, -1)
                    }
                    return prev
                  })
                }
                callPhaseRef.current = 'listening'
                setCallPhase('listening')
              } else if (callPhaseRef.current === 'speaking') {
                if (cleanDelta.length < 2) return
                stopSweetVoiceAudio(false)
                callPhaseRef.current = 'listening'
                setCallPhase('listening')
              }

              currentSegmentRef.current = cleanDelta
              var combined = (
                accumulatedSpeechRef.current
                  ? accumulatedSpeechRef.current + '，' + currentSegmentRef.current
                  : currentSegmentRef.current
              )
                .replace(/[，,]{2,}/g, '，')
                .trim()

              pendingInterimRef.current = combined
              setLiveInterim(combined)
              scheduleSilenceCommit(combined)
            }
            rec.onerror = function (ev) {
              var errCode = ev && ev.error ? String(ev.error) : ''
              if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
                return
              }
              if (recRef.current === rec) {
                recRef.current = null
              }
              if (currentSegmentRef.current) {
                accumulatedSpeechRef.current = (
                  accumulatedSpeechRef.current
                    ? accumulatedSpeechRef.current + '，' + currentSegmentRef.current
                    : currentSegmentRef.current
                )
                  .replace(/[，,]{2,}/g, '，')
                  .trim()
                currentSegmentRef.current = ''
              }
              if (isMountedRef.current && micActiveRef.current && callPhaseRef.current !== 'speaking') {
                if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
                restartTimerRef.current = setTimeout(function () {
                  restartTimerRef.current = null
                  if (isMountedRef.current && micActiveRef.current && callPhaseRef.current !== 'speaking') {
                    startMicrophone(true)
                  }
                }, 120)
              }
            }
            rec.onend = function () {
              if (recRef.current === rec) {
                recRef.current = null
              }
              if (currentSegmentRef.current) {
                accumulatedSpeechRef.current = (
                  accumulatedSpeechRef.current
                    ? accumulatedSpeechRef.current + '，' + currentSegmentRef.current
                    : currentSegmentRef.current
                )
                  .replace(/[，,]{2,}/g, '，')
                  .trim()
                currentSegmentRef.current = ''
              }
              if (isMountedRef.current && micActiveRef.current && callPhaseRef.current !== 'speaking') {
                if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
                restartTimerRef.current = setTimeout(function () {
                  restartTimerRef.current = null
                  if (isMountedRef.current && micActiveRef.current && callPhaseRef.current !== 'speaking') {
                    startMicrophone(true)
                  }
                }, 60)
              }
            }
            recRef.current = rec
            rec.start()
          } catch {}
        },
        [stopMicrophoneCompletely, scheduleSilenceCommit],
      )

      var handleUserUtterance = useCallback(
        function (text) {
          var clean = String(text || '').trim()
          if (!clean) return
          var now = Date.now()
          if (clean === lastSubmittedTextRef.current && now - lastSubmittedAtRef.current < 2000) {
            return
          }
          lastSubmittedTextRef.current = clean
          lastSubmittedAtRef.current = now
          inFlightUserTextRef.current = clean
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }
          accumulatedSpeechRef.current = ''
          currentSegmentRef.current = ''
          pendingInterimRef.current = ''
          consumedFullRef.current = currentInstanceFullRef.current
          stopSweetVoiceAudio(false)
          ensurePreviewAudioElement()
          setLiveInterim('')
          var nextHist = historyRef.current.concat([{ role: 'user', content: clean }])
          setHistory(nextHist)
          callPhaseRef.current = 'thinking'
          setCallPhase('thinking')
          var speedOpt = SWEET_SPEED_OPTIONS[speedIdx] || SWEET_SPEED_OPTIONS[0]

          if (thinkingAbortRef.current) {
            try {
              thinkingAbortRef.current.abort()
            } catch {}
          }
          var abortCtrl = typeof AbortController === 'function' ? new AbortController() : null
          thinkingAbortRef.current = abortCtrl

          fetch('api/subagent-monitor/voice-chat', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            signal: abortCtrl ? abortCtrl.signal : undefined,
            body: JSON.stringify({
              text: clean,
              history: nextHist,
              voiceId: voiceId,
              rate: speedOpt.sapiRate,
              sessionId: sessionId,
            }),
          })
            .then(function (r) {
              return r.json()
            })
            .then(function (data) {
              if (!isMountedRef.current) return
              if (thinkingAbortRef.current === abortCtrl) {
                thinkingAbortRef.current = null
              }
              inFlightUserTextRef.current = ''
              stopMicrophoneCompletely(false)
              var reply = (data && data.spoken_reply) || '我在听呢，你继续说！'
              var replyAudioUrl = data && data.audioUrl ? data.audioUrl : undefined
              var replyAudioB64 = data && data.audioBase64 ? data.audioBase64 : undefined
              var replyAudioMime = data && data.audioMime ? data.audioMime : undefined
              setHistory(function (prev) {
                return prev.concat([
                  {
                    role: 'assistant',
                    content: reply,
                    audioUrl: replyAudioUrl,
                    audioBase64: replyAudioB64,
                    audioMime: replyAudioMime,
                  },
                ])
              })
              callPhaseRef.current = 'speaking'
              setCallPhase('speaking')

              playSweetVoiceText(
                reply,
                voiceId,
                gainIdx,
                speedIdx,
                function () {
                  if (isMountedRef.current) {
                    callPhaseRef.current = 'listening'
                    setCallPhase('listening')
                    if (micActiveRef.current) startMicrophone(false)
                  }
                },
                replyAudioUrl,
                replyAudioB64,
                replyAudioMime,
              )

              if (data && data.should_dispatch_now && data.compiled_agent_prompt) {
                if (onDispatchPrompt) onDispatchPrompt(data.compiled_agent_prompt)
              }
            })
            .catch(function (err) {
              if (!isMountedRef.current) return
              if (err && err.name === 'AbortError') return
              inFlightUserTextRef.current = ''
              stopMicrophoneCompletely(false)
              var fallbackReply = '信号刚刚闪了一下，你再跟我说一遍好不好？'
              setHistory(function (prev) {
                return prev.concat([{ role: 'assistant', content: fallbackReply }])
              })
              callPhaseRef.current = 'speaking'
              setCallPhase('speaking')
              playSweetVoiceText(fallbackReply, voiceId, gainIdx, speedIdx, function () {
                if (isMountedRef.current) {
                  callPhaseRef.current = 'listening'
                  setCallPhase('listening')
                  if (micActiveRef.current) startMicrophone(false)
                }
              })
            })
        },
        [voiceId, gainIdx, speedIdx, sessionId, onDispatchPrompt, startMicrophone, stopMicrophoneCompletely],
      )

      useEffect(function () {
        if (chatListRef.current) {
          chatListRef.current.scrollTop = chatListRef.current.scrollHeight
        }
      }, [history, liveInterim])

      useEffect(function () {
        isMountedRef.current = true
        callPhaseRef.current = 'listening'
        setCallPhase('listening')
        ensurePreviewAudioElement()
        startMicrophone(false)

        watchdogTimerRef.current = setInterval(function () {
          if (
            isMountedRef.current &&
            micActiveRef.current &&
            callPhaseRef.current === 'listening' &&
            recRef.current === null
          ) {
            startMicrophone(true)
          }
        }, 700)

        var onVisChange = function () {
          if (document.visibilityState === 'hidden') {
            stopMicrophoneCompletely(true)
          } else if (isMountedRef.current && micActiveRef.current && callPhaseRef.current === 'listening') {
            startMicrophone(true)
          }
        }
        document.addEventListener('visibilitychange', onVisChange)

        return function () {
          isMountedRef.current = false
          micActiveRef.current = false
          if (thinkingAbortRef.current) {
            try {
              thinkingAbortRef.current.abort()
            } catch {}
            thinkingAbortRef.current = null
          }
          if (watchdogTimerRef.current) {
            clearInterval(watchdogTimerRef.current)
            watchdogTimerRef.current = null
          }
          document.removeEventListener('visibilitychange', onVisChange)
          stopMicrophoneCompletely(false)
          stopSweetVoiceAudio(true)
        }
      }, [])

      var handleHangup = function () {
        isMountedRef.current = false
        micActiveRef.current = false
        if (thinkingAbortRef.current) {
          try {
            thinkingAbortRef.current.abort()
          } catch {}
          thinkingAbortRef.current = null
        }
        stopMicrophoneCompletely(false)
        stopSweetVoiceAudio(true)
        onClose()
      }

      var toggleMic = function () {
        unlockSweetVoiceAudio()
        var next = !micActive
        micActiveRef.current = next
        setMicActive(next)
        if (!next) {
          stopMicrophoneCompletely(false)
          setLiveInterim('')
        } else {
          startMicrophone(false)
        }
      }

      var replayAssistantMessage = function (msg) {
        if (!msg || !msg.content) return
        unlockSweetVoiceAudio()
        stopMicrophoneCompletely(true)
        callPhaseRef.current = 'speaking'
        setCallPhase('speaking')
        playSweetVoiceText(
          msg.content,
          voiceId,
          gainIdx,
          speedIdx,
          function () {
            if (isMountedRef.current) {
              callPhaseRef.current = 'listening'
              setCallPhase('listening')
              if (micActiveRef.current) startMicrophone(true)
            }
          },
          msg.audioUrl,
          msg.audioBase64,
          msg.audioMime,
        )
      }

      return h(
        'div',
        {
          style: {
            position: 'fixed',
            inset: 0,
            zIndex: 2147483600,
            background: 'rgba(8, 11, 20, 0.88)',
            backdropFilter: 'blur(14px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
          },
          onClick: function (e) {
            if (e.target === e.currentTarget) handleHangup()
          },
        },
        h(
          'div',
          {
            style: {
              width: 'min(440px, 96vw)',
              height: 'min(660px, 88dvh)',
              background: 'linear-gradient(180deg, #131c31 0%, #0b1120 100%)',
              color: '#f8fafc',
              borderRadius: '24px',
              border: '1px solid rgba(244, 114, 182, 0.35)',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            },
            onClick: function (e) {
              e.stopPropagation()
            },
          },
          h(
            'div',
            {
              style: {
                padding: '22px 16px 14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                background: 'radial-gradient(circle at 50% 25%, rgba(236,72,153,0.22), transparent 70%)',
              },
            },
            h(
              'div',
              {
                onClick: function () {
                  unlockSweetVoiceAudio()
                  if (pendingInterimRef.current) {
                    commitBufferedUtterance()
                    return
                  }
                  stopSweetVoiceAudio(false)
                  callPhaseRef.current = 'listening'
                  setCallPhase('listening')
                  if (micActiveRef.current) startMicrophone(true)
                },
                style: {
                  width: '88px',
                  height: '88px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  background:
                    callPhase === 'speaking'
                      ? 'linear-gradient(135deg, #f472b6, #db2777)'
                      : callPhase === 'thinking'
                        ? 'linear-gradient(135deg, #fbbf24, #d97706)'
                        : 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                  boxShadow:
                    callPhase === 'speaking'
                      ? '0 0 0 8px rgba(244,114,182,0.22), 0 0 36px rgba(244,114,182,0.85)'
                      : callPhase === 'thinking'
                        ? '0 0 0 6px rgba(251,191,36,0.2), 0 0 28px rgba(251,191,36,0.6)'
                        : '0 0 0 4px rgba(236,72,153,0.16), 0 8px 24px rgba(0,0,0,0.45)',
                  transition: 'all 0.25s ease',
                },
              },
              curVoice.label.slice(0, 2),
            ),
            h(
              'div',
              {
                style: {
                  marginTop: '10px',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#fdf2f8',
                },
              },
              shortName,
            ),
            h(
              'div',
              {
                style: {
                  marginTop: '4px',
                  fontSize: '12px',
                  color:
                    !micActive
                      ? '#94a3b8'
                      : callPhase === 'speaking'
                        ? '#f9a8d4'
                        : callPhase === 'thinking'
                          ? '#fcd34d'
                          : '#86efac',
                },
              },
              !micActive
                ? '麦克风已静音'
                : callPhase === 'speaking'
                  ? '正在说话（点击头像可随时打断）...'
                  : callPhase === 'thinking'
                    ? '正在思考（继续说话可自动追加）...'
                    : liveInterim
                      ? '正在持续接收（中间停顿不会中断）...'
                      : '正在听你说...',
            ),
          ),
          h(
            'div',
            {
              ref: chatListRef,
              style: {
                flex: 1,
                overflowY: 'auto',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              },
            },
            history.map(function (m, idx) {
              var isUser = m.role === 'user'
              return h(
                'div',
                {
                  key: idx,
                  onClick: !isUser
                    ? function () {
                        replayAssistantMessage(m)
                      }
                    : undefined,
                  title: !isUser ? '点击重新播放语音' : undefined,
                  style: {
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '84%',
                    padding: '10px 14px',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    background: isUser ? '#2563eb' : '#1e293b',
                    color: '#f8fafc',
                    border: isUser ? 'none' : '1px solid rgba(244,114,182,0.28)',
                    cursor: !isUser ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  },
                },
                h('span', { style: { flex: 1, wordBreak: 'break-word' } }, m.content),
                !isUser
                  ? h(
                      'span',
                      {
                        style: {
                          fontSize: '13px',
                          opacity: 0.75,
                          flexShrink: 0,
                        },
                      },
                      '🔊',
                    )
                  : null,
              )
            }),
            liveInterim
              ? h(
                  'div',
                  {
                    style: {
                      alignSelf: 'flex-end',
                      maxWidth: '86%',
                      padding: '10px 14px',
                      borderRadius: '16px 16px 4px 16px',
                      fontSize: '13.5px',
                      background: 'rgba(37, 99, 235, 0.45)',
                      color: '#e2e8f0',
                      border: '1px dashed rgba(147, 197, 253, 0.65)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    },
                  },
                  h('div', { style: { wordBreak: 'break-word', lineHeight: 1.45 } }, liveInterim + ' ...'),
                  h(
                    'div',
                    {
                      style: {
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '8px',
                        alignItems: 'center',
                      },
                    },
                    h(
                      'button',
                      {
                        type: 'button',
                        onClick: function () {
                          clearSpeechBuffer()
                        },
                        style: {
                          background: 'rgba(15, 23, 42, 0.55)',
                          color: '#cbd5e1',
                          border: '1px solid rgba(148, 163, 184, 0.35)',
                          borderRadius: '999px',
                          padding: '3px 10px',
                          fontSize: '11.5px',
                          cursor: 'pointer',
                        },
                      },
                      '🗑️ 重说',
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        onClick: function () {
                          unlockSweetVoiceAudio()
                          commitBufferedUtterance()
                        },
                        style: {
                          background: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '999px',
                          padding: '3px 11px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        },
                      },
                      '✅ 说完了，发送',
                    ),
                  ),
                )
              : null,
          ),
          h(
            'div',
            {
              style: {
                padding: '10px 12px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                background: '#090e1a',
              },
            },
            h(
              'button',
              {
                type: 'button',
                onClick: toggleMic,
                title: micActive ? '点击关闭麦克风' : '点击开启麦克风',
                style: {
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: 'none',
                  background: micActive ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.18)',
                  color: micActive ? '#4ade80' : '#94a3b8',
                  fontSize: '16px',
                  cursor: 'pointer',
                  flexShrink: 0,
                },
              },
              micActive ? '🎙️' : '🔇',
            ),
            h('input', {
              type: 'text',
              value: manualInput,
              placeholder: '直接说话，或在这里打字聊天...',
              onChange: function (e) {
                setManualInput(e.target.value)
              },
              onKeyDown: function (e) {
                if (e.key === 'Enter') {
                  unlockSweetVoiceAudio()
                  if (manualInput.trim()) {
                    var txt = manualInput.trim()
                    setManualInput('')
                    handleUserUtterance(txt)
                  } else if (pendingInterimRef.current) {
                    commitBufferedUtterance()
                  }
                }
              },
              style: {
                flex: 1,
                background: '#162033',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '999px',
                padding: '8px 14px',
                fontSize: '13.5px',
                outline: 'none',
              },
            }),
            manualInput.trim()
              ? h(
                  'button',
                  {
                    type: 'button',
                    onClick: function () {
                      unlockSweetVoiceAudio()
                      var txt = manualInput.trim()
                      if (!txt) return
                      setManualInput('')
                      handleUserUtterance(txt)
                    },
                    style: {
                      background: '#db2777',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '999px',
                      padding: '8px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      flexShrink: 0,
                    },
                  },
                  '发送',
                )
              : null,
            h(
              'button',
              {
                type: 'button',
                onClick: handleHangup,
                style: {
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                },
              },
              '挂断',
            ),
          ),
        ),
      )
    }

    function SweetVoiceSettingsPanel(props) {
      var defaultExpanded = props && props.standalone === true
      var expandedState = useState(true)
      var expanded = defaultExpanded ? true : expandedState[0]
      var setExpanded = expandedState[1]

      var voiceIdState = useState(function () {
        try {
          return window.localStorage.getItem('dsh_tts_voice_id_v1') || 'xiaoyi_sweet'
        } catch {
          return 'xiaoyi_sweet'
        }
      })
      var voiceId = voiceIdState[0]
      var setVoiceId = voiceIdState[1]

      var gainIdxState = useState(function () {
        try {
          var v = Number(window.localStorage.getItem('dsh_tts_gain_idx_v1') || '0')
          return Number.isInteger(v) && v >= 0 && v < SWEET_GAIN_OPTIONS.length ? v : 0
        } catch {
          return 0
        }
      })
      var gainIdx = gainIdxState[0]
      var setGainIdx = gainIdxState[1]

      var speedIdxState = useState(function () {
        try {
          var v = Number(window.localStorage.getItem('dsh_tts_speed_idx_v1') || '0')
          return Number.isInteger(v) && v >= 0 && v < SWEET_SPEED_OPTIONS.length ? v : 0
        } catch {
          return 0
        }
      })
      var speedIdx = speedIdxState[0]
      var setSpeedIdx = speedIdxState[1]

      var previewingIdState = useState(null)
      var previewingId = previewingIdState[0]
      var setPreviewingId = previewingIdState[1]

      useEffect(function () {
        var onSync = function () {
          try {
            setVoiceId(window.localStorage.getItem('dsh_tts_voice_id_v1') || 'xiaoyi_sweet')
            var g = Number(window.localStorage.getItem('dsh_tts_gain_idx_v1') || '0')
            if (Number.isInteger(g) && g >= 0 && g < SWEET_GAIN_OPTIONS.length) setGainIdx(g)
            var s = Number(window.localStorage.getItem('dsh_tts_speed_idx_v1') || '0')
            if (Number.isInteger(s) && s >= 0 && s < SWEET_SPEED_OPTIONS.length) setSpeedIdx(s)
          } catch {}
        }
        window.addEventListener('dsh-tts-settings-changed', onSync)
        return function () {
          window.removeEventListener('dsh-tts-settings-changed', onSync)
        }
      }, [])

      var selectVoice = function (nextId, doAudition) {
        setVoiceId(nextId)
        try {
          window.localStorage.setItem('dsh_tts_voice_id_v1', nextId)
          window.dispatchEvent(new CustomEvent('dsh-tts-settings-changed'))
        } catch {}
        if (doAudition) {
          setPreviewingId(nextId)
          playSweetVoiceSample(nextId, gainIdx, speedIdx, function () {
            setPreviewingId(null)
          })
        }
      }

      var selectGain = function (nextG) {
        setGainIdx(nextG)
        try {
          window.localStorage.setItem('dsh_tts_gain_idx_v1', String(nextG))
          window.dispatchEvent(new CustomEvent('dsh-tts-settings-changed'))
        } catch {}
      }

      var selectSpeed = function (nextS) {
        setSpeedIdx(nextS)
        try {
          window.localStorage.setItem('dsh_tts_speed_idx_v1', String(nextS))
          window.dispatchEvent(new CustomEvent('dsh-tts-settings-changed'))
        } catch {}
      }

      var curVoice =
        SWEET_VOICE_CATALOG.find(function (p) {
          return p.id === voiceId
        }) || SWEET_VOICE_CATALOG[0]
      var curGain = SWEET_GAIN_OPTIONS[gainIdx] || SWEET_GAIN_OPTIONS[0]

      return h(
        'div',
        {
          className: 'dsh-ctx-settings-row',
          style: {
            border: '1.5px solid rgba(236, 72, 153, 0.38)',
            background: 'linear-gradient(145deg, rgba(236, 72, 153, 0.06), rgba(168, 85, 247, 0.05))',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '12px',
          },
        },
        h(
          'div',
          { className: 'dsh-ctx-settings-head' },
          h(
            'div',
            null,
            h(
              'div',
              {
                className: 'dsh-ctx-settings-title',
                style: { color: '#db2777', fontWeight: 700, fontSize: '14.5px' },
              },
              '🎀 甜美语音角色库 & 听歌穿透响度增强 (Sweet Voices & Loudness Boost)',
            ),
            h(
              'div',
              { className: 'dsh-ctx-settings-desc', style: { marginTop: '4px' } },
              '当前选用：' +
                curVoice.label +
                ' · ' +
                curGain.label +
                '（已启用 2.85kHz 人声清脆提亮 + 动态压限放大，边放音乐边听依然清晰洪亮）',
            ),
          ),
          !defaultExpanded
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-ctx-toolbar-btn',
                  style: {
                    background: 'linear-gradient(135deg, #ec4899, #9333ea)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    padding: '6px 12px',
                  },
                  onClick: function () {
                    setExpanded(!expanded)
                  },
                },
                expanded ? '收起音色库 ▲' : '🎀 切换甜美音色 / 调响度 ▼',
              )
            : null,
        ),
        expanded
          ? h(
              'div',
              { style: { marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' } },
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.05)',
                  },
                },
                h('span', { style: { fontSize: '12.5px', fontWeight: 600 } }, '🔊 听歌伴随人声响度：'),
                SWEET_GAIN_OPTIONS.map(function (g) {
                  var active = g.idx === gainIdx
                  return h(
                    'button',
                    {
                      key: g.idx,
                      type: 'button',
                      className: 'dsh-ctx-quick-mini-btn',
                      style: {
                        padding: '5px 10px',
                        fontWeight: active ? 700 : 500,
                        background: active ? '#16a34a' : '',
                        color: active ? '#fff' : '',
                        borderColor: active ? '#16a34a' : '',
                      },
                      onClick: function () {
                        selectGain(g.idx)
                      },
                    },
                    g.label,
                  )
                }),
              ),
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.04)',
                  },
                },
                h('span', { style: { fontSize: '12.5px', fontWeight: 600 } }, '⚡ 播报语速：'),
                SWEET_SPEED_OPTIONS.map(function (s) {
                  var active = s.idx === speedIdx
                  return h(
                    'button',
                    {
                      key: s.idx,
                      type: 'button',
                      className: 'dsh-ctx-quick-mini-btn',
                      style: {
                        padding: '4px 10px',
                        fontWeight: active ? 700 : 500,
                        background: active ? '#2563eb' : '',
                        color: active ? '#fff' : '',
                        borderColor: active ? '#2563eb' : '',
                      },
                      onClick: function () {
                        selectSpeed(s.idx)
                      },
                    },
                    s.label,
                  )
                }),
              ),
              h(
                'div',
                {
                  style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '10px',
                  },
                },
                SWEET_VOICE_CATALOG.map(function (item) {
                  var isSelected = item.id === voiceId
                  var isPlaying = previewingId === item.id
                  return h(
                    'div',
                    {
                      key: item.id,
                      onClick: function () {
                        selectVoice(item.id, false)
                      },
                      style: {
                        border: isSelected
                          ? '2px solid #ec4899'
                          : '1px solid var(--dsw-alias-border-l1, rgba(15,23,42,0.12))',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        cursor: 'pointer',
                        background: isSelected
                          ? 'rgba(236, 72, 153, 0.10)'
                          : 'var(--dsw-alias-bg-layer-1, rgba(255,255,255,0.6))',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '8px',
                      },
                    },
                    h(
                      'div',
                      null,
                      h(
                        'div',
                        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                        h(
                          'strong',
                          { style: { fontSize: '13.5px', color: isSelected ? '#db2777' : 'inherit' } },
                          item.label,
                        ),
                        isSelected
                          ? h(
                              'span',
                              {
                                style: {
                                  fontSize: '11px',
                                  padding: '1px 7px',
                                  borderRadius: '99px',
                                  background: '#ec4899',
                                  color: '#fff',
                                  fontWeight: 600,
                                },
                              },
                              '当前使用',
                            )
                          : null,
                      ),
                      h(
                        'div',
                        { style: { fontSize: '11.5px', opacity: 0.78, marginTop: '4px' } },
                        item.tags,
                      ),
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'dsh-ctx-quick-mini-btn',
                        style: {
                          width: '100%',
                          padding: '5px 8px',
                          fontWeight: 600,
                          background: isPlaying
                            ? '#16a34a'
                            : 'linear-gradient(135deg, #ec4899, #9333ea)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                        },
                        onClick: function (ev) {
                          ev.stopPropagation()
                          selectVoice(item.id, true)
                        },
                      },
                      isPlaying ? '🔊 正在试听甜音...' : '🔊 试听甜音并选用',
                    ),
                  )
                }),
              ),
            )
          : null,
      )
    }

    function QuickPhrasesSettingsRow() {
      var phrases = useQuickPhrases()
      var expandedState = useState(false)
      var expanded = expandedState[0]
      var setExpanded = expandedState[1]

      return h(
        'div',
        { className: 'dsh-ctx-settings-row' },
        h(
          'div',
          { className: 'dsh-ctx-settings-head' },
          h(
            'div',
            null,
            h('div', { className: 'dsh-ctx-settings-title' }, '常用对话快捷发送 (Quick Phrases)'),
            h(
              'div',
              { className: 'dsh-ctx-settings-desc' },
              '管理输入框下方「⚡ 常用语」按钮中的快捷短语列表（共 ' +
                String(phrases.length) +
                ' 条，首条：' +
                (phrases[0] || '') +
                '）',
            ),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dsh-ctx-toolbar-btn',
              onClick: function () {
                setExpanded(!expanded)
              },
            },
            expanded ? '收起设置 ▲' : '管理常用对话 (' + String(phrases.length) + ') ▼',
          ),
        ),
        expanded
          ? h(QuickPhrasesEditorList, {
              phrases: phrases,
              compact: false,
              onSave: function (nextList) {
                writeQuickPhrases(nextList)
              },
            })
          : null,
      )
    }

    function ComposerToolbarControls(props) {
      var controller = props.controller
      var t = props.t
      var snap = useControllerSnapshot(controller)
      var phrases = useQuickPhrases()
      var rootRef = useRef(null)
      var quickOpenState = useState(false)
      var quickOpen = quickOpenState[0]
      var setQuickOpen = quickOpenState[1]
      var liveCallOpenState = useState(false)
      var liveCallOpen = liveCallOpenState[0]
      var setLiveCallOpen = liveCallOpenState[1]
      var customSendTextState = useState('')
      var customSendText = customSendTextState[0]
      var setCustomSendText = customSendTextState[1]
      var manageModeState = useState(false)
      var manageMode = manageModeState[0]
      var setManageMode = manageModeState[1]

      useEffect(
        function () {
          if (controller) {
            controller.inputActions = props.inputActions || null
            controller.useInput = props.useInput || null
          }
          syncInlineChatCheckboxes(controller)
        },
        [controller, snap, props.inputActions, props.useInput],
      )

      useEffect(
        function () {
          if (!snap.drawerOpen && !quickOpen) return function () {}
          var onDocMouseDown = function (e) {
            var tEl = e.target
            if (
              rootRef.current &&
              (!rootRef.current.contains(tEl) ||
                (tEl && tEl.classList && tEl.classList.contains('dsh-ctx-popover-wrap')))
            ) {
              controller.setDrawerOpen(false)
              setQuickOpen(false)
            }
          }
          var onDocKeyDown = function (e) {
            if (e.key === 'Escape') {
              controller.setDrawerOpen(false)
              setQuickOpen(false)
            }
          }
          document.addEventListener('mousedown', onDocMouseDown)
          document.addEventListener('touchstart', onDocMouseDown, { passive: true })
          document.addEventListener('keydown', onDocKeyDown)
          return function () {
            document.removeEventListener('mousedown', onDocMouseDown)
            document.removeEventListener('touchstart', onDocMouseDown)
            document.removeEventListener('keydown', onDocKeyDown)
          }
        },
        [controller, snap.drawerOpen, quickOpen],
      )

      var sendPhraseNow = function (text) {
        var clean = String(text || '').trim()
        if (!clean) return
        setQuickOpen(false)
        if (props. onSendQuickPhrase) {
          props.onSendQuickPhrase(clean, props.inputActions)
          return
        }
        if (props.inputActions && typeof props.inputActions.setDraft === 'function') {
          props.inputActions.setDraft(clean)
          if (typeof props.inputActions.submit === 'function') {
            setTimeout(function () {
              try {
                props.inputActions.submit()
              } catch {}
            }, 20)
          }
        }
      }

      var insertPhraseOnly = function (text) {
        var clean = String(text || '').trim()
        if (!clean) return
        setQuickOpen(false)
        if (props.onInsertQuickPhrase) {
          props.onInsertQuickPhrase(clean, props.inputActions)
          return
        }
        if (props.inputActions && typeof props.inputActions.setDraft === 'function') {
          props.inputActions.setDraft(clean)
        }
      }

      var totalTurns = snap.turns.filter(function (r) {
        return !r.compacted
      }).length
      var includedCount = snap.turns.filter(function (r) {
        return !r.compacted && r.included
      }).length
      var savedTokens = snap.tokenStats ? snap.tokenStats.savedTokens || 0 : 0
      var keepNextInContext = !snap.state.nextTurnEphemeral

      var onToggleEphemeral = function (e) {
        e.stopPropagation()
        controller.sendAction({
          action: 'set-next-ephemeral',
          ephemeral: keepNextInContext,
        })
      }

      var onToggleDrawer = function (e) {
        e.stopPropagation()
        setQuickOpen(false)
        controller.toggleDrawer()
      }

      var onToggleQuick = function (e) {
        e.stopPropagation()
        if (!quickOpen) {
          controller.setDrawerOpen(false)
        }
        setQuickOpen(!quickOpen)
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
        { ref: rootRef, className: 'dsh-ctx-sel-toolbar-group' },
        snap.drawerOpen
          ? h(FloatingContextPopover, {
              controller: controller,
              snap: snap,
              t: t,
            })
          : null,
        quickOpen
          ? h(
              'div',
              {
                className: 'dsh-ctx-quick-popover',
                onClick: function (e) {
                  e.stopPropagation()
                },
              },
              h(
                'div',
                { className: 'dsh-ctx-pop-head' },
                h(
                  'div',
                  { className: 'dsh-ctx-pop-title' },
                  h('span', null, '⚡ 常用对话'),
                  h('span', { className: 'dsh-ctx-pop-stat' }, '点击直接发送'),
                ),
                h(
                  'div',
                  { style: { display: 'inline-flex', alignItems: 'center', gap: '4px' } },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dsh-ctx-hc-btn',
                      onClick: function () {
                        setManageMode(!manageMode)
                      },
                    },
                    manageMode ? '返回列表' : '⚙️ 设置管理',
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dsh-ctx-close-x',
                      onClick: function () {
                        setQuickOpen(false)
                      },
                    },
                    '✕',
                  ),
                ),
              ),
              h(
                'div',
                { className: 'dsh-ctx-quick-add-row' },
                h('input', {
                  type: 'text',
                  className: 'dsh-ctx-quick-input',
                  placeholder: '快速输入一句话（回车立即发送）…',
                  value: customSendText,
                  onChange: function (e) {
                    setCustomSendText(e.target.value)
                  },
                  onKeyDown: function (e) {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      var txt = String(customSendText || '').trim()
                      if (txt) {
                        setCustomSendText('')
                        sendPhraseNow(txt)
                      }
                    }
                  },
                }),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-ctx-quick-mini-btn',
                    'data-primary': 'true',
                    onClick: function () {
                      var txt = String(customSendText || '').trim()
                      if (txt) {
                        setCustomSendText('')
                        sendPhraseNow(txt)
                      }
                    },
                  },
                  '发送',
                ),
              ),
              manageMode
                ? h(QuickPhrasesEditorList, {
                    phrases: phrases,
                    compact: true,
                    onSave: function (nextList) {
                      writeQuickPhrases(nextList, controller ? controller.sessionId : null)
                    },
                    onSend: sendPhraseNow,
                    onInsert: insertPhraseOnly,
                  })
                : h(
                    'div',
                    { className: 'dsh-ctx-quick-list' },
                    phrases.map(function (phrase, idx) {
                      return h(
                        'div',
                        { key: String(idx) + '-' + phrase, className: 'dsh-ctx-quick-item' },
                        h(
                          'button',
                          {
                            type: 'button',
                            className: 'dsh-ctx-quick-send-btn',
                            title: '点击直接发送: ' + phrase,
                            onClick: function () {
                              sendPhraseNow(phrase)
                            },
                          },
                          h(
                            'span',
                            {
                              style: {
                                display: 'inline-block',
                                minWidth: '18px',
                                fontSize: '11px',
                                color: 'var(--dsw-alias-label-tertiary)',
                              },
                            },
                            String(idx + 1) + '.',
                          ),
                          phrase,
                        ),
                        h(
                          'div',
                          { className: 'dsh-ctx-quick-actions' },
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'dsh-ctx-quick-mini-btn',
                              title: '填入输入框（不立即发送）',
                              onClick: function () {
                                insertPhraseOnly(phrase)
                              },
                            },
                            '填入',
                          ),
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'dsh-ctx-quick-mini-btn',
                              'data-primary': 'true',
                              title: '直接发送',
                              onClick: function () {
                                sendPhraseNow(phrase)
                              },
                            },
                            '发送',
                          ),
                        ),
                      )
                    }),
                  ),
            )
          : null,
        liveCallOpen
          ? h(LiveVoiceCallModal, {
              sessionId: controller ? controller.sessionId : activeSessionId,
              onClose: function () {
                setLiveCallOpen(false)
              },
              onDispatchPrompt: function (promptTxt) {
                sendPhraseNow(promptTxt)
              },
              onInsertDraft: function (promptTxt) {
                insertPhraseOnly(promptTxt)
              },
            })
          : null,
        h(
          'button',
          {
            type: 'button',
            className: 'dsh-ctx-toolbar-btn dsh-ctx-icon-only-btn',
            'data-active': liveCallOpen ? 'true' : undefined,
            title: '开启实时语音通话',
            'aria-label': '开启实时语音通话',
            onClick: function (e) {
              e.stopPropagation()
              unlockSweetVoiceAudio()
              controller.setDrawerOpen(false)
              setQuickOpen(false)
              setLiveCallOpen(true)
            },
          },
          h(
            'svg',
            {
              width: 15,
              height: 15,
              viewBox: '0 0 16 16',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: 1.4,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              'aria-hidden': 'true',
            },
            h('path', {
              d: 'M13.8 11.1v1.7a1.15 1.15 0 0 1-1.25 1.15 11.4 11.4 0 0 1-4.98-1.77 11.2 11.2 0 0 1-3.44-3.44A11.4 11.4 0 0 1 2.36 3.7a1.15 1.15 0 0 1 1.14-1.25h1.7a1.15 1.15 0 0 1 1.15.99c.07.55.21 1.09.4 1.61a1.15 1.15 0 0 1-.26 1.21l-.72.72a9.2 9.2 0 0 0 3.44 3.44l.72-.72a1.15 1.15 0 0 1 1.21-.26c.52.19 1.06.33 1.61.4a1.15 1.15 0 0 1 .99 1.16Z',
            }),
          ),
        ),
        h(
          'button',
          {
            type: 'button',
            className: 'dsh-ctx-toolbar-btn',
            'data-active': quickOpen ? 'true' : undefined,
            title: '打开常用对话列表，一键选择并直接发送',
            onClick: onToggleQuick,
          },
          h(
            'svg',
            {
              width: 14,
              height: 14,
              viewBox: '0 0 16 16',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: 1.45,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              'aria-hidden': 'true',
            },
            h('path', { d: 'M8.8 2L4 9h4l-.8 5L12 7H8l.8-5z' }),
          ),
          h('span', null, '常用语'),
        ),
        h(
          'button',
          {
            type: 'button',
            className: 'dsh-ctx-toolbar-btn',
            'data-ephemeral': !keepNextInContext ? 'true' : undefined,
            title: t('toolbar.ephemeralTip'),
            onClick: onToggleEphemeral,
          },
          h(
            'svg',
            {
              width: 14,
              height: 14,
              viewBox: '0 0 16 16',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: 1.5,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            },
            keepNextInContext
              ? h('path', { d: 'M13.2 4.8L6.5 11.5L2.8 7.8' })
              : h('path', { d: 'M8.8 2L4 9h4l-.8 5L12 7H8l.8-5z' }),
          ),
          h('span', null, keepNextInContext ? t('toolbar.ephemeralOff') : t('toolbar.ephemeralOn')),
        ),
        h(
          'button',
          {
            type: 'button',
            className: 'dsh-ctx-toolbar-btn',
            'data-active': snap.drawerOpen || savedTokens > 0 ? 'true' : undefined,
            onClick: onToggleDrawer,
          },
          h(
            'svg',
            {
              width: 14,
              height: 14,
              viewBox: '0 0 16 16',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: 1.45,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            },
            h('path', { d: 'M8 2L2 5.2L8 8.4L14 5.2L8 2Z' }),
            h('path', { d: 'M2 8.2L8 11.4L14 8.2' }),
            h('path', { d: 'M2 11.2L8 14.4L14 11.2' }),
          ),
          h('span', null, panelText),
          h(
            'span',
            {
              className: 'dsh-ctx-toolbar-chevron',
              'data-open': snap.drawerOpen ? 'true' : undefined,
            },
            h(
              'svg',
              { width: 11, height: 11, viewBox: '0 0 12 12', fill: 'none' },
              h('path', {
                d: 'M3 4.5L6 7.5L9 4.5',
                stroke: 'currentColor',
                strokeWidth: 1.5,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
              }),
            ),
          ),
        ),
      )
    }

    function normalizeSlashes(p) {
      return String(p || '').replace(/\\/g, '/')
    }

    function basenameOfPath(p) {
      var clean = normalizeSlashes(p).replace(/\/+$/, '')
      var idx = clean.lastIndexOf('/')
      return idx >= 0 ? clean.slice(idx + 1) : clean
    }

    function relativizePathToCwd(rawPath, cwd) {
      var p = String(rawPath || '').trim()
      if (!p) return ''
      var c = String(cwd || '').trim()
      if (!c) return p
      var normP = normalizeSlashes(p)
      var normC = normalizeSlashes(c).replace(/\/+$/, '')
      if (!normC) return p
      var lowerP = normP.toLowerCase()
      var lowerC = normC.toLowerCase()
      if (lowerP === lowerC) return '.'
      if (lowerP.indexOf(lowerC + '/') === 0) {
        return normP.slice(normC.length + 1)
      }
      return p
    }

    function formatAtMention(rawPath, isDir, cwd) {
      var rel = relativizePathToCwd(rawPath, cwd)
      if (!rel) return ''
      if (isDir && !/[/\\]$/.test(rel)) rel += '/'
      if (/\s/.test(rel)) {
        return '@"' + rel.replace(/"/g, '') + '"'
      }
      return '@' + rel
    }

    function parsePreviewUrlPath(urlStr) {
      if (typeof urlStr !== 'string') return null
      var prefix = 'dsh-resource://file/'
      if (urlStr.indexOf(prefix) !== 0) return null
      var qIdx = urlStr.search(/[?#]/)
      var body = qIdx === -1 ? urlStr.slice(prefix.length) : urlStr.slice(prefix.length, qIdx)
      var parts = body.split('/')
      var scope = parts[0]
      if (scope === 'session' && parts.length >= 3) {
        try {
          var sid = decodeURIComponent(parts[1])
          var segs = parts.slice(2).map(decodeURIComponent)
          return { sessionId: sid, path: segs.join('/') }
        } catch {
          return null
        }
      }
      if (scope === 'absolute' && parts.length >= 2) {
        try {
          var aSegs = parts.slice(1).map(decodeURIComponent)
          var joined = aSegs.join('/')
          if (!/^[A-Za-z]:/.test(joined) && joined.charAt(0) !== '/') joined = '/' + joined
          return { path: joined }
        } catch {
          return null
        }
      }
      return null
    }

    function detectSelectionLineRange(previewEl, range) {
      if (!previewEl || !range) return null
      try {
        var findPlainLine = function (node) {
          var el = node && node.nodeType === 1 ? node : node ? node.parentElement : null
          while (el && el !== previewEl) {
            if (el.hasAttribute && el.hasAttribute('data-textpreview-line')) {
              var n = Number(el.getAttribute('data-textpreview-line'))
              if (Number.isInteger(n) && n > 0) return n
            }
            el = el.parentElement
          }
          return null
        }
        var l1 = findPlainLine(range.startContainer)
        var l2 = findPlainLine(range.endContainer)
        if (l1 || l2) {
          var startL = l1 || l2
          var endL = l2 || l1
          return { start: Math.min(startL, endL), end: Math.max(startL, endL) }
        }
        var codeContainer = previewEl.querySelector('[data-code-preview] pre, [data-code-block-content] pre')
        if (codeContainer && codeContainer.contains(range.commonAncestorContainer)) {
          var lines = codeContainer.querySelectorAll('.line')
          if (lines.length > 0) {
            var findCodeLine = function (node) {
              var el = node && node.nodeType === 1 ? node : node ? node.parentElement : null
              while (el && el !== codeContainer) {
                if (el.classList && el.classList.contains('line')) {
                  for (var idx = 0; idx < lines.length; idx++) {
                    if (lines[idx] === el) return idx + 1
                  }
                }
                el = el.parentElement
              }
              return null
            }
            var cl1 = findCodeLine(range.startContainer)
            var cl2 = findCodeLine(range.endContainer)
            if (cl1 || cl2) {
              var cs = cl1 || cl2
              var ce = cl2 || cl1
              return { start: Math.min(cs, ce), end: Math.max(cs, ce) }
            }
          }
        }
      } catch {}
      return null
    }

    function resolveContextTarget(targetEl) {
      if (!targetEl || typeof document === 'undefined') return null
      var el = targetEl.nodeType === 1 ? targetEl : targetEl.parentElement
      if (!el) return null
      if (el.closest('input, textarea, [contenteditable="true"], .dsh-doc-ask-menu, .dsh-doc-ask-float')) {
        return null
      }

      var sel = window.getSelection ? window.getSelection() : null
      var selectedText = ''
      var selRange = null
      if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
        var r = sel.getRangeAt(0)
        var rawSel = String(sel.toString() || '').trim()
        if (rawSel) {
          var common = r.commonAncestorContainer
          var commonEl = common && common.nodeType === 1 ? common : common ? common.parentElement : null
          if (!commonEl || !commonEl.closest('input, textarea, [contenteditable="true"]')) {
            selectedText = rawSel
            selRange = r
          }
        }
      }

      var fileEntryEl = el.closest('[data-files-entry][data-files-path]')
      if (fileEntryEl) {
        var entryKind = fileEntryEl.getAttribute('data-files-entry')
        var entryPath = fileEntryEl.getAttribute('data-files-path')
        if (entryPath && (entryKind === 'file' || entryKind === 'directory')) {
          return {
            kind: entryKind,
            path: entryPath,
            isDir: entryKind === 'directory',
            selectedText: selectedText,
            lineRange: null,
          }
        }
      }

      var filesHeaderPathEl = el.closest('[data-files-path]')
      if (filesHeaderPathEl) {
        var rootContainer = filesHeaderPathEl.closest('[data-files-root]')
        var rootPath =
          (rootContainer && rootContainer.getAttribute('data-files-root')) ||
          filesHeaderPathEl.getAttribute('title') ||
          filesHeaderPathEl.textContent
        if (rootPath) {
          return {
            kind: 'directory',
            path: String(rootPath).trim(),
            isDir: true,
            selectedText: selectedText,
            lineRange: null,
          }
        }
      }

      var presentedCardEl = el.closest('[data-presented-file]')
      if (presentedCardEl) {
        var previewBtn = presentedCardEl.querySelector('button[title]')
        var cardPath = previewBtn ? previewBtn.getAttribute('title') : null
        if (cardPath) {
          return {
            kind: 'file',
            path: cardPath,
            isDir: false,
            selectedText: selectedText,
            lineRange: null,
          }
        }
      }

      var changedRowBtn = el.closest('li > button[aria-describedby]')
      if (changedRowBtn && changedRowBtn.parentElement) {
        var descId = changedRowBtn.getAttribute('aria-describedby')
        var descSpan = descId ? document.getElementById(descId) : null
        var changedPath = descSpan ? String(descSpan.textContent || '').trim() : ''
        if (changedPath) {
          return {
            kind: 'file',
            path: changedPath,
            isDir: false,
            selectedText: selectedText,
            lineRange: null,
          }
        }
      }

      var previewRoot = el.closest('[data-textpreview-url]')
      if (!previewRoot && selRange) {
        var selNode = selRange.commonAncestorContainer
        var selEl = selNode && selNode.nodeType === 1 ? selNode : selNode ? selNode.parentElement : null
        if (selEl) previewRoot = selEl.closest('[data-textpreview-url]')
      }
      if (previewRoot) {
        var pathLabelEl = previewRoot.querySelector('[data-textpreview-path][title], [data-path-label][title]')
        var urlAttr = previewRoot.getAttribute('data-textpreview-url')
        var parsedUrl = parsePreviewUrlPath(urlAttr)
        var docPath =
          (pathLabelEl && pathLabelEl.getAttribute('title')) ||
          (parsedUrl && parsedUrl.path) ||
          ''
        if (docPath) {
          var lineRange = selRange ? detectSelectionLineRange(previewRoot, selRange) : null
          return {
            kind: 'file',
            path: docPath,
            sessionId: parsedUrl ? parsedUrl.sessionId : undefined,
            isDir: false,
            selectedText: selectedText,
            lineRange: lineRange,
          }
        }
      }

      var mdFileBtn = el.closest('button[title]')
      if (mdFileBtn && mdFileBtn.className && /fileLink|fileMention/.test(mdFileBtn.className)) {
        var fPath = mdFileBtn.getAttribute('title')
        if (fPath) {
          return {
            kind: 'file',
            path: fPath,
            isDir: false,
            selectedText: selectedText,
            lineRange: null,
          }
        }
      }

      var anyPathLabel = el.closest('[data-path-label][title]')
      if (anyPathLabel) {
        var pTitle = anyPathLabel.getAttribute('title')
        if (pTitle) {
          return {
            kind: 'file',
            path: pTitle,
            isDir: false,
            selectedText: selectedText,
            lineRange: null,
          }
        }
      }

      var chatRow = el.closest('[data-chat-node-key], [data-chat-call-id], [data-textpreview-body]')
      if (selectedText && (chatRow || el.closest('main, aside, [data-conversation-scroll]'))) {
        return {
          kind: 'selection',
          path: '',
          isDir: false,
          selectedText: selectedText,
          lineRange: null,
        }
      }

      return null
    }

    function buildQuoteChipSpec(text, headerLine) {
      var raw = String(text || '').replace(/\r\n?/g, '\n').trim()
      if (!raw) return null
      var singleLine = raw
        .split('\n')
        .map(function (l) {
          return l.trim()
        })
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      var maxPreview = 18
      var shortPreview = singleLine
      if (singleLine.length > maxPreview) {
        shortPreview = singleLine.slice(0, maxPreview).trimEnd() + '…(' + String(raw.length) + '字)'
      }
      var chipLabel = headerLine
        ? '❝ ' + basenameOfPath(headerLine) + ' 「' + shortPreview + '」'
        : '❝ 引用: 「' + shortPreview + '」'

      var rawLines = raw.split('\n')
      var quotedLines = rawLines.map(function (l) {
        return '> ' + l
      })
      var fullPayload = headerLine
        ? '\n> [' + headerLine + ']\n' + quotedLines.join('\n') + '\n'
        : '\n' + quotedLines.join('\n') + '\n'

      return {
        source: 'reference',
        ref: fullPayload,
        label: chipLabel,
        clipboardText: fullPayload,
      }
    }

    function DocumentHeaderAskButton(props) {
      var absolutePath = props.absolutePath
      var t = props.t
      var onAsk = props.onAsk
      if (!absolutePath) return null
      return h(
        'button',
        {
          type: 'button',
          className: 'dsh-doc-header-ask-btn',
          title: t('ask.file', { name: basenameOfPath(absolutePath) }),
          onClick: function (e) {
            e.stopPropagation()
            if (onAsk) onAsk(absolutePath)
          },
        },
        h('span', null, '💬 ' + t('ask.headerBtn')),
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
        activeSessionId = null

        var getSessionsService = function () {
          try {
            return ctx.get ? ctx.get('sessions') : ctx.sessions
          } catch {
            return null
          }
        }

        var getConversationService = function () {
          try {
            return ctx.get ? ctx.get('conversation') : ctx.conversation
          } catch {
            return null
          }
        }

        var getContextMenusService = function () {
          try {
            return ctx.get ? ctx.get('contextMenus') : ctx.contextMenus
          } catch {
            return null
          }
        }

        var getInputTriggersService = function () {
          try {
            return ctx.get ? ctx.get('inputTriggers') : ctx.inputTriggers
          } catch {
            return null
          }
        }

        var registerQuoteTriggerSource = function (targetCtx) {
          try {
            var inputTriggers =
              (targetCtx && (targetCtx.inputTriggers || (targetCtx.get && targetCtx.get('inputTriggers')))) ||
              getInputTriggersService()
            if (!inputTriggers || typeof inputTriggers.registerSource !== 'function') {
              return function () {}
            }
            return inputTriggers.registerSource({
              trigger: '@',
              name: 'context-quote',
              showGroupTitle: false,
              candidates: function () {
                return Promise.resolve([])
              },
              onPick: function () {
                return undefined
              },
              codec: {
                clipboardText: function (ref) {
                  return ref
                },
                serialize: function (ref) {
                  return Promise.resolve(ref)
                },
              },
            })
          } catch {
            return function () {}
          }
        }

        ctx.effect(function () {
          return registerQuoteTriggerSource(ctx)
        }, 'dsh-context-selector: quote-chip-source')

        if (typeof ctx.inject === 'function') {
          ctx.inject(['inputTriggers'], function (subCtx) {
            subCtx.effect(function () {
              return registerQuoteTriggerSource(subCtx)
            }, 'dsh-context-selector: quote-chip-source-injected')
          })
        }

        var controllerFor = function (sessionId) {
          var key = String(sessionId || '')
          activeSessionId = key
          var ctrl = controllers.get(key)
          if (!ctrl) {
            ctrl = new SessionContextController(key, getSessionsService)
            var savedLocal = readLocalSysOverride(key, getSessionsService)
            if (savedLocal) {
              ctrl.snapshot.state = Object.assign({}, ctrl.snapshot.state, {
                systemPresetOverride: savedLocal.systemPresetOverride || null,
                customSystemPrompt: savedLocal.customSystemPrompt || '',
                customSystemMode: savedLocal.customSystemMode || 'append',
                excludedSystemOrders: Array.isArray(savedLocal.excludedSystemOrders)
                  ? savedLocal.excludedSystemOrders
                  : [],
                sysUpdatedAt: savedLocal.updatedAt || Date.now(),
              })
            }
            controllers.set(key, ctrl)
          }
          return ctrl
        }

        var resolveSessionCwd = function (sessionId) {
          try {
            var sSvc = getSessionsService()
            if (!sSvc || !sSvc.list) return ''
            var snap = sSvc.list.getSnapshot()
            var sid = sessionId || activeSessionId
            if (sid && snap && snap.byId && snap.byId[sid]) {
              return snap.byId[sid].cwd || ''
            }
          } catch {}
          return ''
        }

        var isMobileComposerMode = function () {
          if (typeof window === 'undefined') return false
          if (window.innerWidth <= 768) return true
          if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return true
          return false
        }

        var focusComposerInputNow = function (shell, isMobile) {
          if (typeof document === 'undefined') return
          var rootEl =
            (shell &&
              shell.editor &&
              typeof shell.editor.getRootElement === 'function' &&
              shell.editor.getRootElement()) ||
            document.querySelector('[data-composer-input], [data-composer-card] [contenteditable="true"]')
          if (rootEl && typeof rootEl.focus === 'function') {
            try {
              rootEl.focus({ preventScroll: true })
            } catch {
              try {
                rootEl.focus()
              } catch {}
            }
          }
          if (shell && typeof shell.focus === 'function') {
            try {
              shell.focus()
            } catch {}
          }
          if (isMobile && rootEl) {
            try {
              var ps = rootEl.querySelectorAll('p')
              var lastP = ps.length > 0 ? ps[ps.length - 1] : null
              var wSel = typeof window !== 'undefined' && window.getSelection ? window.getSelection() : null
              if (wSel && lastP) {
                var rng = document.createRange()
                if ((lastP.textContent || '') === '') {
                  rng.setStart(lastP, 0)
                  rng.collapse(true)
                } else {
                  rng.selectNodeContents(lastP)
                  rng.collapse(false)
                }
                wSel.removeAllRanges()
                wSel.addRange(rng)
              }
            } catch {}
          }
        }

        var insertIntoComposer = function (options) {
          var sid = options.sessionId || activeSessionId
          var cwd = resolveSessionCwd(sid)
          var rawPath = options.path || ''
          var isDir = Boolean(options.isDir)
          var selectedText = String(options.selectedText || '').trim()
          var lineRange = options.lineRange || null
          var promptSuffix = typeof options.promptSuffix === 'string' ? options.promptSuffix : ''
          var isMobile = isMobileComposerMode()
          var hasQuoteOrRef = Boolean(rawPath || selectedText)

          var mention = rawPath ? formatAtMention(rawPath, isDir, cwd) : ''
          var label = rawPath ? basenameOfPath(rawPath) + (isDir ? '/' : '') : ''
          var lineTag = ''
          if (lineRange && lineRange.start) {
            lineTag =
              lineRange.end && lineRange.end > lineRange.start
                ? 'L' + lineRange.start + '-L' + lineRange.end
                : 'L' + lineRange.start
          }

          var convSvc = getConversationService()
          var shell = null
          if (convSvc && convSvc.input && typeof convSvc.input.shell === 'function' && sid) {
            try {
              shell = convSvc.input.shell(sid)
            } catch {}
          }

          var ctrl = sid ? controllers.get(sid) : null
          var inputActions = (shell && shell.actions) || (ctrl && ctrl.inputActions) || null

          if (isMobile && typeof document !== 'undefined') {
            var rtBefore = document.querySelector('.P3OORG_panel[data-sidebar-right-open] [data-sidebar-right-toggle]')
            if (rtBefore && typeof rtBefore.click === 'function') rtBefore.click()
            var preRootEl =
              (shell &&
                shell.editor &&
                typeof shell.editor.getRootElement === 'function' &&
                shell.editor.getRootElement()) ||
              document.querySelector('[data-composer-input], [data-composer-card] [contenteditable="true"]')
            if (preRootEl && typeof preRootEl.focus === 'function') {
              try {
                preRootEl.focus({ preventScroll: true })
              } catch {
                try {
                  preRootEl.focus()
                } catch {}
              }
            }
          }

          var quoteHeader = ''
          if (rawPath) {
            var relDisplay = relativizePathToCwd(rawPath, cwd) || rawPath
            quoteHeader = relDisplay + (lineTag ? ':' + lineTag : '')
          }
          var quoteChip = selectedText ? buildQuoteChipSpec(selectedText, quoteHeader) : null

          var chipsToInsert = []
          if (mention && shell && shell.draftEditor) {
            var currentDraft = String(shell.snapshot ? shell.snapshot.draft || '' : '')
            if (currentDraft.indexOf(mention) === -1) {
              chipsToInsert.push({
                source: 'reference',
                ref: mention,
                label: label || mention.slice(1),
                appearance: isDir ? 'folder' : 'file',
                clipboardText: mention,
              })
            }
          }
          if (quoteChip) {
            chipsToInsert.push(quoteChip)
          }

          var chipsInserted = false
          if (chipsToInsert.length > 0 && shell && shell.draftEditor && typeof shell.draftEditor.insertFileReferences === 'function') {
            try {
              chipsInserted = Boolean(shell.draftEditor.insertFileReferences(chipsToInsert))
            } catch {}
          }

          if (shell && typeof shell.setDraft === 'function') {
            var snap = shell.snapshot || { draft: '', draftRev: 0 }
            var existingDraft = String(snap.draft || '')
            var extraLine = chipsInserted && !selectedText && lineTag ? '(' + lineTag + ') ' : ''
            if (isMobile && chipsInserted && hasQuoteOrRef) {
              if (extraLine && shell.actions && typeof shell.actions.captureInsertion === 'function' && typeof shell.actions.insertText === 'function') {
                try {
                  shell.actions.insertText(extraLine, shell.actions.captureInsertion())
                } catch {}
              }
              if (shell.editor && typeof shell.editor.update === 'function') {
                try {
                  shell.editor.update(
                    function () {
                      var st = shell.editor._pendingEditorState || shell.editor._editorState
                      var sel = st && st._selection
                      if (sel && typeof sel.insertParagraph === 'function') {
                        var newP = sel.insertParagraph()
                        var prevP = newP && typeof newP.getPreviousSibling === 'function' ? newP.getPreviousSibling() : null
                        var tailNode = prevP && typeof prevP.getLastChild === 'function' ? prevP.getLastChild() : null
                        if (
                          tailNode &&
                          typeof tailNode.getTextContent === 'function' &&
                          tailNode.getTextContent() === ' ' &&
                          typeof tailNode.remove === 'function'
                        ) {
                          tailNode.remove()
                        }
                        if (newP && typeof newP.selectStart === 'function') {
                          newP.selectStart()
                        }
                      } else if (sel && typeof sel.insertLineBreak === 'function') {
                        sel.insertLineBreak(false)
                      }
                    },
                    { discrete: true },
                  )
                } catch {}
              }
              if (promptSuffix && shell.actions && typeof shell.actions.captureInsertion === 'function' && typeof shell.actions.insertText === 'function') {
                try {
                  shell.actions.insertText(promptSuffix, shell.actions.captureInsertion())
                } catch {}
              }
            } else {
              var addition = ''
              if (!chipsInserted) {
                var fallbackSep = isMobile && hasQuoteOrRef ? '\n' : ' '
                var fallbackPrefix = mention ? mention + (lineTag ? '#' + lineTag : '') + (quoteChip ? ' ' : fallbackSep) : ''
                var fallbackQuote = quoteChip ? quoteChip.label + fallbackSep : ''
                addition = fallbackPrefix + fallbackQuote + promptSuffix
              } else {
                addition = extraLine + promptSuffix
              }
              if (addition) {
                if (shell.actions && typeof shell.actions.captureInsertion === 'function' && typeof shell.actions.insertText === 'function') {
                  var span = shell.actions.captureInsertion()
                  var sep =
                    existingDraft.length > 0 && !/\s$/.test(existingDraft.slice(0, span.start))
                      ? ' '
                      : ''
                  var ok = shell.actions.insertText(sep + addition, span)
                  if (!ok) {
                    var nextFull = existingDraft
                      ? existingDraft.replace(/[ \t]*$/, '') + (isMobile && hasQuoteOrRef ? '\n' : ' ') + addition
                      : addition
                    shell.setDraft(nextFull)
                  }
                } else {
                  var merged = existingDraft
                    ? existingDraft.replace(/[ \t]*$/, '') + (isMobile && hasQuoteOrRef ? '\n' : ' ') + addition
                    : addition
                  shell.setDraft(merged)
                }
              }
            }
            focusComposerInputNow(shell, isMobile && hasQuoteOrRef)
            return true
          }

          var tailSep = isMobile && hasQuoteOrRef ? '\n' : ' '
          if (inputActions && typeof inputActions.setDraft === 'function') {
            var piece =
              (mention ? mention + (lineTag ? '#' + lineTag : '') + (quoteChip ? ' ' : tailSep) : '') +
              (quoteChip ? quoteChip.label + tailSep : '') +
              promptSuffix
            if (typeof inputActions.captureInsertion === 'function' && typeof inputActions.insertText === 'function') {
              var sp = inputActions.captureInsertion()
              if (!inputActions.insertText(piece, sp)) {
                inputActions.setDraft(piece)
              }
            } else {
              inputActions.setDraft(piece)
            }
            focusComposerInputNow(shell, isMobile && hasQuoteOrRef)
            return true
          }

          var fallbackEditor = document.querySelector('[data-composer-input], [data-composer-card] [contenteditable="true"]')
          if (fallbackEditor) {
            focusComposerInputNow(null, false)
            try {
              var fallbackText =
                (mention ? mention + (quoteChip ? ' ' : tailSep) : '') +
                (quoteChip ? quoteChip.label + tailSep : '') +
                promptSuffix
              document.execCommand('insertText', false, fallbackText)
              focusComposerInputNow(null, isMobile && hasQuoteOrRef)
              return true
            } catch {}
          }
          return false
        }

        ctx.effect(function () {
          var contextMenus = getContextMenusService()
          if (!contextMenus || typeof contextMenus.register !== 'function') {
            return function () {}
          }
          var disposers = []
          try {
            disposers.push(
              contextMenus.register({
                id: 'context-selector.ask-file',
                target: 'file',
                order: 10,
                resolve: function (target) {
                  var name = basenameOfPath(target.path)
                  var sel = typeof window !== 'undefined' && window.getSelection ? String(window.getSelection().toString() || '').trim() : ''
                  var actions = [
                    {
                      id: 'askFile',
                      label: '💬 ' + zh['ask.file'].replace('{name}', name),
                      run: function () {
                        insertIntoComposer({
                          sessionId: target.sessionId,
                          path: target.path,
                          isDir: false,
                          selectedText: sel,
                          lineRange: target.line ? { start: target.line, end: target.line } : null,
                        })
                      },
                    },
                  ]
                  if (sel) {
                    actions.push({
                      id: 'askSelection',
                      label: '✨ ' + zh['ask.selection'],
                      run: function () {
                        insertIntoComposer({
                          sessionId: target.sessionId,
                          path: target.path,
                          isDir: false,
                          selectedText: sel,
                          lineRange: target.line ? { start: target.line, end: target.line } : null,
                        })
                      },
                    })
                  }
                  return actions
                },
              }),
            )
            disposers.push(
              contextMenus.register({
                id: 'context-selector.ask-directory',
                target: 'directory',
                order: 10,
                resolve: function (target) {
                  var name = basenameOfPath(target.path)
                  return [
                    {
                      id: 'askDirectory',
                      label: '💬 ' + zh['ask.directory'].replace('{name}', name),
                      run: function () {
                        insertIntoComposer({
                          sessionId: target.sessionId,
                          path: target.path,
                          isDir: true,
                        })
                      },
                    },
                  ]
                },
              }),
            )
          } catch {}
          return function () {
            for (var i = 0; i < disposers.length; i++) {
              try {
                disposers[i]()
              } catch {}
            }
          }
        }, 'dsh-context-selector: native-context-menus')

        ctx.effect(function () {
          if (typeof document === 'undefined') return function () {}

          var menuEl = null
          var floatEl = null
          var floatTimer = null
          var downState = null
          var lastDismissAt = 0
          var lastAskPressAt = 0
          var lastTouchTap = null

          var selectWordAtPoint = function (clientX, clientY, targetNode) {
            if (!targetNode || isEditableNode(targetNode) || isInsideAskUi(targetNode)) return false
            var el = targetNode.nodeType === 1 ? targetNode : targetNode.parentElement
            if (!el || typeof el.closest !== 'function') return false
            if (el.closest('button, a, input, textarea, select, summary, [role="button"], [role="menuitem"], [data-row-key]')) {
              return false
            }
            var inDocPreview = el.closest('[data-textpreview-url], [data-textpreview-body]')
            var inChat = el.closest('[data-chat-node-key], [data-chat-call-id]')
            if (!inDocPreview && !inChat) return false

            var textNode = null
            var offset = 0
            try {
              if (typeof document.caretRangeFromPoint === 'function') {
                var cr = document.caretRangeFromPoint(clientX, clientY)
                if (cr) {
                  textNode = cr.startContainer
                  offset = cr.startOffset
                }
              } else if (typeof document.caretPositionFromPoint === 'function') {
                var cp = document.caretPositionFromPoint(clientX, clientY)
                if (cp) {
                  textNode = cp.offsetNode
                  offset = cp.offset
                }
              }
            } catch {}

            if (textNode && textNode.nodeType === 1) {
              var childNodes = textNode.childNodes
              if (childNodes && childNodes.length > 0) {
                var idx = Math.min(Math.max(0, offset), childNodes.length - 1)
                var candidate = childNodes[idx]
                if (candidate && candidate.nodeType === 3) {
                  textNode = candidate
                  offset = 0
                } else if (idx > 0 && childNodes[idx - 1] && childNodes[idx - 1].nodeType === 3) {
                  textNode = childNodes[idx - 1]
                  offset = (textNode.nodeValue || '').length
                }
              }
            }

            if (!textNode || textNode.nodeType !== 3) return false
            var str = textNode.nodeValue || ''
            if (!str.trim()) return false

            var isAsciiToken = function (ch) {
              return /[A-Za-z0-9_$#@-]/.test(ch)
            }
            var isCjkChar = function (ch) {
              return /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(ch)
            }
            var isSpaceOrPunct = function (ch) {
              return !ch || /\s/.test(ch) || /[，。！？；：、“”‘’（）《》【】「」『』、,.!?;:()[\]{}<>"'`~|\\/+=*^&%$]/.test(ch)
            }

            var pos = Math.min(Math.max(0, offset), str.length - 1)
            if (isSpaceOrPunct(str[pos])) {
              if (pos > 0 && !isSpaceOrPunct(str[pos - 1])) {
                pos = pos - 1
              } else if (pos + 1 < str.length && !isSpaceOrPunct(str[pos + 1])) {
                pos = pos + 1
              } else {
                return false
              }
            }

            var start = pos
            var end = pos + 1
            var ch = str[pos]

            if (isAsciiToken(ch)) {
              while (start > 0 && isAsciiToken(str[start - 1])) start--
              while (end < str.length && isAsciiToken(str[end])) end++
              if (
                start >= 2 &&
                str[start - 1] === ':' &&
                str[start - 2] === ':' &&
                start >= 3 &&
                isAsciiToken(str[start - 3])
              ) {
                var nsStart = start - 2
                while (nsStart > 0 && (isAsciiToken(str[nsStart - 1]) || str[nsStart - 1] === ':')) nsStart--
                start = nsStart
              }
              if (
                end + 1 < str.length &&
                str[end] === ':' &&
                str[end + 1] === ':' &&
                end + 2 < str.length &&
                isAsciiToken(str[end + 2])
              ) {
                var nsEnd = end + 2
                while (nsEnd < str.length && (isAsciiToken(str[nsEnd]) || str[nsEnd] === ':')) nsEnd++
                end = nsEnd
              }
            } else if (isCjkChar(ch)) {
              var maxCjkSpan = 8
              while (start > 0 && isCjkChar(str[start - 1]) && pos - start < maxCjkSpan) start--
              while (end < str.length && isCjkChar(str[end]) && end - pos <= maxCjkSpan) end++
            } else {
              while (start > 0 && !isSpaceOrPunct(str[start - 1])) start--
              while (end < str.length && !isSpaceOrPunct(str[end])) end++
            }

            if (end <= start) return false

            try {
              var range = document.createRange()
              range.setStart(textNode, start)
              range.setEnd(textNode, end)
              var sel = window.getSelection ? window.getSelection() : null
              if (!sel) return false
              sel.removeAllRanges()
              sel.addRange(range)
              lastDismissAt = 0
              scheduleSelectionFloat(20)
              return true
            } catch {
              return false
            }
          }

          var clearFloatTimer = function () {
            if (floatTimer !== null) {
              clearTimeout(floatTimer)
              floatTimer = null
            }
          }

          var isEditableNode = function (node) {
            if (!node) return false
            var el = node.nodeType === 1 ? node : node.parentElement
            if (!el || typeof el.closest !== 'function') return false
            return Boolean(el.closest('input, textarea, [contenteditable="true"]'))
          }

          var isInsideAskUi = function (node) {
            if (!node) return false
            if (menuEl && menuEl.contains(node)) return true
            if (floatEl && floatEl.contains(node)) return true
            var el = node.nodeType === 1 ? node : node.parentElement
            if (!el || typeof el.closest !== 'function') return false
            return Boolean(el.closest('.dsh-doc-ask-menu, .dsh-doc-ask-float'))
          }

          var captureSelectionSnapshot = function () {
            var sel = window.getSelection ? window.getSelection() : null
            if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null
            var text = String(sel.toString() || '').trim()
            if (!text) return null
            try {
              var r = sel.getRangeAt(0)
              if (isEditableNode(r.commonAncestorContainer)) return null
              var c = r.commonAncestorContainer
              var commonEl = c && c.nodeType === 1 ? c : c ? c.parentElement : null
              return {
                text: text,
                sc: r.startContainer,
                so: r.startOffset,
                ec: r.endContainer,
                eo: r.endOffset,
                commonEl: commonEl,
              }
            } catch {
              return null
            }
          }

          var isSameSelectionSnapshot = function (a, b) {
            if (!a || !b) return false
            return (
              a.sc === b.sc &&
              a.so === b.so &&
              a.ec === b.ec &&
              a.eo === b.eo &&
              a.text === b.text
            )
          }

          var closeMenu = function () {
            if (menuEl && menuEl.parentNode) {
              menuEl.parentNode.removeChild(menuEl)
            }
            menuEl = null
          }

          var closeFloat = function () {
            if (floatEl && floatEl.parentNode) {
              floatEl.parentNode.removeChild(floatEl)
            }
            floatEl = null
          }

          var forceClearSelection = function (targetNode) {
            lastDismissAt = Date.now()
            clearFloatTimer()
            closeFloat()
            closeMenu()
            if (isEditableNode(targetNode)) return
            try {
              var sel = window.getSelection ? window.getSelection() : null
              if (sel && !sel.isCollapsed) {
                sel.removeAllRanges()
                if (typeof sel.empty === 'function') sel.empty()
              }
            } catch {}
          }

          var scheduleSelectionFloat = function (delayMs) {
            clearFloatTimer()
            floatTimer = setTimeout(function () {
              floatTimer = null
              if (Date.now() - lastDismissAt < 220) return
              showSelectionFloat()
            }, typeof delayMs === 'number' ? delayMs : 35)
          }

          var addMenuItem = function (container, label, isPrimary, onClick) {
            var btn = document.createElement('button')
            btn.type = 'button'
            btn.className = 'dsh-doc-ask-menu-item'
            if (isPrimary) btn.setAttribute('data-primary', 'true')
            btn.textContent = label
            btn.addEventListener('pointerdown', function (e) {
              e.stopPropagation()
            })
            btn.addEventListener('click', function (e) {
              e.preventDefault()
              e.stopPropagation()
              closeMenu()
              closeFloat()
              onClick()
            })
            container.appendChild(btn)
          }

          var addSeparator = function (container) {
            var sep = document.createElement('div')
            sep.className = 'dsh-doc-ask-menu-sep'
            container.appendChild(sep)
          }

          var onContextMenu = function (e) {
            if (e.shiftKey) return
            if (downState && downState.pointerType === 'touch') return
            if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
              return
            }
            if (document.querySelector('[data-context-menu-popup]')) return
            var info = resolveContextTarget(e.target)
            if (!info) {
              closeMenu()
              return
            }

            e.preventDefault()
            e.stopPropagation()
            closeMenu()
            closeFloat()

            var menu = document.createElement('div')
            menu.className = 'dsh-doc-ask-menu'
            menu.setAttribute('role', 'menu')

            var fileName = info.path ? basenameOfPath(info.path) : ''
            var lineSuffix =
              info.lineRange && info.lineRange.start
                ? info.lineRange.end && info.lineRange.end > info.lineRange.start
                  ? ':' + info.lineRange.start + '-' + info.lineRange.end
                  : ':' + info.lineRange.start
                : ''

            if (fileName || info.selectedText) {
              var header = document.createElement('div')
              header.className = 'dsh-doc-ask-menu-header'
              header.textContent = fileName
                ? (info.isDir ? '📁 ' : '📄 ') + fileName + lineSuffix
                : '✂️ 已选中文本 (' + info.selectedText.length + ' 字)'
              menu.appendChild(header)
            }

            if (info.selectedText) {
              addMenuItem(
                menu,
                '💬 ' +
                  (fileName
                    ? '结合 ' + fileName + lineSuffix + ' 询问选中内容'
                    : zh['ask.selection']),
                true,
                function () {
                  insertIntoComposer({
                    sessionId: info.sessionId,
                    path: info.path,
                    isDir: info.isDir,
                    selectedText: info.selectedText,
                    lineRange: info.lineRange,
                  })
                  try {
                    window.getSelection().removeAllRanges()
                  } catch {}
                },
              )
              if (info.path) {
                addMenuItem(menu, '❝ 仅引用选中文本到输入框', false, function () {
                  insertIntoComposer({
                    sessionId: info.sessionId,
                    path: '',
                    isDir: false,
                    selectedText: info.selectedText,
                    lineRange: null,
                  })
                  try {
                    window.getSelection().removeAllRanges()
                  } catch {}
                })
              }
            }

            if (info.path) {
              addMenuItem(
                menu,
                (info.selectedText ? '📎 ' : '💬 ') +
                  (info.isDir
                    ? zh['ask.directory'].replace('{name}', fileName)
                    : zh['ask.file'].replace('{name}', fileName)),
                !info.selectedText,
                function () {
                  insertIntoComposer({
                    sessionId: info.sessionId,
                    path: info.path,
                    isDir: info.isDir,
                    selectedText: '',
                    lineRange: info.lineRange,
                  })
                },
              )
            }

            if (info.selectedText || info.path) {
              addSeparator(menu)
            }

            if (info.selectedText) {
              addMenuItem(menu, '📋 ' + zh['ask.copySelection'], false, function () {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(info.selectedText).catch(function () {})
                }
              })
            }

            if (info.path) {
              addMenuItem(menu, '🔗 ' + zh['ask.copyPath'], false, function () {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(info.path).catch(function () {})
                }
              })
            }

            document.body.appendChild(menu)
            menuEl = menu

            var rect = menu.getBoundingClientRect()
            var vw = window.innerWidth || document.documentElement.clientWidth
            var vh = window.innerHeight || document.documentElement.clientHeight
            var left = Math.max(8, Math.min(e.clientX, vw - rect.width - 8))
            var top = Math.max(8, Math.min(e.clientY, vh - rect.height - 8))
            menu.style.left = left + 'px'
            menu.style.top = top + 'px'
          }

          var showSelectionFloat = function () {
            closeFloat()
            if (menuEl) return
            var sel = window.getSelection ? window.getSelection() : null
            if (!sel || sel.isCollapsed || sel.rangeCount === 0) return
            var text = String(sel.toString() || '').trim()
            if (!text) return
            var range = sel.getRangeAt(0)
            var common = range.commonAncestorContainer
            var commonEl = common && common.nodeType === 1 ? common : common ? common.parentElement : null
            if (!commonEl) return
            if (commonEl.closest('input, textarea, [contenteditable="true"], .dsh-doc-ask-menu, .dsh-doc-ask-float')) {
              return
            }

            var inDocPreview = commonEl.closest('[data-textpreview-url], [data-textpreview-body]')
            var inChat = commonEl.closest('[data-chat-node-key], [data-chat-call-id]')
            if (!inDocPreview && !inChat) return

            var info = resolveContextTarget(commonEl)
            if (!info || !info.selectedText) return

            var rBounds = range.getBoundingClientRect()
            if (!rBounds || (rBounds.width === 0 && rBounds.height === 0)) return

            var pill = document.createElement('div')
            pill.className = 'dsh-doc-ask-float'

            var askBtn = document.createElement('button')
            askBtn.type = 'button'
            askBtn.className = 'dsh-doc-ask-float-btn'
            askBtn.setAttribute('data-primary', 'true')
            var fName = info.path ? basenameOfPath(info.path) : ''
            var lRange = info.lineRange
            var lText =
              lRange && lRange.start
                ? lRange.end && lRange.end > lRange.start
                  ? ':' + lRange.start + '-' + lRange.end
                  : ':' + lRange.start
                : ''
            askBtn.textContent = '💬 ' + (fName ? '询问 ' + fName + lText : zh['ask.floatAsk'])
            var askHandled = false
            var handleAsk = function (ev) {
              if (ev && ev.cancelable) ev.preventDefault()
              if (ev) ev.stopPropagation()
              lastAskPressAt = Date.now()
              lastDismissAt = Date.now()
              if (askHandled) {
                var convSvc2 = getConversationService()
                var sh2 = null
                var sid2 = info.sessionId || activeSessionId
                if (convSvc2 && convSvc2.input && typeof convSvc2.input.shell === 'function' && sid2) {
                  try {
                    sh2 = convSvc2.input.shell(sid2)
                  } catch {}
                }
                focusComposerInputNow(sh2, isMobileComposerMode())
                return
              }
              askHandled = true
              clearFloatTimer()
              closeMenu()
              try {
                var curSel = window.getSelection ? window.getSelection() : null
                if (curSel && !curSel.isCollapsed) {
                  var anc = curSel.anchorNode
                  if (!isEditableNode(anc)) {
                    curSel.removeAllRanges()
                    if (typeof curSel.empty === 'function') curSel.empty()
                  }
                }
              } catch {}
              if (pill) {
                pill.style.opacity = '0'
                setTimeout(function () {
                  if (floatEl === pill) closeFloat()
                  else if (pill.parentNode) pill.parentNode.removeChild(pill)
                }, 360)
              }
              insertIntoComposer({
                sessionId: info.sessionId,
                path: info.path,
                isDir: info.isDir,
                selectedText: info.selectedText,
                lineRange: info.lineRange,
              })
            }
            askBtn.addEventListener('pointerdown', function (ev) {
              lastAskPressAt = Date.now()
              ev.stopPropagation()
              if (ev.pointerType === 'mouse') {
                ev.preventDefault()
              }
            })
            askBtn.addEventListener('mousedown', function (ev) {
              lastAskPressAt = Date.now()
              ev.preventDefault()
              ev.stopPropagation()
            })
            askBtn.addEventListener(
              'touchstart',
              function (ev) {
                lastAskPressAt = Date.now()
                ev.stopPropagation()
              },
              { passive: true },
            )
            askBtn.addEventListener('touchend', handleAsk, { passive: false })
            askBtn.addEventListener('pointerup', function (ev) {
              if (ev.pointerType === 'mouse' || ev.pointerType === 'pen') {
                handleAsk(ev)
              } else {
                ev.stopPropagation()
              }
            })
            askBtn.addEventListener('click', handleAsk)
            pill.appendChild(askBtn)

            var div = document.createElement('span')
            div.className = 'dsh-doc-ask-float-div'
            pill.appendChild(div)

            var copyBtn = document.createElement('button')
            copyBtn.type = 'button'
            copyBtn.className = 'dsh-doc-ask-float-btn'
            copyBtn.textContent = '复制'
            var copyHandled = false
            var handleCopy = function (ev) {
              if (ev && ev.cancelable) ev.preventDefault()
              if (ev) ev.stopPropagation()
              lastAskPressAt = Date.now()
              if (copyHandled) return
              copyHandled = true
              forceClearSelection(null)
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(info.selectedText).catch(function () {})
              }
            }
            copyBtn.addEventListener('pointerdown', function (ev) {
              lastAskPressAt = Date.now()
              ev.preventDefault()
              ev.stopPropagation()
            })
            copyBtn.addEventListener(
              'touchstart',
              function (ev) {
                lastAskPressAt = Date.now()
                ev.stopPropagation()
              },
              { passive: true },
            )
            copyBtn.addEventListener('touchend', handleCopy, { passive: false })
            copyBtn.addEventListener('pointerup', handleCopy)
            copyBtn.addEventListener('click', handleCopy)
            pill.appendChild(copyBtn)

            document.body.appendChild(pill)
            floatEl = pill

            var pRect = pill.getBoundingClientRect()
            var vw = window.innerWidth || document.documentElement.clientWidth
            var vh = window.innerHeight || document.documentElement.clientHeight
            var x = rBounds.left + (rBounds.width - pRect.width) / 2
            var y = rBounds.top - pRect.height - 8
            if (y < 8) y = rBounds.bottom + 8
            x = Math.max(8, Math.min(x, vw - pRect.width - 8))
            y = Math.max(8, Math.min(y, vh - pRect.height - 8))
            pill.style.left = x + 'px'
            pill.style.top = y + 'px'
          }

          var onPointerDown = function (e) {
            if (isInsideAskUi(e.target)) {
              downState = null
              return
            }
            if (menuEl) {
              closeMenu()
            }
            var snap = captureSelectionSnapshot()
            downState = {
              hadSelection: Boolean(snap),
              snap: snap,
              x: typeof e.clientX === 'number' ? e.clientX : 0,
              y: typeof e.clientY === 'number' ? e.clientY : 0,
              time: Date.now(),
              moved: false,
              selectionChangedDuringPress: false,
              pointerType: e.pointerType || 'mouse',
            }
            if (floatEl) {
              closeFloat()
            }
          }

          var onPointerMove = function (e) {
            if (!downState) return
            var dx = (typeof e.clientX === 'number' ? e.clientX : 0) - downState.x
            var dy = (typeof e.clientY === 'number' ? e.clientY : 0) - downState.y
            if (Math.hypot(dx, dy) > 10) {
              downState.moved = true
            }
          }

          var onPointerCancel = function () {
            downState = null
          }

          var onPointerUp = function (e) {
            if (isInsideAskUi(e.target)) return
            var st = downState
            downState = null
            var cx = typeof e.clientX === 'number' ? e.clientX : st ? st.x : 0
            var cy = typeof e.clientY === 'number' ? e.clientY : st ? st.y : 0
            var dist = st ? Math.hypot(cx - st.x, cy - st.y) : 0
            var duration = st ? Date.now() - st.time : 0
            var now = Date.now()

            var isCoarse =
              (st && st.pointerType === 'touch') ||
              e.pointerType === 'touch' ||
              (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches)

            if (st && isCoarse && !st.moved && dist < 14 && duration < 280) {
              if (
                lastTouchTap &&
                now - lastTouchTap.time < 340 &&
                Math.hypot(cx - lastTouchTap.x, cy - lastTouchTap.y) < 28
              ) {
                lastTouchTap = null
                if (selectWordAtPoint(cx, cy, e.target)) {
                  if (e.cancelable) e.preventDefault()
                  return
                }
              } else {
                lastTouchTap = { time: now, x: cx, y: cy }
              }
            } else {
              lastTouchTap = null
            }

            var nowSnap = captureSelectionSnapshot()

            if (
              st &&
              st.hadSelection &&
              !st.selectionChangedDuringPress &&
              !e.shiftKey &&
              !st.moved &&
              dist < 12 &&
              duration < 280 &&
              (!e.detail || e.detail <= 1) &&
              (!nowSnap || isSameSelectionSnapshot(nowSnap, st.snap))
            ) {
              forceClearSelection(e.target)
              return
            }

            if (st && st.pointerType === 'touch' && st.moved && isSameSelectionSnapshot(nowSnap, st.snap)) {
              return
            }

            scheduleSelectionFloat(35)
          }

          var onSelectionChange = function () {
            if (Date.now() - lastAskPressAt < 600) {
              return
            }
            if (downState) {
              var curSnap = captureSelectionSnapshot()
              if (curSnap && !isSameSelectionSnapshot(curSnap, downState.snap)) {
                downState.selectionChangedDuringPress = true
              }
            }
            if (Date.now() - lastDismissAt < 220) {
              closeFloat()
              return
            }
            var snap = captureSelectionSnapshot()
            if (!snap) {
              clearFloatTimer()
              closeFloat()
              return
            }
            scheduleSelectionFloat(80)
          }

          var onKeyDown = function (e) {
            if (e.key === 'Escape') {
              forceClearSelection(null)
              return
            }
            if (e.key === 'PageUp' || e.key === 'PageDown') {
              var target = e.target
              var el = target && target.nodeType === 1 ? target : target ? target.parentElement : null
              var editableRoot = el ? el.closest('[data-composer-card] [contenteditable="true"]') : null
              if (!editableRoot) return
              var scrollBox =
                editableRoot.closest('[data-input-scroll]') ||
                editableRoot.parentElement
              e.preventDefault()
              e.stopPropagation()
              var isUp = e.key === 'PageUp'
              var step =
                scrollBox && scrollBox.clientHeight > 0
                  ? Math.max(24, Math.round(scrollBox.clientHeight * 0.85))
                  : 120
              if (scrollBox && scrollBox.scrollHeight > scrollBox.clientHeight) {
                scrollBox.scrollTop = isUp
                  ? Math.max(0, scrollBox.scrollTop - step)
                  : Math.min(scrollBox.scrollHeight - scrollBox.clientHeight, scrollBox.scrollTop + step)
              }
              try {
                var sel = window.getSelection ? window.getSelection() : null
                if (sel && typeof sel.modify === 'function') {
                  var alter = e.shiftKey ? 'extend' : 'move'
                  var direction = isUp ? 'backward' : 'forward'
                  var linesToMove = Math.max(1, Math.round(step / 24))
                  for (var li = 0; li < linesToMove; li++) {
                    sel.modify(alter, direction, 'line')
                  }
                }
              } catch {}
            }
          }

          var onScroll = function () {
            if (menuEl) closeMenu()
            if (floatEl) closeFloat()
          }

          document.addEventListener('contextmenu', onContextMenu, true)
          document.addEventListener('pointerdown', onPointerDown, true)
          document.addEventListener('pointermove', onPointerMove, true)
          document.addEventListener('pointercancel', onPointerCancel, true)
          document.addEventListener('pointerup', onPointerUp, true)
          document.addEventListener('selectionchange', onSelectionChange, true)
          document.addEventListener('keydown', onKeyDown, true)
          document.addEventListener('scroll', onScroll, true)

          return function () {
            clearFloatTimer()
            closeMenu()
            closeFloat()
            document.removeEventListener('contextmenu', onContextMenu, true)
            document.removeEventListener('pointerdown', onPointerDown, true)
            document.removeEventListener('pointermove', onPointerMove, true)
            document.removeEventListener('pointercancel', onPointerCancel, true)
            document.removeEventListener('pointerup', onPointerUp, true)
            document.removeEventListener('selectionchange', onSelectionChange, true)
            document.removeEventListener('keydown', onKeyDown, true)
            document.removeEventListener('scroll', onScroll, true)
          }
        }, 'dsh-context-selector: doc-ask-interaction')

        ctx.slots.inject('sidebar.right.tab.document.actions', function () {
          return ctx.slots.register(
            {
              name: 'sidebar.right.tab.document.actions',
              id: 'context-selector-doc-ask-btn',
              order: 5,
              locale: NS,
              inject: function (sessionId) {
                return {
                  onAsk: function (absPath) {
                    var sel =
                      typeof window !== 'undefined' && window.getSelection
                        ? String(window.getSelection().toString() || '').trim()
                        : ''
                    insertIntoComposer({
                      sessionId: sessionId || activeSessionId,
                      path: absPath,
                      isDir: false,
                      selectedText: sel,
                    })
                  },
                }
              },
            },
            DocumentHeaderAskButton,
          )
        })

        var extractTextFromBlocks = function (blocks) {
          if (!Array.isArray(blocks)) return ''
          var parts = []
          for (var i = 0; i < blocks.length; i++) {
            var b = blocks[i]
            if (!b || typeof b !== 'object') continue
            if ((b.type === 'text' || b.type === 'reasoning') && typeof b.text === 'string') {
              parts.push(b.text)
            } else if (b.type === 'tool-result' && Array.isArray(b.content)) {
              for (var j = 0; j < b.content.length; j++) {
                var sub = b.content[j]
                if (sub && sub.type === 'text' && typeof sub.text === 'string') {
                  parts.push(sub.text)
                }
              }
            }
          }
          return parts.join('\n')
        }

        var oneLineText = function (text, maxChars) {
          var limit = maxChars || 88
          var cleaned = String(text || '').replace(/\s+/g, ' ').trim()
          if (!cleaned) return ''
          return cleaned.length <= limit ? cleaned : cleaned.slice(0, limit) + '…'
        }

        var buildLocalClientInspection = function (sid) {
          try {
            var ctrl = controllers.get(sid)
            var snap = ctrl ? ctrl.getSnapshot() : null
            var events = readClientSessionEvents(getSessionsService, sid)

            if (events.length > 0) {
              var foldNodes = []
              var findIdx = function (seqVal) {
                for (var k = 0; k < foldNodes.length; k++) {
                  if (foldNodes[k].seq === seqVal) return k
                }
                return -1
              }
              var curTurn = 0
              var curStep = 1
              var seqToTurn = new Map()
              var seqToStep = new Map()
              var latestHeader = null

              for (var idx = 0; idx < events.length; idx++) {
                var ev = events[idx]
                if (!ev || typeof ev !== 'object') continue
                if (ev.type === 'request/header' && ev.data && ev.data.header) {
                  latestHeader = ev.data.header
                }
                if (ev.type === 'turn/start') {
                  var tn = Number((ev.data && ev.data.turn) || 0)
                  if (tn > 0) {
                    curTurn = tn
                    curStep = 1
                  }
                  continue
                }
                if (ev.type === 'step/start') {
                  var sn = Number((ev.data && ev.data.step) || 1)
                  if (sn > 0) curStep = sn
                  continue
                }
                var expT = ev.data && typeof ev.data.turn === 'number' ? ev.data.turn : curTurn
                if (typeof ev.seq === 'number') {
                  if (expT > 0) seqToTurn.set(ev.seq, expT)
                  seqToStep.set(ev.seq, Number((ev.data && ev.data.step) || curStep))
                }
                var isSurf =
                  ev.surfaceOp !== undefined &&
                  (ev.type === 'system/message' ||
                    ev.type === 'developer/message' ||
                    ev.type === 'user/message' ||
                    ev.type === 'assistant/message' ||
                    ev.type === 'tool/result')
                if (!isSurf) continue
                if (ev.surfaceOp === 'append') {
                  foldNodes.push(ev)
                } else if (ev.surfaceOp && ev.surfaceOp.op === 'replace') {
                  var sIdx = findIdx(ev.surfaceOp.startSeq)
                  var eIdx = findIdx(ev.surfaceOp.endSeq)
                  if (sIdx !== -1 && eIdx !== -1 && sIdx <= eIdx) {
                    foldNodes.splice(sIdx, eIdx - sIdx + 1, ev)
                  } else {
                    foldNodes.push(ev)
                  }
                }
              }

              var sysItems = []
              var sysTok = 0
              var sysChars = 0
              var msgItems = []
              var msgTok = 0
              var msgSaved = 0
              var msgChars = 0
              var sysOrder = 0
              var msgOrder = 0

              var exclTurns = new Set((snap && snap.state && snap.state.excludedTurns) || [])
              var exclMsgs = new Set((snap && snap.state && snap.state.excludedMessageIds) || [])
              var exclCalls = new Set((snap && snap.state && snap.state.excludedCallIds) || [])

              for (var f = 0; f < foldNodes.length; f++) {
                var fev = foldNodes[f]
                var fSeq = fev.seq
                var fTurn = seqToTurn.get(fSeq) || 0
                var fStep = seqToStep.get(fSeq) || 1
                var msgObj = fev.type === 'user/message' ? fev.data : fev.data && fev.data.message
                if (!msgObj) continue
                var txt = extractTextFromBlocks(msgObj.content)
                var estTok = Math.ceil((txt.length || JSON.stringify(msgObj.content || []).length) / 4) + 4

                if (fev.type === 'system/message') {
                  sysTok += estTok
                  sysChars += txt.length
                  var paras = txt
                    .split(/\n{2,}/)
                    .map(function (p) {
                      return p.trim()
                    })
                    .filter(Boolean)
                  if (paras.length > 1) {
                    for (var pIdx = 0; pIdx < paras.length; pIdx++) {
                      var pText = paras[pIdx]
                      var fLine = pText.split('\n')[0].trim()
                      sysItems.push({
                        order: ++sysOrder,
                        seq: fSeq,
                        title: '段落 #' + (pIdx + 1) + ' · ' + oneLineText(fLine, 56),
                        category: '系统提示词分段',
                        chars: pText.length,
                        tokens: Math.ceil(pText.length / 4),
                        content: pText,
                      })
                    }
                  } else {
                    sysItems.push({
                      order: ++sysOrder,
                      seq: fSeq,
                      title: '系统提示词 (seq #' + fSeq + ')',
                      category: 'System Prompt',
                      chars: txt.length,
                      tokens: estTok,
                      content: txt,
                    })
                  }
                  continue
                }

                var mId = typeof msgObj.id === 'string' ? msgObj.id : 'seq-' + fSeq
                var tExcl = fTurn > 0 && exclTurns.has(fTurn)

                if (fev.type === 'user/message') {
                  var sKind = String((msgObj.source && (msgObj.source.kind || msgObj.source.plugin)) || '')
                  var isCp = sKind === 'compact-checkpoint' || txt.indexOf('<compacted-summary>') !== -1
                  var isProt =
                    sKind === 'agent-instructions' || sKind === 'skill-catalog'
                  var isAmb =
                    sKind !== 'user' &&
                    (sKind === 'runtime-context' ||
                      sKind === 'time-context' ||
                      sKind === 'plan-mode' ||
                      txt.indexOf('Current runtime context.') === 0 ||
                      txt.indexOf('<system-reminder>') === 0)
                  var inc = isProt || (!( !isCp && tExcl) && !exclMsgs.has(mId))
                  if (inc) msgTok += estTok
                  else msgSaved += estTok
                  msgChars += txt.length

                  var cat = '我发送的消息 (User)'
                  var bdg = fTurn > 0 ? '第 ' + fTurn + ' 轮 · 提问' : '提问'
                  var exMeta = null
                  if (isCp) {
                    cat = '上下文压缩检查点 (Compaction Summary)'
                    bdg = '📦 压缩摘要'
                    if (fev.surfaceOp && fev.surfaceOp.op === 'replace') {
                      exMeta = '替换原节点 seq ' + fev.surfaceOp.startSeq + ' ~ ' + fev.surfaceOp.endSeq
                    }
                  } else if (sKind === 'agent-instructions') {
                    cat = '项目指令 (AGENTS.md)'
                    bdg = '📌 指令注入'
                  } else if (sKind === 'skill-catalog') {
                    cat = '技能目录 (Available Skills)'
                    bdg = '🧰 技能目录'
                  } else if (isAmb) {
                    cat = '环境状态快照 (' + (sKind || 'runtime-context') + ')'
                    bdg = '🌐 环境上下文'
                  }

                  msgItems.push({
                    order: ++msgOrder,
                    seq: fSeq,
                    id: mId,
                    turn: fTurn,
                    step: fStep,
                    role: 'user',
                    subKind: isCp ? 'checkpoint' : isProt ? 'protected' : isAmb ? 'ambient' : 'user',
                    category: cat,
                    badge: bdg,
                    extraMeta: exMeta,
                    included: inc,
                    canToggle: !isProt && typeof msgObj.id === 'string',
                    tokens: estTok,
                    chars: txt.length,
                    title: oneLineText(txt, 82) || cat,
                    content: txt,
                  })
                } else if (fev.type === 'assistant/message') {
                  var cBlocks = Array.isArray(msgObj.content) ? msgObj.content : []
                  var tParts = []
                  var rParts = []
                  var tCalls = []
                  for (var cbIdx = 0; cbIdx < cBlocks.length; cbIdx++) {
                    var blk = cBlocks[cbIdx]
                    if (!blk) continue
                    if (blk.type === 'text' && blk.text) tParts.push(blk.text)
                    else if (blk.type === 'reasoning' && blk.text) rParts.push(blk.text)
                    else if (blk.type === 'tool-call') tCalls.push(blk)
                  }
                  var aInc = !tExcl && !exclMsgs.has(mId)
                  var secArr = []
                  if (rParts.length > 0) secArr.push('【思考过程】\n' + rParts.join('\n\n'))
                  if (tParts.length > 0) secArr.push('【正式回复】\n' + tParts.join('\n\n'))
                  if (tCalls.length > 0) {
                    secArr.push(
                      '【发起工具调用】\n' +
                        tCalls
                          .map(function (tc) {
                            return tc.name + '(' + (tc.arguments || '') + ')'
                          })
                          .join('\n'),
                    )
                  }
                  var fullA = secArr.join('\n\n────────────────\n\n') || JSON.stringify(cBlocks, null, 2)
                  var aTok = Math.ceil(fullA.length / 4) + 4
                  if (aInc) msgTok += aTok
                  else msgSaved += aTok
                  msgChars += fullA.length

                  msgItems.push({
                    order: ++msgOrder,
                    seq: fSeq,
                    id: mId,
                    turn: fTurn,
                    step: fStep,
                    role: 'assistant',
                    subKind: tParts.length > 0 ? 'assistant-reply' : 'assistant-step',
                    category: tParts.length > 0 ? 'AI 回复与推理' : 'AI 工具调用请求',
                    badge: fTurn > 0 ? '第 ' + fTurn + ' 轮 · Step ' + fStep + ' · AI' : 'AI 回复',
                    included: aInc,
                    canToggle: true,
                    tokens: aTok,
                    chars: fullA.length,
                    title:
                      oneLineText(tParts.join(' '), 80) ||
                      (tCalls.length > 0
                        ? '调用工具: ' +
                          tCalls
                            .map(function (x) {
                              return x.name
                            })
                            .join(', ')
                        : oneLineText(rParts.join(' '), 80)) ||
                      'Assistant',
                    content: fullA,
                  })
                } else if (fev.type === 'tool/result') {
                  var cId = String((msgObj.toolCallId || (msgObj.source && msgObj.source.callId)) || '')
                  var cMeta = snap && snap.callMap ? snap.callMap.get(cId) : null
                  var tName = (cMeta && cMeta.toolName) || 'tool'
                  var isPruned = txt.indexOf('[... tool result middle pruned ...]') !== -1
                  var trInc = !tExcl && !exclMsgs.has(mId) && (!cId || !exclCalls.has(cId))
                  if (trInc) msgTok += estTok
                  else msgSaved += estTok
                  msgChars += txt.length

                  msgItems.push({
                    order: ++msgOrder,
                    seq: fSeq,
                    id: mId,
                    callId: cId,
                    turn: fTurn,
                    step: fStep,
                    role: 'tool',
                    subKind: isPruned ? 'tool-pruned' : 'tool-result',
                    category: '工具返回结果 (' + tName + ')',
                    badge: fTurn > 0 ? '第 ' + fTurn + ' 轮 · 工具 · ' + tName : '工具 · ' + tName,
                    extraMeta: isPruned ? '✂️ 超过 8192 字符阈值，中间段已被自动裁剪' : null,
                    included: trInc,
                    canToggle: true,
                    tokens: estTok,
                    chars: txt.length,
                    title: (cMeta && cMeta.summary) || tName + ' · ' + oneLineText(txt, 70),
                    content: txt,
                  })
                }
              }

              var hTools = latestHeader && Array.isArray(latestHeader.tools) ? latestHeader.tools : []
              var tItems = []
              var tTokTotal = 0
              var tCharTotal = 0
              for (var ti = 0; ti < hTools.length; ti++) {
                var tl = hTools[ti]
                var sJson = JSON.stringify(tl, null, 2)
                var tk = Math.ceil(JSON.stringify(tl).length / 4)
                tTokTotal += tk
                tCharTotal += sJson.length
                var pNames =
                  tl && tl.parameters && tl.parameters.properties
                    ? Object.keys(tl.parameters.properties)
                    : []
                tItems.push({
                  order: ti + 1,
                  name: String((tl && tl.name) || 'tool_' + (ti + 1)),
                  paramCount: pNames.length,
                  paramNames: pNames,
                  chars: sJson.length,
                  tokens: tk,
                  preview: oneLineText(tl && tl.description, 90),
                  description: String((tl && tl.description) || ''),
                  schemaJson: sJson,
                })
              }

              return {
                ok: true,
                sessionId: sid,
                system: { totalTokens: sysTok, totalChars: sysChars, count: sysItems.length, items: sysItems },
                tools: { totalTokens: tTokTotal, totalChars: tCharTotal, count: tItems.length, items: tItems },
                messages: {
                  totalTokens: msgTok,
                  savedTokens: msgSaved,
                  totalChars: msgChars,
                  count: msgItems.length,
                  items: msgItems,
                },
              }
            }

            if (snap && Array.isArray(snap.turns)) {
              var fallbackMsgs = []
              var fOrder = 0
              var cps = Array.isArray(snap.checkpoints) ? snap.checkpoints : []
              for (var cpi2 = 0; cpi2 < cps.length; cpi2++) {
                var cp = cps[cpi2]
                fallbackMsgs.push({
                  order: ++fOrder,
                  seq: cp.seq || fOrder,
                  id: cp.id,
                  turn: cp.afterTurn || cp.turn || 0,
                  step: 1,
                  role: 'user',
                  subKind: 'checkpoint',
                  category: '上下文压缩检查点 (Compaction Summary)',
                  badge: '📦 压缩摘要',
                  extraMeta:
                    Array.isArray(cp.coveredTurns) && cp.coveredTurns.length > 0
                      ? '已浓缩第 ' + cp.coveredTurns[0] + '~' + cp.coveredTurns[cp.coveredTurns.length - 1] + ' 轮历史'
                      : null,
                  included: cp.included,
                  canToggle: true,
                  tokens: cp.tokens || 0,
                  chars: cp.chars || 0,
                  title: cp.preview || '压缩摘要',
                  content: cp.fullText || cp.preview || '',
                })
              }
              for (var ti2 = 0; ti2 < snap.turns.length; ti2++) {
                var tr = snap.turns[ti2]
                if (tr.compacted) continue
                var ms = Array.isArray(tr.messages) ? tr.messages : []
                for (var mi = 0; mi < ms.length; mi++) {
                  var m = ms[mi]
                  fallbackMsgs.push({
                    order: ++fOrder,
                    seq: m.seq || fOrder,
                    id: m.id,
                    callId: m.toolCallId,
                    turn: tr.turn,
                    step: m.step || 1,
                    role: m.role,
                    subKind: m.kind === 'assistant' ? 'assistant-reply' : m.kind || m.role,
                    category: m.role === 'user' ? '我发送的消息' : m.role === 'tool' ? '工具结果 (' + (m.toolName || 'tool') + ')' : 'AI 回复',
                    badge: '第 ' + tr.turn + ' 轮 · ' + (m.role === 'user' ? '提问' : m.role === 'tool' ? m.toolName || '工具' : 'AI'),
                    included: m.included,
                    canToggle: true,
                    tokens: m.tokens || 0,
                    chars: m.chars || 0,
                    title: m.summary || m.preview || '(无预览)',
                    content: m.preview || '',
                  })
                }
              }
              return {
                ok: true,
                sessionId: sid,
                system: { totalTokens: 0, totalChars: 0, count: 0, items: [] },
                tools: { totalTokens: 0, totalChars: 0, count: 0, items: [] },
                messages: { totalTokens: 0, savedTokens: 0, totalChars: 0, count: fallbackMsgs.length, items: fallbackMsgs },
              }
            }
          } catch {}
          return null
        }

        var enhanceContextMeterPanels = function () {
          if (typeof document === 'undefined') return
          var dialogs = document.querySelectorAll('div[role="dialog"]')
          for (var i = 0; i < dialogs.length; i++) {
            var panel = dialogs[i]
            var dl = panel.querySelector('dl')
            if (!dl) continue
            var rowDivs = dl.querySelectorAll(':scope > div')
            if (rowDivs.length !== 3) continue
            if (panel.getAttribute('data-ctx-meter-bound') === BIND_REV) continue
            panel.setAttribute('data-ctx-meter-bound', BIND_REV)

            ;(function (targetPanel, targetDl, rows) {
              var rowKeys = ['system', 'tools', 'messages']
              var activeTab = null
              var roleFilter = 'all'
              var cachedData = null
              var loading = false
              var expandedSeqs = {}

              var hintBar = targetPanel.querySelector('.dsh-ctx-meter-hint')
              if (!hintBar) {
                hintBar = document.createElement('div')
                hintBar.className = 'dsh-ctx-meter-hint'
                hintBar.innerHTML = '<span>💡 点击上方任意分类可按顺序查看上下文具体内容</span>'
                targetPanel.appendChild(hintBar)
              }

              var inspectorBox = targetPanel.querySelector('.dsh-ctx-inspector')
              if (!inspectorBox) {
                inspectorBox = document.createElement('div')
                inspectorBox.className = 'dsh-ctx-inspector'
                inspectorBox.style.display = 'none'
                targetPanel.appendChild(inspectorBox)
              }

              var syncRowHighlights = function () {
                for (var rIdx = 0; rIdx < rows.length; rIdx++) {
                  var rk = rowKeys[rIdx]
                  var rEl = rows[rIdx]
                  rEl.setAttribute('data-active', activeTab === rk ? 'true' : 'false')
                }
                if (activeTab) {
                  targetPanel.setAttribute('data-ctx-meter-enhanced', 'true')
                  inspectorBox.style.display = 'flex'
                  hintBar.style.display = 'none'
                } else {
                  targetPanel.removeAttribute('data-ctx-meter-enhanced')
                  inspectorBox.style.display = 'none'
                  hintBar.style.display = 'flex'
                }
              }

              var fetchInspectData = function (forceRefresh) {
                if (cachedData && !forceRefresh) {
                  renderInspector()
                  return
                }
                var sid = activeSessionId
                if (!sid) {
                  inspectorBox.innerHTML = '<div style="font-size:11.5px;color:var(--dsw-alias-label-tertiary);">未获取到当前会话 ID</div>'
                  return
                }
                loading = true
                renderInspector()
                fetch('/api/context-selector/inspect?sessionId=' + encodeURIComponent(sid), {
                  headers: { accept: 'application/json' },
                })
                  .then(function (res) {
                    if (res.ok) return res.json()
                    return fetch(
                      '/api/context-selector/state?inspect=1&sessionId=' + encodeURIComponent(sid),
                      { headers: { accept: 'application/json' } },
                    ).then(function (r2) {
                      return r2.ok ? r2.json() : null
                    })
                  })
                  .then(function (data) {
                    loading = false
                    if (data && data.ok && (data.system || data.tools || data.messages)) {
                      cachedData = data
                    } else {
                      cachedData = buildLocalClientInspection(sid)
                    }
                    renderInspector()
                  })
                  .catch(function () {
                    loading = false
                    cachedData = buildLocalClientInspection(sid)
                    renderInspector()
                  })
              }

              var renderInspector = function () {
                inspectorBox.innerHTML = ''
                if (!activeTab) return

                var head = document.createElement('div')
                head.className = 'dsh-ctx-inspector-head'

                var tabsWrap = document.createElement('div')
                tabsWrap.className = 'dsh-ctx-inspector-tabs'
                var tabDefs = [
                  { key: 'system', label: '系统提示词' },
                  { key: 'tools', label: '工具定义' },
                  { key: 'messages', label: '对话消息' },
                ]
                tabDefs.forEach(function (td) {
                  var tb = document.createElement('button')
                  tb.type = 'button'
                  tb.className = 'dsh-ctx-inspector-tab'
                  tb.setAttribute('data-active', activeTab === td.key ? 'true' : 'false')
                  tb.textContent = td.label
                  tb.onclick = function (ev) {
                    ev.stopPropagation()
                    activeTab = td.key
                    syncRowHighlights()
                    renderInspector()
                  }
                  tabsWrap.appendChild(tb)
                })
                head.appendChild(tabsWrap)

                var rightBtns = document.createElement('div')
                rightBtns.style.display = 'inline-flex'
                rightBtns.style.gap = '4px'

                var refreshBtn = document.createElement('button')
                refreshBtn.type = 'button'
                refreshBtn.className = 'dsh-ctx-inspector-chip'
                refreshBtn.textContent = '↻ 刷新'
                refreshBtn.onclick = function (ev) {
                  ev.stopPropagation()
                  fetchInspectData(true)
                }
                rightBtns.appendChild(refreshBtn)

                var collapseBtn = document.createElement('button')
                collapseBtn.type = 'button'
                collapseBtn.className = 'dsh-ctx-inspector-chip'
                collapseBtn.textContent = '收起 ✕'
                collapseBtn.onclick = function (ev) {
                  ev.stopPropagation()
                  activeTab = null
                  syncRowHighlights()
                }
                rightBtns.appendChild(collapseBtn)

                head.appendChild(rightBtns)
                inspectorBox.appendChild(head)

                if (loading) {
                  var loadEl = document.createElement('div')
                  loadEl.style.padding = '12px 4px'
                  loadEl.style.fontSize = '12px'
                  loadEl.style.color = 'var(--dsw-alias-label-tertiary)'
                  loadEl.textContent = '正在读取当前上下文顺序明细…'
                  inspectorBox.appendChild(loadEl)
                  return
                }

                if (!cachedData) {
                  var errEl = document.createElement('div')
                  errEl.style.padding = '12px 4px'
                  errEl.style.fontSize = '12px'
                  errEl.style.color = 'var(--dsw-alias-label-tertiary)'
                  errEl.textContent = '暂无上下文明细数据'
                  inspectorBox.appendChild(errEl)
                  return
                }

                if (activeTab === 'messages') {
                  var filterBar = document.createElement('div')
                  filterBar.className = 'dsh-ctx-inspector-filter-bar'
                  var allItems = (cachedData.messages && cachedData.messages.items) || []
                  var filters = [
                    { id: 'all', label: '全部按序 (' + allItems.length + ')' },
                    {
                      id: 'checkpoint',
                      label:
                        '压缩/系统注入 (' +
                        allItems.filter(function (x) {
                          return x.subKind === 'checkpoint' || x.subKind === 'protected' || x.subKind === 'ambient' || x.role === 'developer'
                        }).length +
                        ')',
                    },
                    {
                      id: 'user',
                      label:
                        '我说的 (' +
                        allItems.filter(function (x) {
                          return x.subKind === 'user'
                        }).length +
                        ')',
                    },
                    {
                      id: 'assistant',
                      label:
                        'AI回复/推理 (' +
                        allItems.filter(function (x) {
                          return x.role === 'assistant'
                        }).length +
                        ')',
                    },
                    {
                      id: 'tool',
                      label:
                        '工具结果 (' +
                        allItems.filter(function (x) {
                          return x.role === 'tool'
                        }).length +
                        ')',
                    },
                  ]
                  filters.forEach(function (f) {
                    var chip = document.createElement('button')
                    chip.type = 'button'
                    chip.className = 'dsh-ctx-inspector-chip'
                    chip.setAttribute('data-active', roleFilter === f.id ? 'true' : 'false')
                    chip.textContent = f.label
                    chip.onclick = function (ev) {
                      ev.stopPropagation()
                      roleFilter = f.id
                      renderInspector()
                    }
                    filterBar.appendChild(chip)
                  })
                  inspectorBox.appendChild(filterBar)
                }

                var listEl = document.createElement('div')
                listEl.className = 'dsh-ctx-inspector-list'

                if (activeTab === 'system') {
                  var activeCtrl = activeSessionId ? controllers.get(activeSessionId) : null
                  var activeSnap = activeCtrl ? activeCtrl.getSnapshot() : null
                  var stObj = (activeSnap && activeSnap.state) || {}
                  var excludedSysOrders = stObj.excludedSystemOrders || []

                  var sysOverrideBox = document.createElement('div')
                  sysOverrideBox.className = 'dsh-ctx-sys-bar'
                  sysOverrideBox.style.marginBottom = '6px'
                  sysOverrideBox.onclick = function (ev) {
                    ev.stopPropagation()
                  }

                  var topRow = document.createElement('div')
                  topRow.className = 'dsh-ctx-sys-row'

                  var leftLabel = document.createElement('span')
                  leftLabel.style.fontWeight = '600'
                  leftLabel.textContent = '🎭 切换模式提示词:'
                  topRow.appendChild(leftLabel)

                  var presetSelect = document.createElement('select')
                  presetSelect.className = 'dsh-ctx-sys-select'
                  var defaultOpt = document.createElement('option')
                  defaultOpt.value = ''
                  defaultOpt.textContent =
                    '默认 (' + (activeSnap && activeSnap.activePreset ? '当前: ' + activeSnap.activePreset : '保持会话初始模式') + ')'
                  presetSelect.appendChild(defaultOpt)
                  buildEffectivePresetList(activeSnap).forEach(function (tpl) {
                    var opt = document.createElement('option')
                    opt.value = tpl.id
                    opt.textContent = tpl.name
                    presetSelect.appendChild(opt)
                  })
                  var customOpt = document.createElement('option')
                  customOpt.value = 'custom'
                  customOpt.textContent = '✍️ 自定义系统提示词'
                  presetSelect.appendChild(customOpt)
                  presetSelect.value = stObj.systemPresetOverride || ''

                  var customInput = document.createElement('textarea')
                  customInput.className = 'dsh-ctx-sys-textarea'
                  customInput.placeholder = '在此输入自定义或模式覆盖的系统提示词（保存后下一轮立即生效）…'
                  customInput.value = stObj.customSystemPrompt || ''

                  presetSelect.onchange = function (ev) {
                    ev.stopPropagation()
                    var val = presetSelect.value
                    if (!val) {
                      customInput.value = ''
                      if (activeCtrl) {
                        activeCtrl
                          .sendAction({
                            action: 'set-system-override',
                            systemPresetOverride: null,
                            customSystemPrompt: '',
                            customSystemMode: 'append',
                          })
                          .then(function () {
                            fetchInspectData(true)
                          })
                      }
                      return
                    }
                    var tpl = findPresetTemplate(val)
                    if (tpl) {
                      customInput.value = tpl.prompt
                      if (activeCtrl) {
                        activeCtrl
                          .sendAction({
                            action: 'set-system-override',
                            systemPresetOverride: val,
                            customSystemPrompt: tpl.prompt,
                            customSystemMode: tpl.mode,
                          })
                          .then(function () {
                            fetchInspectData(true)
                          })
                      }
                    }
                  }
                  topRow.appendChild(presetSelect)

                  var saveBtn = document.createElement('button')
                  saveBtn.type = 'button'
                  saveBtn.className = 'dsh-ctx-inspector-chip'
                  saveBtn.setAttribute('data-active', 'true')
                  saveBtn.textContent = '💾 保存生效'
                  saveBtn.onclick = function (ev) {
                    ev.stopPropagation()
                    if (activeCtrl) {
                      activeCtrl
                        .sendAction({
                          action: 'set-system-override',
                          systemPresetOverride:
                            presetSelect.value || (customInput.value.trim() ? 'custom' : null),
                          customSystemPrompt: customInput.value,
                          customSystemMode: stObj.customSystemMode || 'append',
                        })
                        .then(function () {
                          fetchInspectData(true)
                        })
                    }
                  }
                  topRow.appendChild(saveBtn)

                  sysOverrideBox.appendChild(topRow)
                  sysOverrideBox.appendChild(customInput)
                  listEl.appendChild(sysOverrideBox)

                  var sysItems = (cachedData.system && cachedData.system.items) || []
                  if (sysItems.length === 0) {
                    var emptySys = document.createElement('div')
                    emptySys.style.fontSize = '11.5px'
                    emptySys.style.color = 'var(--dsw-alias-label-tertiary)'
                    emptySys.style.padding = '8px 0'
                    emptySys.textContent = '当前无基础系统提示词节点'
                    listEl.appendChild(emptySys)
                  }
                  sysItems.forEach(function (item) {
                    var key = 'sys-' + item.order
                    var isExp = Boolean(expandedSeqs[key])
                    var isInc =
                      item.included !== undefined
                        ? Boolean(item.included)
                        : excludedSysOrders.indexOf(item.order) === -1
                    var card = document.createElement('div')
                    card.className = 'dsh-ctx-inspector-card'
                    if (!isInc) card.setAttribute('data-excluded', 'true')

                    var top = document.createElement('div')
                    top.className = 'dsh-ctx-inspector-card-top'
                    top.onclick = function (ev) {
                      ev.stopPropagation()
                      expandedSeqs[key] = !isExp
                      renderInspector()
                    }

                    var cb = document.createElement('input')
                    cb.type = 'checkbox'
                    cb.className = 'dsh-ctx-sel-checkbox'
                    cb.checked = isInc
                    cb.title = '勾选 = 保留此段系统提示词；取消勾选 = 从系统提示词中剔除此段'
                    cb.onclick = function (ev) {
                      ev.stopPropagation()
                    }
                    cb.onchange = function (ev) {
                      ev.stopPropagation()
                      var nextVal = this.checked
                      item.included = nextVal
                      card.setAttribute('data-excluded', !nextVal ? 'true' : 'false')
                      if (activeCtrl) {
                        activeCtrl.sendAction({
                          action: 'toggle-system-section',
                          order: item.order,
                          included: nextVal,
                        })
                      }
                    }
                    top.appendChild(cb)

                    var seqSpan = document.createElement('span')
                    seqSpan.className = 'dsh-ctx-inspector-seq'
                    seqSpan.textContent = '#' + item.order
                    top.appendChild(seqSpan)

                    var badge = document.createElement('span')
                    badge.className = 'dsh-ctx-inspector-badge'
                    badge.textContent = item.category
                    top.appendChild(badge)

                    var titleSpan = document.createElement('span')
                    titleSpan.className = 'dsh-ctx-inspector-item-title'
                    titleSpan.textContent = item.title
                    top.appendChild(titleSpan)

                    var tokSpan = document.createElement('span')
                    tokSpan.className = 'dsh-ctx-inspector-tok'
                    tokSpan.textContent = '~' + formatTokensCount(item.tokens) + ' (' + (isExp ? '▲' : '▼') + ')'
                    top.appendChild(tokSpan)

                    card.appendChild(top)

                    if (isExp) {
                      var pre = document.createElement('pre')
                      pre.className = 'dsh-ctx-inspector-pre'
                      pre.textContent = item.content
                      pre.onclick = function (ev) {
                        ev.stopPropagation()
                      }
                      card.appendChild(pre)
                    }
                    listEl.appendChild(card)
                  })
                } else if (activeTab === 'tools') {
                  var toolItems = (cachedData.tools && cachedData.tools.items) || []
                  if (toolItems.length === 0) {
                    listEl.innerHTML = '<div style="font-size:11.5px;color:var(--dsw-alias-label-tertiary);padding:8px 0;">当前未挂载工具定义</div>'
                  }
                  toolItems.forEach(function (item) {
                    var key = 'tool-' + item.name
                    var isExp = Boolean(expandedSeqs[key])
                    var card = document.createElement('div')
                    card.className = 'dsh-ctx-inspector-card'

                    var top = document.createElement('div')
                    top.className = 'dsh-ctx-inspector-card-top'
                    top.onclick = function (ev) {
                      ev.stopPropagation()
                      expandedSeqs[key] = !isExp
                      renderInspector()
                    }

                    var seqSpan = document.createElement('span')
                    seqSpan.className = 'dsh-ctx-inspector-seq'
                    seqSpan.textContent = '#' + item.order
                    top.appendChild(seqSpan)

                    var badge = document.createElement('span')
                    badge.className = 'dsh-ctx-inspector-badge'
                    badge.setAttribute('data-kind', 'tool-result')
                    badge.textContent = item.name + ' (' + item.paramCount + ' 参数)'
                    top.appendChild(badge)

                    var titleSpan = document.createElement('span')
                    titleSpan.className = 'dsh-ctx-inspector-item-title'
                    titleSpan.textContent = item.preview || item.name
                    top.appendChild(titleSpan)

                    var tokSpan = document.createElement('span')
                    tokSpan.className = 'dsh-ctx-inspector-tok'
                    tokSpan.textContent = '~' + formatTokensCount(item.tokens) + ' (' + (isExp ? '▲' : '▼') + ')'
                    top.appendChild(tokSpan)

                    card.appendChild(top)

                    if (isExp) {
                      var pre = document.createElement('pre')
                      pre.className = 'dsh-ctx-inspector-pre'
                      pre.textContent =
                        '【功能描述】\n' +
                        item.description +
                        '\n\n【参数列表】\n' +
                        (item.paramNames.join(', ') || '无') +
                        '\n\n【完整 JSON Schema】\n' +
                        item.schemaJson
                      pre.onclick = function (ev) {
                        ev.stopPropagation()
                      }
                      card.appendChild(pre)
                    }
                    listEl.appendChild(card)
                  })
                } else if (activeTab === 'messages') {
                  var msgItems = ((cachedData.messages && cachedData.messages.items) || []).filter(function (m) {
                    if (roleFilter === 'all') return true
                    if (roleFilter === 'checkpoint') {
                      return (
                        m.subKind === 'checkpoint' ||
                        m.subKind === 'protected' ||
                        m.subKind === 'ambient' ||
                        m.role === 'developer'
                      )
                    }
                    if (roleFilter === 'user') return m.subKind === 'user'
                    if (roleFilter === 'assistant') return m.role === 'assistant'
                    if (roleFilter === 'tool') return m.role === 'tool'
                    return true
                  })

                  if (msgItems.length === 0) {
                    listEl.innerHTML = '<div style="font-size:11.5px;color:var(--dsw-alias-label-tertiary);padding:8px 0;">该分类下暂无上下文消息</div>'
                  }

                  msgItems.forEach(function (item) {
                    var key = 'msg-' + item.seq + '-' + item.order
                    var isExp = Boolean(expandedSeqs[key])
                    var card = document.createElement('div')
                    card.className = 'dsh-ctx-inspector-card'
                    if (!item.included) card.setAttribute('data-excluded', 'true')

                    var top = document.createElement('div')
                    top.className = 'dsh-ctx-inspector-card-top'
                    top.onclick = function (ev) {
                      ev.stopPropagation()
                      expandedSeqs[key] = !isExp
                      renderInspector()
                    }

                    if (item.canToggle) {
                      var cb = document.createElement('input')
                      cb.type = 'checkbox'
                      cb.className = 'dsh-ctx-sel-checkbox'
                      cb.checked = Boolean(item.included)
                      cb.title = '勾选 = 发送给 AI；取消勾选 = 下次请求排除此条'
                      cb.onclick = function (ev) {
                        ev.stopPropagation()
                      }
                      cb.onchange = function (ev) {
                        ev.stopPropagation()
                        var nextInc = this.checked
                        item.included = nextInc
                        card.setAttribute('data-excluded', !nextInc ? 'true' : 'false')
                        var ctrl = activeSessionId ? controllers.get(activeSessionId) : null
                        if (ctrl) {
                          if (item.role === 'tool' && item.callId) {
                            ctrl.sendAction({
                              action: 'toggle-call',
                              callId: item.callId,
                              included: nextInc,
                            })
                          } else {
                            ctrl.sendAction({
                              action: 'toggle-message',
                              messageId: item.id,
                              included: nextInc,
                            })
                          }
                        }
                      }
                      top.appendChild(cb)
                    }

                    var seqSpan = document.createElement('span')
                    seqSpan.className = 'dsh-ctx-inspector-seq'
                    seqSpan.title = '底层事件序号 seq=' + item.seq
                    seqSpan.textContent = '#' + item.order
                    top.appendChild(seqSpan)

                    var badge = document.createElement('span')
                    badge.className = 'dsh-ctx-inspector-badge'
                    badge.setAttribute('data-kind', item.subKind || item.role)
                    badge.textContent = item.badge || item.category
                    top.appendChild(badge)

                    var titleSpan = document.createElement('span')
                    titleSpan.className = 'dsh-ctx-inspector-item-title'
                    titleSpan.textContent = item.title
                    top.appendChild(titleSpan)

                    var tokSpan = document.createElement('span')
                    tokSpan.className = 'dsh-ctx-inspector-tok'
                    tokSpan.textContent = '~' + formatTokensCount(item.tokens) + ' (' + (isExp ? '▲' : '▼') + ')'
                    top.appendChild(tokSpan)

                    card.appendChild(top)

                    if (item.extraMeta) {
                      var metaDiv = document.createElement('div')
                      metaDiv.className = 'dsh-ctx-inspector-meta'
                      metaDiv.textContent = item.extraMeta
                      card.appendChild(metaDiv)
                    }

                    if (isExp) {
                      var pre = document.createElement('pre')
                      pre.className = 'dsh-ctx-inspector-pre'
                      pre.textContent =
                        '【分类】' +
                        item.category +
                        ' (seq=' +
                        item.seq +
                        ', ~' +
                        item.tokens +
                        ' tokens, ' +
                        item.chars +
                        ' 字符)\n\n' +
                        item.content
                      pre.onclick = function (ev) {
                        ev.stopPropagation()
                      }
                      card.appendChild(pre)
                    }

                    listEl.appendChild(card)
                  })
                }

                inspectorBox.appendChild(listEl)
              }

              for (var r = 0; r < rows.length; r++) {
                ;(function (idx) {
                  var rowEl = rows[idx]
                  var key = rowKeys[idx]
                  rowEl.classList.add('dsh-ctx-meter-row-interactive')
                  rowEl.title = '点击查看该项在上下文中的按序明细内容'
                  var dd = rowEl.querySelector('dd')
                  if (dd && !dd.querySelector('.dsh-ctx-meter-chevron')) {
                    var chev = document.createElement('span')
                    chev.className = 'dsh-ctx-meter-chevron'
                    chev.textContent = '▶'
                    dd.appendChild(chev)
                  }
                  rowEl.addEventListener('click', function (ev) {
                    ev.stopPropagation()
                    if (activeTab === key) {
                      activeTab = null
                      syncRowHighlights()
                    } else {
                      activeTab = key
                      syncRowHighlights()
                      fetchInspectData(false)
                    }
                  })
                })(r)
              }
            })(panel, dl, rowDivs)
          }
        }

        var ensureWorkspaceSortedByUpdated = function () {
          try {
            if (typeof localStorage !== 'undefined') {
              var storageKey = 'dsh.workspace.view.v5'
              var raw = localStorage.getItem(storageKey)
              if (raw) {
                var parsed = JSON.parse(raw)
                if (parsed && parsed.orderBy !== 'updated') {
                  parsed.orderBy = 'updated'
                  parsed.sessionOrderByAccount = {}
                  localStorage.setItem(storageKey, JSON.stringify(parsed))
                }
              }
            }
          } catch {}
          try {
            if (!ctx.slots || typeof ctx.slots.entries !== 'function') return
            var entries = ctx.slots.entries('sidebar.workspaces')
            for (var i = 0; i < entries.length; i++) {
              var entry = entries[i]
              if (entry && entry.store && typeof entry.store.create === 'function') {
                var inst = entry.__dshSortStoreInst || (entry.__dshSortStoreInst = entry.store.create())
                if (inst && typeof inst.getSnapshot === 'function' && inst.actions && typeof inst.actions.setOrderBy === 'function') {
                  var snap = inst.getSnapshot()
                  if (snap && snap.orderBy !== 'updated') {
                    inst.actions.setOrderBy('updated', {})
                  }
                  if (inst.subscribe && !inst.__dshAutoSortBound) {
                    inst.__dshAutoSortBound = true
                    inst.subscribe(function () {
                      try {
                        var cur = inst.getSnapshot()
                        if (cur && cur.orderBy !== 'updated') {
                          inst.actions.setOrderBy('updated', {})
                        }
                      } catch {}
                    })
                  }
                }
              }
            }
          } catch {}
          try {
            var sSvc = getSessionsService()
            if (sSvc && sSvc.list && typeof sSvc.list.getSnapshot === 'function') {
              var lSnap = sSvc.list.getSnapshot()
              var byId = (lSnap && lSnap.byId) || {}
              var groupContainers = document.querySelectorAll('div[role="tree"] > div')
              for (var g = 0; g < groupContainers.length; g++) {
                var grp = groupContainers[g]
                var rowEls = Array.prototype.slice.call(
                  grp.querySelectorAll(':scope > [data-row-key^="session:"]'),
                )
                if (rowEls.length <= 1) continue
                var items = rowEls.map(function (el, idx) {
                  var rk = el.getAttribute('data-row-key') || ''
                  var sid = rk.slice('session:'.length)
                  var meta = byId[sid]
                  var isBlank = Boolean(meta && meta.blank)
                  var isRunning = Boolean(meta && meta.running)
                  var updatedAt = (meta && typeof meta.updatedAt === 'number' ? meta.updatedAt : 0) + (isRunning ? 1000000000000 : 0)
                  return {
                    el: el,
                    sid: sid,
                    idx: idx,
                    isBlank: isBlank,
                    updatedAt: updatedAt,
                  }
                })
                var sorted = items.slice().sort(function (a, b) {
                  if (a.isBlank !== b.isBlank) return a.isBlank ? -1 : 1
                  if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt
                  return a.idx - b.idx
                })
                var needsMove = false
                for (var m = 0; m < items.length; m++) {
                  if (items[m].el !== sorted[m].el) {
                    needsMove = true
                    break
                  }
                }
                if (needsMove) {
                  var overflowBtn = grp.querySelector(':scope > [data-row-key^="overflow:"]')
                  for (var s = 0; s < sorted.length; s++) {
                    if (overflowBtn) {
                      grp.insertBefore(sorted[s].el, overflowBtn)
                    } else {
                      grp.appendChild(sorted[s].el)
                    }
                  }
                }
              }
            }
          } catch {}
        }

        ctx.effect(function () {
          ensureWorkspaceSortedByUpdated()
          var t1 = setTimeout(ensureWorkspaceSortedByUpdated, 300)
          var t2 = setTimeout(ensureWorkspaceSortedByUpdated, 1200)
          var unsub = null
          try {
            if (ctx.slots && typeof ctx.slots.subscribe === 'function') {
              unsub = ctx.slots.subscribe('sidebar.workspaces', ensureWorkspaceSortedByUpdated)
            }
          } catch {}
          return function () {
            clearTimeout(t1)
            clearTimeout(t2)
            if (typeof unsub === 'function') unsub()
          }
        }, 'dsh-context-selector: default-session-order-updated')

        ctx.effect(function () {
          if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
            return function () {}
          }
          var timerId = null
          var isInternalMutating = false
          var isOwnPluginNode = function (node) {
            if (!node) return false
            var el = node.nodeType === 1 ? node : node.parentElement
            if (!el || typeof el.closest !== 'function') return false
            return Boolean(
              el.closest(
                '.dsh-ctx-user-actions, .dsh-ctx-inline-wrap, .dsh-ctx-inline-reply-pill, .dsh-ctx-popover-wrap, .dsh-ctx-quick-popover, .dsh-ctx-inspector, .dsh-ctx-meter-hint, .dsh-doc-ask-menu, .dsh-doc-ask-float, .dsh-doc-header-ask-btn',
              ),
            )
          }
          var observer = new MutationObserver(function (mutations) {
            if (isInternalMutating || timerId !== null) return
            var hasExternalMutation = false
            for (var m = 0; m < mutations.length; m++) {
              var rec = mutations[m]
              if (isOwnPluginNode(rec.target)) continue
              if (rec.type === 'childList') {
                var allOwn = true
                var added = rec.addedNodes
                var removed = rec.removedNodes
                for (var a = 0; a < added.length; a++) {
                  if (!isOwnPluginNode(added[a])) {
                    allOwn = false
                    break
                  }
                }
                if (allOwn) {
                  for (var r = 0; r < removed.length; r++) {
                    if (!isOwnPluginNode(removed[r])) {
                      allOwn = false
                      break
                    }
                  }
                }
                if (allOwn && (added.length > 0 || removed.length > 0)) continue
              }
              hasExternalMutation = true
              break
            }
            if (!hasExternalMutation) return
            timerId = setTimeout(function () {
              timerId = null
              isInternalMutating = true
              try {
                if (activeSessionId && controllers.has(activeSessionId)) {
                  syncInlineChatCheckboxes(controllers.get(activeSessionId))
                }
                enhanceContextMeterPanels()
                ensureWorkspaceSortedByUpdated()
              } finally {
                isInternalMutating = false
              }
            }, 120)
          })
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['hidden', 'aria-expanded'],
          })
          return function () {
            observer.disconnect()
            if (timerId !== null) clearTimeout(timerId)
          }
        }, 'dsh-context-selector: inline-dom-observer')

        ctx.effect(function () {
          if (typeof window === 'undefined' || typeof document === 'undefined') {
            return function () {}
          }
          var isMob = function () {
            return window.innerWidth <= 768 || Boolean(window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
          }
          var isEditableActive = function () {
            var a = document.activeElement
            return (
              a instanceof HTMLElement &&
              (a.isContentEditable ||
                a.tagName === 'INPUT' ||
                a.tagName === 'TEXTAREA' ||
                a.hasAttribute('data-composer-input'))
            )
          }
          var maxVpH = window.visualViewport ? window.visualViewport.height : window.innerHeight || 0
          var kbRaf = null
          var kbTrackEnd = 0
          var setKbState = function (open, offsetPx) {
            if (!document.body) return
            if (open && offsetPx > 0) {
              if (document.body.getAttribute('data-dsh-kb-open') !== 'true') {
                document.body.setAttribute('data-dsh-kb-open', 'true')
              }
              var val = offsetPx + 'px'
              if (document.body.style.getPropertyValue('--dsh-kb-offset') !== val) {
                document.body.style.setProperty('--dsh-kb-offset', val)
              }
            } else {
              if (document.body.hasAttribute('data-dsh-kb-open')) {
                document.body.removeAttribute('data-dsh-kb-open')
              }
              document.body.style.setProperty('--dsh-kb-offset', '0px')
            }
          }
          var syncKbViewport = function () {
            if (!isMob()) {
              setKbState(false, 0)
              return
            }
            if (window.scrollX !== 0 || window.scrollY !== 0) {
              window.scrollTo(0, 0)
            }
            if (document.documentElement && (document.documentElement.scrollLeft !== 0 || document.documentElement.scrollTop !== 0)) {
              document.documentElement.scrollLeft = 0
              document.documentElement.scrollTop = 0
            }
            if (document.body && (document.body.scrollLeft !== 0 || document.body.scrollTop !== 0)) {
              document.body.scrollLeft = 0
              document.body.scrollTop = 0
            }
            var vv = window.visualViewport
            var focused = isEditableActive()
            if (!vv || !focused) {
              setKbState(false, 0)
              return
            }
            if (vv.height > maxVpH) maxVpH = vv.height
            var layoutH = Math.max(window.innerHeight || 0, document.documentElement ? document.documentElement.clientHeight : 0, maxVpH, vv.height)
            var kbHeight = layoutH - vv.height
            var rawOffset = Math.max(0, Math.round(layoutH - (vv.height + vv.offsetTop)))
            if (kbHeight > 110 && rawOffset > 40) {
              setKbState(true, rawOffset)
            } else {
              setKbState(false, 0)
            }
          }
          var startKbRaf = function (durationMs) {
            kbTrackEnd = Math.max(kbTrackEnd, Date.now() + (durationMs || 360))
            if (kbRaf !== null) return
            var step = function () {
              syncKbViewport()
              if (Date.now() < kbTrackEnd) {
                kbRaf = requestAnimationFrame(step)
              } else {
                kbRaf = null
              }
            }
            kbRaf = requestAnimationFrame(step)
          }
          var onFocusIn = function () {
            if (!isMob()) return
            syncKbViewport()
            startKbRaf(420)
          }
          var onFocusOut = function () {
            if (!isMob()) return
            setKbState(false, 0)
            syncKbViewport()
            startKbRaf(360)
          }
          window.addEventListener('scroll', syncKbViewport, { passive: true })
          document.addEventListener('focusin', onFocusIn, true)
          document.addEventListener('focusout', onFocusOut, true)
          var vv = window.visualViewport
          if (vv) {
            vv.addEventListener('resize', syncKbViewport, { passive: true })
            vv.addEventListener('scroll', syncKbViewport, { passive: true })
          }
          syncKbViewport()
          return function () {
            window.removeEventListener('scroll', syncKbViewport)
            document.removeEventListener('focusin', onFocusIn, true)
            document.removeEventListener('focusout', onFocusOut, true)
            if (vv) {
              vv.removeEventListener('resize', syncKbViewport)
              vv.removeEventListener('scroll', syncKbViewport)
            }
          }
        }, 'dsh-context-selector: mobile-kb-viewport-sync')

        ctx.effect(function () {
          return function () {
            for (var ctrl of controllers.values()) {
              ctrl.dispose()
            }
            controllers.clear()
          }
        }, 'dsh-context-selector: controllers')

        var sendQuickPhraseForSession = function (sessionId, text, fallbackInputActions) {
          var clean = String(text || '').trim()
          if (!clean) return
          var sid = sessionId || activeSessionId
          var convSvc = getConversationService()
          var shell = null
          if (convSvc && convSvc.input && typeof convSvc.input.shell === 'function' && sid) {
            try {
              shell = convSvc.input.shell(sid)
            } catch {}
          }
          if (shell && typeof shell.setDraft === 'function') {
            shell.setDraft(clean)
            setTimeout(function () {
              try {
                if (typeof shell.submit === 'function') {
                  shell.submit('queue', 'click')
                } else if (shell.actions && typeof shell.actions.submit === 'function') {
                  shell.actions.submit()
                }
              } catch {}
            }, 25)
            return
          }
          if (fallbackInputActions && typeof fallbackInputActions.setDraft === 'function') {
            fallbackInputActions.setDraft(clean)
            setTimeout(function () {
              try {
                if (typeof fallbackInputActions.submit === 'function') {
                  fallbackInputActions.submit()
                }
              } catch {}
            }, 25)
          }
        }

        var insertQuickPhraseForSession = function (sessionId, text) {
          var clean = String(text || '').trim()
          if (!clean) return
          insertIntoComposer({
            sessionId: sessionId || activeSessionId,
            path: '',
            isDir: false,
            selectedText: '',
            promptSuffix: clean,
          })
        }

        ctx.slots.inject('settings.general.item', function () {
          return ctx.slots.register(
            {
              name: 'settings.general.item',
              id: 'context-selector-sweet-voices',
              order: 1,
              locale: NS,
            },
            SweetVoiceSettingsPanel,
          )
        })

        ctx.slots.inject('settings.section', function () {
          return ctx.slots.register(
            {
              name: 'settings.section',
              id: 'sweet-voice-settings',
              order: 15,
              label: function () {
                return '🎀 甜美语音与响度'
              },
              locale: NS,
            },
            function () {
              return h(
                'div',
                { style: { padding: '8px 4px' } },
                h(SweetVoiceSettingsPanel, { standalone: true }),
              )
            },
          )
        })

        ctx.slots.inject('settings.general.item', function () {
          return ctx.slots.register(
            {
              name: 'settings.general.item',
              id: 'context-selector-quick-phrases',
              order: 35,
              locale: NS,
            },
            QuickPhrasesSettingsRow,
          )
        })

        ctx.slots.inject('conversation.input.left', function () {
          return ctx.slots.register(
            {
              name: 'conversation.input.left',
              id: 'context-selector-toolbar',
              order: 20,
              locale: NS,
              inject: function (sessionId) {
                return {
                  controller: controllerFor(sessionId),
                  onSendQuickPhrase: function (txt, inputActs) {
                    sendQuickPhraseForSession(sessionId, txt, inputActs)
                  },
                  onInsertQuickPhrase: function (txt) {
                    insertQuickPhraseForSession(sessionId, txt)
                  },
                }
              },
            },
            ComposerToolbarControls,
          )
        })
      },
    }
  },
})
