# Support App Frontend

## Design

**Primary colour:** `#7B2FBE` (flat purple, no gradient, no shadow)
- Used on the Navbar (`AppBar`)
- Applied as a global MUI theme colour when that is set up

## Testing Conventions

- **Testing context:** Use `renderHook` from `@testing-library/react` to test hooks and context directly. Do not create `TestConsumer` helper components that render context values as DOM text — `renderHook` gives you the values directly via `result.current`.
- **Async state:** Wrap assertions in `waitFor` when testing state that updates after an async call (e.g. `useEffect` fetching from the API).

## Architecture

- Navigation is handled by a top **Navbar** (`src/components/Navbar.tsx`), not a sidebar
- Auth state is managed via React Context (`src/context/AuthContext.tsx`)
- Protected routes use `SecureRoute` wrapper (`src/components/SecureRoute.tsx`)
