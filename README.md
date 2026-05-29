# Splitwise Clone (MERN Stack)

A simplified, premium-designed Splitwise clone built as a mobile-responsive web application using the MERN stack (MongoDB, Express, React, Node.js). 

This project was developed in partnership with **Antigravity** (Google DeepMind's advanced AI coding assistant).

---

## 🌟 Key Features
- **Dual Database Mode (Zero-Config):** Automatically attempts to connect to MongoDB. If MongoDB is not running locally, it seamlessly falls back to a JSON-file database (`db.json`), requiring zero setup from the evaluator.
- **Pre-Seeded Data:** Automatically seeds the database with the exact users, groups, and expenses shown in the assignment screenshots (e.g. Jaish Minocha, Sonia Minocha, David, Brooklyn S., Earl E.) so the dashboard matches the initial reference state immediately.
- **Account Selector:** Click "Sign in with Google" to switch between users instantly and test their relative balances.
- **Debt Netting:** Automatically calculates direct debts and nets them (e.g. A owing B and B owing A).
- **Responsive Premium UI:** Beautiful peach-to-sand sunset gradients, mobile app wrapper, custom icons, micro-animations, and styled forms.

---

## 🛠️ Setup & Running

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
- **Files Maintained:**
  - `AI_CONTEXT.md` - Complete technical decisions, models, and schemas.
  - `BUILD_PLAN.md` - Product research, scoping logic, and trade-offs.
