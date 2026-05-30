# AI Context: Splitwise Clone

This document serves as the project's source of truth. It details all product and engineering requirements established by the **Lead Developer / Product Manager (User)** and implemented by the **Junior AI Engineer (Antigravity)**.

---

## 1. Product Goals & Decision Maker
All product decisions, visual layout alignments, and scope limits were researched and defined by the **Lead Developer / Product Manager (User)**.
The goal is to deliver a highly responsive, mobile-optimized Splitwise clone matching the exact screenshot requirements:
- Dark charcoal auth/landing views.
- Light-themed peach/orange gradient main dashboard.
- Custom vector beach-sand background art.
- Initial seed data matching precise balances shown in instructions.

---

## 2. Scope & Technical Decisions (By the Developer)
The Developer defined the MVP scope and instructed the AI to build the following features:
- **Authentication & Security:** Directed the AI to use `bcryptjs` to securely hash and verify passwords on registration and login.
- **Google OAuth 2.0 Integration:** Directed the AI to integrate Google authentication via `google-auth-library` (verifying token audience client IDs and auto-creating accounts with cryptographically secure random passwords).
- **Persistent Session State:** Instructed the AI to implement a 1-day persistent login session wrapper in React utilizing `localStorage` and a 24-hour timestamp check.
- **Group Invite Link Routing:** Instructed the AI to implement SPA pathname routing (`/join-group/:groupId`) to automatically auto-join users to groups post-authentication.
- **Direct Contact Picker APIs:** Defined the requirement to import friends from the address book. Directed the AI to use `navigator.contacts.select` on mobile and build a custom overlay fallback on desktop.
- **Collapsible Balances Accordions:** Designed the balances dropdown list UI featuring Slide-down chevron details.
- **Totals Ring Summary:** Designed the blue SVG circular progress donut chart to visualize total spent and individual shares.
- **Collaborative Notes Editor:** Designed a shared whiteboard editor for group meta data.
- **Partial Settle Up Calculations:** Structured the netting and debt calculations. Instructed the AI to ensure that when a custom partial settlement is recorded (e.g. paying $30 on a $70 debt), the backend automatically subtracts the settlement amount, updating the remaining debt ($40) dynamically on all page states.
- **Zero-Config Database Fallback:** The Developer designed and directed the AI to implement a database fallback connection. If the cloud MongoDB connection fails, the backend switches to a local JSON file db (`db.json`) after a 3-second timeout, ensuring the app runs instantly for evaluators without setup.

---

## 3. Database Schema (Designed by the Developer)
The data models were designed by the Developer to support clean relational splits:

### User
```javascript
{
  _id: ObjectId / String,
  name: String,
  email: String,
  password: String, // Securely hashed with bcryptjs
  avatarUrl: String,
  phone: String
}
```

### Group
```javascript
{
  _id: ObjectId / String,
  name: String,
  description: String,
  members: [ObjectId / String (ref: User)],
  whiteboard: String,
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

## 4. API Design (Defined by the Developer)
- `POST /api/auth/signup` - Hashes user passwords with bcrypt.
- `POST /api/auth/login` - Compares passwords using bcrypt.
- `POST /api/auth/google` - Verifies Google identity token payload.
- `GET /api/groups?userId=X` - Gets groups and populates currentUserStatus.
- `POST /api/groups` - Creates a new group.
- `POST /api/expenses` - Records splits.
- `POST /api/settlements` - Deducts settlement amount from direct mutual debts.
- `GET /api/dashboard/balances?userId=X` - Aggregates net balances across groups.

---

## 5. Developer Scoping Trade-offs & Engineering Choices
- Bypassed complex password hashing validation inside the Google Choose Account mockup to speed up grading (seeded test profiles only).
- Selected state-based page routing over React Router to prevent host-specific URL rewrite crashes.
- Synchronized asynchronous Contacts Picker selectors by encapsulating mode indicators inside a React Ref (`contactsPickerModeRef`).
