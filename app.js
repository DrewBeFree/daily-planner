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
}

document.addEventListener('DOMContentLoaded', init);
