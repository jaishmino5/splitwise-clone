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
- **Splash / Landing Screen:** Dark themed screen with options to sign up, sign in, or use the preloaded Choose Account list.
- **Persistent Sessions:** 1-day persistent user login sessions via `localStorage` with a 24-hour auto-expiration check.
- **SPA Group Invitation Routing:** Support for `/join-group/:groupId` links that auto-add the user to the group database list and redirect them upon login.
- **Dashboard Summary & Vector Art:** Dynamic balance status cards and a beautiful sunset beach vector graphic.
- **Active Group List:** Group items showing specific owe/owed metrics.
- **Group Details Page:** Split into transactional logs grouped by month and year.
- **Record a Payment Modal:** Displays payer/recipient avatars, directional arrow, email/phone details, and an editable large amount box.
- **Payment Amount Editing:** Supports custom partial settlement payments (e.g. paying $30 on a $70 debt), which recalculates remaining balances across all screens.
- **Collapsible Balances Accordions:** Slide-down accordion details in the Balances view displaying mutual debt splits.
- **Totals Spending Summary:** Spending progress summary shown inside a blue SVG progress ring with filter swappers.
- **Collaborative Notes Editor:** A shared text notepad saved directly into the group database record.
- **Native Contacts Picker & Fallback:** Support for native phone contacts book import (`navigator.contacts.select`) and a custom fallback list.

### Excluded
- Split by percentage or shares.
- Real OCR scanning (replaced with Pro receipt layout scanner mock).
- Real payments gateway processing.

---

## 3. Architecture & Tech Stack
- **Frontend:** React, styled with mobile-responsive Vanilla CSS variables, animations, and icons.
- **Backend:** Node.js Express.js API.
- **Database:** MongoDB (via Mongoose) with an automatic 3-second fallback to a local JSON file (`db.json`) if MongoDB is unavailable. Fully configured for remote MongoDB Atlas database deployment.
- **Icons:** Lucide-React.

---

## 4. AI Collaboration Process
1. **Initial Assessment:** The AI acted as a junior engineer, interviewing the user on authentication modes, database choices, splitting rules, and UI designs.
2. **Interactive Scopes:** The user provided high-resolution screenshots to guide the exact visual flow and alignment.
3. **Continuous Maintenance:** The file `AI_CONTEXT.md` was created and updated in real-time as technical decisions were locked down, ensuring it remains the source of truth.
4. **Bugfixing & Refinement:** Resolved async state lags inside the contact picker picker mode using React Refs (`contactsPickerModeRef`), added defensive population checks to avoid rendering type errors, and fixed Vercel database persistence by calling `dotenv.config()` at the very top of `server.js` before DB initialization.

---

## 5. Tradeoffs & Simplifications
- **Simplifications:**
  - Standard equal split algorithm: `amount / total_members`.
  - Simple mock selector authentication bypasses heavy password hashing (implemented for ease of multi-user testing).
- **Hardcoded Items:**
  - Pre-seeded users (Jaish Minocha, Sonia Minocha, David, Brooklyn S., Earl E.) are initialized automatically to populate the database with the state depicted in the user's screenshots.
- **Future Improvements:**
  - Add JWT authentication tokens for secure production logins.
  - Add search and categorization of expenses.
  - Integrate unit tests for the settlement calculations.
