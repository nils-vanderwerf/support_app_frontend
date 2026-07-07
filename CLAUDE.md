# Support App Frontend

## Design

**Primary colour:** `#7B2FBE` (flat purple, no gradient, no shadow)
- Used on the Navbar (`AppBar`)
- Applied as a global MUI theme colour when that is set up

## Testing Conventions

- **Testing context:** Use `renderHook` from `@testing-library/react` to test hooks and context directly. Do not create `TestConsumer` helper components that render context values as DOM text — `renderHook` gives you the values directly via `result.current`.
- **Async state:** Wrap assertions in `waitFor` when testing state that updates after an async call (e.g. `useEffect` fetching from the API).

## AI Agents

- AI agent UIs are right-side Drawers that maintain a `Message[]` array (`{ role, content }`) and POST the full history to the backend on each turn — see `BookingAgent.tsx` for the canonical pattern.
- AI responses are rendered with `renderMarkdown` (`src/utils/renderMarkdown.tsx`), not as plain text.
- Conversation messages are E2E encrypted — never log or display raw `content` outside the decrypted render path.
- `BookingAgent.tsx` separates `apiMessages` (sent to the Anthropic API — chat turns only) from `displayMessages` (shown in the UI — includes `{ type: 'tool_steps', toolCalls }` and `{ type: 'error_link', message, to, linkLabel }` entries). Never push non-chat display objects into `apiMessages` or the API call will fail.
- Tool calls returned in the backend response are rendered as purple pill chips via the `ToolSteps` component. `describeToolCall()` maps tool names to a label and icon.
- If the backend returns a `503` with `{ error: 'ai_unavailable' }` (AI agent down), show a clearer message than a generic failure and, where there's no manual fallback (e.g. `BookingAgent.tsx`), a role-based link to browse directly instead (`/support-workers` for clients, `/clients` for support workers).
- Progress reports (generated on a client profile page) are saveable/discardable directly in `ClientProgressReportDrawer.tsx` before leaving the drawer. The summary field is always editable and visible from the moment the drawer opens — never gate it behind a successful generate response, so an AI failure doesn't leave the user with nothing to write in. Saved reports are persisted to `POST /progress_reports` and visible on the Reports page under the "Progress Reports" tab.

## Working style

- Commit finished, verified changes by default — don't wait to be asked. Still confirm before pushing.
