# Support App Frontend

## Design

**Primary colour:** `#7B2FBE` (flat purple, no gradient, no shadow)
- Used on the Navbar (`AppBar`)
- Applied as a global MUI theme colour when that is set up

## Booking Flow — In Progress (paused 2026-04-14)

### Completed
- Backend login response now returns `user`, `client`, and `support_worker` (see `Api::SessionsController#create`)
- `Client` model has `belongs_to :user`; `User` model has `has_one :client` and `has_one :support_worker`
- `user_id` added to `clients` and `support_workers` tables (nullable)

### Next steps
1. Finish `AuthContext.tsx` — define `Client` (use `name` not `first_name`/`last_name`) and `SupportWorker` interfaces, add them to context type and state
2. Update `Login.tsx` — change `response.data.success` to `response.data.user`, and also store `response.data.client` and `response.data.support_worker` in context
3. Build `BookingForm.tsx` — modal form collecting date, duration, location, notes; `support_worker_id` passed as prop, `client_id` from `AuthContext`; submits to `POST /api/appointments`
4. Wire `SupportWorker.js` → `BookingForm.tsx` — replace local `handleBook` with opening the form
5. Build `AppointmentList.tsx` — page at `/appointments` using `GET /api/appointments`
6. Add `/appointments` route in `App.tsx` and link in `Navbar`

## Architecture

- Navigation is handled by a top **Navbar** (`src/components/Navbar.tsx`), not a sidebar
- Auth state is managed via React Context (`src/context/AuthContext.tsx`)
- Protected routes use `SecureRoute` wrapper (`src/components/SecureRoute.tsx`)
