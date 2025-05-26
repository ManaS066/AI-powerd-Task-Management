import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './TaskManager.css';

const API = 'http://localhost:5000';

function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', status: '', priority: '', deadline: '', category: '' });
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', category: '' });
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchStats();
    fetchCategories();
  }, []);

  // Fetch tasks with filters and search
  const fetchTasks = async () => {
    setLoading(true);
    try {
      let url = `${API}/tasks?`;
      if (filters.status) url += `status=${filters.status}&`;
      if (filters.priority) url += `priority=${filters.priority}&`;
      if (filters.category) url += `category=${filters.category}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      const res = await axios.get(url);
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setTasks([]);
      alert('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/stats`);
      setStats(res.data);
    } catch {}
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/categories`);
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch {}
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePredict = async () => {
    if (!form.title || !form.description) return alert('Enter title and description for prediction');
    try {
      setPredicting(true);
      const res = await axios.post(`${API}/predict_category`, {
        title: form.title,
        description: form.description,
      });
      setForm({ ...form, category: res.data.predicted_category });
    } catch (error) {
      alert('Prediction failed.');
    } finally {
      setPredicting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/tasks`, form);
      setForm({ title: '', description: '', status: '', priority: '', deadline: '', category: '' });
      fetchTasks();
      fetchStats();
      fetchCategories();
    } catch (error) {
      alert('Failed to add task');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/tasks/${id}`);
      fetchTasks();
      fetchStats();
      fetchCategories();
    } catch (error) {
      alert('Failed to delete task');
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilterApply = () => {
    fetchTasks();
  };

  const handleExport = async (format = 'csv') => {
    try {
      const res = await axios.get(`${API}/export?format=${format}`);
      if (format === 'csv') {
        const blob = new Blob([res.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tasks.csv';
        a.click();
      } else {
        // For JSON, just download as .json
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tasks.json';
        a.click();
      }
    } catch {
      alert('Export failed');
    }
  };

  return (
    <div className="task-manager">
      <h2>📝 AI Task Manager</h2>

      {/* Stats */}
      {stats && (
        <div className="stats">
          <span>Total: {stats.total_tasks}</span>
          <span>Completed: {stats.completed_tasks}</span>
          <span>In Progress: {stats.in_progress_tasks}</span>
          <span>Overdue: {stats.overdue_tasks}</span>
          <span>Due Soon: {stats.due_soon_tasks}</span>
          <span>Completion Rate: {stats.completion_rate}%</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="filters">
        <input placeholder="Search..." value={search} onChange={handleSearch} />
        <select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">All Status</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select name="priority" value={filters.priority} onChange={handleFilterChange}>
          <option value="">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select name="category" value={filters.category} onChange={handleFilterChange}>
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button onClick={handleFilterApply}>Apply</button>
        <button onClick={() => { setFilters({ status: '', priority: '', category: '' }); setSearch(''); fetchTasks(); }}>Reset</button>
        <button onClick={() => handleExport('csv')}>Export CSV</button>
        <button onClick={() => handleExport('json')}>Export JSON</button>
      </div>

     

      {/* Add Task Modal */}
      {showModal && (
        <div className="modal-bg" onClick={() => setShowModal(false)}>
          <div className="modal-content enhanced-modal" onClick={e => e.stopPropagation()}>
            <button
              className="close-modal-btn"
              onClick={() => setShowModal(false)}
              aria-label="Close"
              type="button"
            >
              &times;
            </button>
            <h2 className="modal-title">Add New Task</h2>
            <form
  className="task-form"
  onSubmit={(e) => {
    handleSubmit(e);
    setShowModal(false);
  }}
  autoComplete="on"
>
  <div className="form-group">
    <label>
      <span>Title <span className="required">*</span></span>
      <input
        name="title"
        placeholder="Task title"
        value={form.title}
        onChange={handleChange}
        required
        autoFocus
      />
    </label>

    <label>
      <span>Description <span className="required">*</span></span>
      <textarea
        name="description"
        placeholder="Describe the task"
        value={form.description}
        onChange={handleChange}
        required
        rows={3}
      />
    </label>
  </div>

  <div className="form-row">
    <label>
      <span>Status</span>
      <select name="status" value={form.status} onChange={handleChange}>
        <option value="">Select status</option>
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
    </label>
    <label>
      <span>Priority</span>
      <select name="priority" value={form.priority} onChange={handleChange}>
        <option value="">Select priority</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </label>
  </div>

  <div className="form-row">
    <label>
      <span>Deadline</span>
      <input
        name="deadline"
        type="date"
        value={form.deadline}
        onChange={handleChange}
      />
    </label>

    <label>
      <span>Category</span>
      <div className="category-group">
        <input
          name="category"
          placeholder="Predicted category"
          value={form.category}
          onChange={handleChange}
          readOnly
          className="predicted-category"
        />
        <button
          type="button"
          className="predict-btn"
          onClick={handlePredict}
          disabled={predicting}
        >
          {predicting ? 'Predicting...' : 'Predict'}
        </button>
      </div>
    </label>
  </div>

  <div className="button-group">
    <button type="submit" className="submit-btn">➕ Add Task</button>
    <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>❌ Cancel</button>
  </div>
</form>

          </div>
        </div>
      )}

      <hr />

      {/* Task List */}
      <div className="task-list">
        <h3>📋 Tasks ({tasks.length})</h3>
        {loading ? (
          <p>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p>No tasks found.</p>
        ) : (
          <ul>
            {tasks.map((t) => (
              <li key={t.id} className="task-item">
                <div>
                  <strong>{t.title}</strong>
                  <p>{t.description}</p>
                  <span className="badge">{t.category}</span>
                  <span className="meta">
                    Status: <b>{t.status}</b> | Priority: <b>{t.priority}</b> | Deadline: <b>{t.deadline}</b>
                  </span>
                </div>
                <button className="delete-btn" onClick={() => handleDelete(t.id)}>❌</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      
       {/* Add Task Button */}
      <div className="add-task-btn-container" style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
        <button className="add-task-btn" onClick={() => setShowModal(true)}>
          ➕ Add Task
        </button>
      </div>
    </div>
  );
}

export default TaskManager;
