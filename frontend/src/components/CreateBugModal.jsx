import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import api from "../api/axios.js";
import { useToast } from "../context/ToastContext.jsx";

export default function CreateBugModal({ projectId, members = [], onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    stepsToReproduce: "",
    expectedResult: "",
    actualResult: "",
    priority: "medium",
    severity: "minor",
    assignedTo: "",
    labels: "",
    dueDate: "",
  });
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(projectId || "");
  const [projectMembers, setProjectMembers] = useState(members);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!projectId) {
      api.get("/projects").then((res) => setProjects(res.data.projects)).catch(() => {});
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedProject && !projectId) {
      api.get(`/projects/${selectedProject}`).then((res) => {
        setProjectMembers(res.data.project.members || []);
      }).catch(() => {});
    }
  }, [selectedProject, projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        project: selectedProject || projectId,
        assignedTo: form.assignedTo || null,
        labels: form.labels ? form.labels.split(",").map((l) => l.trim()).filter(Boolean) : [],
        dueDate: form.dueDate || null,
      };
      await api.post("/bugs", payload);
      toast?.success("Bug created successfully");
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create bug");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-stroke rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-panel">
        <div className="flex items-center justify-between p-5 border-b border-stroke">
          <h2 className="font-semibold text-[14px] text-ink-primary">Report a Bug</h2>
          <button onClick={onClose} className="text-ink-tertiary hover:text-ink-primary transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-severity-p0/10 border border-severity-p0/30 text-severity-p0 text-[13px] px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          {!projectId && (
            <div>
              <label className="label">Project</label>
              <select
                className="input"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                required
              >
                <option value="">Select a project</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} ({p.key})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">Title *</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="Brief summary of the bug"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detailed description of the issue"
            />
          </div>
          <div>
            <label className="label">Steps to reproduce</label>
            <textarea
              className="input"
              rows={2}
              value={form.stepsToReproduce}
              onChange={(e) => setForm({ ...form, stepsToReproduce: e.target.value })}
              placeholder="1. Go to... 2. Click on..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Expected result</label>
              <input
                className="input"
                value={form.expectedResult}
                onChange={(e) => setForm({ ...form, expectedResult: e.target.value })}
                placeholder="What should happen"
              />
            </div>
            <div>
              <label className="label">Actual result</label>
              <input
                className="input"
                value={form.actualResult}
                onChange={(e) => setForm({ ...form, actualResult: e.target.value })}
                placeholder="What actually happens"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="label">Severity</label>
              <select className="input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
                <option value="blocker">Blocker</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Assign to</label>
              <select className="input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {projectMembers.map((m) => (
                  <option key={m._id} value={m._id}>{m.name} ({m.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Due date</label>
              <input
                type="date"
                className="input"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Labels (comma-separated)</label>
            <input
              className="input"
              value={form.labels}
              onChange={(e) => setForm({ ...form, labels: e.target.value })}
              placeholder="ui, backend, auth"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? "Creating..." : "Create Bug"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
