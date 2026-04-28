# Support App — Frontend

A full-stack portfolio project inspired by [Mable](https://mable.com.au), a platform that connects people living with disability to independent support workers. This project is personally meaningful — built by someone with cerebral palsy who understands the value of accessible, well-designed support services.

The backend Rails API lives in a separate repository: [support_app_backend](https://github.com/nils-vanderwerf/support_app_backend).

## What it does

- Clients can browse support workers, view their profiles, and book appointments
- Support workers can browse clients and book appointments with them
- Multi-step sign up flow with role selection (client or support worker)
- Session-based authentication with protected routes that persist across page refreshes
- Role-aware UI — booking buttons and views adapt based on who is logged in

## Tech stack

- **React** with TypeScript
- **Material UI** for components
- **Axios** for API requests
- **React Router** for navigation and protected routes
- **React Context + hooks** for auth state management
- **Jest + React Testing Library** for unit and component tests

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
