import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FolderClosed, Users } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", key: "", description: "" });
  const [error, setError] = useState("");
  const { user } = useAuth();

  const load = () => {
    setLoading(true);
    api
      .get("/projects")
      .then((res) => setProjects(res.data.projects))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const canCreate = user?.role === "admin" || user?.role === "developer";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/projects", form);
      setForm({ name: "", key: "", description: "" });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create project");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[18px] font-semibold text-ink-primary tracking-tight">Projects</h1>
          <p className="text-ink-tertiary text-[13px] mt-0.5">All projects being tracked</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-1.5">
            <Plus size={14} /> New Project
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="panel p-5 mb-6 space-y-4">
          {error && (
            <div className="bg-severity-p0/10 border border-severity-p0/30 text-severity-p0 text-[13px] px-3 py-2 rounded-md">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Project name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Project key (e.g. APP)</label>
              <input
                className="input"
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase() })}
                maxLength={6}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary">
            Create Project
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center text-ink-tertiary text-[13px] py-12">Loading projects</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link key={p._id} to={`/projects/${p._id}`} className="panel p-5 hover:border-ink-tertiary transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-accent-soft text-accent p-2 rounded-md">
                  <FolderClosed size={16} />
                </div>
                <span className="mono-tag bg-surface-raised text-ink-tertiary px-2 py-1 rounded border border-stroke">
                  {p.key}
                </span>
              </div>
              <h3 className="font-semibold text-[14px] text-ink-primary mb-1">{p.name}</h3>
              <p className="text-[12px] text-ink-tertiary line-clamp-2 mb-4">
                {p.description || "No description"}
              </p>
              <div className="flex items-center justify-between text-[11px] text-ink-tertiary pt-3 border-t border-stroke-soft">
                <span className="flex items-center gap-1">
                  <Users size={12} /> {p.members?.length || 0} members
                </span>
                <span className="font-mono">
                  {p.openBugCount} open / {p.bugCount} total
                </span>
              </div>
            </Link>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full text-center text-ink-tertiary text-[13px] py-12">
              No projects yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
