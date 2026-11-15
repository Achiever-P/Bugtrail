import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../api/axios.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { PriorityBadge, SeverityTag } from "../components/Badges.jsx";
import CreateBugModal from "../components/CreateBugModal.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function BugList() {
  const { user } = useAuth();
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    status: "", priority: "", severity: "", search: "", project: "",
    assignedTo: "", sort: "", page: 1,
  });
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get("/projects").then((res) => setProjects(res.data.projects)).catch(() => {});
    api.get("/auth/users").then((res) => setUsers(res.data.users)).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.severity) params.set("severity", filters.severity);
    if (filters.search) params.set("search", filters.search);
    if (filters.project) params.set("project", filters.project);
    if (filters.assignedTo) params.set("assignedTo", filters.assignedTo);
    if (filters.sort) params.set("sort", filters.sort);
    params.set("page", filters.page);
    params.set("limit", "25");

    api
      .get(`/bugs?${params.toString()}`)
      .then((res) => {
        setBugs(res.data.bugs);
        setTotal(res.data.total);
        setPages(res.data.pages);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === "page" ? value : 1 }));
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[18px] font-semibold text-ink-primary tracking-tight">All Bugs</h1>
          <p className="text-ink-tertiary text-[13px] mt-0.5">
            {total} bug{total !== 1 ? "s" : ""} across all projects
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5">
          <Plus size={14} /> Report Bug
        </button>
      </div>

      <div className="panel p-3 mb-5 flex flex-wrap gap-2.5 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <input placeholder="Search bugs by ID, title, or description..." className="input pl-9" value={filters.search} onChange={(e) => setFilter("search", e.target.value)} />
        </div>
        <select className="input w-auto" value={filters.project} onChange={(e) => setFilter("project", e.target.value)}>
          <option value="">All projects</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <select className="input w-auto" value={filters.status} onChange={(e) => setFilter("status", e.target.value)}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
          <option value="reopened">Reopened</option>
        </select>
        <select className="input w-auto" value={filters.priority} onChange={(e) => setFilter("priority", e.target.value)}>
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <select className="input w-auto" value={filters.severity} onChange={(e) => setFilter("severity", e.target.value)}>
          <option value="">All severities</option>
          <option value="minor">Minor</option>
          <option value="major">Major</option>
          <option value="critical">Critical</option>
          <option value="blocker">Blocker</option>
        </select>
        <select className="input w-auto" value={filters.assignedTo} onChange={(e) => setFilter("assignedTo", e.target.value)}>
          <option value="">All assignees</option>
          <option value="unassigned">Unassigned</option>
          {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
        </select>
        <select className="input w-auto" value={filters.sort} onChange={(e) => setFilter("sort", e.target.value)}>
          <option value="">Newest first</option>
          <option value="priority">By priority</option>
          <option value="dueDate">By due date</option>
          <option value="updatedAt">Recently updated</option>
        </select>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-surface-raised text-ink-tertiary text-[10px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold">Bug</th>
                <th className="text-left px-4 py-2.5 font-semibold">Project</th>
                <th className="text-left px-4 py-2.5 font-semibold">Priority</th>
                <th className="text-left px-4 py-2.5 font-semibold">Severity</th>
                <th className="text-left px-4 py-2.5 font-semibold">Assignee</th>
                <th className="text-left px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke-soft">
              {bugs.map((bug) => (
                <tr key={bug._id} className="hover:bg-surface-raised transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/bugs/${bug._id}`} className="block">
                      <div className="mono-tag text-ink-tertiary">{bug.bugId}</div>
                      <div className="font-medium text-ink-primary">{bug.title}</div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/projects/${bug.project?._id}`} className="text-ink-tertiary font-mono text-[12px] hover:text-accent">{bug.project?.key}</Link>
                  </td>
                  <td className="px-4 py-3"><PriorityBadge priority={bug.priority} /></td>
                  <td className="px-4 py-3"><SeverityTag severity={bug.severity} /></td>
                  <td className="px-4 py-3 text-ink-secondary">{bug.assignedTo?.name || <span className="text-ink-tertiary">Unassigned</span>}</td>
                  <td className="px-4 py-3"><StatusBadge status={bug.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && bugs.length === 0 && (
          <div className="text-center text-ink-tertiary text-[13px] py-12">No bugs match your filters.</div>
        )}
        {loading && <div className="text-center text-ink-tertiary text-[13px] py-12">Loading…</div>}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-[12px] text-ink-tertiary">
            Page {filters.page} of {pages} · {total} total
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("page", Math.max(1, filters.page - 1))}
              disabled={filters.page <= 1}
              className="btn-secondary px-2 py-1 disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setFilter("page", p)}
                  className={`px-2.5 py-1 rounded text-[12px] font-medium ${
                    p === filters.page ? "bg-accent text-white" : "text-ink-secondary hover:bg-surface-raised"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setFilter("page", Math.min(pages, filters.page + 1))}
              disabled={filters.page >= pages}
              className="btn-secondary px-2 py-1 disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <CreateBugModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}
