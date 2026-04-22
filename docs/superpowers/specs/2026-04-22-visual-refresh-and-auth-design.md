# Daily Planner — Visual Refresh & Auth Design Spec
**Date:** 2026-04-22

## Overview

Two goals: (1) warm up the visual design from stark white/black to a soft, personal-feeling palette; (2) add a client-side password gate so only the owner can access real data, with a `?demo=1` URL that bypasses auth and shows sample data instead.

---

## Visual Theme

Replace the current white/black palette with a warm, notebook-like feel. No layout changes — same tab structure, same components.

| Element | Current | New |
|---|---|---|
| Page background | `#fff` | `#fdf8f3` (soft cream) |
| Active tab indicator | `#1a1a1a` | `#d97706` (warm amber) |
| Buttons | `#1a1a1a` | `#78350f` (warm brown) |
| Button hover | `#333` | `#92400e` |
| Checkbox accent | `#1a1a1a` | `#d97706` |
| Input border (focus) | `#888` | `#d97706` |
| Input border-radius | `8px` | `12px` |
| List item divider | `#f0f0f0` | `#f5ede3` (warm tint) |

---

## Completed Tasks Section

Instead of completed tasks sitting inline with active tasks (strikethrough in place), they move to a collapsible "Completed (n)" section below the active list.

- Checking a task moves it to the completed section immediately
- Unchecking moves it back to the active list
- The section header shows the count: `Completed (3)`
- Collapsed by default; user can expand to see/delete completed items
- Delete button remains available in the completed section
- `renderTasks()` splits the task array into two groups before rendering

---

## Password Gate (`auth.js`)

New file that loads via `<script src="auth.js">` in `index.html`, placed before `app.js`.

### Flow

1. Check `?demo=1` query param → if present, set `window.isDemo = true` and exit (no gate shown)
2. Check `localStorage` for a valid session token → if found, exit (already authenticated)
3. Render full-screen overlay: app name, password input, Submit button
4. On submit: hash input with `crypto.subtle.digest('SHA-256', ...)`, compare against `PASSWORD_HASH` constant
5. Match → save session token to `localStorage`, remove overlay, app loads
6. No match → shake animation on input, clear field, stay on gate

### Password Setup

A comment in `auth.js` provides a browser console one-liner that outputs the SHA-256 hash of any string. User runs it once, pastes the hash into the `PASSWORD_HASH` constant. Plaintext password never appears in code.

```js
// Run in browser console to generate your hash:
// const h = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourpassword')))].map(b=>b.toString(16).padStart(2,'0')).join(''); console.log(h);
const PASSWORD_HASH = 'REPLACE_WITH_YOUR_HASH';
```

### Session Token

A random token (e.g. `crypto.randomUUID()`) is stored in `localStorage` on successful auth. `auth.js` checks for its presence on subsequent loads. No expiry for now. To log out: clear `localStorage`.

---

## Demo Mode (`?demo=1`)

`auth.js` sets `window.isDemo = true` when the query param is present. `app.js` checks this flag before calling `init()`.

### Behavior

- No Supabase connection — all reads/writes target an in-memory mock data layer
- A "Demo" badge appears in the top-right corner
- Interactions work (check, add, delete) but operate on the mock data only
- Refreshing resets to default demo data

### Mock Data

```js
// Tasks
[
  { id: '1', text: 'Pick up dry cleaning', completed: false },
  { id: '2', text: 'Call the dentist', completed: false },
  { id: '3', text: 'Review budget spreadsheet', completed: true },
]

// Active grocery list: "Weekly Shop"
// Items: Eggs, Milk, Bread, Olive oil, Apples

// Archived list: "Costco Run" (archived 2026-04-15)
// Items: Paper towels, Protein bars, Sparkling water
```

### Future Extension

When a real demo version is needed, the `window.isDemo` flag is the hook — either flesh out the mock layer or point it at a separate Supabase project with read-only demo data.

---

## File Changes

```
daily-planner/
├── index.html      # add <script src="auth.js"> before app.js
├── auth.js         # NEW — gate, session persistence, demo detection
├── app.js          # demo-mode init swap + completed section in renderTasks
└── style.css       # warm palette + gate overlay styles + completed section styles
```

No new dependencies. No build step. No changes to Supabase config or data model.

---

## Security Notes

- SHA-256 client-side hashing is not cryptographically unbreakable (JS is inspectable) but prevents casual access — appropriate for a personal tool on GitHub Pages
- The hash is visible in source; the password is not
- RLS remains permissive (no change) — the gate is the only access control
- Demo mode never touches real Supabase credentials
