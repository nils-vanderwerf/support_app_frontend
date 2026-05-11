# Suppova — Frontend

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

**Live app:** [https://suppova.com](https://suppova.com)

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

1. Go to [https://suppova.com](https://suppova.com) and click **Sign Up**
2. Enter your name, email, and password, then select **Client**
3. Fill in your profile details (age, location, health conditions, emergency contact)
4. Once logged in, you land on your **Home dashboard** — upcoming appointments, health summary, and quick actions
5. Browse **Support Workers** — filter by name, specialization, availability, or location radius
6. Click a worker's card to view their full profile, then **Book Appointment** or **Message** them
7. Use **Book with AI** to describe what you need in natural language — the AI finds a suitable worker and proposes appointment times on your behalf
8. Manage your bookings from the **Appointments** page — view status, cancel, or rebook

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

### Demo accounts

The following seeded accounts are available to try the app without signing up:

| Role | Email | Password |
|------|-------|----------|
| Client | elena.martinez@example.com | password123 |
| Client | raj.patel@example.com | password123 |
| Client | sophie.chen@example.com | password123 |
| Support Worker | olivia.williams@example.com | password123 |
| Support Worker | james.smith@example.com | password123 |
| Admin | admin@example.com | password123 |

> **Note:** The backend runs on Render's free tier and may take up to 50 seconds to respond after a period of inactivity while the server wakes up.

---

## What it does

- Clients can browse support workers, view profiles, and book appointments
- Support workers can browse clients and connect with them
- Multi-step sign-up flow with role selection (client or support worker)
- Messaging between clients and support workers with in-thread appointment invitations
- Pending invitations page where support workers approve or decline bookings
- Token-based auth stored in localStorage with protected routes that persist across page refresh
- Role-aware and status-aware UI — pending workers are redirected to vetting; approved workers see their full dashboard
- **AI conversation simulation** — every message thread is populated by a Claude persona built from real profile data; no real users needed to test the end-to-end flow
- **AI Booking Assistant** — conversational agent that finds and connects users in natural language
- **AI Vetting Agent** — guided interview that collects and validates support worker credentials
- **AI Visit Reports** — generates a structured draft from appointment context; workers edit and submit from the same page
- **Admin Dashboard** — stats bar, pending applications with AI vetting recommendations, appointment management, and approved workers list
- **Forgot password** — email-based reset flow via Resend

## Tech stack

**Frontend**
- React with TypeScript
- Material UI for components
- Axios for API requests with Bearer token auth
- React Router for navigation and protected routes
- React Context + hooks for auth state management
- Jest + React Testing Library for component tests

**Backend** (separate repo)
- Ruby on Rails API
- PostgreSQL via Neon (persistent, serverless)
- Token-based authentication (signed tokens via `Rails.application.message_verifier`)
- Claude API (Anthropic) for AI agents
- Resend for transactional email
- Deployed on Render (Docker)

## Features

### Authentication & routing
- Token-based login — signed token returned on login/signup, stored in localStorage, sent as `Authorization: Bearer` header on every request
- `SecureRoute` wrapper redirects unauthenticated users to `/login`, pending workers to `/vetting`, and serves role-appropriate content
- Navbar adapts per role — admin link, worker-only links, and client-only links all conditionally rendered
- Forgot password — email reset link sent via Resend, token validated on the backend

### Home dashboard
- Client view: upcoming appointments, days since last visit, total appointments, health info summary, edit/delete actions
- Support worker view: today's appointments, hours this week, total clients, upcoming and recent appointments with rebook shortcut

### Appointment system
- `BookingForm` submits dates with the local timezone offset so the backend stores and formats times correctly
- Pending invitations page with approve/decline — passes browser timezone so confirmation system messages show the right local time
- Admin appointment table with status filter (All / Pending / Approved / Declined)

### Messaging
- Conversation threads with chat-bubble UI, encrypted end-to-end using AES-256-GCM
- Messages are encrypted in the browser before leaving the client; the server stores only ciphertext
- Per-conversation keys derived via HKDF-SHA256 (IKM = fixed context string, info = `conv-{id}`) — cached in memory so repeated sends are fast
- The backend mirrors the same HKDF + AES-256-GCM derivation in Ruby/OpenSSL to decrypt messages before passing context to the AI, and encrypts AI replies before storing them
- System messages (appointment confirmations/declines) rendered inline with a distinct style; the `ENC:` prefix distinguishes encrypted messages from plaintext system messages
- Unread message badges in the navbar
- AI conversation simulation — each participant in a thread is played by a Claude persona built from their real profile data (name, bio, location, specialisations, health conditions); workers can trigger a simulated client reply and vice versa, including proactive appointment invitation actions

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### Support worker profiles & list
- Profile page with editable fields, availability selector, and specialization chips
- Worker list formats availability from raw JSON into human-readable text (e.g. "Mon, Tue, Thu · Morning (06:00-12:00)")
- `AvailabilitySelector` component with preset time windows and day toggles; `formatAvailability` exported for reuse
- **Location filter** — geocodes the search address via Google Places API (New) using `AutocompleteSuggestion.fetchAutocompleteSuggestions` + `toPlace().fetchFields`, then filters workers by Haversine distance with an adjustable radius slider
- **Availability day filter** — `parseAvail` parses both JSON (`{"days":["Mon","Tue"...]}`) and free-form strings ("Weekdays", "Mon/Wed/Fri") so legacy data still filters correctly
- `LocationAutocomplete` component with session token management and an `onCoordinates` callback to avoid a redundant geocoding round-trip after the user selects a suggestion

### Visit reports
- Support workers can create a visit report for any completed appointment
- **AI draft generation** — one click populates Activities, Observations, and Follow-up Actions from appointment context
- Expandable report rows with full detail panel; reports are editable after submission
- Appointments that already have a report are disabled in the picker to prevent duplicates

### Admin dashboard
- Stats bar: approved workers, pending review, total clients, appointments this week
- Pending applications tab with police check, WWCC, AI vetting recommendation chips, and approve/reject buttons
- Optimistic UI: approving a worker moves them instantly between lists without a reload
- Appointments tab with status filter
- Approved workers tab with avatar, email, location, and specialisations
- Messages page — admin can view and reply to support worker threads (linked from the navbar)

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

- Component composition and reuse across views
- React hooks (`useState`, `useEffect`, `useContext`)
- TypeScript interfaces and typing
- React Context for global auth state
- Session persistence across refresh
- Protected and role-gated routes
- Multi-step forms with conditional rendering
- Optimistic UI updates (approve/decline without full reload)
- Timezone-aware date handling — `localOffsetStr()` appends the browser offset to ISO strings; `Intl.DateTimeFormat().resolvedOptions().timeZone` passed to the backend for message formatting
- MUI component patterns: `ToggleButtonGroup`, `Chip`, `Avatar`, `Table`, `Drawer`, `Dialog`
- Mocking with Jest (`jest.mock`, `mockResolvedValueOnce`, `jest.MockedFunction`)
- Testing context with `renderHook` from `@testing-library/react`
- Agentic AI conversational UI — chat bubbles, loading state, auto-scroll, streaming-style UX
- Web Crypto API — AES-256-GCM encryption, HKDF key derivation, key caching
- Geospatial filtering — Haversine distance, async geocoding with debounce, Places API (New)
- **237 passing tests** across 22 test suites — components, hooks, context, and utility functions

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
