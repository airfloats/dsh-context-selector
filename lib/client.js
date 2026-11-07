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
    var BIND_REV = 'v2.2.1'

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
      '[data-chat-call-id]:has(> .dsh-ctx-inline-wrap), [data-chat-flow-kind="assistant-step"][data-chat-group-part="reasoning"]:has(> .dsh-ctx-inline-wrap) {',
      '  display: flex !important;',
      '  align-items: flex-start !important;',
      '  gap: 6px !important;',
      '}',
      '[data-chat-call-id]:has(> .dsh-ctx-inline-wrap) > :not(.dsh-ctx-inline-wrap), [data-chat-flow-kind="assistant-step"][data-chat-group-part="reasoning"]:has(> .dsh-ctx-inline-wrap) > :not(.dsh-ctx-inline-wrap) {',
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

    function findPresetTemplate(presetId) {
      for (var i = 0; i < PRESET_SYSTEM_TEMPLATES.length; i++) {
        if (PRESET_SYSTEM_TEMPLATES[i].id === presetId) return PRESET_SYSTEM_TEMPLATES[i]
      }
      return null
    }

    function readLocalSysOverride(sessionId) {
      if (!sessionId || typeof localStorage === 'undefined') return null
      try {
        var raw = localStorage.getItem('dsh_ctx_sys_override_' + String(sessionId))
        if (!raw) return null
        var parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : null
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
      var events = readClientSessionEvents(getSessionsService, sessionId)
      if (events.length === 0) return data

      var existingTurns = Array.isArray(data.turns) ? data.turns : []
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
        if (typeof ev.seq === 'number' && expT > 0) {
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
      var clientCheckpoints = Array.isArray(data.checkpoints) && data.checkpoints.length > 0 ? data.checkpoints.slice() : []
      if (clientCheckpoints.length === 0) {
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
          var shadSeqs = (sInfo && sInfo.shadowedSeqs) || cev.sourceEventSeqs || []
          for (var ss = 0; ss < shadSeqs.length; ss++) {
            var st = seqToTurn.get(shadSeqs[ss])
            if (st > 0) covSet.add(st)
          }
          if (covSet.size === 0 && cev.surfaceOp && cev.surfaceOp.op === 'replace') {
            for (var rSeq = cev.surfaceOp.startSeq; rSeq <= cev.surfaceOp.endSeq; rSeq++) {
              var rt = seqToTurn.get(rSeq)
              if (rt > 0) covSet.add(rt)
            }
          }
          var covTurns = Array.from(covSet).sort(function (a, b) {
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
      } else {
        for (var ci = 0; ci < clientCheckpoints.length; ci++) {
          var cpItem = clientCheckpoints[ci]
          if (!cpItem.afterTurn) {
            cpItem.afterTurn =
              Array.isArray(cpItem.coveredTurns) && cpItem.coveredTurns.length > 0
                ? cpItem.coveredTurns[cpItem.coveredTurns.length - 1]
                : cpItem.turn || 0
          }
        }
      }

      var compactedTurnsMap = new Map()
      for (var cpi = 0; cpi < clientCheckpoints.length; cpi++) {
        var cpObj = clientCheckpoints[cpi]
        var cTurns = cpObj.coveredTurns || []
        for (var cti = 0; cti < cTurns.length; cti++) {
          compactedTurnsMap.set(cTurns[cti], cpObj.compactionId || cpObj.id)
        }
      }

      var mergedTurnsMap = new Map()
      for (var et = 0; et < existingTurns.length; et++) {
        var exRow = existingTurns[et]
        var isComp = Boolean(exRow.compacted || compactedTurnsMap.has(exRow.turn))
        mergedTurnsMap.set(
          exRow.turn,
          Object.assign({}, exRow, {
            compacted: isComp,
            compactedById: exRow.compactedById || compactedTurnsMap.get(exRow.turn) || null,
            included: isComp ? false : exRow.included,
            outgoingIncluded: isComp ? false : exRow.outgoingIncluded,
            incomingIncluded: isComp ? false : exRow.incomingIncluded,
          }),
        )
      }

      allTurnsData.forEach(function (localRow, tNum) {
        if (!mergedTurnsMap.has(tNum)) {
          var isComp2 = compactedTurnsMap.has(tNum)
          if (!isComp2) return
          mergedTurnsMap.set(tNum, {
            turn: tNum,
            status: localRow.status,
            compacted: isComp2,
            compactedById: compactedTurnsMap.get(tNum) || 'compacted',
            included: false,
            outgoingIncluded: false,
            incomingIncluded: false,
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
              return Object.assign({}, m, { compacted: true, included: false })
            }),
            calls: [],
          })
        }
      })

      var finalTurns = Array.from(mergedTurnsMap.values()).sort(function (a, b) {
        return a.turn - b.turn
      })

      return Object.assign({}, data, {
        turns: finalTurns,
        checkpoints: clientCheckpoints,
      })
    }

    SessionContextController.prototype.applyPayload = function (rawData) {
      if (!rawData || rawData.ok !== true) return
      var localSys = readLocalSysOverride(this.sessionId)
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

      /* 0. Helper: check whether a flow item actually rendered visible native content */
      var hasVisibleNativeContent = function (containerEl) {
        if (!containerEl) return false
        var slotEl = containerEl.querySelector(':scope > [data-slot="conversation.chat.node"]')
        if (slotEl) {
          if (slotEl.children.length === 0 && String(slotEl.textContent || '').trim() === '') {
            return false
          }
          return true
        }
        var children = containerEl.children
        for (var ci = 0; ci < children.length; ci++) {
          var ch = children[ci]
          if (
            ch.classList &&
            (ch.classList.contains('dsh-ctx-inline-wrap') ||
              ch.classList.contains('dsh-ctx-inline-reply-pill') ||
              ch.classList.contains('dsh-ctx-user-actions'))
          ) {
            continue
          }
          if (ch.hasAttribute && ch.hasAttribute('hidden')) continue
          if (ch.children.length > 0 || String(ch.textContent || '').trim() !== '') {
            return true
          }
        }
        return false
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
          if (isCallCompacted) {
            metaTagEl.className = 'dsh-ctx-call-meta-tag dsh-ctx-compacted-tag'
            metaTagEl.textContent = '📦已归档'
            wrap.title = '此条工具记录已被系统自动压缩进历史摘要中，原内容不再单独发送'
          } else if (isCallPruned) {
            metaTagEl.className = 'dsh-ctx-call-meta-tag dsh-ctx-pruned-tag'
            metaTagEl.textContent = '✂️已裁剪'
            wrap.title = '此条超长工具输出已被系统自动裁剪中间段（保留首尾），点击可彻底排除'
          } else {
            metaTagEl.className = 'dsh-ctx-call-meta-tag'
            metaTagEl.textContent = ''
            wrap.title = '勾选 = 携带；取消勾选 = 不发（按住 Shift 点击可连选）'
          }
        }
        if (inputEl) {
          inputEl.disabled = isCallCompacted
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
          toggleBtnEl.onclick = function (e) {
            e.stopPropagation()
            var ctrl = this.__ctxController
            if (!ctrl) return
            if (this.__ctxCompacted) {
              ctrl.setDrawerOpen(true)
              return
            }
            var mid = this.__ctxMsgId
            var bTurn = this.__ctxTurn
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
            rInput.disabled = aCompacted
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
          aInput.disabled = aCompacted
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
          if (aCompacted) {
            aSpan.textContent = '📦 已合入压缩摘要 (原 ~' + formatTokensCount(stepAsstMsg.tokens) + ' tok 已归档)'
          } else {
            aSpan.textContent = aIncluded
              ? '~' + formatTokensCount(stepAsstMsg.tokens) + ' tok'
              : '回复已排除 · 省 ~' + formatTokensCount(stepAsstMsg.tokens)
          }
        }
        rPill.setAttribute('data-excluded', !aIncluded ? 'true' : 'false')
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
            row.compacted
              ? h('span', { className: 'dsh-ctx-compacted-tag' }, '📦 已压缩进摘要')
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
        row.compacted
          ? h(
              'div',
              {
                className: 'dsh-ctx-cp-banner',
                style: { marginBottom: '2px' },
              },
              h(
                'div',
                { style: { fontSize: '11.5px', color: '#d97706', fontWeight: 600 } },
                '📦 本轮原始对话已被系统自动压缩归档',
              ),
              h(
                'div',
                { style: { fontSize: '11px', color: 'var(--dsw-alias-label-secondary)', lineHeight: '16px' } },
                '原消息（~' +
                  formatTokensCount(row.tokenCount) +
                  ' tok）已从活动表面移出，浓缩进顶部的「压缩摘要检查点」中。如需排除本轮信息，请在左侧勾选/取消勾选对应的「📦 压缩摘要」。',
              ),
            )
          : null,
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
          /* System Prompt / Preset Switcher Bar */
          h(
            'div',
            { className: 'dsh-ctx-sys-bar' },
            h(
              'div',
              { className: 'dsh-ctx-sys-row' },
              h(
                'div',
                { style: { display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' } },
                h(
                  'span',
                  { style: { fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } },
                  '🎭 系统提示词模式:',
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
                  h('option', { value: '' }, '默认 (保持会话初始模式)'),
                  PRESET_SYSTEM_TEMPLATES.map(function (item) {
                    return h('option', { key: item.id, value: item.id }, item.name)
                  }),
                  h('option', { value: 'custom' }, '✍️ 自定义系统提示词'),
                ),
              ),
              h(
                'div',
                { style: { display: 'inline-flex', alignItems: 'center', gap: '5px' } },
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
                    onClick: function () {
                      setSysEditorOpen(!sysEditorOpen)
                    },
                  },
                  sysEditorOpen ? '收起编辑 ▲' : '✏️ 编辑提示词 ▼',
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
                        h('span', null, '追加到原系统提示词末尾 (保留工具说明)'),
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
                    placeholder: '输入要追加或替换的系统提示词内容（也可直接从上方下拉框选择「创造模式」等预设模板自动填入）…',
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
                      '保存并立即生效',
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
                  { className: 'dsh-ctx-capsule-grid' },
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
                          'data-excluded': !row.included ? 'true' : undefined,
                          'data-compacted': row.compacted ? 'true' : undefined,
                          'data-hovered': isHovered ? 'true' : undefined,
                          title: row.compacted
                            ? '第 ' + String(row.turn) + ' 轮已在压缩前结束（原内容未勾选，由下方压缩摘要替代）'
                            : undefined,
                          onMouseEnter: function () {
                            enterTurnHover(row.turn)
                          },
                          onMouseLeave: leaveTurnHover,
                          onClick: function (e) {
                            if (row.compacted) return
                            handleTurnToggle(row, e)
                          },
                        },
                        h(
                          'div',
                          { className: 'dsh-ctx-capsule-left' },
                          h('input', {
                            type: 'checkbox',
                            className: 'dsh-ctx-sel-checkbox',
                            checked: row.compacted ? false : row.included,
                            disabled: Boolean(row.compacted),
                            onChange: function () {},
                            onClick: function (e) {
                              e.stopPropagation()
                              if (row.compacted) return
                              handleTurnToggle(row, e)
                            },
                          }),
                          h('span', { className: 'dsh-ctx-capsule-num' }, '#' + String(row.turn)),
                        ),
                        h(
                          'span',
                          { className: 'dsh-ctx-capsule-tok' },
                          row.compacted ? '已压缩' : formatTokensCount(row.tokenCount),
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
                                title: '勾选 = 携带此次压缩生成的新上下文摘要；取消勾选 = 不携带此摘要',
                              },
                              h('input', {
                                type: 'checkbox',
                                className: 'dsh-ctx-sel-checkbox',
                                checked: cp.included,
                                onChange: function (e) {
                                  controller.sendAction({
                                    action: 'toggle-message',
                                    messageId: cp.id,
                                    included: e.target.checked,
                                  })
                                },
                              }),
                              h(
                                'span',
                                null,
                                '📦 ── 此处已执行上下文压缩（上方 #' +
                                  String(startT) +
                                  '~#' +
                                  String(endT) +
                                  ' 已取消勾选，浓缩为此新上下文主导）──',
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
                  { className: 'dsh-ctx-compact-list' },
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
                          'data-excluded': !row.included ? 'true' : undefined,
                          'data-compacted': row.compacted ? 'true' : undefined,
                          'data-hovered': isHovered ? 'true' : undefined,
                          onMouseEnter: function () {
                            enterTurnHover(row.turn)
                          },
                          onMouseLeave: leaveTurnHover,
                          onClick: function (e) {
                            if (row.compacted) return
                            handleTurnToggle(row, e)
                          },
                        },
                        h('input', {
                          type: 'checkbox',
                          className: 'dsh-ctx-sel-checkbox',
                          checked: row.compacted ? false : row.included,
                          disabled: Boolean(row.compacted),
                          onChange: function () {},
                          onClick: function (e) {
                            e.stopPropagation()
                            if (row.compacted) return
                            handleTurnToggle(row, e)
                          },
                        }),
                        h('span', { className: 'dsh-ctx-compact-turn' }, '#' + String(row.turn)),
                        row.compacted
                          ? h('span', { className: 'dsh-ctx-compacted-tag' }, '已压缩替换')
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
                                title: '勾选 = 携带此次压缩生成的新上下文摘要；取消勾选 = 不携带此摘要',
                              },
                              h('input', {
                                type: 'checkbox',
                                className: 'dsh-ctx-sel-checkbox',
                                checked: cp.included,
                                onChange: function (e) {
                                  controller.sendAction({
                                    action: 'toggle-message',
                                    messageId: cp.id,
                                    included: e.target.checked,
                                  })
                                },
                              }),
                              h(
                                'span',
                                null,
                                '📦 ── 第 ' +
                                  String(endT) +
                                  ' 轮后已触发压缩：上方 #' +
                                  String(startT) +
                                  '~#' +
                                  String(endT) +
                                  ' 已取消勾选，由此新上下文主导 ──',
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
                            ),
                          ),
                          isCpOpen ? h('pre', { className: 'dsh-ctx-cp-preview' }, cp.fullText) : null,
                        )
                      }),
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
            var savedLocal = readLocalSysOverride(key)
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
                  defaultOpt.textContent = '默认 (保持会话初始模式)'
                  presetSelect.appendChild(defaultOpt)
                  PRESET_SYSTEM_TEMPLATES.forEach(function (tpl) {
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
              enhanceContextMeterPanels()
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
