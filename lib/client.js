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
    var BIND_REV = 'v1.6.3'

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
      '[data-chat-call-id], [data-chat-flow-kind="assistant-step"][data-chat-group-part="reasoning"] {',
      '  display: flex !important;',
      '  align-items: flex-start !important;',
      '  gap: 6px !important;',
      '}',
      '[data-chat-call-id] > :not(.dsh-ctx-inline-wrap), [data-chat-flow-kind="assistant-step"][data-chat-group-part="reasoning"] > :not(.dsh-ctx-inline-wrap) {',
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
      '  z-index: 10;',
      '  opacity: 0.52;',
      '  transition: opacity 0.12s;',
      '}',
      '.dsh-ctx-inline-wrap:hover, [data-chat-call-id]:hover > .dsh-ctx-inline-wrap {',
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
      '  z-index: 5;',
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
      '.dsh-ctx-row-excluded > :not(.dsh-ctx-inline-wrap):not(.dsh-ctx-inline-reply-pill) {',
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
      '  align-items: flex-end;',
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
      '.dsh-ctx-pop-header {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  gap: 8px;',
      '}',
      '.dsh-ctx-pop-title-group {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '  min-width: 0;',
      '}',
      '.dsh-ctx-pop-title {',
      '  font-size: 13px;',
      '  font-weight: 600;',
      '  color: var(--dsw-alias-label-primary);',
      '}',
      '.dsh-ctx-pop-stat {',
      '  font-size: 11px;',
      '  padding: 1px 6px;',
      '  border-radius: 999px;',
      '  background: var(--dsw-alias-interactive-bg-hover);',
      '  color: var(--dsw-alias-label-secondary);',
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
      '.dsh-ctx-pop-close {',
      '  width: 22px;',
      '  height: 22px;',
      '  border: none;',
      '  border-radius: 6px;',
      '  background: transparent;',
      '  color: var(--dsw-alias-label-tertiary);',
      '  display: inline-flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  cursor: pointer;',
      '}',
      '.dsh-ctx-pop-close:hover {',
      '  background: var(--dsw-alias-interactive-bg-hover);',
      '  color: var(--dsw-alias-label-primary);',
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
      '  pointer-events: auto;',
      '  box-sizing: border-box;',
      '  width: 320px;',
      '  max-width: calc(100vw - 32px);',
      '  padding: 12px;',
      '  border-radius: 14px;',
      '  border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.22));',
      '  background: var(--dsw-alias-bg-layer-1, #ffffff);',
      '  box-shadow: 0 14px 40px -8px rgba(0, 0, 0, 0.22), 0 4px 12px -2px rgba(0, 0, 0, 0.08);',
      '  color: var(--dsw-alias-label-primary);',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 8px;',
      '  animation: dshCtxHoverIn 0.12s ease-out;',
      '}',
      '@media (max-width: 740px) {',
      '  .dsh-ctx-popover-wrap {',
      '    flex-direction: column-reverse;',
      '    align-items: stretch;',
      '  }',
      '  .dsh-ctx-hover-card {',
      '    width: 356px;',
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
      '  padding: 7px 9px;',
      '  border-radius: 8px;',
      '  background: var(--dsw-alias-interactive-bg-hover);',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 4px;',
      '}',
      '.dsh-ctx-hc-block[data-excluded="true"] {',
      '  opacity: 0.48;',
      '}',
      '.dsh-ctx-hc-block-top {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  font-size: 11px;',
      '  color: var(--dsw-alias-label-tertiary);',
      '}',
      '.dsh-ctx-hc-role {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 5px;',
      '  font-weight: 500;',
      '  color: var(--dsw-alias-label-secondary);',
      '  cursor: pointer;',
      '}',
      '.dsh-ctx-hc-text {',
      '  font-size: 12px;',
      '  line-height: 17px;',
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
      'span[data-composer-chip="context-quote"] > span {',
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
      'body[data-ds-dark-theme] span[data-composer-chip="context-quote"] > span {',
      '  background: rgba(245, 158, 11, 0.16) !important;',
      '  color: #fbbf24 !important;',
      '  border-color: rgba(245, 158, 11, 0.4) !important;',
      '}',
      'span[data-composer-chip="context-quote"] > span > span:first-child {',
      '  display: none !important;',
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

      /* 1. Every tool call row: [data-chat-call-id] (supports Shift+Click range toggle) */
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
          wrap.title = '勾选 = 携带；取消勾选 = 不发（按住 Shift 点击可连选）'
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
          inputEl.__ctxRowEl = callEl
          inputEl.onclick = function (e) {
            e.stopPropagation()
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
        callEl.classList.toggle('dsh-ctx-row-excluded', !isIncluded)
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
        var turnExcluded = (snap.state.excludedTurns || []).indexOf(turnNum) !== -1
        var msgExcluded = (snap.state.excludedMessageIds || []).indexOf(msgId) !== -1
        var userIncluded = !turnExcluded && !msgExcluded
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
          if (userIncluded) {
            toggleBtnEl.setAttribute('data-status', 'included')
            toggleBtnEl.setAttribute('data-ctx-tip', '已计入上下文 · 点击排除本条')
            toggleBtnEl.innerHTML = SVG_CHECK_CIRCLE
          } else {
            toggleBtnEl.setAttribute('data-status', 'excluded')
            toggleBtnEl.setAttribute('data-ctx-tip', '本条已排除 · 点击恢复携带')
            toggleBtnEl.innerHTML = SVG_EXCLUDED_CIRCLE + '<span>已排除</span>'
          }
          toggleBtnEl.onclick = function (e) {
            e.stopPropagation()
            var ctrl = this.__ctxController
            var mid = this.__ctxMsgId
            var bTurn = this.__ctxTurn
            var nextInc = !this.__ctxIncluded
            if (!ctrl || !mid) return
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
          if (earlierAllExcl) {
            cutBtnEl.setAttribute('data-status', 'cutoff')
            cutBtnEl.setAttribute('data-ctx-tip', '上方第 1~' + String(turnNum - 1) + ' 轮已排除 · 点击恢复全部')
            cutBtnEl.innerHTML = SVG_CUTOFF_UP + '<span>仅从此轮起</span>'
          } else {
            cutBtnEl.setAttribute('data-status', 'normal')
            cutBtnEl.setAttribute('data-ctx-tip', '仅从此轮起携带（一键排除上方旧历史）')
            cutBtnEl.innerHTML = SVG_CUTOFF_UP
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

        userEl.setAttribute('data-ctx-pinned-bar', !userIncluded || earlierAllExcl ? 'true' : 'false')
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
            ? '~' + formatTokensCount(stepAsstMsg.tokens) + ' tok'
            : '回复已排除 · 省 ~' + formatTokensCount(stepAsstMsg.tokens)
        }
        rPill.setAttribute('data-excluded', !aIncluded ? 'true' : 'false')
        asstEl.classList.toggle('dsh-ctx-row-excluded', !aIncluded)
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

    function HoverTurnPreviewCard(props) {
      var row = props.row
      var controller = props.controller
      var onMouseEnter = props.onMouseEnter
      var onMouseLeave = props.onMouseLeave
      var showToolsState = useState(false)
      var showTools = showToolsState[0]
      var setShowTools = showToolsState[1]

      if (!row) return null

      var calls = Array.isArray(row.calls) ? row.calls : []
      var anyToolIncluded = calls.some(function (c) {
        return c.included
      })
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
          callIds: cids,
          included: checked,
        })
      }

      return h(
        'aside',
        {
          className: 'dsh-ctx-hover-card',
          onMouseEnter: onMouseEnter,
          onMouseLeave: onMouseLeave,
        },
        h(
          'div',
          { className: 'dsh-ctx-hc-head' },
          h(
            'div',
            { className: 'dsh-ctx-hc-title' },
            h('span', null, '第 ' + String(row.turn) + ' 轮对话'),
            h(
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
                  '↑ 仅从此轮起',
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
          ),
        ),
        /* 1. User prompt block */
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
            h('span', null, row.outgoingIncluded ? '已携带' : '已排除'),
          ),
          h('div', { className: 'dsh-ctx-hc-text' }, row.userPreview || '(无提问文本)'),
        ),
        /* 2. Tool calls block (if any) */
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
                    onChange: function (e) {
                      onToggleAllTurnTools(e.target.checked)
                    },
                  }),
                  h('span', null, '过程工具 (' + String(calls.length) + ') · ~' + formatTokensCount(toolTokens)),
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
        /* 3. Assistant reply block */
        h(
          'div',
          {
            className: 'dsh-ctx-hc-block',
            'data-excluded': !row.incomingIncluded ? 'true' : undefined,
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
                checked: row.incomingIncluded,
                onChange: function () {
                  controller.sendAction({
                    action: 'toggle-incoming',
                    turn: row.turn,
                    included: !row.incomingIncluded,
                  })
                },
              }),
              h('span', null, 'AI 回复'),
            ),
            h('span', null, row.incomingIncluded ? '已携带' : '已排除'),
          ),
          h(
            'div',
            { className: 'dsh-ctx-hc-text' },
            row.assistantPreview || (row.status === 'running' ? '正在生成回复…' : '(仅工具调用)'),
          ),
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
      var hoverTimerRef = useRef(null)

      var switchViewMode = function (mode) {
        setViewMode(mode)
        try {
          localStorage.setItem('dsh_ctx_view_mode', mode)
        } catch {}
      }

      var enterTurnHover = function (turnNum) {
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current)
          hoverTimerRef.current = null
        }
        setHoveredTurn(turnNum)
      }

      var leaveTurnHover = function () {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = setTimeout(function () {
          setHoveredTurn(null)
        }, 160)
      }

      useEffect(function () {
        return function () {
          if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
        }
      }, [])

      var turns = snap.turns || []
      var totalTurns = turns.length
      var excludedCount = (snap.state.excludedTurns || []).length
      var includedCount = Math.max(0, totalTurns - excludedCount)
      var savedTokens = snap.tokenStats ? snap.tokenStats.savedTokens || 0 : 0

      var activeHoverRow = null
      if (hoveredTurn !== null) {
        activeHoverRow = snap.turnMap.get(hoveredTurn) || null
      }
      if (!activeHoverRow && turns.length > 0) {
        activeHoverRow = turns[turns.length - 1]
      }

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
        { className: 'dsh-ctx-popover-wrap' },
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
          /* Main body: Capsule Grid vs Compact List */
          turns.length === 0
            ? h('div', { className: 'dsh-ctx-pop-hint' }, t('dock.empty'))
            : viewMode === 'capsule'
              ? h(
                  'div',
                  { className: 'dsh-ctx-capsule-grid' },
                  turns.map(function (row) {
                    var isHovered = activeHoverRow && activeHoverRow.turn === row.turn
                    return h(
                      'div',
                      {
                        key: row.turn,
                        className: 'dsh-ctx-capsule',
                        'data-excluded': !row.included ? 'true' : undefined,
                        'data-hovered': isHovered ? 'true' : undefined,
                        onMouseEnter: function () {
                          enterTurnHover(row.turn)
                        },
                        onMouseLeave: leaveTurnHover,
                        onClick: function (e) {
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
                        formatTokensCount(row.tokenCount),
                      ),
                    )
                  }),
                )
              : h(
                  'div',
                  { className: 'dsh-ctx-compact-list' },
                  turns.map(function (row) {
                    var isHovered = activeHoverRow && activeHoverRow.turn === row.turn
                    var earlierExcl = isEarlierAllExcluded(snap, row.turn)
                    return h(
                      'div',
                      {
                        key: row.turn,
                        className: 'dsh-ctx-compact-row',
                        'data-excluded': !row.included ? 'true' : undefined,
                        'data-hovered': isHovered ? 'true' : undefined,
                        onMouseEnter: function () {
                          enterTurnHover(row.turn)
                        },
                        onMouseLeave: leaveTurnHover,
                        onClick: function (e) {
                          handleTurnToggle(row, e)
                        },
                      },
                      h('input', {
                        type: 'checkbox',
                        className: 'dsh-ctx-sel-checkbox',
                        checked: row.included,
                        onChange: function () {},
                        onClick: function (e) {
                          e.stopPropagation()
                          handleTurnToggle(row, e)
                        },
                      }),
                      h('span', { className: 'dsh-ctx-compact-turn' }, '#' + String(row.turn)),
                      h('span', { className: 'dsh-ctx-compact-title' }, row.userPreview),
                      h(
                        'span',
                        { className: 'dsh-ctx-capsule-tok' },
                        formatTokensCount(row.tokenCount),
                      ),
                      row.turn > 1
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
                    )
                  }),
                ),
          /* Footer hint */
          h(
            'div',
            { className: 'dsh-ctx-pop-hint' },
            h('span', null, '悬停任意轮次可在右侧预览对话内容与细项开关'),
            h('span', null, 'Shift+点击可连选'),
          ),
        ),
        /* Side Floating Preview Card for the hovered/active turn */
        activeHoverRow
          ? h(HoverTurnPreviewCard, {
              row: activeHoverRow,
              controller: controller,
              onMouseEnter: function () {
                if (hoverTimerRef.current) {
                  clearTimeout(hoverTimerRef.current)
                  hoverTimerRef.current = null
                }
              },
              onMouseLeave: leaveTurnHover,
            })
          : null,
      )
    }

    function ComposerToolbarControls(props) {
      var controller = props.controller
      var t = props.t
      var snap = useControllerSnapshot(controller)
      var rootRef = useRef(null)

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
          if (!snap.drawerOpen) return function () {}
          var onDocMouseDown = function (e) {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
              controller.setDrawerOpen(false)
            }
          }
          var onDocKeyDown = function (e) {
            if (e.key === 'Escape') {
              controller.setDrawerOpen(false)
            }
          }
          document.addEventListener('mousedown', onDocMouseDown)
          document.addEventListener('keydown', onDocKeyDown)
          return function () {
            document.removeEventListener('mousedown', onDocMouseDown)
            document.removeEventListener('keydown', onDocKeyDown)
          }
        },
        [controller, snap.drawerOpen],
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

      var onToggleDrawer = function (e) {
        e.stopPropagation()
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
        { ref: rootRef, className: 'dsh-ctx-sel-toolbar-group' },
        snap.drawerOpen
          ? h(FloatingContextPopover, {
              controller: controller,
              snap: snap,
              t: t,
            })
          : null,
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
        source: 'context-quote',
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
        var activeSessionId = null

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

        ctx.effect(function () {
          var inputTriggers = getInputTriggersService()
          if (!inputTriggers || typeof inputTriggers.registerSource !== 'function') {
            return function () {}
          }
          try {
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
        }, 'dsh-context-selector: quote-chip-source')

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

        var insertIntoComposer = function (options) {
          var sid = options.sessionId || activeSessionId
          var cwd = resolveSessionCwd(sid)
          var rawPath = options.path || ''
          var isDir = Boolean(options.isDir)
          var selectedText = String(options.selectedText || '').trim()
          var lineRange = options.lineRange || null
          var promptSuffix = typeof options.promptSuffix === 'string' ? options.promptSuffix : ''

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
            var addition = ''
            if (!chipsInserted) {
              var fallbackPrefix = mention ? mention + (lineTag ? '#' + lineTag : '') + ' ' : ''
              var fallbackQuote = quoteChip ? quoteChip.label + ' ' : ''
              addition = fallbackPrefix + fallbackQuote + promptSuffix
            } else {
              var extraLine = !selectedText && lineTag ? '(' + lineTag + ') ' : ''
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
                    ? existingDraft.replace(/[ \t]*$/, '') + ' ' + addition
                    : addition
                  shell.setDraft(nextFull)
                }
              } else {
                var merged = existingDraft
                  ? existingDraft.replace(/[ \t]*$/, '') + ' ' + addition
                  : addition
                shell.setDraft(merged)
              }
            }
            try {
              shell.focus()
            } catch {}
            return true
          }

          if (inputActions && typeof inputActions.setDraft === 'function') {
            var piece = (mention ? mention + (lineTag ? '#' + lineTag : '') + ' ' : '') + blockText
            if (typeof inputActions.captureInsertion === 'function' && typeof inputActions.insertText === 'function') {
              var sp = inputActions.captureInsertion()
              if (!inputActions.insertText(piece, sp)) {
                inputActions.setDraft(piece)
              }
            } else {
              inputActions.setDraft(piece)
            }
            var editorDom = document.querySelector('[data-composer-card] [contenteditable="true"]')
            if (editorDom) editorDom.focus()
            return true
          }

          var fallbackEditor = document.querySelector('[data-composer-card] [contenteditable="true"]')
          if (fallbackEditor) {
            fallbackEditor.focus()
            try {
              var fallbackText = (mention ? mention + ' ' : '') + blockText
              document.execCommand('insertText', false, fallbackText)
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
            askBtn.addEventListener('pointerdown', function (ev) {
              ev.preventDefault()
              ev.stopPropagation()
            })
            askBtn.addEventListener('click', function (ev) {
              ev.preventDefault()
              ev.stopPropagation()
              closeFloat()
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
            })
            pill.appendChild(askBtn)

            var div = document.createElement('span')
            div.className = 'dsh-doc-ask-float-div'
            pill.appendChild(div)

            var copyBtn = document.createElement('button')
            copyBtn.type = 'button'
            copyBtn.className = 'dsh-doc-ask-float-btn'
            copyBtn.textContent = '复制'
            copyBtn.addEventListener('pointerdown', function (ev) {
              ev.preventDefault()
              ev.stopPropagation()
            })
            copyBtn.addEventListener('click', function (ev) {
              ev.preventDefault()
              ev.stopPropagation()
              closeFloat()
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(info.selectedText).catch(function () {})
              }
              try {
                window.getSelection().removeAllRanges()
              } catch {}
            })
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
            if (menuEl && !menuEl.contains(e.target)) {
              closeMenu()
            }
            if (floatEl && !floatEl.contains(e.target)) {
              closeFloat()
            }
          }

          var onPointerUp = function (e) {
            if (menuEl && menuEl.contains(e.target)) return
            if (floatEl && floatEl.contains(e.target)) return
            setTimeout(showSelectionFloat, 30)
          }

          var onKeyDown = function (e) {
            if (e.key === 'Escape') {
              closeMenu()
              closeFloat()
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
          document.addEventListener('pointerup', onPointerUp, true)
          document.addEventListener('keydown', onKeyDown, true)
          document.addEventListener('scroll', onScroll, true)

          return function () {
            closeMenu()
            closeFloat()
            document.removeEventListener('contextmenu', onContextMenu, true)
            document.removeEventListener('pointerdown', onPointerDown, true)
            document.removeEventListener('pointerup', onPointerUp, true)
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
      },
    }
  },
})
