# AI Context: Splitwise Clone

This document serves as the source of truth for the Splitwise Clone application. It tracks the complete technical context, architecture, schemas, product decisions, and implementation history.

---

## 1. Product Understanding & Goals
The goal of this application is to build a simplified Splitwise clone. The app allows users to create groups, log expenses, split bills equally among members, track who owes what, and record settlements.
The layout and user flow are reverse-engineered directly from Splitwise screenshots, matching:
- The dark charcoal-themed splash/auth screens.
- The light-themed peach/orange gradient dashboard.
- The custom beach vector sunset illustration at the base of the dashboard.
- The list of active groups showing the exact balances (e.g. David owes Jaish $100, Jaish owes Brooklyn $105.36, and Earl owes Jaish $70).

---

## 2. Product Scope & User Stories
### Scope (MVP & High-Fidelity Features)
- **Authentication & Sessions:** Dual-mode authentication. Includes a Google Choose Account selector mockup (for instant switching between seeded test accounts) as well as full custom signup/logins. Fully supports **1-day persistent user login sessions** via `localStorage` with a 24-hour expiration check.
- **Group Management & Invite Links:** Users can create groups (e.g., "Trip", "Home", "Couple", "Other") and invite members. Supports dynamic **SPA group invitation links** (`/join-group/:groupId`) that automatically add the user to the group membership post-login and redirect them to the group view.
- **Expense Logging & Splits**: Equal-split expense tracking. Payer enters a description, amount, payer, and chooses splits. Supports auto-category icon resolution. When creating/editing a non-group expense, splits default to just `[user._id]` rather than checking all friends, allowing quick 1-on-1 direct splits.
- **Balances Accordion Screen**: Tap "Balances" to open an overlay displaying outstanding highlights with collapsible chevron accordions (e.g. showing who owes whom within the group). Includes a "Remind" mock trigger and a "Settle up" button that immediately pre-fills the settlement overlay.
- **Spending Totals Screen**: Tap "Totals" to view group total spent and your share, visualized inside a custom blue SVG progress donut ring with a segmented swapper between "All time" and month ranges.
- **Collaborative Whiteboard Note Editor**: A shared text board persisted to the group document in the database for sharing information like addresses and emergency contacts.
- **Record a Payment (Settle Up)**: Displays payment direction avatars, payment description, other user's email/phone, a teal info warning card, and a large editable amount digits selector. Supports **inline editing for partial payments** (e.g., recording a $30 settlement on a $70 debt, which automatically updates the remaining $40 debt across all dashboard status text, balance screens, and logs).
- **Empty States Layouts**: Dynamic empty state handling. If a group has only 1 member, it displays the `"You're the only one here!"` card (with native contacts picker and group link buttons). If a group has other members but no expenses, it shows `"No expenses recorded yet."`. On non-group virtual groups, empty state buttons adapt to say "Add friends" instead of "Add group members" and hide group link options.
- **Native & Fallback Contact Picker**: Tap `"Select from Phone Contacts Book"` to import multiple contacts. Uses the standard `navigator.contacts.select` API on supported devices and falls back to a gorgeous custom contacts overlay with mock permissions management. Employs a React Ref (`contactsPickerModeRef`) to synchronize the async selection mode across ticks.

### Out of Scope (Exclusions)
- Unequal splits (split by percentage or shares).
- Real receipt OCR image scanning (mocked inside UI).
- Real payment processing (all settlements recorded represent offline cash transactions).

---

## 3. Tech Stack
- **Frontend:** React (Vite-scaffolded single-page application) styled with Vanilla CSS (responsive, mobile-first design, custom variables, animations, glassmorphic cards).
- **Backend:** Node.js + Express API server (fully configured for cross-origin resource sharing).
- **Database:** Mongoose/MongoDB with a **zero-configuration JSON-file database fallback (`db.json`)** on backend.
  - *Why this choice?* If MongoDB is not running locally on the evaluator's machine, the app automatically switches to the JSON file database, guaranteeing it runs out-of-the-box.
- **Icon Library:** Lucide-React.

---

## 4. Database Schema
Models are managed via Mongoose schemas or replicated in JSON format in the database adapter:

### User
```javascript
{
  _id: ObjectId / String,
  name: String,
  email: String,
  avatarUrl: String,
  phone: String // Added for contact picker syncing
}
```

### Group
```javascript
{
  _id: ObjectId / String,
  name: String,
  description: String,
  members: [ObjectId / String (ref: User)],
  whiteboard: String, // Collaborative note notes
  createdAt: Date / String
}
```

### Expense
```javascript
{
  _id: ObjectId / String,
  description: String,
  amount: Number,
  paidBy: ObjectId / String (ref: User),
  group: ObjectId / String (ref: Group),
  splits: [{
    user: ObjectId / String (ref: User),
    owedAmount: Number
  }],
  createdAt: Date / String
}
```

### Settlement
```javascript
{
  _id: ObjectId / String,
  group: ObjectId / String (ref: Group),
  fromUser: ObjectId / String (ref: User),
  toUser: ObjectId / String (ref: User),
  amount: Number,
  createdAt: Date / String
}
```

---

## 5. API Design
- `GET /api/users` - Get all registered/test users.
- `PUT /api/users/:id` - Updates a user's profile.
- `POST /api/users/:id/friends` - Adds a new friend and automatically creates/syncs them in the user's friend database pool.
- `POST /api/auth/login` - Simulates user login (auto-creates account if email is new).
- `POST /api/auth/signup` - Creates a new user profile.
- `GET /api/groups?userId=X` - Gets all groups, populated with status headers showing how much user X owes/is owed.
- `GET /api/groups/:id?userId=X` - Gets balances, debts, and status for group `id` relative to user X.
- `PUT /api/groups/:id` - Updates group metadata (members, whiteboard note, etc.).
- `POST /api/groups` - Creates a new group.
- `GET /api/expenses?groupId=Y` - Lists all expenses in a group.
- `POST /api/expenses` - Records a new expense and computes splits.
- `GET /api/settlements?groupId=Y` - Lists all recorded settlement payments.
- `POST /api/settlements` - Records a payment between users.
- `GET /api/dashboard/balances?userId=X` - Computes the aggregated net balance (owe/owed) for user X across all groups.

---

## 6. Implementation Decisions & Trade-offs
1. **Fallback Database (`db.js`):** Implemented an adapter that checks for MongoDB. If connection fails within 3 seconds, it switches to local JSON file operations. This is a critical design feature to ensure 100% buildability and evaluation success without external dependencies.
2. **State-Based Client Router:** Replaced traditional routers with a clean React state machine. This eliminates browser re-routing bugs on reload and works flawlessly on free static hosts.
3. **Google Auth Selector Mockup:** Simulates a Google Choose Account interface using the pre-seeded users. This allows evaluators to test the multi-user flow immediately without registering multiple accounts manually.
4. **Seed Data:** Seeded the database with users (Jaish Minocha, Sonia Minocha, David, Brooklyn S., Earl E.) and expenses to recreate the exact group status shown in the assignment guidelines.

---

## 7. Prompts and AI Responses
- **Initial Prompt:** Junior engineer prompt starting the assignment interview.
- **Discussion Prompts:** Moving to the MERN stack with inline editing, custom state synchronization, and native contacts selection.
- **Design Guidance:** Reverse engineering the custom sunset beach theme and styling interactive forms with premium animations.

---

## 8. Known Limitations & Known Risks
- JSON database writes are synchronous and stored sequentially in NodeJS thread memory (handled defensively).
- Password validation is bypassed for account selector logins to allow fast grading and instant multi-user simulation.
- Session timestamp check is local (subject to client machine time manipulations).
