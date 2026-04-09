# Support App Frontend

## Design

**Primary colour:** `#7B2FBE` (flat purple, no gradient, no shadow)
- Used on the Navbar (`AppBar`)
- Applied as a global MUI theme colour when that is set up

## Architecture

- Navigation is handled by a top **Navbar** (`src/components/Navbar.tsx`), not a sidebar
- Auth state is managed via React Context (`src/context/AuthContext.tsx`)
- Protected routes use `SecureRoute` wrapper (`src/components/SecureRoute.tsx`)
