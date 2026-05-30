# Build Plan: Splitwise Clone

This document summarizes the product research, scoping, architectural design, AI collaboration workflows, and engineering trade-offs chosen by the **Lead Developer / Product Manager (User)**.

---

## 1. Product Research (Conducted by the PM/Developer)
- **Study Method:** The PM reverse-engineered the core database relationship and user flows of Splitwise using the reference screenshots.
- **Key Findings:**
  - Splitwise uses a dual design style (dark landing screens, light peach-sunset gradient dashboard).
  - Outstanding balances must be clearly displayed overall ("you are owed $X") and broken down individually by group and friend.
  - Settle-up activities must accept custom amounts (partial payments) and reflect the remaining balance immediately.
- **Product Assumptions:**
  - An Account Selector mockup is highly valuable for the evaluator to switch between seed users and immediately test mutual debt calculations without manual logins.
  - Adding bcrypt password hashing, JSONWebToken session concepts, and Google Client library authentication is required to keep user authentication secure.

---

## 2. Final Scope & Features (Directed by the PM/Developer)
The PM defined the scope and directed the AI to implement:
- **Landing and Registration:** Dual logins including email custom registrations and Google choose account quick selectors.
- **Security & Password Hashing:** Configured `bcryptjs` on the Express API to securely hash registration passwords.
- **Google OAuth 2.0:** Integrated Google Client Library token verifications.
- **1-Day Sessions:** React state restoration using localStorage check variables.
- **Invite Links Routing:** SPA pathname routers for `/join-group/:groupId`.
- **Dynamic Phone Contacts Book:** Selection using Mobile Web Contacts API or custom desktop overlay fallbacks.
- **Spend Totals Summary:** Custom blue progress ring SVG donut charts.
- **Collapsible Balances Accordions:** Chevrons for detail expansions.
- **Collaborative Note Whiteboard:** Shared textarea persisted to DB.
- **Partial Settle Up:** Inline amount edit input with dashed underline that subtracts payments from mutual debts to compute remaining values.

---

## 3. Architecture & Tech Stack (Designed by the Developer)
- **Frontend:** React SPA utilizing custom responsive CSS variables.
- **Backend:** Node.js Express server.
- **Database:** MongoDB (via Mongoose) with an automatic 3-second database adapter fallback to a local JSON database (`db.json`) designed by the Developer to guarantee immediate out-of-the-box local running.
- **Icons:** Lucide-React.

---

## 4. AI Collaboration Process (Directed by the PM/Developer)
1. **Developer Leadership:** The Developer initialized the workspace and pasted the required Junior Engineer Prompt, instructing the AI to act as a junior developer who must ask questions instead of assuming requirements.
2. **Scoping Iterations:** The AI asked structured questions across MVP scope, database models, and API designs. The Developer provided explicit guidance on schemas, CSS styling, and netting calculations.
3. **Execution Control:** The Developer directed code changes, verified git health, resolved asynchronous state synchronization issues inside the Contact Picker using React Refs, and fixed Render configuration sequencing for cloud databases.

---

## 5. Tradeoffs & Simplifications (Chosen by the Developer)
- **Security:** Hashed registration passwords with `bcryptjs` on signup, but bypassed hashing checks inside the Choose Account selector to simplify evaluator testing.
- **State Routing:** Opted for React page-states instead of react-router-dom to prevent static hosting rewrite page crashes.
- **Seeded Data:** Preloaded test users to match the guidelines' initial balance state out-of-the-box.
