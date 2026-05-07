# Support App — Frontend

A full-stack portfolio project inspired by [Mable](https://mable.com.au), a platform that connects people living with disability to independent support workers. This project is personally meaningful — built by someone with cerebral palsy who understands the value of accessible, well-designed support services.

The backend Rails API lives in a separate repository: [support_app_backend](https://github.com/nils-vanderwerf/support_app_backend).

## What it does

- Clients can browse support workers, view profiles, and book appointments
- Support workers can browse clients and connect with them
- Multi-step sign-up flow with role selection (client or support worker)
- Messaging between clients and support workers with in-thread appointment invitations
- Pending invitations page where support workers approve or decline bookings
- Session-based auth with protected routes that persist across page refresh
- Role-aware and status-aware UI — pending workers are redirected to vetting; approved workers see their full dashboard
- **AI Booking Assistant** — conversational agent that finds and connects users in natural language
- **AI Vetting Agent** — guided interview that collects and validates support worker credentials
- **Admin Dashboard** — stats bar, pending applications, appointment management, and approved workers list

## Tech stack

- **React** with TypeScript
- **Material UI** for components
- **Axios** for API requests
- **React Router** for navigation and protected routes
- **React Context + hooks** for auth state management
- **Jest + React Testing Library** for component tests
- **Claude API (Anthropic)** for AI agents

## Features implemented

### Authentication & routing
- Session-based login with persistent auth check on refresh
- `SecureRoute` wrapper redirects unauthenticated users to `/login`, pending workers to `/vetting`, and serves role-appropriate content
- Navbar adapts per role — admin link, worker-only links, and client-only links all conditionally rendered

### Home dashboard
- Client view: upcoming appointments, days since last visit, total appointments, health info summary, edit/delete actions
- Support worker view: today's appointments, hours this week, total clients, upcoming and recent appointments with rebook shortcut

### Appointment system
- `BookingForm` submits dates with the local timezone offset (`+10:00`) so the backend stores and formats times correctly
- Pending invitations page with approve/decline — passes browser timezone so confirmation system messages show the right local time
- Admin appointment table with status filter (All / Pending / Approved / Declined) using `ToggleButtonGroup`

### Messaging
- Conversation threads with chat-bubble UI
- System messages (appointment confirmations/declines) rendered inline with a distinct style
- Unread message badges in the navbar

### Support worker vetting
- `VettingAgent` component — step-by-step AI conversation that collects police check, WWCC, bio, specializations, and availability
- On completion, the worker's status moves to `needs_review` and they are redirected out of vetting

### Support worker profiles & list
- Profile page with editable fields, availability selector, and specialization chips
- Worker list formats availability from raw JSON into human-readable text (e.g. "Mon, Tue, Thu · Business hours (09:00-17:00)")
- `AvailabilitySelector` component with preset time windows and day toggles; `formatAvailability` exported for reuse

### Admin dashboard
- Stats bar: approved workers, pending review, total clients, appointments this week — all scoped to the logged-in admin's approved workers
- Pending applications tab with police check, WWCC, agent recommendation chips, and approve/reject buttons
- Optimistic UI: approving a worker moves them from the applications list to the workers list without a reload
- Appointments tab with status filter
- Approved workers tab with avatar, email, location, and specializations

## Frontend concepts practised

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

## Running the app

The frontend requires the backend to be running first.

```bash
npm install
npm start
```

Runs on [http://localhost:3000](http://localhost:3000).

## Running tests

```bash
npm test
```
