// js/widgets/todo.js
import { $, esc } from '../utils.js';
import { api } from '../api.js';

let todos = [];

export async function loadTodos() {
  todos = await api('/api/todos');
  renderTodos();
}

export function renderTodos() {
  const body = $('body-todo');
  if (!body) return;
  const pending = todos.filter(t => !t.done);
  $('badge-todo').textContent = `${pending.length} en cours`;
  if (!todos.length) { body.innerHTML = '<div class="empty">Aucune tâche</div>'; return; }
  const PRIORITY_ICON = { haute: '🔴', normal: '🔵', basse: '⚪' };
  body.innerHTML = todos.map(t => `
    <div class="todo-item ${t.done ? 'done' : ''}" id="todo-${t.id}">
      <input type="checkbox" id="chk-${t.id}" ${t.done ? 'checked' : ''}
        data-id="${t.id}">
      <label for="chk-${t.id}">${PRIORITY_ICON[t.priority] || '🔵'} ${esc(t.title)}</label>
      <button class="btn-icon btn-delete-todo" data-id="${t.id}" title="Supprimer">×</button>
    </div>
  `).join('');

  // Add listeners
  body.querySelectorAll('input[type="checkbox"]').forEach(el => {
    el.onchange = e => toggleTodo(parseInt(e.target.dataset.id), e.target.checked);
  });
  body.querySelectorAll('.btn-delete-todo').forEach(el => {
    el.onclick = e => deleteTodo(parseInt(e.target.dataset.id));
  });
}

export async function addTodo() {
  const input = $('todo-input');
  const priority = $('todo-priority').value;
  const title = input.value.trim();
  if (!title) return;
  await api('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, priority }),
  });
  input.value = '';
  await loadTodos();
}

export async function toggleTodo(id, done) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  await api(`/api/todos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done, title: todo.title, priority: todo.priority }),
  });
  await loadTodos();
}

export async function deleteTodo(id) {
  await api(`/api/todos/${id}`, { method: 'DELETE' });
  await loadTodos();
}

// Global exposure for HTML onclicks (temporary during migration)
window.addTodo = addTodo;
