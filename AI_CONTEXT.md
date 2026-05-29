# AI Context: Splitwise Clone

This document serves as the source of truth for the Splitwise Clone application. It tracks the complete technical context, architecture, schemas, product decisions, and implementation history.

---

## 1. Product Understanding & Goals
The goal of this application is to build a simplified Splitwise clone. The app allows users to create groups, log expenses, split bills equally among members, track who owes what, and record settlements. 
The layout and user flow are reverse-engineered directly from Splitwise screenshots, matching:
- The dark charcoal-themed splash/auth screens.
- The light-themed peach/orange gradient dashboard.
- The custom beach vector illustration at the base of the dashboard.
- The list of active groups showing the exact balances (e.g. David owes Jaish $100, Jaish owes Brooklyn $105.36, and Earl owes Jaish $70).

---

## 2. Product Scope & User Stories
### Scope (MVP)
- **Authentication:** Dual-mode authentication. Supports a Google-like Account Selector mockup (allowing seamless switching between seeded users to showcase the app instantly) as well as full custom email logins.
- **Group Management:** Users can create groups (e.g., "Beach trip", "House stuff") and add members.
- **Expense Logging:** Equal-split expense tracking. Payer enters a description, amount, selects the payer, and chooses which group members share the expense.
- **Balances & Netting:** Automatic calculation of net balances. Mutual debts between users are netted (e.g., if A owes B $100 and B owes A $70, the net result is A owes B $30).
- **Settlements:** Users can record payments to settle outstanding balances.

### Out of Scope (Exclusions)
- Unequal splits (split by percentage or shares).
- OCR receipt scanning.
- Push/email notifications.
- Activity feed comments.

---

## 3. Tech Stack
- **Frontend:** React (Vite-scaffolded single-page application) styled with Vanilla CSS (responsive, mobile-first design, animations, glassmorphic cards).
- **Backend:** Node.js + Express API server.
- **Database:** Mongoose/MongoDB with a **zero-configuration JSON-file database fallback (`db.json`)**.
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
  avatarUrl: String
}
```

### Group
```javascript
{
  _id: ObjectId / String,
  name: String,
  description: String,
  members: [ObjectId / String (ref: User)],
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
- `POST /api/auth/login` - Simulates user login (auto-creates account if email is new).
- `POST /api/auth/signup` - Creates a new user profile.
- `GET /api/groups?userId=X` - Gets all groups, populated with status headers showing how much user X owes/is owed.
- `GET /api/groups/:id?userId=X` - Gets balances, debts, and status for group `id` relative to user X.
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
- **Initial Prompt:** Paste the junior engineer prompt.
- **Discussion Prompts:** Discussions regarding moving to MERN stack and including screenshots to guide the exact flow and layout.
- **Design Guidance:** Reverse engineering the custom peach-sand sunset illustration using pure SVG inside the dashboard.

---

## 8. Known Limitations
- The in-memory/JSON fallback does not support complex concurrent writes (handled sequentially in NodeJS thread).
- Simple authentication does not require password hashing for mock selector logins (implemented for ease of testing).
