# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

### Messaging
- Conversation threads with chat-bubble UI, encrypted end-to-end using AES-256-GCM
- Messages are encrypted in the browser before leaving the client; the server stores only ciphertext
- Per-conversation keys derived via HKDF-SHA256 (IKM = fixed context string, info = `conv-{id}`) — cached in memory so repeated sends are fast
- The backend mirrors the same HKDF + AES-256-GCM derivation in Ruby/OpenSSL to decrypt messages before passing context to the AI, and encrypts AI replies before storing them
- System messages (appointment confirmations/declines) rendered inline with a distinct style; the `ENC:` prefix distinguishes encrypted messages from plaintext system messages
- Unread message badges in the navbar
- **AI chat simulation** — support workers can trigger an AI-simulated client reply; clients can trigger an AI-simulated support worker reply, including proactive appointment invitation JSON actions

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### Support worker profiles & list
- Profile page with editable fields, availability selector, and specialization chips
- Worker list formats availability from raw JSON into human-readable text (e.g. "Mon, Tue, Thu · Morning (06:00-12:00)")
- `AvailabilitySelector` component with preset time windows and day toggles; `formatAvailability` exported for reuse
- **Location filter** — geocodes the search address via Google Places API (New) using `AutocompleteSuggestion.fetchAutocompleteSuggestions` + `toPlace().fetchFields`, then filters workers by Haversine distance with an adjustable radius slider
- **Availability day filter** — `parseAvail` parses both JSON (`{"days":["Mon","Tue"...]}`) and free-form strings ("Weekdays", "Mon/Wed/Fri") so legacy data still filters correctly
- `LocationAutocomplete` component with session token management and an `onCoordinates` callback to avoid a redundant geocoding round-trip after the user selects a suggestion

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

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
