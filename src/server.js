const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ─── In-Memory Store ────────────────────────────────────────────────────────
const tasks = new Map();
let idCounter = 1;

const STATUSES = ['todo', 'in-progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

function createTask({ title, description = '', priority = 'medium', status = 'todo', dueDate = null, tags = [] }) {
  const id = String(idCounter++);
  const task = {
    id,
    title,
    description,
    priority,
    status,
    dueDate,
    tags: Array.isArray(tags) ? tags : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tasks.set(id, task);
  return task;
}

// Seed with a few demo tasks
createTask({ title: 'Set up project structure', description: 'Initialize repo and install dependencies', priority: 'high', status: 'done', tags: ['setup'] });
createTask({ title: 'Build REST API', description: 'Create CRUD endpoints for tasks', priority: 'high', status: 'in-progress', tags: ['backend'] });
createTask({ title: 'Design frontend UI', description: 'Create clean HTML/CSS/JS interface', priority: 'medium', status: 'in-progress', tags: ['frontend'] });
createTask({ title: 'Write unit tests', description: 'Cover core business logic', priority: 'medium', status: 'todo', tags: ['testing'] });
createTask({ title: 'Set up CI/CD pipeline', description: 'GitHub Actions → Render deploy', priority: 'low', status: 'todo', tags: ['devops'] });

// ─── API Routes ──────────────────────────────────────────────────────────────

// GET /api/tasks  — list with optional filters
app.get('/api/tasks', (req, res) => {
  let result = [...tasks.values()];
  const { status, priority, search, tags } = req.query;

  if (status && STATUSES.includes(status)) result = result.filter(t => t.status === status);
  if (priority && PRIORITIES.includes(priority)) result = result.filter(t => t.priority === priority);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }
  if (tags) {
    const tagList = tags.split(',').map(s => s.trim().toLowerCase());
    result = result.filter(t => tagList.some(tag => t.tags.map(x => x.toLowerCase()).includes(tag)));
  }

  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, count: result.length, data: result });
});

// GET /api/tasks/:id
app.get('/api/tasks/:id', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  res.json({ success: true, data: task });
});

// POST /api/tasks
app.post('/api/tasks', (req, res) => {
  const { title, description, priority, status, dueDate, tags } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ success: false, message: 'Title is required' });
  if (priority && !PRIORITIES.includes(priority)) return res.status(400).json({ success: false, message: 'Invalid priority' });
  if (status && !STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

  const task = createTask({ title: title.trim(), description, priority, status, dueDate, tags });
  res.status(201).json({ success: true, data: task });
});

// PATCH /api/tasks/:id
app.patch('/api/tasks/:id', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  const { title, description, priority, status, dueDate, tags } = req.body;
  if (title !== undefined) task.title = title.trim();
  if (description !== undefined) task.description = description;
  if (priority !== undefined) {
    if (!PRIORITIES.includes(priority)) return res.status(400).json({ success: false, message: 'Invalid priority' });
    task.priority = priority;
  }
  if (status !== undefined) {
    if (!STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    task.status = status;
  }
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (tags !== undefined) task.tags = Array.isArray(tags) ? tags : [];
  task.updatedAt = new Date().toISOString();

  tasks.set(task.id, task);
  res.json({ success: true, data: task });
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', (req, res) => {
  if (!tasks.has(req.params.id)) return res.status(404).json({ success: false, message: 'Task not found' });
  tasks.delete(req.params.id);
  res.json({ success: true, message: 'Task deleted' });
});

// GET /api/stats
app.get('/api/stats', (req, res) => {
  const all = [...tasks.values()];
  res.json({
    success: true,
    data: {
      total: all.length,
      todo: all.filter(t => t.status === 'todo').length,
      inProgress: all.filter(t => t.status === 'in-progress').length,
      done: all.filter(t => t.status === 'done').length,
      high: all.filter(t => t.priority === 'high').length,
      medium: all.filter(t => t.priority === 'medium').length,
      low: all.filter(t => t.priority === 'low').length,
    }
  });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime(), tasks: tasks.size }));

// Catch-all → index.html
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Task Manager running on http://localhost:${PORT}`));

module.exports = app;
