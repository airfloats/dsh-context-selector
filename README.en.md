# dsh-context-selector

[中文](./README.md) | **English**

Per-row context checkbox selector plugin for **DeepSeek Harness (DSH)** Web UI. Adds inline checkboxes on the left side of every user prompt, process group, individual tool call (`read`, `glob`, `grep`, `pwsh`/`bash`, etc.), and assistant response.

- **Checked `☑` (Default)**: Included in subsequent outgoing LLM requests.
- **Unchecked `☐`**: Omitted from subsequent LLM requests while keeping the transcript visible in the UI, and immediately updates the bottom **`Context Used XX%`** meter.

---

## Features

1. **Inline Left-Side Checkboxes on Every Row**
   - **Sent User Messages**: Toggle `☑ Sent` on the left of any user message row.
   - **Process Groups & Individual Tool Calls**: Toggle an entire tool group or expand it to uncheck specific heavy tool outputs (e.g. a large file read). Paired `tool-call` blocks and `tool/result` messages are cleanly stripped together so provider APIs never fail on orphaned tool IDs.
   - **Received Assistant Replies**: Toggle `☑ Received (~XX tok)` above any assistant response.

2. **Real-Time Context Meter Synchronization**
   - Checking or unchecking any item immediately recalculates saved tokens and updates the live `contextPressure` and `contextBreakdown` projections in the composer bar.

3. **Composer Toolbar & Slash Commands**
   - **`Keep in context` / `Send once only`**: Send a one-off prompt that automatically unchecks itself after the turn finishes.
   - **Overview Drawer**: One-click **Check All**, **Uncheck All**, **Keep Last 3**, or **Keep Last 1**.
   - **Slash Commands**: `/ctx`, `/ctx toggle <N>`, `/ctx last <N>`, `/ctx none`, `/ctx all`, `/ctx once`.

---

## Installation

```bash
# Install from tarball
dsh plugin add /path/to/dsh-context-selector-1.4.0.tgz

# Or install from GitHub repository
dsh plugin add git+https://github.com/airfloats/dsh-context-selector.git
```

## License

[MIT](./LICENSE)
