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

async function loadArchivedLists() { /* implemented in Task 8 */ }

// ── Auto-print ─────────────────────────────────────────────────────────────

function checkAutoPrint() {
  if (new URLSearchParams(window.location.search).get('print') === '1') {
    window.addEventListener('load', () => setTimeout(() => window.print(), 800));
  }
}

// ── Init ───────────────────────────────────────────────────────────────────

async function init() {
  checkAutoPrint();
  await loadTasks();
  await loadGroceries();
}

document.addEventListener('DOMContentLoaded', init);
