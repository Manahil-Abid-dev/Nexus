# Nexus Platform — Architecture & Setup Notes (Week 1)

## 1. Stack

| Layer | Choice |
|---|---|
| Build tool | Vite 5 |
| Framework | React 18 + TypeScript |
| Routing | React Router v6 |
| Styling | Tailwind CSS 3 |
| State | React Context (`AuthContext`) + local component state; mock data acts as an in-memory "database" |
| Icons | lucide-react |
| Notifications | react-hot-toast |
| Dates | date-fns |
| Calendar UI (new) | react-calendar |

There is no backend — the app is a fully client-side prototype. "Persistence" is simulated with `localStorage` (current session user) and in-memory arrays in `src/data/*` that are mutated directly (no real API calls).

## 2. Folder structure

```
src/
├── App.tsx                # Route table, wraps everything in AuthProvider
├── main.tsx                # React root
├── index.css                # Tailwind directives + global overrides
├── context/
│   └── AuthContext.tsx     # Mock auth: login/register/logout/profile update, persisted to localStorage
├── types/
│   └── index.ts             # All shared TS interfaces (User, Investor, Entrepreneur, Message, CollaborationRequest, AvailabilitySlot, MeetingRequest, ...)
├── data/                     # Mock "database" + query/mutation helper functions
│   ├── users.ts
│   ├── messages.ts
│   ├── collaborationRequests.ts
│   ├── availability.ts      # NEW — availability slots
│   └── meetings.ts          # NEW — meeting requests
├── components/
│   ├── ui/                   # Design-system primitives: Button, Card, Badge, Input, Avatar
│   ├── layout/                # Navbar, Sidebar, DashboardLayout (auth-gated shell)
│   ├── chat/, collaboration/, investor/, entrepreneur/, calendar/  # Feature-specific presentational components
├── pages/
│   ├── auth/                  # Login, Register, Forgot/Reset password
│   ├── dashboard/             # EntrepreneurDashboard, InvestorDashboard
│   ├── profile/, investors/, entrepreneurs/, messages/, notifications/, documents/, deals/, settings/, help/, chat/
│   └── calendar/              # NEW — CalendarPage (Milestone 2)
```

### Routing model
`App.tsx` defines two kinds of routes:
- Public: `/login`, `/register`
- Protected: everything else is nested under `<DashboardLayout />`, which checks `useAuth()` and redirects to `/login` if unauthenticated. Each protected route renders inside `<Outlet />` alongside a shared `Navbar` + `Sidebar`.

### State model
`AuthContext` is the only global store. It exposes the current `user`, auth actions, and `isAuthenticated`/`isLoading` flags. Every other page reads/writes directly from the mock `data/*` modules and keeps its own local `useState`, re-rendering via a manual refresh counter where needed (see `CalendarPage`) since there's no shared store like Redux/Zustand.

### Role-based UI
`UserRole` is `'entrepreneur' | 'investor'`. Both `Sidebar` and the dashboards branch on `user.role` to show different navigation items and content — this is the pattern to follow for Milestone 6's role-based dashboards.

## 3. UI theme (Milestone 1)

The repo already ships a fairly complete design system, so Week 1 work was to **audit, confirm, and extend it** rather than build one from scratch:

- **Colors** — `tailwind.config.js` defines `primary` (blue), `secondary` (teal), `accent` (amber), plus `success`/`warning`/`error` semantic scales (50/500/700 shades). All feature work should reuse these tokens instead of raw Tailwind grays/blues.
- **Typography** — Inter (`Inter var`) is loaded globally via `index.html` (`rsms.me/inter`) and set as the default `font-sans`.
- **Spacing / radius / shadows** — components consistently use `rounded-md`/`rounded-lg`, `shadow-md` on cards, and Tailwind's default spacing scale — no custom spacing scale needed.
- **Responsive grid** — pages use Tailwind's responsive grid utilities (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3/4`), and the shell (`DashboardLayout`) hides the sidebar under `md` and relies on the Navbar's mobile menu.
- **Animation** — two custom keyframes (`fade-in`, `slide-in`) are defined for page/element transitions and used across pages (`animate-fade-in`).

No breaking theme changes were made — new features (calendar) reuse the existing `Card`, `Button`, `Badge`, `Input`, `Avatar` primitives and color tokens so the whole app stays visually consistent. The one addition was theming the third-party `react-calendar` widget (see `src/index.css`) to match the existing primary/accent palette instead of its default plain styling.

## 4. Milestone 2 — Meeting Scheduling Calendar

New types added to `src/types/index.ts`:
- `AvailabilitySlot` — a user-owned open time slot (`date`, `startTime`, `endTime`, `isBooked`).
- `MeetingRequest` — a request from one user to book another user's slot, with `status: 'pending' | 'accepted' | 'declined' | 'cancelled'`.

New mock data modules (mirroring the existing `collaborationRequests.ts` pattern of "array + helper functions"):
- `src/data/availability.ts` — `getAvailabilityForUser`, `getOpenSlotsForUser`, `addAvailabilitySlot`, `removeAvailabilitySlot`, `setSlotBooked`.
- `src/data/meetings.ts` — `getMeetingsForUser`, `getIncomingRequestsForUser`, `getSentRequestsForUser`, `getConfirmedMeetingsForUser`, `createMeetingRequest`, `updateMeetingStatus`.

New UI:
- `src/pages/calendar/CalendarPage.tsx` (route: `/calendar`, added to the sidebar for both roles) — a month calendar (react-calendar) with dots marking days that have availability or confirmed meetings, an "Add availability" form for the selected day, and three lists: **Incoming Requests** (accept/decline), **Sent Requests** (cancel), and **Confirmed Meetings**.
- `src/components/calendar/MeetingRequestCard.tsx` — reusable card for a meeting request, mirroring `CollaborationRequestCard`'s look/feel and action buttons.
- Both dashboards (`EntrepreneurDashboard`, `InvestorDashboard`) now show a live "Upcoming Meetings" count and a short list of confirmed meetings, replacing the previous hardcoded placeholder value.

## 5. Week 2 — Video Calling & Document Chamber

### Milestone 3 — Video Calling Section (`/call/:userId`)

- `src/pages/call/VideoCallPage.tsx`, reachable from the Phone/Video buttons in `ChatPage`'s header.
- Uses real browser WebRTC media APIs (`navigator.mediaDevices.getUserMedia` / `getDisplayMedia`) to capture the local camera/mic and screen — there's no signaling server or peer connection, so the "remote" participant is a simulated tile (the other user's avatar + a connecting → connected state machine + call timer), which matches the brief's "frontend mock" scope.
- Features: start/end call, mute/unmute mic, camera on/off, screen share toggle (auto-reverts if the browser's native "stop sharing" is used), and a graceful fallback message if camera/mic permission is denied so the UI is still explorable.

### Milestone 4 — Document Chamber (`/document-chamber`)

- New types in `src/types/index.ts`: `DealDocument`, `DealDocumentStatus` (`'Draft' | 'In Review' | 'Signed'`).
- `src/data/dealDocuments.ts` — mock data + `getDocumentsForUser`, `addDealDocument`, `updateDocumentStatus`, `signDealDocument`, following the same array + helper-function pattern as the other `data/*` modules.
- `src/components/ui/Modal.tsx` — new generic modal primitive (didn't exist yet), used for both the upload dialog and document preview/signing.
- `src/components/documents/SignaturePad.tsx` — canvas-based e-signature mockup (`react-signature-canvas`) with clear/confirm.
- `src/components/documents/DealDocumentCard.tsx` — one document's card: preview (inline for PDFs/images uploaded in-session via `URL.createObjectURL`, download otherwise), status badge, and a "Send for Review" / "Sign Document" action that walks the doc through `Draft → In Review → Signed`.
- `src/pages/documents/DocumentChamberPage.tsx` — three-column board (Draft / In Review / Signed), an upload modal (react-dropzone) that requires picking which counterpart (investor/entrepreneur) the document is shared with before accepting a file.
- Kept separate from the pre-existing generic `/documents` page (personal file storage) since the brief specifically asks for a deal/contract-focused chamber; both are now in the sidebar for both roles.

## 6. Week 3 — Payments, Security & Final Polish

### Milestone 5 — Payment Section (`/wallet`)

- New types: `Transaction`, `TransactionType` (`'deposit' | 'withdrawal' | 'transfer' | 'funding'`), `TransactionStatus`.
- `src/data/wallet.ts` — per-user mock balances + `getBalance`, `getTransactionsForUser`, `deposit`, `withdraw`, `transfer`, `fundDeal` (investor → entrepreneur transfer, tagged distinctly for the UI/history).
- `src/pages/wallet/WalletPage.tsx` — Stripe/PayPal-styled balance card, Deposit/Withdraw/Send (or "Fund a Deal" for investors) actions via the shared `Modal`, and a transaction history table (type, amount, sender, receiver, status, date). The "Send" flow auto-detects investor → entrepreneur transfers and books them as `funding` instead of a plain `transfer`.
- Both dashboards now show a live Wallet Balance card linking to `/wallet`.
- Everything here is a simulation — no real payment rails are involved, per the brief.

### Milestone 6 — Security & Access Control

- `src/components/security/PasswordStrengthMeter.tsx` — length/case/digit/symbol heuristic, rendered live under the password field on `RegisterPage` and the "New Password" field in `SettingsPage`.
- **Multi-step login (2FA mockup)** — `LoginPage` now has two steps: credentials → a 6-digit OTP input (auto-advancing boxes, backspace support). The mock code is displayed on-screen for demo purposes (`123456`); entering `000000` demonstrates the invalid-code error path. No real OTP is sent (no backend), consistent with the "mockup" scope in the brief.
- `SettingsPage`'s Two-Factor Authentication toggle is now stateful (Enable/Disable flips a badge + button), since it was previously a static, non-interactive placeholder.
- **Role-based UI** — already existed in the sidebar/dashboards; extended it in `Navbar` with a role badge (Investor/Entrepreneur) next to the user's name so the active role is always visible, not just inferable from which dashboard loaded.

### Milestone 7 — Integration & Demo Prep

- All new modules (Calendar, Document Chamber, Wallet) are in the sidebar for both roles; Video Call is reachable from Chat.
- **Guided walkthrough** — `src/components/tour/GuidedTour.tsx` (react-joyride) highlights Dashboard → Calendar → Document Chamber → Wallet. It auto-runs once per browser (tracked via `localStorage`) and can be replayed anytime via the new "Take a tour" button in the Navbar (desktop + mobile menu).
- **Responsive pass** — every new page (Calendar, Document Chamber, Wallet, Video Call) uses the same `grid-cols-1 md:… lg:…` pattern as the rest of the app, and the transaction table scrolls horizontally on narrow screens instead of overflowing.
- **Demo prep** — see `DEMO_SCRIPT.md` for a suggested walkthrough order and talking points for the recorded demo video (recording itself needs a screen-capture tool on your end, not something this environment can produce).

## 7. Running locally

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build to dist/
```

## 8. Deliverables

- GitHub repo: https://github.com/Asakusa-k/Nexus (fork, with Week 1 + Week 2 + Week 3 changes)
- Vercel deployment: redeploy from the fork (base project already has `vercel.json`)
- Demo video/presentation: recorded separately following `DEMO_SCRIPT.md`
