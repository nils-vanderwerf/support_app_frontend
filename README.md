# Suppova — Frontend

A full-stack portfolio project built by someone with cerebral palsy who is on the NDIS — and wanted a platform that actually works for people navigating disability support.

**Live app:** [https://suppova.com](https://suppova.com)

The backend Rails API lives in a separate repository: [support_app_backend](https://github.com/nils-vanderwerf/support_app_backend), deployed at [https://api.suppova.com](https://api.suppova.com).

---

## Using the app

### As a client

1. Go to [https://suppova.com](https://suppova.com) and click **Sign Up**
2. Enter your name, email, and password, then select **Client**
3. Fill in your profile details (age, location, health conditions, emergency contact)
4. Once logged in, you land on your **Home dashboard** — upcoming appointments, health summary, and quick actions
5. Browse **Support Workers** — filter by name, specialisation, availability, or location radius
6. Click a worker's card to view their full profile, then **Book Appointment** or **Message** them
7. Use **Book with AI** to describe what you need in natural language — the AI finds a suitable worker and proposes appointment times on your behalf
8. Manage your bookings from the **Appointments** page — view status, cancel, or rebook
9. After a completed appointment, leave a star rating and review on the worker's profile page

### As a support worker

1. Sign up and select **Support Worker**
2. Fill in your profile (bio, experience, availability, specialisations)
3. Submit your police check number, Working With Children Check, and qualifications
4. Once submitted, an admin reviews your application
5. On approval, you land on your **Home dashboard** — today's schedule, weekly hours, total clients, average star rating, and a preview of your most recent reviews
6. Browse **Clients**, view their profiles, and initiate conversations
7. Respond to appointment invitations from your **Invitations** page — approve or decline bookings
8. Write visit reports for completed appointments directly from the **Appointments** page or your dashboard — the AI can pre-fill a draft for you
9. Chat with clients via **Messages** — the AI can simulate client replies; review notifications also appear here as in-thread system messages

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
- **AI Visit Reports** — generates a structured draft from appointment context; workers edit and submit from the same page
- **Admin Dashboard** — stats bar, pending applications with AI vetting recommendations, appointment management, and approved workers list
- **Forgot password** — email-based reset flow via Resend
- **Star ratings & reviews** — clients rate support workers after completed appointments; workers are notified by email and in-app message

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
- Client view: upcoming appointments, days since last visit, total appointments, health info summary, reviews given; edit/delete actions on appointments
- Support worker view: today's appointments, hours this week, total clients, average star rating, upcoming and recent appointments with rebook shortcut, recent reviews sidebar

### Appointment system
- `BookingForm` submits dates with the local timezone offset so the backend stores and formats times correctly
- Pending invitations page with approve/decline — passes browser timezone so confirmation system messages show the right local time
- Admin appointment table with status filter (All / Pending / Approved / Declined)

### Messaging
- Conversation threads with chat-bubble UI, encrypted at rest using AES-256-GCM (see "How this app talks to its backend and Google" below for what that does and doesn't protect against)
- Messages are encrypted in the browser before leaving the client; the server stores only ciphertext
- Per-conversation keys derived via HKDF-SHA256 — cached in memory so repeated sends are fast
- System messages (appointment confirmations, declines, and review notifications) rendered inline with a distinct style
- Unread message badges in the navbar
- AI conversation simulation — each participant in a thread is played by a Claude persona built from their real profile data (name, bio, location, specialisations, health conditions); workers can trigger a simulated client reply and vice versa, including proactive appointment invitation actions

### AI booking
- Clients describe what they need in plain language
- The AI searches available workers, proposes appointment times, and sends invitations
- Supports single bookings and recurring appointments ("3 sessions over the next month")
- Supports bulk actions ("decline the rest for me")
- Tool calls (worker searches, conversation opens) are rendered as purple pill chips in the chat UI so the user can see what the agent is doing

### Support worker profiles & list
- Profile page with editable fields, multi-select availability selector, and specialisation chips
- **Location filter** — geocodes the search address via Google Places API and filters workers by Haversine distance with an adjustable radius slider
- **Availability day filter** — parses both JSON and free-form availability strings so legacy data still filters correctly

### Visit reports
- Support workers can create a visit report for any completed appointment
- **AI draft generation** — one click populates Activities, Observations, and Follow-up Actions from appointment context
- Expandable report rows with full detail panel; reports are editable after submission
- Accessible directly from the **Appointments** page — the button turns green ("Edit Report") when a report already exists, making it clear at a glance and preventing accidental duplicates
- Visit report history is shown on the client profile page, filterable by time period and support worker; clients see reports from all their workers

### Progress reports
- Support workers can generate an AI summary of a client's full visit history from the client profile page (requires an approved appointment)
- Generated reports can be saved or discarded directly in the drawer before closing
- Saved reports appear on the Reports page under the **Progress Reports** tab, expandable with the full markdown summary
- Supports client filtering and one-click delete
- Client names in saved reports link through to the client profile page

### Reviews
- Clients can leave a star rating (1–5) and optional comment for a support worker after a completed, approved appointment
- Interactive star picker with hover animation; one review per appointment enforced at the database level
- Reviews are visible on the support worker's profile page under a dedicated **Reviews** tab, with the average rating and review count shown in the sidebar regardless of which tab is active
- Clients can edit or delete their own reviews inline without leaving the page
- The appointment dropdown shows all past appointments; already-reviewed ones are disabled with an "Already reviewed" label
- Support workers are notified of new reviews via email and a system message in their existing conversation thread with the client, which surfaces as an unread message in the navbar badge
- Average rating, review count, and a preview of the three most recent reviews appear on the support worker's **Home dashboard**
- Clients see a "Reviews You've Given" summary on their own dashboard with links through to each worker's profile

### Admin dashboard
- Stats bar: approved workers, pending review, total clients, appointments this week
- Pending applications tab with police check, WWCC, AI vetting recommendation chips, and approve/reject buttons
- Optimistic UI: approving a worker moves them instantly between lists without a reload
- Appointments tab with status filter
- Approved workers tab with avatar, email, location, and specialisations
- Messages page — admin can view and reply to support worker threads (linked from the navbar)

## How this app talks to its backend and Google

For the full backend-side security/architecture write-up (how sensitive fields are gated server-side, graceful AI degradation, encryption details), see the [backend README](https://github.com/nils-vanderwerf/support_app_backend#how-the-pieces-talk-to-each-other). The frontend-specific pieces:

- **Auth:** a signed token (not a session cookie) is stored in `localStorage` and attached as `Authorization: Bearer <token>` by an Axios interceptor (`src/api/axiosConfig.js`) on every request. **Trade-off:** no cookies means no CSRF exposure, but a token in `localStorage` can be read by any script running on the page — an XSS bug would be a stolen-session bug. That's judged an acceptable trade for an app with no third-party embedded scripts.
- **Google Places** is called directly from the browser (`LocationAutocomplete.tsx`, `geoDistance.ts`) using a Maps API key that ships in the frontend bundle — safe because it's locked to this domain via HTTP referrer restriction in Google Cloud Console, not because it's secret. The backend is never involved in geocoding or autocomplete. Distance filtering on the browse/list pages is a real Haversine calculation on geocoded coordinates — contrast this with the AI booking assistant, which instead asks Claude to *estimate* distance from place names using its own geographic knowledge, since the backend tool-use loop has no access to browser-side geocoding. That's a deliberate inconsistency (precise client-side math for the list pages, fuzzy LLM reasoning for chat), not a bug.
- **Claude (Anthropic)** is never called from the browser — the API key only ever lives in the backend's environment. Every AI feature the frontend triggers (booking assistant, visit/progress report drafts, AI conversation replies) is a POST to this app's own Rails API, which then talks to Anthropic server-side.
- **Message encryption** (`src/utils/encryption.ts`) really does encrypt in the browser before sending and decrypt in the browser on render — but the AES key is derived via HKDF from a hardcoded context string plus the conversation id, not from any per-user secret. That means the backend can (and does, for the AI conversation-simulation features) derive the identical key itself. So this protects a database dump or leaked backup from showing plaintext messages, but it is not confidentiality against the server — an important distinction from what "end-to-end encrypted" usually implies.
- **Graceful AI degradation:** when the backend returns `503 { error: 'ai_unavailable' }`, the UI never just shows a dead end. The progress report drawer's summary field is a normal editable text box from the moment it opens (not something that only appears after a successful generate), so a failed AI call just means it's empty instead of pre-filled. The AI booking chat has no manual equivalent, so instead it shows a clearer message plus a direct link to browse the client/support-worker list, chosen based on the logged-in user's role.

## Running locally

The frontend requires the backend to be running first. Clone both repos and follow the backend setup instructions, then:

```bash
# Install dependencies
npm install

# Create a .env file with:
# REACT_APP_API_URL=http://localhost:9292/api
# REACT_APP_GOOGLE_MAPS_API_KEY=your_key

npm start
```

Runs on [http://localhost:3000](http://localhost:3000).

## Running tests

```bash
npm test
```

237 passing tests across 22 test suites — components, hooks, context, and utility functions.
