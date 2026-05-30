# Splitwise Clone (MERN Stack)

A simplified, premium-designed Splitwise clone built as a mobile-responsive web application using the MERN stack (MongoDB, Express, React, Node.js). 

This project was developed in partnership with **Antigravity** (Google DeepMind's advanced AI coding assistant).

---

## 🚀 Assignment Submission Deliverables

1. **Public Deployed App URL:** 
   - Deployed Frontend: [https://splitwise-jaish.vercel.app](https://splitwise-jaish.vercel.app) (Fallback: [https://splitwise-chitraksh.vercel.app](https://splitwise-chitraksh.vercel.app))
   - Deployed API Backend: [https://splitwise-backend.onrender.com](https://splitwise-backend.onrender.com)
2. **GitHub Repository:** [https://github.com/jaishmino5/splitwise-clone](https://github.com/jaishmino5/splitwise-clone)
3. **AI Development Collaborator:** Antigravity (Google DeepMind Advanced Agentic Coding)
4. **Source of Truth Context File:** [AI_CONTEXT.md](./AI_CONTEXT.md)
5. **Project Build Plan:** [BUILD_PLAN.md](./BUILD_PLAN.md)
6. **Key Development Prompts:** [PROMPTS.md](./PROMPTS.md)

---

## 🌟 Key Features & Scopes Built

- **Zero-Config Database Fallback:** The backend automatically connects to MongoDB Atlas/local server. If no database connection is found within 3 seconds, it seamlessly falls back to a local JSON-file database (`db.json`), requiring zero setup or installation for the evaluator.
- **Pre-Seeded Visual Alignment:** Seeds test users (Jaish Minocha, Sonia Minocha, David, Brooklyn S., Earl E.) and initial expenses to align perfectly with Splitwise guidelines on startup.
- **Account Switcher:** Instant multi-user testing. Click "Sign in with Google" to select any seeded profile and verify their relative net balances immediately.
- **1-Day Persistent Login Sessions:** Session tokens are stored in `localStorage` with a 24-hour expiration check, preventing logout on reload.
- **SPA Group Invite Routing:** Supports copyable `/join-group/:groupId` invitation links. Tapping a link auto-adds the logged-in user to the group database list and navigates them straight to the group details page.
- **Interactive Balances Accordions:** Inside any group, tap the **Balances** overlay to view detailed splits inside collapsible chevron drop-downs.
- **Totals Spending Ring:** Tap **Totals** to see total group spending and your calculated share represented inside an interactive blue SVG donut progress ring.
- **Collaborative Group Whiteboard:** Edit notes, emergency contacts, or trip agendas in a shared whiteboard editor persisted to the MongoDB group schema.
- **Record a Payment (Partial Settlements):** Settle debts by clicking "Record a payment". Supports **inline settlement editing** (e.g. paying $30 on a $70 debt), which dynamically recalculates and updates the remaining balance ($40) across all groups, transaction lists, and status cards.
- **Phone Contacts Book integration:** Tap `"Select from Phone Contacts Book"` on the Create Group or Non-group details page to select contacts. Utilizes the native Web Contacts Manager API on supported devices, with a custom overlay fallback for desktop browsers.

---

## 🛠️ Setup & Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- (Optional) [MongoDB](https://www.mongodb.com/) running locally. If not installed, the app will run in fallback JSON mode.

### 1. Run the Express Backend
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server in development mode:
   ```bash
   npm run dev
   ```
   *The server runs on http://localhost:5000 and will automatically seed the test data.*

### 2. Run the React Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the address shown in your terminal (typically `http://localhost:5173`).

---

## 🤖 AI Collaboration Details

- **Primary AI Agent:** Antigravity (Google DeepMind)
- **Role:** Acting as both Product Manager and Junior Developer.
- **Initial Context & Interview Prompt:**
  *"You are a junior engineer helping me complete an internship assignment. The assignment is to reverse engineer Splitwise, scope a realistic 3-day version, and build a working deployed app. Do not assume product requirements..."* (full prompt inside [AI_CONTEXT.md](./AI_CONTEXT.md)).
- **Key Scoping Prompts Used:**
  - Scoped MERN-stack architecture with a JSON-fallback mechanism for grading stability.
  - Implemented custom React state-routing to avoid client-side refresh issues.
  - Resolved asynchronous Contact Picker lags by synchronizing picker modes using React Refs.
  - Wired dotenv configuration sequences at the top of the backend startup file to fix Atlas cloud persistence.
