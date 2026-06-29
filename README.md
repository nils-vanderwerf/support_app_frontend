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

### As a support worker

1. Sign up and select **Support Worker**
2. Fill in your profile (bio, experience, availability, specialisations)
3. You'll be taken through the **AI Vetting** interview — the AI collects your police check number, Working With Children Check, and qualifications
4. Once submitted, an admin reviews your application
5. On approval, you land on your **Home dashboard** — today's schedule, weekly hours, upcoming appointments
6. Browse **Clients**, view their profiles, and initiate conversations
7. Respond to appointment invitations from your **Invitations** page — approve or decline bookings
8. Chat with clients via **Messages** — the AI can simulate client responses so you can test the flow end to end

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
- Per-conversation keys derived via HKDF-SHA256 — cached in memory so repeated sends are fast
- System messages (appointment confirmations/declines) rendered inline with a distinct style
- Unread message badges in the navbar
- AI conversation simulation — each participant in a thread is played by a Claude persona built from their real profile data (name, bio, location, specialisations, health conditions); workers can trigger a simulated client reply and vice versa, including proactive appointment invitation actions

### AI booking
- Clients describe what they need in plain language
- The AI searches available workers, proposes appointment times, and sends invitations
- Supports single bookings and recurring appointments ("3 sessions over the next month")
- Supports bulk actions ("decline the rest for me")
- Tool calls (worker searches, conversation opens) are rendered as purple pill chips in the chat UI so the user can see what the agent is doing

### Support worker vetting
- `VettingAgent` — step-by-step AI conversation that collects police check number, WWCC number, and expiry dates
- Validates reference numbers (minimum 6 characters, must contain a digit)
- On completion, worker status moves to `pending` and admin is notified

### Support worker profiles & list
- Profile page with editable fields, multi-select availability selector, and specialisation chips
- **Location filter** — geocodes the search address via Google Places API and filters workers by Haversine distance with an adjustable radius slider
- **Availability day filter** — parses both JSON and free-form availability strings so legacy data still filters correctly

### Visit reports
- Support workers can create a visit report for any completed appointment
- **AI draft generation** — one click populates Activities, Observations, and Follow-up Actions from appointment context
- Expandable report rows with full detail panel; reports are editable after submission
- Appointments that already have a report are disabled in the picker to prevent duplicates
- Visit report history is shown on the client profile page, filterable by time period and support worker; clients see reports from all their workers

### Progress reports
- Support workers can generate an AI summary of a client's full visit history from the client profile page (requires an approved appointment)
- Generated reports can be saved or discarded directly in the drawer before closing
- Saved reports appear on the Reports page under the **Progress Reports** tab, expandable with the full markdown summary
- Supports client filtering and one-click delete
- Client names in saved reports link through to the client profile page

### Admin dashboard
- Stats bar: approved workers, pending review, total clients, appointments this week
- Pending applications tab with police check, WWCC, AI vetting recommendation chips, and approve/reject buttons
- Optimistic UI: approving a worker moves them instantly between lists without a reload
- Appointments tab with status filter
- Approved workers tab with avatar, email, location, and specialisations
- Messages page — admin can view and reply to support worker threads (linked from the navbar)

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
