# Support App — Frontend

A full-stack portfolio project inspired by [Mable](https://mable.com.au), a platform that connects people living with disability to independent support workers. This project is personally meaningful — built by someone with cerebral palsy who understands the value of accessible, well-designed support services.

The backend Rails API lives in a separate repository: [support_app_backend](https://github.com/nils-vanderwerf/support_app_backend).

## What it does

- Clients can browse support workers, view their profiles, and book appointments
- Support workers can browse clients and book appointments with them
- Multi-step sign up flow with role selection (client or support worker)
- Session-based authentication with protected routes that persist across page refreshes
- Role-aware UI — booking buttons and views adapt based on who is logged in
- **AI Booking Assistant** — a conversational agent that helps clients find and book support workers using natural language

## AI Booking Assistant

The app includes an AI-powered booking agent accessible from the Appointments page. Clients click **Book with AI**, describe what they need in plain English, and the agent finds matching support workers and books the appointment.

The agent is built using the [Claude API](https://docs.anthropic.com/en/api/getting-started) (Anthropic) with **tool use** — a pattern where the model can call backend functions mid-conversation to fetch data or take actions, rather than just generating text.

### How the conversation works

1. The client describes their needs (e.g. "I need help with bathing and medication on Monday mornings")
2. Claude calls the `get_support_workers` tool to query the database and reasons over the results
3. Claude presents 2–3 matched workers with a brief explanation of why each is a good fit
4. The client selects a worker and provides a time — Claude calls `create_appointment` to book it
5. Claude confirms the booking in the chat; the appointments list refreshes automatically

### Frontend

- `BookingAgent.tsx` — a Material UI `Drawer` with a scrollable chat log and text input
- Full conversation history is kept in local React state and sent with every request
- The component detects confirmation language in Claude's reply to trigger a list refresh

### How the agentic loop works (backend)

The backend runs the entire tool-use loop within a single HTTP request:

```
POST /api/ai_booking/chat
  → call Claude with tools defined
  → if Claude returns tool_use blocks → execute tools against the DB → call Claude again with results
  → repeat until Claude returns a plain text response
  → send that text back to the frontend
```

This keeps the frontend simple (it only ever sends messages and receives a text reply) while the backend handles all the multi-step reasoning.

## Tech stack

- **React** with TypeScript
- **Material UI** for components
- **Axios** for API requests
- **React Router** for navigation and protected routes
- **React Context + hooks** for auth state management
- **Jest + React Testing Library** for unit and component tests
- **Claude API (Anthropic)** for the AI booking agent

## Frontend concepts practised

- Component composition and reuse
- React hooks (`useState`, `useEffect`, `useContext`)
- TypeScript interfaces and typing
- React Context for global auth state
- Session persistence across refresh using a backend session check
- Protected routes with loading state handling
- Multi-step forms with conditional rendering
- Mocking with Jest (`jest.mock`, `mockResolvedValueOnce`)
- Testing context with `renderHook`
- Building a conversational UI with streamed-style UX (chat bubbles, loading state, auto-scroll)

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

---

## Feature branches and worktrees

The following features are being developed in parallel using git worktrees. Each has its own frontend worktree (under `/tmp/wt_fe_*`) and, where needed, a backend worktree (under `/tmp/wt_be_*` or `/tmp/wt_backend_cp`).

### How to test a feature branch

**Frontend worktrees** share code but not `node_modules`. Run `npm install` once inside each worktree before starting.

**Backend worktrees** all share the same database — stop the main backend before starting a feature backend on the same port.

---

### 1. Client privacy (`feature/client-privacy`) — Status: pushed, PR open

Restricts client data so clients can only see their own profile. Support workers can browse all clients.

**Start:**
```bash
# Terminal 1 — backend (stop main backend first)
cd /tmp/wt_backend_cp
rackup -p 9292

# Terminal 2 — frontend on port 3001
cd /tmp/wt_fe_client-privacy
npm install
PORT=3001 npm start
```

**Test at [http://localhost:3001](http://localhost:3001):**
- Log in as a support worker → "Clients" appears in the navbar; clicking it shows a list of all clients
- Log in as a client → no "Clients" link in the navbar
- Navigating to `/clients` as a client redirects back to home

---

### 2. Chip/bubble selectors (`feature/bubble-selectors`) — Status: pushed, PR pending

Replaces plain text inputs for medications, allergies, and specializations with MUI chip selectors — searchable, multi-select, with free-text entry.

**Start:**
```bash
# Terminal 1 — main backend (no backend changes needed)
cd /path/to/support_app_backend
rackup -p 9292

# Terminal 2 — frontend on port 3002
cd /tmp/wt_fe_bubble-selectors
npm install
PORT=3002 npm start
```

**Test at [http://localhost:3002](http://localhost:3002):**
- Sign up as a client → medications and allergies fields show purple chip selectors
- Type a value and press Enter to add a free-text chip
- Sign up as a support worker → specializations field shows a chip selector with preset options

---

### 3. Visit report AI agent (`feature/visit-report-agent`) — Status: in progress

After a session, support workers can open a drawer, hit "Generate Draft with AI", and get a pre-filled report based on the appointment details. The draft is editable before saving.

**Start:**
```bash
# Terminal 1 — backend (stop main backend first)
cd /tmp/wt_be_visit-report-agent
rackup -p 9292

# Terminal 2 — frontend on port 3003
cd /tmp/wt_fe_visit-report-agent
npm install
PORT=3003 npm start
```

**Test at [http://localhost:3003](http://localhost:3003):**
- Log in as a support worker → appointments list shows a "Write Report" button
- Click it → right-side drawer opens
- Click "Generate Draft with AI" → Claude fills in Activities, Observations, and Follow-up sections
- Edit the draft freely, then click "Save Report" to persist it

---

### 4. Appointment reminders (`feature/appointment-notifications`) — Status: pushed, PR #8 open

Schedules a background job when an appointment is created or updated. 24 hours before the appointment, reminder emails are sent to both the client and the support worker.

**Start:**
```bash
# Terminal 1 — backend (stop main backend first)
cd /tmp/wt_be_appointment-notifications
rackup -p 9292

# Terminal 2 — frontend on port 3004
cd /tmp/wt_fe_appointment-notifications
npm install
PORT=3004 npm start
```

**Test at [http://localhost:3004](http://localhost:3004):**
- Book an appointment with a date more than 24 hours in the future → check backend logs for `AppointmentReminderJob scheduled`
- Cancel an appointment → job skips email delivery (soft-delete guard)
- In test mode, emails accumulate in `ActionMailer::Base.deliveries` (run `bundle exec rspec spec/mailers spec/jobs` to verify)

---

### 5. User profile page (`feature/user-profile`) — Status: not started

Clicking a client or support worker's name in any list will open their full profile page.

**Start:**
```bash
# Terminal 1 — backend
cd /tmp/wt_be_user-profile
rackup -p 9292

# Terminal 2 — frontend on port 3005
cd /tmp/wt_fe_user-profile
npm install
PORT=3005 npm start
```

**Test at [http://localhost:3005](http://localhost:3005):**
- Log in as a support worker → click a client's name in the appointments list → profile page opens
- Log in as a client → click a support worker's name → support worker profile page opens
- Profile shows bio, location, specializations (support worker), health info (client)
