# Manual Test Checklist — Suppova

Test against the **live app** at https://suppova.com
or locally:

```
# Backend — http://localhost:9292
rails s -p 9292

# Frontend — http://localhost:3000
npm start
```

---

## Seeded Demo Accounts (live app)

| Role | Email | Password |
|------|-------|----------|
| **Client** | `elena.martinez@example.com` | `password123` |
| **Client** | `raj.patel@example.com` | `password123` |
| **Support Worker** | `olivia.williams@example.com` | `password123` |
| **Support Worker** | `james.smith@example.com` | `password123` |
| **Admin** | `admin@example.com` | *(set via Rails console)* |
| **New SW (pending)** | Register via sign-up | — |

---

## 1 · Auth

- [ Y ] Visit `/` while logged out — redirects to `/login`
- [ Y ] Submit wrong credentials — "Invalid email or password" alert appears
- [ Y ] Login as **client** → lands on home dashboard
- [ Y ] Login as **support worker** → lands on home dashboard
- [ Y ] Login as **admin** → redirected straight to `/admin`
- [ Y ] Refresh page — still logged in (token persists in localStorage)
- [ Y ] Log out — token cleared, redirected to `/login`
- [ N ] Login redirects to originally requested page if there was one *(not yet implemented)*

---

## 2 · Sign Up

- [ Y ] Click Sign Up → Step 1: enter name, email, password → Next
- [  Y] Step 2: choose role (Client / Support Worker)
- [ Y ] Step 3 (client): fill in age, gender, phone, location, about, health conditions, medications, allergies, emergency contact → Sign Up
- [ Y ] Step 3 (support worker): fill in age, gender, phone, location, about, experience, availability, specializations, emergency contact → Sign Up
- [ Y ] Successful signup logs in automatically
- [ Y ] New support worker redirected to `/vetting`
- [ Y ] New client redirected to home dashboard
- [ Y ] Duplicate email shows validation error

---

## 3 · Forgot Password

- [ Y ] Click "Forgot password?" on login page → `/forgot-password`
- [ ] Enter email → submit — "Check your inbox" success message shown
- [ ] Email arrives from `onboarding@resend.dev` (or `noreply@suppova.com` once domain verified)
- [ ] Reset link in email goes to `/reset-password/<token>` (path param, not query string)
- [ ] Follow reset link → `/reset-password/:token` page loads
- [ ] Enter new password → redirect to `/login` with "Password updated" notice
- [ ] Old password no longer works; new password logs in successfully

---

## 4 · Support Worker List (as client)

Login as **`elena.martinez@example.com`**

- [ Y ] `/support-workers` shows table with avatar, name, location, availability, specializations
- [ Y ] Worker count shown (e.g. "8 of 8 workers")

**Name filter**
- [ Y ] Type "Olivia" → only Olivia Williams visible; clear → all return

**Location filter**
- [ Y ] Type a suburb (e.g. "Sydney") — autocomplete suggestions appear
- [ Y ] Select a suggestion — radius slider appears; workers outside radius disappear
- [ Y ] Drag slider to 100 km — more workers appear

**Availability day filter**
- [ Y ] Select "Mon" — only workers available Mondays shown
- [ Y ] Select "Mon" + "Wed" — workers available on Mon OR Wed are shown (either day)

**Specialization filter**
- [ Y ] Click "Elderly Care" chip — only workers with that specialization shown
- [ Y ] Click multiple chips — workers must have ALL selected

**Filter badge + clear**
- [ Y ] Apply two filters — badge shows count; "Clear all" resets everything

---

## 5 · Support Worker Profile (as client)

- [ ] Click a worker row → `/support-workers/:id`
- [ Y ] Profile shows name, location, bio, availability, experience, specialization chips
- [ Y ] Police Check and WWCC chips visible if the worker has them
- [ Y ] "Message" button creates or opens a conversation → navigates to `/messages/:id`
- [ ] "Book Appointment" button opens booking form modal

---

## 6 · Appointments (as client)

- [ ] `/appointments` shows table with Date, Worker, Location, Duration, Status columns
- [ ] Future pending appointments have **Edit** and **Delete** buttons
- [ ] Past appointments have a **Rebook** button
- [ ] Delete → confirmation dialog → Confirm — appointment removed, snackbar appears
- [ ] Edit → BookingForm opens pre-filled; saving updates the row
- [ ] Empty list shows "No appointments found"

---

## 7 · Booking Form

- [ ] Select date, time, location, duration — submit creates appointment
- [ ] New appointment appears in table immediately (optimistic update)
- [ ] On mobile (< 600px) — dialog is full screen
- [ ] Close button dismisses without saving

---

## 8 · Availability Selector

- [ ] Day checkboxes work; "Weekdays", "Weekends", "Every day" shortcut chips work
- [ ] **Multiple time windows can be selected** (e.g. Morning + Evening both highlighted)
- [ ] Custom time window shows From/To pickers
- [ ] Selected summary shown below days ("Weekdays selected")
- [ ] Saved value displays correctly in profile (e.g. "Mon, Tue, Thu · Morning (06:00-12:00), Evening (18:00-22:00)")

---

## 9 · Messaging (as client)

Login as **`elena.martinez@example.com`**

- [ ] `/messages` shows conversation list
- [ ] Click a conversation → chat bubbles aligned (mine right, theirs left)
- [ ] Starter chips visible on empty threads; clicking one populates the input
- [ ] Send a message → AI typing indicator → AI reply arrives
- [ ] System messages (appointment confirmations) appear centred in grey
- [ ] "Send Invitation" button visible; clicking opens BookingForm with suggested time pre-filled
- [ ] Pending invitation card shows "Waiting for response…"
- [ ] "Book with AI" describes needs in natural language → AI proposes worker + time
- [ ] "Decline the rest for me" — AI declines all remaining pending invitations

---

## 10 · Messaging (as support worker)

Login as **`olivia.williams@example.com`**

- [ ] **Suppova Support** thread pinned at top (purple admin icon)
- [ ] Pending invitation cards show **Approve** and **Decline** buttons
- [ ] Approve → card updates, AI sends confirmation message
- [ ] Decline → card updates, AI sends decline message
- [ ] Starter chips visible on empty threads

---

## 11 · AI Booking — recurring appointments

- [ ] Ask AI for "3 sessions over the next month" — AI creates 3 separate appointment invitations
- [ ] All 3 appear as pending invitation cards in the conversation
- [ ] "Decline the rest for me" after approving one — remaining invitations declined

---

## 12 · Pending Invitations (as support worker)

- [ ] `/invitations` lists pending invitations with date, client name, location, duration
- [ ] Approve/Decline buttons work; approved/declined items removed from list
- [ ] Empty state shown when none pending

---

## 13 · Client List (as support worker)

- [ ] `/clients` shows table with name, location, phone, health conditions
- [ ] Name and location filters work; "Clear all" resets
- [ ] Click a client row → `/clients/:id`

---

## 14 · Client Profile (as support worker)

- [ ] Profile shows name, health conditions, medications, allergies
- [ ] "Message" and "Book Appointment" buttons visible

---

## 15 · Home Dashboard

**As client:** upcoming appointments, days since last visit, total appointments, health summary, edit/delete actions

**As support worker:** today's schedule, hours this week, total clients, upcoming/recent appointments with rebook shortcut

---

## 16 · Self-Edit Profile

**Support worker** — login as `olivia.williams@example.com`, go to `/support-workers/:id`

- [ ] "Edit Profile" button visible only on own profile
- [ ] Edit bio, save — persists after page refresh
- [ ] AvailabilitySelector allows selecting multiple time windows
- [ ] Location autocomplete works when editing

**Client** — similar flow on `/clients/:id`

---

## 17 · Vetting Flow (new support worker)

Register a **new support worker** account via sign-up

- [ ] After registration, redirected to `/vetting`
- [ ] Vetting chat starts with greeting
- [ ] Invalid police check number (e.g. "ABC") — AI rejects and asks again
- [ ] Valid police check (6+ chars with a digit, e.g. "PCK123456") — AI confirms and moves on
- [ ] WWCC number — AI confirms
- [ ] Chat completes; `[VETTING_COMPLETE]` stripped from reply; completion banner shown
- [ ] Worker status set to `pending` in DB

---

## 18 · Admin Dashboard

Login as **`admin@example.com`**

- [ ] `/admin` loads with stats: approved workers, pending review, clients, appointments this week
- [ ] Non-admin users cannot reach `/admin` (redirected to `/`)

**Pending Applications tab**
- [ ] Pending workers listed with police check + WWCC info
- [ ] Agent recommendation chip shown
- [ ] Approve → worker moves to Approved Workers tab; approval message sent to their Suppova thread
- [ ] Reject → worker notified in their Suppova thread with reason + reapply notice

**Appointments tab**
- [ ] All appointments listed; status filter (All / Pending / Approved / Declined) works

**Approved Workers tab**
- [ ] Shows approved workers with avatar, email, location, specializations

**Messages tab**
- [ ] Thread list shows support workers; click to view history
- [ ] Admin can reply; message appears in the worker's Suppova thread

---

## 19 · Suppova Thread (support worker)

- [ ] `/messages/admin` shows the admin thread
- [ ] Approval / rejection messages from admin visible
- [ ] Worker can reply to admin

---

## 20 · Navbar

- [ ] Admin: only "Admin" link shown
- [ ] Pending/vetting worker: no nav links
- [ ] Approved worker: Clients, Appointments, Messages, Invitations
- [ ] Client: Support Workers, Appointments, Messages, Invitations
- [ ] Unread messages badge on Messages link updates every 15 s
- [ ] Mobile: hamburger menu opens drawer with same links
- [ ] Logout clears session and auth token

---

## 21 · Mobile Responsiveness

Test at mobile viewport (< 600px)

- [ ] Navbar shows hamburger menu; drawer opens/closes
- [ ] Support worker list table scrolls horizontally; less important columns hidden
- [ ] Client list table scrolls horizontally
- [ ] Login/Signup forms take 95% width
- [ ] Profile page: avatar overlaps banner correctly; buttons stack vertically
- [ ] BookingForm opens as full-screen dialog

---

## 22 · Encryption Smoke Check

- [ ] Send a message — backend DB / logs show content starting with `ENC:`
- [ ] Message renders as plain text in browser (decryption working)
- [ ] AI reply also stored encrypted but displays correctly
- [ ] System messages render without `[SYS]` prefix

---

## 23 · Deployment Checks

- [ ] https://suppova.com loads (tab title = "Suppova")
- [ ] Login works on live app (token-based auth, no cookie dependency)
- [ ] Google Maps autocomplete works in location fields
- [ ] Backend API at https://api.suppova.com responds (may take 50 s cold start on free tier)
- [ ] CORS — no `Access-Control-Allow-Origin` errors in console after login
- [ ] Forgot password email arrives (sent via Resend from `onboarding@resend.dev` or `noreply@suppova.com`)

---

## Automated Tests

```bash
cd support_app_frontend
npm test
```

237 tests across 22 suites — all should pass. Key coverage:

| Suite | What it tests |
|-------|--------------|
| `AuthContext` | Login, session persistence, role detection |
| `AvailabilitySelector` | Day/time selection, `formatAvailability` output, multi-window |
| `BookingForm` | Submit, edit, close, timezone offset |
| `ConversationView` | Message send, AI response, appointment actions |
| `Home` | Dashboard stats, edit/delete appointments |
| `InvitationsPage` | Approve/decline flow |
| `Navbar` | Conditional links, unread badge, logout |
| `SupportWorkerList` | Filters, location search, availability parsing |

---

## Limitations & Future Work

**Compliance & vetting**
- Police check and WWCC numbers are not verified against real registries — AI simulates a pass
- No document upload (scanned certificates)

**Payments**
- No payment system or NDIS billing

**Reviews**
- No rating/review system

**Scheduling**
- No live availability calendar or conflict detection

**Communication**
- In-app polling only (every 15 s); no push notifications or email for new messages

**Matching**
- Filter-based only; no algorithmic recommendation engine

**Regulatory**
- No NDIS plan management or mandatory incident reporting
