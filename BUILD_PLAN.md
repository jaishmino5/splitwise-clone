# Build Plan: Splitwise Clone

This build plan outlines the product scope, research findings, architectural designs, AI collaboration processes, and trade-offs that guided the development of the Splitwise Clone application.

---

## 1. Product Research

### How We Studied Splitwise
We reverse-engineered Splitwise by analyzing its user interface flows, transaction calculations, and database structures:
1. **Layout Design:** Studied Splitwise’s layout styles, identifying its dark landing/auth themes and light-themed dashboards with sunset-peach headers.
2. **Transaction Netting:** Explored how transactions are grouped and calculated mutually (if Alice owes Bob $10 and Bob owes Alice $5, it resolves to Alice owing Bob $5).
3. **Debt Settlements:** Analyzed the "Settle Up" mechanism, identifying that partial settlements must reduce running balances dynamically without closing the debt relationship.

### Key Workflows Identified
- Multi-user authentication & Google OAuth integrations.
- Creating groups and inviting members via shareable URLs.
- Logging group expenses and auto-calculating equal splits.
- Recording settlements (full or partial) and recalculating debts instantly.
- Viewing total spending summaries with SVG progress rings.
- Writing notes/emergency contacts on a group whiteboard.

### Product Assumptions Made
- Evaluators want an out-of-the-box working application. Thus, we built an automatic 3-second database fallback to a local JSON file db (`db.json`) if MongoDB Atlas is down.
- Evaluators want to test mutual balances without creating multiple accounts. Thus, we built an account switcher mockup inside the Google Auth modal.

---

## 2. Final Scope & Deliverables

### In-Scope (What We Built)
- **User Authentication:** Email signup/login (with `bcryptjs` hashing) + Google OAuth token verification + 1-day persistent session state.
- **Group Management:** SPA invite links (`/join-group/:groupId`) + custom group types (Trip, Home, Couple, Other) + collaborative note whiteboard.
- **Expense splitting & Settle Up:** Standard equal splits + partial settlement editing.
- **Rich Interfaces:** Sunset gradient headers + custom beach sand SVG backgrounds + collapsible balances accordions + SVG Totals progress donut.
- **Mobile Contacts Picker:** Web Contacts API (`navigator.contacts`) on mobile + custom desktop friend selector fallback.
- **Zero-Config Fallback:** Database connection fallback to `db.json` on local/cloud connection failures.

### Out-of-Scope (What We Excluded)
- **Custom Splits:** Percentage splits, custom shares, or itemized adjustment ratios (equal splits only).
- **Multi-currency Support:** Limited to USD ($) to keep balance aggregations simple.
- **Image receipt OCR uploads:** Processing receipts via image uploads.
- **Recurring transactions:** Automating monthly recurring bill payments.

### Why This is Achievable in 3 Days
By scoping out custom splits, image OCR, and recurring bills, we kept the core database models lean. Utilizing a single-file React client (`App.jsx`) and a simplified state routing mechanism eliminated client-side routing library compilation errors and allowed us to focus on CSS animations and the complex netting logic.

---

## 3. Architecture & Tech Stack

### Tech Stack & Core Libraries Used
The system is built on a decoupled Client-Server architecture utilizing the following packages:
- **Frontend Dependencies:**
  - `react` (v19.1.0) & `react-dom` (v19.1.0) - Virtual DOM layout managers.
  - `lucide-react` (v1.17.0) - High-fidelity visual icons.
  - `@vitejs/plugin-basic-ssl` (v2.3.0) - Vite plugin to serve local https, allowing Contacts Manager API to run.
- **Backend Dependencies:**
  - `express` (v4.21.1) - Router handling RESTful API requests.
  - `cors` (v2.8.5) - Resolves cross-origin resource requests.
  - `dotenv` (v16.4.5) - Environment loader.
  - `bcryptjs` (v2.4.3) - Safely hashes password values.
  - `google-auth-library` (v10.6.2) - Performs server-side validation of Google credential tokens.
  - `mongoose` (v8.8.2) - Mongoose database object schema manager.
  - `jsonwebtoken` (v9.0.2) - JSON web token tools (pre-packaged).

### Database Schema
We designed four core relational models:
- **User:** name, email, password, avatarUrl, and friends list array.
- **Group:** name, description, members list array, and whiteboard text notes.
- **Expense:** description, total amount, paidBy reference, split user objects list, and owed amounts.
- **Settlement:** group reference, fromUser, toUser, and payment amount.

### API Design
We exposed structured REST APIs:
- `/api/auth/signup` and `/api/auth/login` (Standard Auth).
- `/api/auth/google` (Google OAuth Validation).
- `/api/users/:userId/friends` (Retrieves friends and populates mutual debt balances).
- `/api/groups` and `/api/groups/:id` (Manages groups, balances, and whiteboard metadata).
- `/api/expenses` and `/api/settlements` (Logs expenses and settlements, adjusting balances).
- `/api/dashboard/balances` and `/api/activity` (Aggregates overview totals and activity logs).

### Frontend Structure & Persistent Sessions
- **Vite React Client:** Clean asset configuration serving index.html.
- **`App.jsx`:** Modular UI screens styled via dynamic CSS variables, utilizing conditional page rendering for state transitions.
- **`index.css`:** Tailored container system mimicking a premium mobile app frame on desktop devices.
- **Persistent Sessions (localStorage wrapper):** Stores the authenticated user context (`splitwise_session_user`) alongside an authentication timestamp (`splitwise_session_timestamp`). On reload, the client evaluates whether less than 24 hours have elapsed. If valid, the session is rehydrated automatically, bypassing standard landing views. Otherwise, localStorage is cleared and standard login is requested.

---

## 4. AI Collaboration Process

### How We Instructed the AI
We initiated the project using the required prompt, instructing the AI (Antigravity) to act as a junior developer who must ask structured product questions instead of assuming requirements.

### Questions Asked & How the PM/Developer Answered
- **AI Question:** Should we support percentage splits?
  - *Answer:* No, keep splits equal to ensure the MVP is completed within 3 days.
- **AI Question:** How do we handle database access for evaluators who don't have MongoDB installed?
  - *Answer:* Build an adapter fallback in `db.js`. If Mongoose fails to connect within 3 seconds, write and read data using a local `db.json` file.
- **AI Question:** How do we test mutual debts quickly?
  - *Answer:* Build an account selector inside the Google sign-in view pre-populated with seeded user profiles (Jaish, Sonia, David, Brooklyn, Earl) with their guideline balances.

### How the Plan Evolved
As development progressed, the deployment on Render free-tier introduced database timeouts and cold-start spins. We adjusted the Mongoose connection timeout options (`serverSelectionTimeoutMS: 3000`) and placed our local JSON-fallback layer as a resilient wrapper around all DB methods. When testing on desktop browsers, the Contacts Picker API was unavailable, prompting us to add an automatic feature detection fallback that shows a custom manual friend input dialog.

---

## 5. Tradeoffs & Simplifications

### What We Simplified
- **Google Authenticator:** We implemented a mock account chooser dialog for seeded profiles to allow instant multi-user switching, while standard registrations use cryptographically secure random password generations with real token checks.
- **React State Routing:** Instead of installing `react-router-dom`, we built page transitions using standard React page state variables. This prevented 404 rewrite crashes when hosted as a single-page app (SPA) on Vercel.

### What We Hardcoded
- **Seeded User Profiles:** Seeded standard profiles matching the guide balances to provide an immediate visual representation of Splitwise's netting algorithms upon first launch.
- **Single Currency:** All calculations assume USD ($) only.

### What We Avoided
- **Third-party CSS Frameworks:** We avoided TailwindCSS, choosing vanilla CSS variables inside `index.css` to gain absolute layout control and create a customized splitscreen glassmorphism look.
- **Cloud Image Storage:** Avatars are rendered using SVG seeds from Dicebear instead of hosting media uploads.

### What We Would Improve with More Time
- **Custom Split Types:** Add input sliders for customized percentages, itemized breakdowns, and exact share divisions.
- **State Navigation Preservation:** Implement URL hash tracking for sub-screens so page reloads do not return the user to the default Dashboard view.
