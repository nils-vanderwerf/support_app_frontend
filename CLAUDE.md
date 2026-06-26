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
