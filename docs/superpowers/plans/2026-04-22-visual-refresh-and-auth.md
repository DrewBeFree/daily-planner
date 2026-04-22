# Visual Refresh & Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a warm visual theme, a completed-tasks section, a client-side password gate, and a `?demo=1` bypass mode with in-memory sample data.

**Architecture:** A new `auth.js` script loads before `app.js` and exposes `window.authReady` (a Promise) plus `window.isDemo` (a boolean). `app.js`'s `init()` awaits `authReady` before touching Supabase; if `isDemo` is true it calls `initDemo()` instead, which overrides all Supabase-bound globals with in-memory equivalents. Visual changes are CSS-only.

**Tech Stack:** Vanilla JS, CSS, Supabase JS v2 (CDN), GitHub Pages, Web Crypto API (`crypto.subtle`)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `auth.js` | **Create** | Demo detection, session check, password gate |
| `style.css` | **Modify** | Warm palette, gate overlay, demo badge, completed section |
| `index.html` | **Modify** | Add `auth.js` script tag; add completed-section HTML |
| `app.js` | **Modify** | Await authReady in init(); add initDemo(); update renderTasks |

---

## Task 1: Warm CSS Palette

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Update body background and tab accent**

In `style.css`, make these replacements:

```css
/* REPLACE */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px 16px;
  color: #1a1a1a;
  background: #fff;
}

/* WITH */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px 16px;
  color: #1a1a1a;
  background: #fdf8f3;
}
```

```css
/* REPLACE */
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e5e5e5;
  margin-bottom: 28px;
}

/* WITH */
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #f0e6d8;
  margin-bottom: 28px;
}
```

```css
/* REPLACE */
.tab.active { color: #1a1a1a; border-bottom-color: #1a1a1a; }

/* WITH */
.tab.active { color: #d97706; border-bottom-color: #d97706; }
```

- [ ] **Step 2: Update input styles**

```css
/* REPLACE */
.input-row input {
  flex: 1;
  padding: 10px 14px;
  font-size: 16px;
  border: 1px solid #d4d4d4;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.15s;
}

.input-row input:focus { border-color: #888; }

/* WITH */
.input-row input {
  flex: 1;
  padding: 10px 14px;
  font-size: 16px;
  border: 1px solid #d4d4d4;
  border-radius: 12px;
  outline: none;
  background: #fff;
  transition: border-color 0.15s;
}

.input-row input:focus { border-color: #d97706; }
```

- [ ] **Step 3: Update button styles**

```css
/* REPLACE */
button {
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  background: #1a1a1a;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}

button:hover { background: #333; }

/* WITH */
button {
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  background: #78350f;
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}

button:hover { background: #92400e; }
```

- [ ] **Step 4: Update checkbox and list divider**

```css
/* REPLACE */
input[type="checkbox"] {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  cursor: pointer;
  accent-color: #1a1a1a;
}

/* WITH */
input[type="checkbox"] {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  cursor: pointer;
  accent-color: #d97706;
}
```

```css
/* REPLACE */
ul li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 4px;
  border-bottom: 1px solid #f0f0f0;
}

/* WITH */
ul li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 4px;
  border-bottom: 1px solid #f5ede3;
}
```

- [ ] **Step 5: Verify visually**

Open `index.html` in a browser (no server needed for CSS). Confirm:
- Page background is cream, not white
- Active tab indicator is amber
- Buttons are warm brown
- Input focus ring is amber

- [ ] **Step 6: Commit**

```bash
git add style.css
git commit -m "style: warm cream/amber palette"
```

---

## Task 2: Completed Tasks Section

**Files:**
- Modify: `index.html` (add completed-section HTML)
- Modify: `style.css` (add completed section styles)
- Modify: `app.js` (update renderTasks)

- [ ] **Step 1: Add completed-section HTML to index.html**

In `index.html`, replace the tasks section:

```html
<!-- REPLACE -->
<section id="tasks-section">
  <div class="input-row">
    <input id="task-input" type="text" placeholder="Add a task…"
           onkeydown="if(event.key==='Enter') addTask()">
    <button onclick="addTask()">Add</button>
  </div>
  <ul id="task-list"></ul>
</section>

<!-- WITH -->
<section id="tasks-section">
  <div class="input-row">
    <input id="task-input" type="text" placeholder="Add a task…"
           onkeydown="if(event.key==='Enter') addTask()">
    <button onclick="addTask()">Add</button>
  </div>
  <ul id="task-list"></ul>
  <details id="completed-section" class="completed-section hidden">
    <summary id="completed-summary">Completed (0)</summary>
    <ul id="completed-list"></ul>
  </details>
</section>
```

- [ ] **Step 2: Add completed section styles to style.css**

Append to the end of `style.css`, before the `@media print` block:

```css
/* ── Completed section ── */
.completed-section {
  margin-top: 28px;
  border-top: 1px solid #f0e6d8;
  padding-top: 12px;
}

.completed-section summary {
  font-size: 13px;
  color: #a78b6f;
  cursor: pointer;
  user-select: none;
  padding: 4px 0 8px;
  list-style: none;
}

.completed-section summary::before { content: '▸ '; }
details[open].completed-section > summary::before { content: '▾ '; }
```

- [ ] **Step 3: Update renderTasks in app.js**

```js
/* REPLACE */
function renderTasks(tasks) {
  document.getElementById('task-list').innerHTML = tasks.map(t => `
    <li class="${t.completed ? 'completed' : ''}" data-id="${t.id}">
      <input type="checkbox" ${t.completed ? 'checked' : ''}
             onchange="toggleTask('${t.id}', this.checked)">
      <span>${escapeHtml(t.text)}</span>
      <button class="delete-btn" onclick="deleteTask('${t.id}')" title="Remove">×</button>
    </li>
  `).join('');
}

/* WITH */
function renderTasks(tasks) {
  const active = tasks.filter(t => !t.completed);
  const done = tasks.filter(t => t.completed);

  document.getElementById('task-list').innerHTML = active.map(t => `
    <li data-id="${t.id}">
      <input type="checkbox" onchange="toggleTask('${t.id}', this.checked)">
      <span>${escapeHtml(t.text)}</span>
      <button class="delete-btn" onclick="deleteTask('${t.id}')" title="Remove">×</button>
    </li>
  `).join('');

  const section = document.getElementById('completed-section');
  if (done.length === 0) {
    section.classList.add('hidden');
    return;
  }
  section.classList.remove('hidden');
  document.getElementById('completed-summary').textContent = `Completed (${done.length})`;
  document.getElementById('completed-list').innerHTML = done.map(t => `
    <li class="completed" data-id="${t.id}">
      <input type="checkbox" checked onchange="toggleTask('${t.id}', this.checked)">
      <span>${escapeHtml(t.text)}</span>
      <button class="delete-btn" onclick="deleteTask('${t.id}')" title="Remove">×</button>
    </li>
  `).join('');
}
```

- [ ] **Step 4: Update print stylesheet in style.css**

The existing print block hides `ul li.completed`. Now that completed items are in `#completed-section`, that section should be hidden instead. Replace the entire `@media print` block:

```css
/* REPLACE */
@media print {
  .tabs,
  #groceries-section,
  .input-row,
  .delete-btn,
  input[type="checkbox"] {
    display: none !important;
  }

  #tasks-section { display: block !important; }

  body { max-width: 100%; padding: 12px; font-size: 14px; }

  ul li { padding: 6px 0; border-bottom: 1px solid #ddd; }
  ul li.completed { display: none; }
  ul li span { font-size: 14px; }
}

/* WITH */
@media print {
  .tabs,
  #groceries-section,
  .input-row,
  .delete-btn,
  input[type="checkbox"],
  #completed-section,
  #auth-overlay {
    display: none !important;
  }

  #tasks-section { display: block !important; }

  body { max-width: 100%; padding: 12px; font-size: 14px; }

  ul li { padding: 6px 0; border-bottom: 1px solid #ddd; }
  ul li span { font-size: 14px; }
}
```

- [ ] **Step 5: Verify (requires Supabase — deploy or use live server)**

Add a task, check it. Confirm it moves to the "Completed (1)" section below. Uncheck it — confirm it moves back to the active list.

- [ ] **Step 6: Commit**

```bash
git add index.html style.css app.js
git commit -m "feat: completed tasks collapsible section"
```

---

## Task 3: Create auth.js

**Files:**
- Create: `auth.js`

- [ ] **Step 1: Create auth.js**

```js
// To generate your password hash, open any browser console and run:
// [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('yourpassword')))].map(b=>b.toString(16).padStart(2,'0')).join('')
// Then paste the output as the value below.
const PASSWORD_HASH = 'REPLACE_WITH_YOUR_HASH';
const SESSION_KEY = 'dp_session';

window.authReady = (async () => {
  // Demo mode — skip gate entirely
  if (new URLSearchParams(window.location.search).get('demo') === '1') {
    window.isDemo = true;
    return;
  }

  // Already authenticated this session
  if (localStorage.getItem(SESSION_KEY)) return;

  // Show gate and wait for unlock
  await new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.innerHTML = `
      <div class="auth-box">
        <h1>Daily Planner</h1>
        <form id="auth-form">
          <input id="auth-input" type="password" placeholder="Password"
                 autocomplete="current-password" autofocus>
          <button type="submit">Unlock</button>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('auth-form').addEventListener('submit', async e => {
      e.preventDefault();
      const val = document.getElementById('auth-input').value;
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(val));
      const hash = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

      if (hash === PASSWORD_HASH) {
        localStorage.setItem(SESSION_KEY, crypto.randomUUID());
        overlay.remove();
        resolve();
      } else {
        const input = document.getElementById('auth-input');
        input.classList.add('shake');
        input.value = '';
        setTimeout(() => input.classList.remove('shake'), 500);
      }
    });
  });
})();
```

- [ ] **Step 2: Add gate overlay and shake animation to style.css**

Append before the `@media print` block:

```css
/* ── Auth gate ── */
#auth-overlay {
  position: fixed;
  inset: 0;
  background: #fdf8f3;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.auth-box {
  text-align: center;
  width: 100%;
  max-width: 320px;
  padding: 0 24px;
}

.auth-box h1 {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 28px;
  color: #1a1a1a;
}

#auth-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

#auth-input {
  padding: 12px 16px;
  font-size: 16px;
  border: 1px solid #d4d4d4;
  border-radius: 12px;
  outline: none;
  text-align: center;
  background: #fff;
  transition: border-color 0.15s;
}

#auth-input:focus { border-color: #d97706; }

#auth-input.shake {
  animation: shake 0.4s ease;
  border-color: #dc2626;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-8px); }
  40%       { transform: translateX(8px); }
  60%       { transform: translateX(-6px); }
  80%       { transform: translateX(6px); }
}
```

- [ ] **Step 3: Commit**

```bash
git add auth.js style.css
git commit -m "feat: auth gate with SHA-256 password and session persistence"
```

---

## Task 4: Wire app.js to authReady + add initDemo

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Update init() to await authReady**

```js
/* REPLACE */
async function init() {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  checkAutoPrint();
  await loadTasks();
  await loadGroceries();
}

/* WITH */
async function init() {
  await window.authReady;
  if (window.isDemo) { initDemo(); return; }
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  checkAutoPrint();
  await loadTasks();
  await loadGroceries();
}
```

- [ ] **Step 2: Add initDemo() above the init() function**

Insert the following block immediately above the `// ── Init ───` comment:

```js
// ── Demo mode ──────────────────────────────────────────────────────────────

function initDemo() {
  const badge = document.createElement('div');
  badge.id = 'demo-badge';
  badge.textContent = 'Demo';
  document.body.appendChild(badge);

  let tasks = [
    { id: '1', text: 'Pick up dry cleaning', completed: false },
    { id: '2', text: 'Call the dentist', completed: false },
    { id: '3', text: 'Review budget spreadsheet', completed: true },
  ];
  let items = [
    { id: 'i1', list_id: 'g1', text: 'Eggs', removed: false },
    { id: 'i2', list_id: 'g1', text: 'Milk', removed: false },
    { id: 'i3', list_id: 'g1', text: 'Bread', removed: false },
    { id: 'i4', list_id: 'g1', text: 'Olive oil', removed: false },
    { id: 'i5', list_id: 'g1', text: 'Apples', removed: false },
  ];
  const archived = [
    { id: 'g2', title: 'Costco Run', archived_at: '2026-04-15T12:00:00Z' },
  ];

  activeListId = 'g1';
  showActiveList({ id: 'g1', title: 'Weekly Shop' });
  renderTasks(tasks);
  renderItems(items.filter(i => !i.removed));
  renderArchivedLists(archived);

  window.addTask = () => {
    const input = document.getElementById('task-input');
    const text = input.value.trim();
    if (!text) return;
    tasks.push({ id: String(Date.now()), text, completed: false });
    input.value = '';
    renderTasks(tasks);
  };

  window.toggleTask = (id, completed) => {
    const t = tasks.find(t => t.id === id);
    if (t) t.completed = completed;
    renderTasks(tasks);
  };

  window.deleteTask = (id) => {
    tasks = tasks.filter(t => t.id !== id);
    renderTasks(tasks);
  };

  window.addItem = () => {
    const input = document.getElementById('item-input');
    const text = input.value.trim();
    if (!text) return;
    items.push({ id: String(Date.now()), list_id: activeListId, text, removed: false });
    input.value = '';
    renderItems(items.filter(i => i.list_id === activeListId && !i.removed));
  };

  window.removeItem = (id) => {
    const item = items.find(i => i.id === id);
    if (item) item.removed = true;
    renderItems(items.filter(i => i.list_id === activeListId && !i.removed));
  };

  window.archiveList = () => {
    showNewListPrompt();
    renderArchivedLists(archived);
  };

  window.createList = () => {
    const input = document.getElementById('new-list-title');
    const title = input.value.trim();
    if (!title) return;
    const newList = { id: String(Date.now()), title };
    input.value = '';
    activeListId = newList.id;
    showActiveList(newList);
    renderItems([]);
  };

  window.reloadList = (listId, title) => {
    const newList = { id: String(Date.now()), title };
    activeListId = newList.id;
    showActiveList(newList);
    renderItems([]);
  };
}
```

- [ ] **Step 3: Add demo badge style to style.css**

Append to `style.css` before the `@media print` block:

```css
/* ── Demo badge ── */
#demo-badge {
  position: fixed;
  top: 12px;
  right: 12px;
  background: #d97706;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 20px;
  z-index: 999;
  pointer-events: none;
}
```

- [ ] **Step 4: Commit**

```bash
git add app.js style.css
git commit -m "feat: demo mode and authReady wiring"
```

---

## Task 5: Update index.html Script Tag

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add auth.js script before app.js**

```html
<!-- REPLACE -->
  <script src="app.js"></script>
</body>

<!-- WITH -->
  <script src="auth.js"></script>
  <script src="app.js"></script>
</body>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "wire: load auth.js before app.js"
```

---

## Task 6: Set Your Password and Deploy

- [ ] **Step 1: Generate your password hash**

Open any page in Chrome, open DevTools console, and run:

```js
[...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourpassword')))].map(b=>b.toString(16).padStart(2,'0')).join('')
```

Replace `'yourpassword'` with your actual password. Copy the 64-character hex string that is logged.

- [ ] **Step 2: Paste the hash into auth.js**

In `auth.js`, replace:

```js
const PASSWORD_HASH = 'REPLACE_WITH_YOUR_HASH';
```

With:

```js
const PASSWORD_HASH = 'paste-your-64-char-hash-here';
```

- [ ] **Step 3: Commit and push**

```bash
git add auth.js
git commit -m "config: set password hash"
git push origin master
```

- [ ] **Step 4: Verify on GitHub Pages**

1. Open your GitHub Pages URL — confirm the password gate appears
2. Enter your password — confirm it unlocks and the app loads
3. Refresh — confirm it stays unlocked (session persists)
4. Open `<your-url>?demo=1` — confirm no gate, "Demo" badge appears, sample data loads
5. In demo, check a task — confirm it moves to completed section
6. In demo, add a task — confirm it appears in the active list
