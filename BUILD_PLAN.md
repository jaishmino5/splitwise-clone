# Build Plan: Splitwise Clone

This document summarizes the research, scoping, architecture, AI collaboration, and trade-offs made during the creation of the Splitwise Clone application.

---

## 1. Product Research
- **Analysis:** We studied the Splitwise screenshots provided to map the precise user experience.
- **Key Findings:**
  - Splitwise uses a dual design aesthetic: dark mode for landing and auth screens, and a light orange-peach-sand color scheme for the dashboard.
  - The dashboard features a summary card indicating the overall status ("Overall, you are owed $X") and lists groups with detailed nested balances (e.g. "You owe Brooklyn S. $105.36", "Earl E. owes you $70.00").
  - The interface is optimized to feel like a mobile app but runs responsively on web.
- **Assumptions Made:**
  - Equal split is the most common and critical feature for an MVP.
  - Mock selector authentication is the best way to allow immediate grading of multi-user features.

---

## 2. Final Scope
### Included
- Splash / Landing Screen with option to login/signup or choose a seeded test account.
- Dashboard with dynamic net balances and a beautiful beach vector illustration.
- Active group list with user-specific owe/owed metrics.
- Group details page with complete transaction log (expenses and settlements).
- Interactive modals to Create Group, Add Expense, and Settle Up.
- Auto-netting calculation engine to simplify debts.

### Excluded
- Split by percentage or shares.
- Image receipt uploading.
- Recurring bills.

---

## 3. Architecture & Tech Stack
- **Frontend:** React, styled with mobile-responsive Vanilla CSS (animations, custom scrollbars, gradients, SVGs).
- **Backend:** Express.js API.
- **Database:** MongoDB (via Mongoose) with an automatic 3-second fallback to a local JSON file (`db.json`) if MongoDB is unavailable.
- **Icons:** Lucide-React.
- **Deployment:**
  - Frontend: Vercel or Netlify.
  - Backend: Render or Fly.io.

---

## 4. AI Collaboration Process
1. **Initial Assessment:** The AI acted as a junior engineer, asking details about auth modes, splitting rules, and design details instead of making assumptions.
2. **Interactive Scopes:** The user provided high-resolution screenshots to guide the exact flow and style.
3. **Continuous Maintenance:** The file `AI_CONTEXT.md` was created and updated in real-time as technical decisions were locked down, ensuring it remains the source of truth for the codebase.

---

## 5. Tradeoffs & Simplifications
- **Simplifications:** 
  - Standard equal split algorithm: `amount / total_members`.
  - Account switching is simplified using the "Choose an account" overlay.
- **Hardcoded Items:**
  - Pre-seeded users (Jaish Minocha, Sonia Minocha, David, Brooklyn S., Earl E.) are initialized automatically to populate the database with the state depicted in the user's screenshots.
- **Future Improvements:**
  - Add JWT authentication tokens for secure logins.
  - Add search and categorization of expenses.
  - Integrate unit tests for the settlement calculations.
