import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Calendar, CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";
import api from "../api/axios.js";
import { useToast } from "../context/ToastContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { PriorityBadge } from "../components/Badges.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function SprintManagement() {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedSprint, setExpandedSprint] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", startDate: "", endDate: "" });

  const canManage = user?.role === "admin" || user?.role === "developer";

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get(`/projects/${projectId}`),
      api.get(`/sprints?project=${projectId}`),
      api.get(`/bugs?project=${projectId}&limit=200`),
    ])
      .then(([pRes, sRes, bRes]) => {
        setProject(pRes.data.project);
        setSprints(sRes.data.sprints);
        setBugs(bRes.data.bugs);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [projectId]);

  const createSprint = async (e) => {
    e.preventDefault();
    try {
      await api.post("/sprints", { ...form, project: projectId });
      toast?.success("Sprint created");
      setShowForm(false);
      setForm({ name: "", description: "", startDate: "", endDate: "" });
      load();
    } catch (err) {
      toast?.error(err.response?.data?.message || "Failed to create sprint");
    }
  };

  const updateSprintStatus = async (sprintId, status) => {
    try {
      await api.patch(`/sprints/${sprintId}`, { status });
      toast?.success("Sprint status updated");
      load();
    } catch (err) {
      toast?.error("Failed to update sprint");
    }
  };

  const addBugToSprint = async (sprintId, bugId) => {
    try {
      await api.post(`/sprints/${sprintId}/bugs`, { bugId });
      toast?.success("Bug added to sprint");
      load();
    } catch (err) {
      toast?.error(err.response?.data?.message || "Failed to add bug");
    }
  };

  const removeBugFromSprint = async (sprintId, bugId) => {
    try {
      await api.delete(`/sprints/${sprintId}/bugs`, { data: { bugId } });
      toast?.success("Bug removed from sprint");
      load();
    } catch (err) {
      toast?.error("Failed to remove bug");
    }
  };

  const deleteSprint = async (sprintId) => {
    try {
      await api.delete(`/sprints/${sprintId}`);
      toast?.success("Sprint deleted");
      load();
    } catch (err) {
      toast?.error("Failed to delete sprint");
    }
  };

  if (loading) return <div className="p-8 text-center text-ink-tertiary text-[13px]">Loading…</div>;
  if (!project) return <div className="p-8 text-center text-ink-tertiary text-[13px]">Project not found.</div>;

  const unassignedBugs = bugs.filter((b) => !b.sprint && !["closed"].includes(b.status));

  const statusStyles = {
    planning: "bg-accent/15 text-accent",
    active: "bg-state-resolved/15 text-state-resolved",
    completed: "bg-state-closed/15 text-state-closed",
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
      <Link to={`/projects/${projectId}`} className="flex items-center gap-1.5 text-[12px] text-ink-tertiary hover:text-ink-primary mb-4 transition-colors">
        <ArrowLeft size={13} /> Back to {project.name}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[18px] font-semibold text-ink-primary tracking-tight flex items-center gap-2">
            <Calendar size={20} /> Sprints & Milestones
          </h1>
          <p className="text-ink-tertiary text-[13px] mt-0.5">{project.name} · {project.key}</p>
        </div>
        {canManage && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-1.5">
            <Plus size={14} /> New Sprint
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={createSprint} className="panel p-5 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Sprint name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Description</label>
              <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Start date</label>
              <input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </div>
            <div>
              <label className="label">End date</label>
              <input type="date" className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Sprint</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {sprints.map((sprint) => {
          const completed = sprint.completedBugs || 0;
          const total = sprint.totalBugs || 0;
          const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
          const isExpanded = expandedSprint === sprint._id;

          return (
            <div key={sprint._id} className="panel overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-raised transition-colors"
                onClick={() => setExpandedSprint(isExpanded ? null : sprint._id)}
              >
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-accent shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-semibold text-ink-primary">{sprint.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold capitalize ${statusStyles[sprint.status]}`}>
                        {sprint.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-ink-tertiary mt-0.5">
                      {format(new Date(sprint.startDate), "MMM d")} — {format(new Date(sprint.endDate), "MMM d, yyyy")}
                      {sprint.description && ` · ${sprint.description}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[12px] font-medium text-ink-primary">{completed}/{total} bugs</div>
                    <div className="w-24 h-1.5 bg-surface-sunken rounded-full mt-1">
                      <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-stroke p-4 space-y-3">
                  {canManage && (
                    <div className="flex items-center gap-2 mb-3">
                      <select
                        className="input w-auto py-1 text-[12px]"
                        value={sprint.status}
                        onChange={(e) => updateSprintStatus(sprint._id, e.target.value)}
                      >
                        <option value="planning">Planning</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button onClick={() => deleteSprint(sprint._id)} className="text-[11px] text-severity-p0 hover:underline ml-auto">
                        Delete Sprint
                      </button>
                    </div>
                  )}

                  {/* Sprint bugs */}
                  <div className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wide mb-2">Sprint Bugs</div>
                  {sprint.bugs?.length > 0 ? (
                    <div className="space-y-1">
                      {sprint.bugs.map((b) => (
                        <div key={b._id || b} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-surface-raised">
                          <Link to={`/bugs/${b._id || b}`} className="flex items-center gap-2 text-[13px] text-ink-primary hover:text-accent">
                            {["resolved", "closed"].includes(b.status) ? (
                              <CheckCircle2 size={14} className="text-state-resolved" />
                            ) : (
                              <Circle size={14} className="text-ink-tertiary" />
                            )}
                            <span className="mono-tag text-ink-tertiary">{b.bugId}</span>
                            {b.title}
                          </Link>
                          {canManage && (
                            <button
                              onClick={() => removeBugFromSprint(sprint._id, b._id || b)}
                              className="text-[11px] text-ink-tertiary hover:text-severity-p0"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[12px] text-ink-tertiary py-2">No bugs in this sprint</div>
                  )}

                  {/* Add bugs */}
                  {canManage && unassignedBugs.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-stroke-soft">
                      <label className="label">Add bug to sprint</label>
                      <select
                        className="input"
                        onChange={(e) => { if (e.target.value) addBugToSprint(sprint._id, e.target.value); e.target.value = ""; }}
                        defaultValue=""
                      >
                        <option value="">Select a bug…</option>
                        {unassignedBugs.map((b) => (
                          <option key={b._id} value={b._id}>{b.bugId} — {b.title}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {sprints.length === 0 && (
          <div className="panel p-12 text-center text-ink-tertiary text-[13px]">
            No sprints yet. Create one to start organizing your bugs.
          </div>
        )}
      </div>
    </div>
  );
}
