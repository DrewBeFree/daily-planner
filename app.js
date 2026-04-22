let db;

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

// ── Tasks ──────────────────────────────────────────────────────────────────

async function loadTasks() {
  const { data, error } = await db
    .from('tasks')
    .select('*')
    .order('created_at');
  if (error) { console.error('loadTasks:', error); return; }
  renderTasks(data || []);
}

function renderTasks(tasks) {
  const active = tasks.filter(t => !t.completed);
  const done = tasks.filter(t => t.completed);

  document.getElementById('task-list').innerHTML = active.length === 0
    ? '<li style="padding:10px 4px"><span class="empty">All caught up.</span></li>'
    : active.map(t => `
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

async function addTask() {
  const input = document.getElementById('task-input');
  const text = input.value.trim();
  if (!text) return;
  const { error } = await db.from('tasks').insert({ text });
  if (error) { console.error('addTask:', error); return; }
  input.value = '';
  loadTasks();
}

async function toggleTask(id, completed) {
  const { error } = await db.from('tasks').update({ completed }).eq('id', id);
  if (error) { console.error('toggleTask:', error); return; }
  loadTasks();
}

async function deleteTask(id) {
  const { error } = await db.from('tasks').delete().eq('id', id);
  if (error) { console.error('deleteTask:', error); return; }
  loadTasks();
}

// ── Groceries ─────────────────────────────────────────────────────────────

let activeListId = null;

async function loadGroceries() {
  const { data, error } = await db
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
  const { data, error } = await db
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
  const { data, error } = await db
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
      <input type="checkbox" onchange="this.closest('li').classList.toggle('checked', this.checked)">
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
  const { error } = await db
    .from('grocery_items')
    .insert({ list_id: activeListId, text });
  if (error) { console.error('addItem:', error); return; }
  input.value = '';
  await loadItems(activeListId);
}

async function removeItem(id) {
  const { error } = await db
    .from('grocery_items')
    .update({ removed: true })
    .eq('id', id);
  if (error) { console.error('removeItem:', error); return; }
  await loadItems(activeListId);
}

async function archiveList() {
  if (!activeListId) return;
  const { error } = await db
    .from('grocery_lists')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', activeListId);
  if (error) { console.error('archiveList:', error); return; }
  showNewListPrompt();
  await loadArchivedLists();
}

async function loadArchivedLists() {
  const { data, error } = await db
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
  const { data: items, error: itemsError } = await db
    .from('grocery_items')
    .select('text')
    .eq('list_id', listId)
    .eq('removed', false);
  if (itemsError) { console.error('reloadList items:', itemsError); return; }

  const { data: newList, error: listError } = await db
    .from('grocery_lists')
    .insert({ title })
    .select()
    .single();
  if (listError) { console.error('reloadList insert:', listError); return; }

  if (items && items.length > 0) {
    const { error: copyError } = await db
      .from('grocery_items')
      .insert(items.map(item => ({ list_id: newList.id, text: item.text })));
    if (copyError) { console.error('reloadList copy:', copyError); return; }
  }

  activeListId = newList.id;
  showActiveList(newList);
  await loadItems(newList.id);
  await loadArchivedLists();
}

// ── Auto-print ─────────────────────────────────────────────────────────────

function checkAutoPrint() {
  if (new URLSearchParams(window.location.search).get('print') === '1') {
    window.addEventListener('load', () => setTimeout(() => window.print(), 800));
  }
}

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
  let archived = [
    { id: 'g2', title: 'Costco Run', archived_at: '2026-04-15T12:00:00Z' },
  ];
  let activeList = { id: 'g1', title: 'Weekly Shop' };

  activeListId = 'g1';
  showActiveList(activeList);
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
    archived.push({ id: activeList.id, title: activeList.title, archived_at: new Date().toISOString() });
    showNewListPrompt();
    renderArchivedLists(archived);
  };

  window.createList = () => {
    const input = document.getElementById('new-list-title');
    const title = input.value.trim();
    if (!title) return;
    activeList = { id: String(Date.now()), title };
    input.value = '';
    activeListId = activeList.id;
    showActiveList(activeList);
    renderItems([]);
  };

  window.reloadList = (listId, title) => {
    activeList = { id: String(Date.now()), title };
    activeListId = activeList.id;
    showActiveList(activeList);
    renderItems(items.filter(i => i.list_id === listId && !i.removed));
  };
}

// ── Init ───────────────────────────────────────────────────────────────────

async function init() {
  await window.authReady;
  if (window.isDemo) { initDemo(); return; }
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  checkAutoPrint();
  await loadTasks();
  await loadGroceries();
}

document.addEventListener('DOMContentLoaded', () => init().catch(err => console.error('[init]', err)));
