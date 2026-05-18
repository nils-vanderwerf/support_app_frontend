# Screenshot Checklist — Suppova LinkedIn Post

Live app: https://suppova.com  
Target: **13 slides** for a LinkedIn carousel PDF

---

## Before You Start

- [ ] Run `bundle exec rails db:seed` in Render shell (wipes old data, loads clean seed data)
- [ ] Then run the extra data script below (Slide 13 needs multiple pending appointments)
- [ ] Open app in **Chrome**, logged out, incognito window
- [ ] Set browser zoom to **90%** so more content fits without scrolling
- [ ] Hide bookmarks bar (`Cmd+Shift+B`)
- [ ] Window width: **1440px** (or maximised on a 1440p/Retina screen)

---

## Accounts

| Who | Email | Password |
|-----|-------|----------|
| Client | `elena.martinez@example.com` | `password123` |
| Client (pushback) | `raj.patel@example.com` | `password123` |
| Client (ASD) | `sophie.chen@example.com` | `password123` |
| Support Worker | `olivia.williams@example.com` | `password123` |
| Admin | `admin@example.com` | `password123` |

---

## Slide 1 — Hook (no screenshot needed)

Text only slide — create in Figma.

> "I built a full-stack NDIS support worker platform from scratch.  
> AI-assisted matching, encrypted messaging, and credential verification.  
> Here's what it looks like →"

---

## Slide 2 — Support Worker List

**Login as:** Elena  
**URL:** `/support-workers`

- [ ] No filters applied — all 8 workers visible with chips, location, availability days
- [ ] Screenshot the full table

**Bonus shot:** Type "Bondi" in the location filter → radius slider appears → only Olivia shown. Good second angle for this feature.

---

## Slide 3 — Support Worker Profile (Verified)

**Login as:** Elena  
**URL:** `/support-workers/:id` → click **Olivia Williams**

- [ ] **Police Check ✓** and **WWCC ✓** green chips visible
- [ ] Specializations: Elderly Care, Disability Support, Healthcare Support
- [ ] Bio paragraph, 7 years experience
- [ ] Message + Book Appointment buttons

---

## Slide 4 — Conversation: Warm Scheduling

**Login as:** Elena  
**URL:** `/messages` → open **Olivia Williams** thread

- [ ] Full back-and-forth visible — Olivia asks about location, Elena confirms
- [ ] **Purple system message** "✓ Appointment invitation sent for Wednesday at 10:00 AM" visible
- [ ] Scroll so the system message is in frame

Headline: *"AI-assisted scheduling — confirm appointments directly in chat"*

---

## Slide 5 — Conversation: Distance Decline

**Login as:** Elena  
**URL:** `/messages` → open **James Smith** thread

- [ ] James's opening message flagging ~900km distance visible
- [ ] Elena's reply: "Yeah that's way too far, thanks for being honest!"
- [ ] Keep the exchange tight — crop to just these 3–4 messages if needed

Headline: *"Distance-aware — workers flag when they're too far to commit"*

---

## Slide 6 — Conversation: Client Pushback

**Login as:** Raj (`raj.patel@example.com`)  
**URL:** `/messages` → open **James Smith** thread

- [ ] Raj pushes back: *"'Presenting challenges' — that's exactly the language I'm trying to avoid"*
- [ ] James course-corrects: *"You're right, I'm sorry. I'll drop the clinical hat."*
- [ ] Crop to just this exchange

Headline: *"Adaptive AI — adjusts when clients push back on tone"*

---

## Slide 7 — Appointments Page

**Login as:** Elena  
**URL:** `/appointments`

- [ ] **Upcoming** section visible with 3–4 rows, Approved chips (green)
- [ ] **Past Appointments** section below with 5 rows, Approved chips
- [ ] At least one **Pending** chip (orange) visible in upcoming
- [ ] No 0 min durations anywhere

Headline: *"Full appointment lifecycle — from invitation to history"*

---

## Slide 8 — Vetting Agent

**How to trigger:** Register a brand-new support worker account via `/signup`  
(name + email + password → Role: Support Worker → fill profile → submit)  
You'll be redirected to `/vetting` automatically.

- [ ] Vetting chat open — AI greeting visible
- [ ] At least one exchange showing AI asking for Police Check number
- [ ] Show a valid response being accepted (e.g. "PCK123456")
- [ ] Completion banner visible if you get that far — or just show mid-flow

Headline: *"AI-powered vetting — credentials checked before workers go live"*

> Tip: use a throwaway email like `newworker@test.com`

---

## Slide 9 — Booking Agent

**Login as:** Elena  
**URL:** `/appointments` → click **Book with AI**

- [ ] Chat dialog open
- [ ] Type: *"I'd like to book a weekly session with Olivia in Sydney"*
- [ ] AI responds with a suggested time and asks to confirm
- [ ] Shows the AI reasoning through date, time, and location

Headline: *"Book with AI — describe what you need, the agent handles the rest"*

---

## Slide 10 — Visit Reports Index

**Login as:** Olivia (`olivia.williams@example.com`)  
**URL:** `/reports`

Take **two shots** — one closed, one expanded:

**Shot A — overview:**
- [ ] Table visible with at least 2–3 report rows
- [ ] **Elena Martinez** shown in purple in the Client column
- [ ] Location and Activities (preview) columns visible
- [ ] **New Report** button top-right

**Shot B — expanded row:**
- [ ] Click the chevron on one row to expand it
- [ ] **Client** name in purple + **Date of Birth** visible in the detail panel
- [ ] Activities, Observations, Follow-up actions text all readable
- [ ] **Edit report** button visible at the bottom of the panel

Headline: *"Visit reports — full history, expandable detail, editable anytime"*

---

## Slide 11 — New Report: AI Draft

**Login as:** Olivia  
**URL:** `/reports` → click **New Report**

- [ ] Appointment picker dialog open — client filter + date range filter visible
- [ ] Select a past appointment (one without a report — not greyed out)
- [ ] Right-side **Visit Report** drawer opens with client name + date in header
- [ ] Click **"Generate draft with AI"** → watch fields populate
- [ ] Screenshot with Activities, Observations, Follow-up actions filled in

Headline: *"AI visit reports — generate a structured draft from appointment context"*

> Note: Appointments that already have a report show a **"Report submitted"** chip and are disabled in the picker — shows the system prevents duplicates.

---

## Slide 12 — Admin Dashboard

**Login as:** admin  
**URL:** `/admin`

> Seed data includes 2 pending applicants automatically — no extra console steps needed.

- [ ] Stats row: Approved Workers / Pending Review / Clients / Appointments this week
- [ ] **Pending Applications** tab — **Marcus Bell** and **Aisha Koroma** visible with Agent Recommendation chips
- [ ] Marcus: *"Approved — nursing background adds strong clinical credibility…"*
- [ ] Aisha: *"Conditionally approved — limited experience (2 years) but youth mental health focus is genuine…"*
- [ ] Chip text readable — shows AI doesn't just rubber-stamp everyone

Headline: *"Admin oversight — AI vetting recommendations for every applicant"*

---

## Slide 13 — Approve All (Recurring Invitations)

**Requires extra seed data — run this in the Render Rails console AFTER `db:seed`:**

```ruby
elena = Client.find_by!(first_name: 'Elena')
olivia = SupportWorker.find_by!(first_name: 'Olivia')
conv = Conversation.find_by!(client: elena, support_worker: olivia)

[
  { date: 3.weeks.from_now, notes: 'Weekly session — skills practice' },
  { date: 4.weeks.from_now, notes: 'Weekly session — community access' },
  { date: 5.weeks.from_now, notes: 'Weekly session — monthly review' },
].each do |d|
  Appointment.create!(
    client: elena, support_worker: olivia,
    date: d[:date], duration: 60,
    location: 'Surry Hills Community Centre',
    notes: d[:notes], status: 'pending',
    conversation_id: conv.id, initiated_by: 'support_worker'
  )
end
puts "Done — #{Appointment.where(status: 'pending', conversation_id: conv.id).count} pending in Elena/Olivia conv"
```

**Login as:** Elena (`elena.martinez@example.com`)  
**URL:** `/messages` → open **Olivia Williams** thread

- [ ] **Approve All (3)** purple button visible above the message window
- [ ] 3 individual Appointment Invitation cards below it, each with Approve / Decline buttons
- [ ] Message thread visible below the cards

Headline: *"One tap to confirm recurring sessions — approve all at once"*

---

## Bonus Shots (use if you have space)

| Shot | Login | URL / Action |
|------|-------|-------------|
| Client profile | Olivia | `/clients/:id` → Elena — shows health conditions, meds, emergency contact |
| Booking form modal | Elena | Support worker profile → Book Appointment |
| Invitations page | Olivia | `/invitations` — pending invite cards with Approve/Decline |
| Home dashboard (client) | Elena | `/` — upcoming appointments, stats, health summary |
| Home dashboard (SW) | Olivia | `/` — today's schedule, client count |
| Sophie ↔ Mei convo | Sophie | `/messages` → Mei — direct ASD communication style |
| Report picker dialog | Olivia | `/reports` → New Report — show client + date range filters, greyed-out "Report submitted" row |
| Edit report drawer | Olivia | `/reports` → expand row → Edit report — pre-filled fields, "Edit Report" title |

---

## Figma Assembly

1. Canvas: **1080×1080px** per slide, background `#1a0a2e` (dark purple)
2. Drop each screenshot into **Shots.so** first → browser frame, transparent background
3. Screenshot takes ~70% of canvas, centred
4. Headline text: top of frame, white, bold, ~34px
5. Slide number (small, bottom right): white, 14px, 40% opacity
6. Export all frames → **PDF** → upload to LinkedIn as a **Document post**

---

## LinkedIn Post Copy

```
I'm on the NDIS. I know this problem from the inside.

So I built the platform I wished existed — and shipped it in 8 weeks.

It's a full-stack NDIS support platform — clients find and book verified support workers, workers manage their schedule and document visits.

Under the hood:
→ Encrypted messaging with AI personas that adapt to each person's communication style
→ AI booking agent — describe what you need, it finds the right match
→ AI vetting — credentials checked before workers go live
→ AI-generated visit reports - draft, edit, and track from one page
→ Location-aware matching - workers push back if they're too far

The conversations in the demo are AI-to-AI — each person in a chat is a Claude persona built from real profile data. No real users needed to populate it.

It's still a work in progress — no document uploads, no payment or rate handling, no review system yet. Happy to hear feedback from anyone who knows the space.

Swipe to see it →

Link in comments

I'm based in Sydney and actively looking for a junior/mid software developer role. If you're hiring or know someone who is, I'd love to connect.

Tech: Rails API · React · Claude AI · PostgreSQL
Deployed: Render (API) · Vercel (frontend) · Resend (email) · suppova.com

#buildinpublic #rails #react #ndis #ai #softwaredevelopment #disability #sydneyjobs #hiring
```

*(Drop the live link in first comment — LinkedIn suppresses reach on posts with external URLs in the body, add both Github URLs too)*
