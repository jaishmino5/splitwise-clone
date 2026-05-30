# AI Context: Splitwise Clone (Source of Truth)

This document is the absolute source of truth for the Splitwise Clone application. It compiles the product specifications, architecture designs, data models, API endpoints, user stories, implementation logs, testing workflows, and the complete AI collaboration context. 

---

## 1. Product Understanding & Core Workflows

Through reverse-engineering the core functionality of Splitwise, we identified the following critical product behaviors:
- **Shared Group Expenses:** Group members split costs. The application must calculate individual shares, track who paid what, and aggregate total group spending.
- **Dynamic Netting of Debt:** Instead of every transaction being settled individually, debts within a group are netted. If Alice owes Bob $10 and Bob owes Alice $5, the system nets this so Alice owes Bob $5.
- **Multi-Group Aggregation:** A user's total dashboard balance ("You owe $X" / "You are owed $Y") represents the sum of their net balances across all groups.
- **Settlement Recording:** Settle-up operations must support partial payments (e.g., paying off $30 of a $70 debt), reducing the outstanding balance dynamically without forcing a zero balance.

---

## 2. Product Scope & User Stories

### MVP Scope (In-Scope)
- **Multi-user Selection (Seeded Profiles):** A Google Account chooser simulator pre-seeded with test profiles to allow examiners to switch between users and immediately test debt calculations.
- **Secure Authentication:** Standard email/password registration and login with secure hashing (`bcryptjs`) alongside real Google OAuth token verification.
- **Persistent Sessions:** 1-day persistent login sessions wrapped via React state and `localStorage`.
- **Group Management:** Creation of groups with custom types (Trip, Home, Couple, Other) and custom metadata.
- **Invite Link Routing:** Copyable share links (`/join-group/:groupId`) that automatically add authenticated users to a group.
- **Expense Creation & Equal Splits:** Adding expenses inside groups with auto-calculated equal splits.
- **Partial Settle Up:** Recording payments of any value that reduce the mutual debt between two group members.
- **Spending Summary & SVG Progress Donut:** Visualizing total spent and individual shares using an interactive SVG donut chart.
- **Collapsible Balances Accordions:** Slide-down dropdown list detail card to view exact splits.
- **Collaborative Notes Whiteboard:** Shared group whiteboard persisted to the group schema.
- **Contacts Book Picker:** Native Web Contacts API (`navigator.contacts.select`) for mobile browsers, with a custom desktop fallback dialog.
- **Zero-Config Database Fallback:** Automatic switch to a local JSON file database (`db.json`) if MongoDB Atlas fails.

### Out of Scope (For Future Development)
- **Custom Split Ratios:** Percentages, shares, or exact amount adjustments (currently equal splits only).
- **Multi-Currency Support:** Fixed to USD ($).
- **Receipt Image Uploads:** OCR scan for receipts.
- **Recurring Expenses:** Scheduled monthly bills.

### User Stories
1. **As a registered user,** I want to log in securely with my email and password or use my Google account, so that my personal expenses are kept secure.
2. **As a group member,** I want to create a group and invite others via a shared link, so that we can easily log shared expenses.
3. **As a trip participant,** I want to record an expense and split it equally among all members, so that everyone's balance is recalculated immediately.
4. **As a debtor,** I want to record a partial settlement (e.g. paying $30 of a $100 debt) and see the remaining balance decrease to $70, so that our running balances are always accurate.
5. **As an examiner,** I want the database to work out of the box without complex local database installations, so that I can evaluate the application instantly.

---

## 3. Database Schema

The system uses a relational MongoDB layout (implemented via Mongoose), with an identical structures replicated in the JSON fallback database (`db.json`):

```javascript
// 1. User Schema
{
  _id: ObjectId | String, // Unique Identifier
  name: String,           // Full Name
  email: String,          // Unique Email address
  password: String,       // Hashed password (bcryptjs)
  avatarUrl: String,      // User avatar thumbnail link
  friends: [ObjectId]     // Array referencing User._id (Mutual relationships)
}

// 2. Group Schema
{
  _id: ObjectId | String,       // Unique Identifier
  name: String,                 // Group Name
  description: String,          // Type-based metadata description
  members: [ObjectId],          // Array referencing User._id
  whiteboard: String,           // Shared markdown/notes whiteboard text
  createdAt: Date | String      // Group creation timestamp
}

// 3. Expense Schema
{
  _id: ObjectId | String,       // Unique Identifier
  description: String,          // Description of the expense
  amount: Number,               // Total amount paid
  paidBy: ObjectId,             // Referencing User._id (The payer)
  group: ObjectId,              // Referencing Group._id
  splits: [{
    user: ObjectId,             // Referencing User._id
    owedAmount: Number          // The exact share this user owes
  }],
  createdAt: Date | String      // Date added
}

// 4. Settlement Schema
{
  _id: ObjectId | String,       // Unique Identifier
  group: ObjectId,              // Referencing Group._id
  fromUser: ObjectId,           // Referencing User._id (The debtor paying)
  toUser: ObjectId,             // Referencing User._id (The payee receiving)
  amount: Number,               // The amount settled
  createdAt: Date | String      // Timestamp of settlement
}
```

---

## 4. API Design

### Authentication Endpoints
- **`POST /api/auth/signup`**
  - **Description:** Registers a new user account. Hashes password using `bcryptjs`.
  - **Request Body:** `{ name, email, password }`
  - **Response (201):** `{ _id, name, email, avatarUrl, isNewUser: true }`
- **`POST /api/auth/login`**
  - **Description:** Authenticates standard users.
  - **Request Body:** `{ email, password }`
  - **Response (200):** `{ _id, name, email, avatarUrl, friends: [...] }`
- **`POST /api/auth/google`**
  - **Description:** Verifies Google ID token, logs in user, or registers new user with a random password.
  - **Request Body:** `{ token }`
  - **Response (200):** `{ _id, name, email, avatarUrl, isNewUser }`

### Users & Friends Endpoints
- **`GET /api/users`**
  - **Description:** Lists all registered users (used for selectors).
  - **Response (200):** `[{ _id, name, email, avatarUrl }]`
- **`PUT /api/users/:userId`**
  - **Description:** Updates profile settings (name, email, avatarUrl).
  - **Request Body:** `{ name, email, avatarUrl }`
  - **Response (200):** Updated user object.
- **`GET /api/users/:userId/friends`**
  - **Description:** Retrieves user's friends list populated with dynamic friend-to-friend net balances.
  - **Response (200):** `[{ _id, name, email, balance: { owe, owed, netBalance, type, text } }]`
- **`POST /api/users/:userId/friends`**
  - **Description:** Adds a friend by name and optional email (creates shadow user if not registered).
  - **Request Body:** `{ name, email }`
  - **Response (201):** Friend user object with balance metadata.

### Groups Endpoints
- **`GET /api/groups?userId=X`**
  - **Description:** Lists all groups that the user is a member of, populated with the user's status in each.
  - **Response (200):** `[{ _id, name, description, members, currentUserStatus: { text, amount, type, owesTo, owedBy } }]`
- **`GET /api/groups/:id?userId=X`**
  - **Description:** Retrieves group details, member balances, net debts, and current user status.
  - **Response (200):** `{ group, balances: [...], netDebts: [...], currentUserStatus }`
- **`POST /api/groups`**
  - **Description:** Creates a new group.
  - **Request Body:** `{ name, description, members }`
  - **Response (201):** New Group object.
- **`PUT /api/groups/:id`**
  - **Description:** Updates group details, members list, or whiteboard text notes.
  - **Request Body:** `{ name, description, members, whiteboard }`
  - **Response (200):** Updated Group object.

### Expenses & Settlements Endpoints
- **`GET /api/expenses?groupId=X`**
  - **Description:** Lists expenses for a group, sorted newest first.
  - **Response (200):** `[{ _id, description, amount, paidBy, group, splits, createdAt }]`
- **`POST /api/expenses`**
  - **Description:** Creates an expense with auto-calculated equal splits.
  - **Request Body:** `{ description, amount, paidBy, group, splitUserIds, createdAt }`
  - **Response (201):** Saved Expense object.
- **`GET /api/settlements?groupId=X`**
  - **Description:** Lists settlements recorded in a group.
  - **Response (200):** `[{ _id, group, fromUser, toUser, amount, createdAt }]`
- **`POST /api/settlements`**
  - **Description:** Records a settlement, adjusting mutual debts.
  - **Request Body:** `{ group, fromUser, toUser, amount }`
  - **Response (201):** Saved Settlement object.

### Dashboard Balance Endpoints
- **`GET /api/dashboard/balances?userId=X`**
  - **Description:** Aggregates overall net balance, total owe, and total owed across all groups.
  - **Response (200):** `{ totalOwe, totalOwed, netBalance, text, details: [{ groupId, groupName, status }] }`
- **`GET /api/activity?userId=X`**
  - **Description:** Gets chronological history of expenses, settlements, and group creation.
  - **Response (200):** Sorted activities array.

---

## 5. Frontend Structure, Libraries & Session Details

### Technology Stack & Libraries Directory
The application relies on key external dependencies to manage security, icon render states, backend services, and local SSL server hosting.
- **Frontend Dependencies:**
  - `react` (v19.1.0) & `react-dom` (v19.1.0) - UI construction core.
  - `lucide-react` (v1.17.0) - High-fidelity icons (Plus, Users, DollarSign, etc.).
- **Frontend Development Tools:**
  - `vite` (v6.3.5) - Project build environment and packaging.
  - `@vitejs/plugin-react` (v4.4.1) - React fast refresh support.
  - `@vitejs/plugin-basic-ssl` (v2.3.0) - Serves Vite local dev server over secure HTTPS, enabling native Web Contacts API calls (`navigator.contacts`) during local mobile testing.
  - `eslint` (v9.25.0) - Coding standard compliance.
- **Backend Dependencies:**
  - `express` (v4.21.1) - HTTP request router routing REST APIs.
  - `cors` (v2.8.5) - Multi-origin resource policy middleware.
  - `dotenv` (v16.4.5) - Cloud environment configuration parser.
  - `bcryptjs` (v2.4.3) - Blowfish cryptographically secure password hashing for signup validation.
  - `google-auth-library` (v10.6.2) - Google Identity Services client verification, decodes and validates Google JWT authentication claims on the backend.
  - `mongoose` (v8.8.2) - Mongoose ODM connecting Atlas DB clusters.
- **Backend Development Tools:**
  - `nodemon` (v3.1.7) - File system monitor auto-reloading API servers on save.

### Persistent Login Session Architecture
To provide a smooth, persistent user experience that mimics real mobile apps, we implemented a custom session validation system in `frontend/src/App.jsx`:
1. **Token/User Storage:** Upon successful signup, standard login, or Google token authentication, the backend returns the user object. The client React app stores this user object in the browser’s `localStorage` under the key `splitwise_session_user`.
2. **Timestamp Validation:** Simultaneously, the client logs a millisecond timestamp of the authentication epoch in `localStorage` under `splitwise_session_timestamp`.
3. **Session Rehydration:** When the user visits the app, a React state initializer checks `localStorage` for both keys. If present, it computes the time difference: `const elapsed = Date.now() - parseInt(savedTimestamp, 10)`.
4. **Session Expiry Rule:**
   - **Session Valid (< 24 Hours):** If `elapsed` is less than `24 * 60 * 60 * 1000` ms (1 day), the state rehydrates the user object, bypasses the Landing Screen, and routes them straight to the `dashboard` view.
   - **Session Expired (>= 24 Hours):** If `elapsed` is greater than or equal to 24 hours, the client automatically wipes both keys from `localStorage` and routes the user to the `landing` screen for secure re-login.

### Theme & Colors
The application uses two visually distinct themes:
1. **Dark Charcoal Theme (Auth/Landing Screen):** Designed with deep charcoal colors (`#18191b`), frosted glass inputs, and neon orange/teal accents.
2. **Light Peach/Orange Theme (Dashboard):** Features a vibrant sunset gradient header, soft backgrounds, custom SVG beach sand illustration vector art, and distinct semantic alerts:
   - Green (`#108573`): You are owed / Settled up.
   - Orange (`#ff652f`): You owe.

### CSS Custom Variables
```css
--font-display: 'Outfit', sans-serif;
--font-body: 'Inter', sans-serif;
--primary-teal: #108573;
--accent-orange: #ff652f;
--color-owe: #ff652f;
--color-owed: #108573;
--bg-main: #f8fafc;
--dark-bg: #18191b;
```

---

## 6. Implementation Decisions & Changes Made

During implementation, we made specific adjustments to fit the 3-day timeline while ensuring security and reliability:

- **JSON File Database Fallback (`db.json`):** Created a hybrid db layer in `backend/db.js`. On start, the server attempts connection to MONGODB_URI. If connection fails or times out (after 3 seconds), it dynamically wraps database operations in standard Node file-read/write calls to `db.json`, pre-seeding the database in either scenario.
- **State-Based Navigation:** Chose React page state management inside `frontend/src/App.jsx` instead of React Router to bypass client-side page reload crashes (404s) commonly found on static hosting environments like Vercel.
- **Asynchronous Contacts Picker Sync:** Mobile Contacts Picker (`navigator.contacts`) operations run asynchronously. We implemented `contactsPickerModeRef` inside a React Ref rather than component state to prevent stale-closure state bugs during multi-step contact creations.
- **Inline Amount Settlement Editing:** Enabled partial settlements. Clicking "Settle Up" exposes an inline numeric edit input with a dashed underline. Changing this value recalculates the balance in real-time, sending a custom payment payload to the server.

---

## 7. AI Collaboration Prompts & Responses

Below is the initial PM interview exchange used to align on scope and technical implementation:

### Initial Developer Prompt
> "You are a junior engineer helping me complete an internship assignment. The assignment is to reverse engineer Splitwise, scope a realistic 3-day version, and build a working deployed app. Start by interviewing me. Ask questions across all scope areas."

### Junior AI Engineer Interview Questions
1. **MVP Scope:** Do we need custom ratios (percentage, shares) or is equal splits enough?
2. **Database Fallback:** Should the application run if MongoDB Atlas fails or isn't installed?
3. **Seeded Data:** What are the exact default values and users to match the assignment guidelines?
4. **Google Sign-In:** Should Google login be fully functional or mock-capable for evaluators?
5. **Partial Settlements:** Can users record custom payment amounts to partially settle a balance?
6. **Contacts Picker:** How should we handle importing friends from mobile device contacts?

### PM / Developer Response
1. **Scope:** Keep splitting equal only. Multi-currency and percentage splits are out of scope.
2. **Fallback:** Yes, build a zero-config local file database fallback (`db.json`) if MongoDB times out.
3. **Data:** Seed five users (Jaish, Sonia, David, Brooklyn, Earl) with specific balances matching the assignment: Jaish is owed $100 by David, and owes Brooklyn $105.36 while Earl owes Jaish $70.00.
4. **Google Sign-In:** Integrate both: real OAuth token validation, but add an "Account Switcher" chooser to let evaluators switch between seeded profiles with a single click.
5. **Partial Settlements:** Allow entering custom settlement values that subtract from the active balance.
6. **Contacts Picker:** Use the native Web Contacts Manager API on compatible mobile devices, with a manual friend dialog desktop fallback.

---

## 8. Deployment Plan

### Backend Deployment (Render)
- **Hosting Platform:** Render Web Service (Node/Express).
- **Environment Variables:**
  - `PORT=5000`
  - `MONGODB_URI=mongodb+srv://...` (MongoDB Atlas Connection String)
  - `GOOGLE_CLIENT_ID=204315747168-hjteb1ojmu55qmu7a364nppf4c76tuo9.apps.googleusercontent.com`
- **Build Settings:**
  - Build Command: `npm install`
  - Start Command: `npm start`
- **Health Checks:** Configured path `/api/users` for service keep-alive.

### Frontend Deployment (Vercel)
- **Hosting Platform:** Vercel Static Hosting (Vite React app).
- **Environment Variables:**
  - `VITE_API_BASE=https://splitwise-backend.onrender.com`
- **Build Settings:**
  - Build Command: `npm run build`
  - Output Directory: `dist`
- **SPA Rewrite Rule (`vercel.json`):**
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

---

## 9. Testing & Verification Plan

To verify all components work correctly, use the following manual testing scripts:

### Test Case 1: Account Switching & Balance Validation
1. Open the deployed URL.
2. Click **"Sign In with Google"** to view the mockup account chooser overlay.
3. Select **"Jaish Minocha"**.
4. **Expected Result:** Dashboard loads showing "overall, you are owed $64.64" (which is $100.00 from David + $70.00 from Earl - $105.36 to Brooklyn).
5. Switch users via Account Switcher to **"David"**.
6. **Expected Result:** Dashboard loads showing "overall, you owe $100.00".

### Test Case 2: Partial Settlement Recalculation
1. Log in as **"Jaish Minocha"**.
2. Tap **"House stuff"** group. Under balances, expand Brooklyn S. showing "You owe Brooklyn S. $105.36".
3. Tap **"Settle Up"**. In the settlement popup, tap the settlement amount ($35.36 default net).
4. Edit the amount to **$10.00** using the inline editor, then click **"Save Settlement"**.
5. **Expected Result:** The group details screen reloads. Under balances, your outstanding debt to Brooklyn S. has dynamically recalculated to **$25.36** ($35.36 - $10.00).

### Test Case 3: Group Invite Links SPA Routing
1. Log in as **"Sonia Minocha"**.
2. Visit URL: `https://splitwise-jaish.vercel.app/join-group/<BEACH_TRIP_GROUP_ID>`.
3. **Expected Result:** Sonia joins the group database list, is redirect-navigated straight to the Beach Trip group page, and can now add expenses shared with Jaish and David.

### Test Case 4: Zero-Config Fallback Connection
1. Run backend locally without starting MongoDB local server: `cd backend && npm run dev`.
2. **Expected Result:** Terminal prints: *"MongoDB connection failed. Falling back to JSON-file database."*
3. Open `backend/db.json` to verify the pre-seeded users and group expenses are loaded successfully.

---

## 10. Known Limitations & Trade-offs

- **JSON DB Session Volatility:** If running in fallback JSON mode on Render, the `db.json` file is reset whenever the Render free-tier container spins down or restarts. (Mitigated by Atlas cloud persistence).
- **Contacts API Context Limit:** The Web Contacts Picker (`navigator.contacts`) requires a Secure Context (HTTPS or localhost) and mobile browser support. In non-secure contexts, the application falls back to the manual overlay dialog.
- **Navigation Resets:** Since page views are maintained via React State variables, reloading the browser page returns the user to the default Dashboard view (Groups tab) rather than preserving the specific group detail overlays.
