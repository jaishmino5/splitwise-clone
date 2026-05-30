# Key Development Prompts

This document lists the key prompts and instructions used to collaborate with **Antigravity (Google DeepMind)** during the 3-day development of the Splitwise Clone.

---

## 1. Initial Prompt (Interview & Context Setup)
**Purpose:** Setup the junior developer persona and initiate the reverse-engineering interview questions.

```text
You are a junior engineer helping me complete an internship assignment.
The assignment is to reverse engineer Splitwise, scope a realistic 3-day version,
and build a working deployed app.
Important instructions:
1. Do not assume product requirements.
2. Do not jump directly into implementation.
3. Ask me detailed questions about product scope, UX, workflows, edge cases, and
engineering decisions.
4. Ask about every implementation detail needed to build the app.
5. After each answer I give, update a Markdown file called AI_CONTEXT.md.
6. AI_CONTEXT.md must become the source of truth for the entire project.
7. The final app must be buildable from AI_CONTEXT.md.
8. Another evaluator should be able to paste AI_CONTEXT.md into the same AI tool
and recreate a similar app.
9. Before writing code, produce a build plan based only on the agreed context.
10. During implementation, keep updating AI_CONTEXT.md whenever requirements,
architecture, schema, UI, or logic changes.
Start by interviewing me.
Ask questions across:
- product goals
- Splitwise research
- core workflows
- user personas
- MVP scope
- out-of-scope features
- data model !IMPORTANT!
- authentication
- groups
- expenses
- settlements
- balance calculation
- UI screens
- routing
- frontend architecture
- backend architecture
- database choice
- API design
- deployment
- testing
- known risks
- tradeoffs
Do not give me a final plan until you have asked enough questions.
```

---

## 2. Zero-Config Database Fallback Prompt
**Purpose:** Build a robust backend connection that defaults to a local JSON file db if MongoDB connection parameters are missing or MongoDB Atlas cluster times out.

```text
Please build a database adapter layer inside `backend/db.js` that implements the database helper routines. 
If the MongoDB connection (defined by MONGODB_URI) is unavailable or times out after 3 seconds, 
the application must dynamically fall back to reading and writing to a local `db.json` file inside the backend directory. 
Pre-seed both the MongoDB database and the local JSON file database with the initial test user profiles and 
mock group expenses so that the app works instantly out-of-the-box for evaluators without any setup.
```

---

## 3. Persistent 24-Hour Session State Prompt
**Purpose:** Implement persistent frontend user logins using a `localStorage` wrapper checking timestamps on load.

```text
Configure standard logins, signup, and Google Auth selections to save the active user profile to localStorage 
under the key `splitwise_session_user` along with the authentication epoch timestamp in `splitwise_session_timestamp`. 
Write a React hook initializer in `App.jsx` that checks these keys on mount. If the elapsed time since authentication 
is less than 24 hours (86,400,000 ms), automatically restore their logged-in state and bypass the landing login screen. 
If it is 24 hours or older, clear the localStorage keys and route the user to standard login.
```

---

## 4. SPA Page Routing & Invite Link Processing Prompt
**Purpose:** Handle copyable share invitation links `/join-group/:groupId` without breaking on reloads in static hosts.

```text
Write a custom pathname reader in React to manage page routing. On app load, check the window pathname for the invite routing format: `/join-group/:groupId`. 
If detected, extract the `groupId` parameter, store it in sessionStorage, and use `window.history.replaceState` to clear the URL back to a clean main pathname instantly. 
Once the user is authenticated, check sessionStorage for any pending `join_group_id`. If present, automatically perform a PUT call to the backend to add their userId 
to the group members array, fetch updated balances, and navigate them straight to the group details page.
```

---

## 5. Contact Picker Ref Synchronization Prompt
**Purpose:** Resolve stale closures in asynchronous Contacts Picker API actions.

```text
The Mobile Contact Picker (`navigator.contacts.select`) runs asynchronously. When adding members to a group or splits to an expense, 
using standard React state to track whether the contact book is opening causes closure state lag. 
Encapsulate the picker mode indicator inside a React Ref (`contactsPickerModeRef`) to synchronize the asynchronous picker threads 
with the synchronous React state variables. If the contacts API is not supported on the user's browser, 
automatically default to a custom desktop dialog layout.
```

---

## 6. Partial Settlement Amount Editing Prompt
**Purpose:** Implement partial debt settle-ups.

```text
For standard settlements, users should be able to pay any custom amount rather than just the full balance. 
Inside the Settle Up modal, when a user clicks the settlement amount, display an inline numeric edit input with a dashed underline. 
As the user types, recalculate the outstanding balances in real-time. When saved, write a new settlement transaction 
representing this partial payment to the backend, subtracting it from the mutual debt.
```

---

## 7. Glassmorphism CSS UI Polish Prompt
**Purpose:** Make the interface feel premium and visually impressive.

```text
Please style the user interface using custom HSL colors and vanilla CSS variables inside `index.css`. 
On desktop screens, wrap the entire application in a responsive mobile container frame featuring a thick charcoal border 
that mimics a physical phone. Apply vibrant peach/sunset orange CSS gradients for dashboard headers, 
create custom sand-ripple SVG backgrounds, use frosted-glass cards (`backdrop-filter: blur(10px)`), and 
add micro-animations (like button scales on click and chevron slide-downs) to make the app feel responsive and premium.
```
