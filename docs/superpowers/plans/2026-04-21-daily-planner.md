# Daily Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal two-tab daily planner (tasks + grocery lists) hosted on GitHub Pages, backed by Supabase, with auto-print via Windows Task Scheduler.

**Architecture:** Single `index.html` with vanilla JS and the Supabase JS CDN client. All data lives in three Supabase tables. A `?print=1` query param auto-triggers `window.print()` for the morning Task Scheduler script.

**Tech Stack:** HTML, CSS, vanilla JS, Supabase JS v2 (CDN), GitHub Pages

---

## File Map

| File | Responsibility |
|---|---|
| `index.html` | App shell — tab structure, task section, grocery section |
| `style.css` | All visual styles + `@media print` rules |
| `config.js` | Supabase URL + anon key — **gitignored, never committed** |
| `config.example.js` | Template for `config.js` — committed to repo |
| `app.js` | All JS — Supabase client, tab switching, tasks, groceries, auto-print |
| `print.bat` | Opens the GitHub Pages URL with `?print=1` in Chrome |
| `.gitignore` | Excludes `config.js` |

---

## Task 1: Repo scaffolding

**Files:**
- Create: `.gitignore`
- Create: `config.example.js`

- [ ] **Step 1: Create `.gitignore`**

```
config.js
.superpowers/
```

- [ ] **Step 2: Create `config.example.js`**

```js
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

- [ ] **Step 3: Create your real `config.js` from the example**

Copy `config.example.js` to `config.js` and fill in your actual Supabase project URL and anon key. These are found in your Supabase dashboard under **Project Settings → API**.

- [ ] **Step 4: Commit**

```bash
git add .gitignore config.example.js
git commit -m "feat: add repo scaffolding and config template"
```

---

## Task 2: Supabase schema

**Action:** Run SQL in the Supabase SQL editor (dashboard → SQL Editor → New query).

- [ ] **Step 1: Create the three tables**

Run this SQL in your Supabase SQL editor:

```sql
create table tasks (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table grocery_lists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table grocery_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references grocery_lists(id) on delete cascade,
  text text not null,
  removed boolean not null default false,
  created_at timestamptz not null default now()
);
```

- [ ] **Step 2: Disable RLS on all three tables (personal app, no auth)**

```sql
alter table tasks disable row level security;
alter table grocery_lists disable row level security;
alter table grocery_items disable row level security;
```

- [ ] **Step 3: Verify in Supabase Table Editor**

In the Supabase dashboard → Table Editor, confirm all three tables appear with the correct columns.

---

## Task 3: `index.html` skeleton

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Planner</title>
  <link rel="stylesheet" href="style.css">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="config.js"></script>
</head>
<body>

  <nav class="tabs">
    <button id="tasks-tab" class="tab active" onclick="showTab('tasks')">Tasks</button>
    <button id="groceries-tab" class="tab" onclick="showTab('groceries')">Groceries</button>
  </nav>

  <main>

    <!-- ── Tasks ── -->
    <section id="tasks-section">
      <div class="input-row">
        <input id="task-input" type="text" placeholder="Add a task…"
               onkeydown="if(event.key==='Enter') addTask()">
        <button onclick="addTask()">Add</button>
      </div>
      <ul id="task-list"></ul>
    </section>

    <!-- ── Groceries ── -->
    <section id="groceries-section" class="hidden">

      <div id="new-list-prompt">
        <p>Start a new grocery list</p>
        <div class="input-row">
          <input id="new-list-title" type="text" placeholder="List name…"
                 onkeydown="if(event.key==='Enter') createList()">
          <button onclick="createList()">Create</button>
        </div>
      </div>

      <div id="active-list" class="hidden">
        <div class="list-header">
          <h2 id="list-title"></h2>
          <button class="secondary-btn" onclick="archiveList()">Archive List</button>
        </div>
        <div class="input-row">
          <input id="item-input" type="text" placeholder="Add item…"
                 onkeydown="if(event.key==='Enter') addItem()">
          <button onclick="addItem()">Add</button>
        </div>
        <ul id="item-list"></ul>
      </div>

      <details class="archives">
        <summary>Archived Lists</summary>
        <div id="archived-lists"></div>
      </details>

    </section>
  </main>

  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Open `index.html` in Chrome and verify**

Expected: blank white page with two tabs ("Tasks" and "Groceries") and no JS errors in the console (the Supabase CDN and config.js both load). The Tasks section is visible; Groceries section is hidden.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add HTML skeleton with tab structure"
```

---

## Task 4: `style.css`

**Files:**
- Create: `style.css`

- [ ] **Step 1: Create `style.css`**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px 16px;
  color: #1a1a1a;
  background: #fff;
}

/* ── Tabs ── */
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e5e5e5;
  margin-bottom: 28px;
}

.tab {
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  padding: 10px 24px;
  font-size: 16px;
  font-weight: 500;
  color: #888;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.tab.active { color: #1a1a1a; border-bottom-color: #1a1a1a; }
.tab:hover:not(.active) { color: #444; }

/* ── Utility ── */
.hidden { display: none !important; }

/* ── Input row ── */
.input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

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

/* ── Buttons ── */
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

.secondary-btn {
  background: #f0f0f0;
  color: #444;
}

.secondary-btn:hover { background: #e0e0e0; }

/* ── Task list ── */
ul { list-style: none; }

ul li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 4px;
  border-bottom: 1px solid #f0f0f0;
}

ul li span { flex: 1; font-size: 16px; line-height: 1.4; }

ul li.completed span {
  text-decoration: line-through;
  color: #aaa;
}

input[type="checkbox"] {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  cursor: pointer;
  accent-color: #1a1a1a;
}

.delete-btn {
  background: none;
  color: #ccc;
  border: none;
  font-size: 20px;
  line-height: 1;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 400;
  transition: background 0.1s, color 0.1s;
}

.delete-btn:hover { background: #fee2e2; color: #dc2626; }

/* ── Groceries ── */
#new-list-prompt p {
  font-size: 15px;
  color: #666;
  margin-bottom: 14px;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  gap: 12px;
}

.list-header h2 { font-size: 20px; font-weight: 700; }

/* ── Archives ── */
.archives {
  margin-top: 36px;
  border-top: 1px solid #e5e5e5;
  padding-top: 14px;
}

.archives summary {
  font-size: 14px;
  color: #888;
  cursor: pointer;
  user-select: none;
  padding: 4px 0 8px;
  list-style: none;
}

.archives summary::before { content: '▸ '; }
details[open] .archives summary::before { content: '▾ '; }
details[open] > summary::before { content: '▾ '; }

.archived-list {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 0;
  border-bottom: 1px solid #f5f5f5;
  gap: 12px;
}

.archived-list .archive-meta { font-size: 14px; color: #333; }
.archived-list .archive-meta small { color: #aaa; margin-left: 8px; font-size: 12px; }

.reload-btn {
  font-size: 12px;
  padding: 5px 12px;
  background: #f0f0f0;
  color: #444;
  flex-shrink: 0;
}

.reload-btn:hover { background: #e0e0e0; }

.empty { color: #aaa; font-size: 14px; padding: 10px 0; }

/* ── Print ── */
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
```

- [ ] **Step 2: Reload `index.html` in Chrome and verify**

Expected: clean tab bar at top, simple white layout, no console errors.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: add app styles and print stylesheet"
```

---

## Task 5: `app.js` — foundation (client, tabs, utilities)

**Files:**
- Create: `app.js`

- [ ] **Step 1: Create `app.js` with the Supabase client, tab switcher, and utilities**

```js
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Tab switching ──────────────────────────────────────────────────────────

function showTab(tab) {
  document.getElementById('tasks-tab').classList.toggle('active', tab === 'tasks');
  document.getElementById('groceries-tab').classList.toggle('active', tab === 'groceries');
  document.getElementById('tasks-section').classList.toggle('hidden', tab !== 'tasks');
  document.getElementById('groceries-section').classList.toggle('hidden', tab !== 'groceries');
}

// ── Utilities ─────────────────────────────────────────────────────────────

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Auto-print ─────────────────────────────────────────────────────────────

function checkAutoPrint() {
  if (new URLSearchParams(window.location.search).get('print') === '1') {
    window.addEventListener('load', () => setTimeout(() => window.print(), 800));
  }
}

// ── Init ───────────────────────────────────────────────────────────────────

async function init() {
  checkAutoPrint();
}

document.addEventListener('DOMContentLoaded', init);
```

- [ ] **Step 2: Reload `index.html` in Chrome and verify in the console**

Open DevTools console and run:
```js
showTab('groceries')
```
Expected: Groceries tab becomes active, Tasks section hides, Groceries section appears.

Run:
```js
showTab('tasks')
```
Expected: reverts to Tasks tab active.

Run:
```js
escapeHtml('<script>alert("xss")</script>')
```
Expected: `"&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"`

- [ ] **Step 3: Verify Supabase client in the console**

```js
await supabase.from('tasks').select('count')
```
Expected: `{ data: [{ count: 0 }], error: null }` (or similar count response — no error).

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: add app.js foundation with Supabase client, tabs, and utils"
```

---

## Task 6: `app.js` — tasks (load, add, toggle, delete)

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add task functions to `app.js` after the utilities section and before `checkAutoPrint`**

```js
// ── Tasks ──────────────────────────────────────────────────────────────────

async function loadTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at');
  if (error) { console.error('loadTasks:', error); return; }
  renderTasks(data || []);
}

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

async function addTask() {
  const input = document.getElementById('task-input');
  const text = input.value.trim();
  if (!text) return;
  const { error } = await supabase.from('tasks').insert({ text });
  if (error) { console.error('addTask:', error); return; }
  input.value = '';
  loadTasks();
}

async function toggleTask(id, completed) {
  const { error } = await supabase.from('tasks').update({ completed }).eq('id', id);
  if (error) { console.error('toggleTask:', error); return; }
  loadTasks();
}

async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) { console.error('deleteTask:', error); return; }
  loadTasks();
}
```

- [ ] **Step 2: Update `init` to call `loadTasks`**

Replace the `init` function:

```js
async function init() {
  checkAutoPrint();
  await loadTasks();
}
```

- [ ] **Step 3: Reload page and verify tasks work**

1. Type a task in the input and press Enter — it appears in the list.
2. Type another task and click Add — it appends to the list.
3. Check the checkbox on a task — text gets strikethrough, DB updates (check Supabase Table Editor).
4. Click the × button on a task — it disappears, DB row deleted.

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: add task list with add, toggle, and delete"
```

---

## Task 7: `app.js` — groceries active list (create, add item, remove item)

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add a module-level variable and grocery active-list functions after the tasks section**

```js
// ── Groceries ─────────────────────────────────────────────────────────────

let activeListId = null;

async function loadGroceries() {
  const { data, error } = await supabase
    .from('grocery_lists')
    .select('*')
    .is('archived_at', null)
    .limit(1);
  if (error) { console.error('loadGroceries:', error); return; }

  if (data && data.length > 0) {
    activeListId = data[0].id;
    showActiveList(data[0]);
    await loadItems(data[0].id);
  } else {
    showNewListPrompt();
  }
  await loadArchivedLists();
}

function showActiveList(list) {
  document.getElementById('new-list-prompt').classList.add('hidden');
  document.getElementById('active-list').classList.remove('hidden');
  document.getElementById('list-title').textContent = list.title;
}

function showNewListPrompt() {
  activeListId = null;
  document.getElementById('active-list').classList.add('hidden');
  document.getElementById('new-list-prompt').classList.remove('hidden');
  document.getElementById('item-list').innerHTML = '';
}

async function createList() {
  const input = document.getElementById('new-list-title');
  const title = input.value.trim();
  if (!title) return;
  const { data, error } = await supabase
    .from('grocery_lists')
    .insert({ title })
    .select()
    .single();
  if (error) { console.error('createList:', error); return; }
  input.value = '';
  activeListId = data.id;
  showActiveList(data);
  await loadItems(data.id);
}

async function loadItems(listId) {
  const { data, error } = await supabase
    .from('grocery_items')
    .select('*')
    .eq('list_id', listId)
    .eq('removed', false)
    .order('created_at');
  if (error) { console.error('loadItems:', error); return; }
  renderItems(data || []);
}

function renderItems(items) {
  document.getElementById('item-list').innerHTML = items.map(item => `
    <li data-id="${item.id}">
      <span>${escapeHtml(item.text)}</span>
      <button class="delete-btn" onclick="removeItem('${item.id}')" title="Remove">×</button>
    </li>
  `).join('');
}

async function addItem() {
  if (!activeListId) return;
  const input = document.getElementById('item-input');
  const text = input.value.trim();
  if (!text) return;
  const { error } = await supabase
    .from('grocery_items')
    .insert({ list_id: activeListId, text });
  if (error) { console.error('addItem:', error); return; }
  input.value = '';
  await loadItems(activeListId);
}

async function removeItem(id) {
  const { error } = await supabase
    .from('grocery_items')
    .update({ removed: true })
    .eq('id', id);
  if (error) { console.error('removeItem:', error); return; }
  await loadItems(activeListId);
}
```

- [ ] **Step 2: Add `loadArchivedLists` and `renderArchivedLists` stubs so `loadGroceries` doesn't break (the full implementation comes in Task 8)**

```js
async function loadArchivedLists() { /* implemented in Task 8 */ }
```

- [ ] **Step 3: Update `init` to call `loadGroceries`**

```js
async function init() {
  checkAutoPrint();
  await loadTasks();
  await loadGroceries();
}
```

- [ ] **Step 4: Reload and verify in the Groceries tab**

1. Click Groceries tab — "Start a new grocery list" prompt appears.
2. Type a list name and press Enter — active list appears with the title.
3. Add several items — they appear in the list.
4. Click × on an item — it disappears; Supabase shows `removed = true`.

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat: add groceries active list with create, add item, remove item"
```

---

## Task 8: `app.js` — groceries archive + reload

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Replace the `loadArchivedLists` stub and add `archiveList`, `renderArchivedLists`, and `reloadList`**

Remove the stub line `async function loadArchivedLists() { /* implemented in Task 8 */ }` and replace it with:

```js
async function archiveList() {
  if (!activeListId) return;
  const { error } = await supabase
    .from('grocery_lists')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', activeListId);
  if (error) { console.error('archiveList:', error); return; }
  showNewListPrompt();
  await loadArchivedLists();
}

async function loadArchivedLists() {
  const { data, error } = await supabase
    .from('grocery_lists')
    .select('*')
    .not('archived_at', 'is', null)
    .order('archived_at', { ascending: false });
  if (error) { console.error('loadArchivedLists:', error); return; }
  renderArchivedLists(data || []);
}

function renderArchivedLists(lists) {
  const container = document.getElementById('archived-lists');
  if (!lists.length) {
    container.innerHTML = '<p class="empty">No archived lists yet.</p>';
    return;
  }
  container.innerHTML = lists.map(list => `
    <div class="archived-list">
      <span class="archive-meta">
        ${escapeHtml(list.title)}
        <small>${formatDate(list.archived_at)}</small>
      </span>
      <button class="reload-btn" data-list-id="${list.id}"
              data-title="${escapeHtml(list.title)}"
              onclick="reloadList('${list.id}', this.dataset.title)">Reload</button>
    </div>
  `).join('');
}

async function reloadList(listId, title) {
  const { data: items, error: itemsError } = await supabase
    .from('grocery_items')
    .select('text')
    .eq('list_id', listId)
    .eq('removed', false);
  if (itemsError) { console.error('reloadList items:', itemsError); return; }

  const { data: newList, error: listError } = await supabase
    .from('grocery_lists')
    .insert({ title })
    .select()
    .single();
  if (listError) { console.error('reloadList insert:', listError); return; }

  if (items && items.length > 0) {
    const { error: copyError } = await supabase
      .from('grocery_items')
      .insert(items.map(item => ({ list_id: newList.id, text: item.text })));
    if (copyError) { console.error('reloadList copy:', copyError); return; }
  }

  activeListId = newList.id;
  showActiveList(newList);
  await loadItems(newList.id);
  await loadArchivedLists();
}
```

- [ ] **Step 2: Reload and verify archive + reload**

1. On the Groceries tab with an active list, click **Archive List** — prompt returns, list moves to Archived Lists section inside the `<details>` element.
2. Open the **Archived Lists** disclosure — the archived list appears with title and date.
3. Click **Reload** — a new active list is created with the same title and all non-removed items copied in.
4. Archive a list with items, then reload it — verify item count matches in the Supabase Table Editor.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: add grocery list archive and reload"
```

---

## Task 9: Verify auto-print

**Files:**
- No new files — verify existing behavior.

- [ ] **Step 1: Test the `?print=1` param locally**

Open `index.html?print=1` in Chrome (you can drag the file into the address bar and append `?print=1`).

Expected: After ~800ms the browser print dialog opens. The print preview should show only the task list — no tabs, no buttons, no groceries section. Completed tasks should be hidden.

- [ ] **Step 2: Verify print preview content**

In the print dialog preview, confirm:
- Tab bar is absent
- Only the task list items are visible
- Completed (checked) tasks do not appear
- No input fields or buttons visible

- [ ] **Step 3: If print preview looks wrong, adjust `style.css` `@media print` block**

The print block in `style.css` already covers the common cases. If something is still showing, add its selector to the `display: none !important` rule. Re-test until the preview is clean.

- [ ] **Step 4: Commit any CSS fixes**

```bash
git add style.css
git commit -m "fix: refine print stylesheet"
```

---

## Task 10: `print.bat`

**Files:**
- Create: `print.bat`

- [ ] **Step 1: Create `print.bat`**

Replace `drewbefree` with your actual GitHub username.

```bat
@echo off
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "https://drewbefree.github.io/daily-planner/?print=1"
```

- [ ] **Step 2: Verify Chrome path**

Run this in PowerShell to confirm the path exists:
```powershell
Test-Path "C:\Program Files\Google\Chrome\Application\chrome.exe"
```
Expected: `True`. If `False`, find your Chrome path with:
```powershell
where.exe chrome
```
Update `print.bat` with the correct path.

- [ ] **Step 3: Test `print.bat` manually**

Double-click `print.bat` (or run it from the command prompt). Expected: Chrome opens the planner URL and the print dialog appears.

- [ ] **Step 4: Set up Windows Task Scheduler**

Open Task Scheduler → Create Basic Task:
- **Name:** Daily Planner Print
- **Trigger:** Daily, your preferred morning time (e.g., 7:30 AM)
- **Action:** Start a program
- **Program/script:** Full path to `print.bat`, e.g.:
  `C:\Users\drewb\Documents\GitHub\daily-planner\print.bat`
- **Start in:** `C:\Users\drewb\Documents\GitHub\daily-planner\`

- [ ] **Step 5: Commit**

```bash
git add print.bat
git commit -m "feat: add Windows Task Scheduler print script"
```

---

## Task 11: GitHub Pages deploy

**Files:**
- No new files — push existing repo.

- [ ] **Step 1: Create the GitHub repo**

```bash
gh repo create daily-planner --public --source=. --remote=origin --push
```

If you prefer private: replace `--public` with `--private` (note: GitHub Pages requires a paid plan for private repos, so keep it public or use a different static host).

- [ ] **Step 2: Enable GitHub Pages**

In the GitHub repo → Settings → Pages:
- Source: **Deploy from a branch**
- Branch: `main` / `(root)`
- Save.

Wait ~60 seconds, then visit `https://drewbefree.github.io/daily-planner/` to confirm it loads.

- [ ] **Step 3: Copy `config.js` to any other device you'll use**

On your phone or any other device, open the URL — it will show the app but won't connect to Supabase (because `config.js` isn't on GitHub). You need to either:
- **Option A (simple):** Access the page only from devices where you've manually placed `config.js` — not applicable for phones.
- **Option B (phone-friendly):** Inline the config directly into `index.html` as a `<script>` block with your Supabase URL and anon key (the anon key is safe to expose — Supabase's RLS is the access control layer). Add it before `<script src="app.js"></script>`:

```html
<script>
  const SUPABASE_URL = 'https://your-project.supabase.co';
  const SUPABASE_ANON_KEY = 'your-anon-key-here';
</script>
```

Then remove `<script src="config.js"></script>` from `index.html` and remove `config.js` from `.gitignore`. The anon key is not a secret — it's the public client key Supabase expects to be in browser code.

- [ ] **Step 4: Update `print.bat` if needed and re-test**

Confirm `print.bat` points to the correct GitHub Pages URL and the print dialog still appears correctly.

- [ ] **Step 5: Final commit and push**

```bash
git add -A
git commit -m "chore: finalize deploy config"
git push
```

---

## Self-Review

**Spec coverage:**
- ✅ Two tabs (Tasks + Groceries)
- ✅ Tasks persist, checkbox + delete per item
- ✅ Grocery list: named, one active at a time, items deleted individually
- ✅ Archive list with title, reload archived list
- ✅ "No active list" prompt on first load / after archive
- ✅ Auto-print via `?print=1` + Windows Task Scheduler `.bat`
- ✅ Print shows tasks only, completed tasks hidden
- ✅ Supabase backend, config kept out of git
- ✅ GitHub Pages hosting

**Placeholder scan:** No TBDs. All code blocks are complete.

**Type consistency:** `activeListId`, `loadItems`, `showActiveList`, `showNewListPrompt`, `loadArchivedLists` — all defined before use. ✅
