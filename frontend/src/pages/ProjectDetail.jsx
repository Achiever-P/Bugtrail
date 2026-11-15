import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, ArrowLeft, Clock, Columns3, List, Users, Settings, Archive, ArchiveRestore } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "../api/axios.js";
import { PriorityBadge } from "../components/Badges.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import CreateBugModal from "../components/CreateBugModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import EmptyState from "../components/EmptyState.jsx";

const COLUMNS = [
  { key: "open", label: "Open", dot: "bg-state-open" },
  { key: "in_progress", label: "In Progress", dot: "bg-state-progress" },
  { key: "in_review", label: "In Review", dot: "bg-state-review" },
  { key: "resolved", label: "Resolved", dot: "bg-state-resolved" },
  { key: "closed", label: "Closed", dot: "bg-state-closed" },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [view, setView] = useState("board");

  const canManage = user?.role === "admin" || user?.role === "developer";

  const load = () => {
    setLoading(true);
    Promise.all([api.get(`/projects/${id}`), api.get(`/bugs?project=${id}&limit=200`)])
      .then(([pRes, bRes]) => {
        setProject(pRes.data.project);
        setBugs(bRes.data.bugs);
      })
      .catch(() => toast?.error("Failed to load project"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const loadUsers = () => {
    api.get("/auth/users").then((res) => setAllUsers(res.data.users)).catch(() => {});
  };

  const addMember = async (userId) => {
    try {
      await api.post(`/projects/${id}/members`, { userId });
      toast?.success("Member added");
      load();
    } catch (err) {
      toast?.error(err.response?.data?.message || "Failed to add member");
    }
  };

  const removeMember = async (userId) => {
    try {
      await api.delete(`/projects/${id}/members`, { data: { userId } });
      toast?.success("Member removed");
      load();
    } catch (err) {
      toast?.error(err.response?.data?.message || "Failed to remove member");
    }
  };

  const toggleArchive = async () => {
    try {
      await api.patch(`/projects/${id}`, { isArchived: !project.isArchived });
      toast?.success(project.isArchived ? "Project restored" : "Project archived");
      load();
      setConfirmArchive(false);
    } catch (err) {
      toast?.error("Failed to update project");
    }
  };

  if (loading) return <div className="p-8 text-center text-ink-tertiary text-[13px]">Loading project…</div>;
  if (!project) return <div className="p-8 text-center text-ink-tertiary text-[13px]">Project not found.</div>;

  const bugsByStatus = (status) =>
    bugs.filter((b) => b.status === status || (status === "open" && b.status === "reopened"));

  const openCount = bugsByStatus("open").length + bugsByStatus("in_progress").length + bugsByStatus("in_review").length;
  const criticalCount = bugs.filter((b) => b.priority === "critical" && !["closed", "resolved"].includes(b.status)).length;
  const resolvedCount = bugs.filter((b) => b.status === "resolved" || b.status === "closed").length;

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-6">
      <Link to="/projects" className="flex items-center gap-1.5 text-[12px] text-ink-tertiary hover:text-ink-primary mb-4 transition-colors">
        <ArrowLeft size={13} /> All projects
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[18px] font-semibold text-ink-primary tracking-tight">{project.name}</h1>
            <span className="mono-tag bg-surface-raised text-ink-tertiary px-2 py-0.5 rounded border border-stroke">
              {project.key}
            </span>
            {project.isArchived && (
              <span className="text-[10px] bg-severity-p1/15 text-severity-p1 px-2 py-0.5 rounded font-medium">ARCHIVED</span>
            )}
          </div>
          <p className="text-ink-tertiary text-[13px] mt-0.5">
            {project.description || "No description"} · Lead: {project.lead?.name}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canManage && (
            <>
              <button
                onClick={() => { setShowMembers(!showMembers); if (!showMembers) loadUsers(); }}
                className="btn-secondary flex items-center gap-1.5"
              >
                <Users size={14} /> Members ({project.members?.length || 0})
              </button>
              <button onClick={() => setConfirmArchive(true)} className="btn-ghost flex items-center gap-1.5">
                {project.isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                {project.isArchived ? "Restore" : "Archive"}
              </button>
            </>
          )}
          <Link to={`/projects/${id}/kanban`} className="btn-secondary flex items-center gap-1.5">
            <Columns3 size={14} /> Kanban
          </Link>
          <Link to={`/projects/${id}/sprints`} className="btn-secondary flex items-center gap-1.5">
            Sprints
          </Link>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5">
            <Plus size={14} /> Report Bug
          </button>
        </div>
      </div>

      {/* Member management panel */}
      {showMembers && (
        <div className="panel p-5 mb-6">
          <h3 className="text-[13px] font-semibold text-ink-primary mb-3">Project Members</h3>
          <div className="space-y-2 mb-4">
            {project.members?.map((m) => (
              <div key={m._id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-accent-soft text-accent flex items-center justify-center text-[11px] font-semibold">
                    {m.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-ink-primary">{m.name}</div>
                    <div className="text-[11px] text-ink-tertiary">{m.email} · {m.role}</div>
                  </div>
                </div>
                {canManage && m._id !== project.lead?._id && (
                  <button onClick={() => removeMember(m._id)} className="text-[11px] text-severity-p0 hover:underline">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          {canManage && (
            <div>
              <label className="label">Add member</label>
              <select
                className="input"
                onChange={(e) => { if (e.target.value) addMember(e.target.value); e.target.value = ""; }}
                defaultValue=""
              >
                <option value="">Select a user to add…</option>
                {allUsers
                  .filter((u) => !project.members?.some((m) => m._id === u._id))
                  .map((u) => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                  ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="panel px-4 py-3.5">
          <div className="text-[10px] font-semibold tracking-wider text-ink-tertiary uppercase mb-2">Active Bugs</div>
          <div className="text-2xl font-semibold text-ink-primary tracking-tight">{openCount}</div>
        </div>
        <div className="panel px-4 py-3.5">
          <div className="text-[10px] font-semibold tracking-wider text-ink-tertiary uppercase mb-2">Critical</div>
          <div className="text-2xl font-semibold text-severity-p0 tracking-tight">{criticalCount}</div>
        </div>
        <div className="panel px-4 py-3.5">
          <div className="text-[10px] font-semibold tracking-wider text-ink-tertiary uppercase mb-2">Resolved / Closed</div>
          <div className="text-2xl font-semibold text-state-resolved tracking-tight">{resolvedCount}</div>
        </div>
        <div className="panel px-4 py-3.5">
          <div className="text-[10px] font-semibold tracking-wider text-ink-tertiary uppercase mb-2">Total Bugs</div>
          <div className="text-2xl font-semibold text-ink-primary tracking-tight">{bugs.length}</div>
        </div>
      </div>

      {/* Board view */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {COLUMNS.map((col) => (
          <div key={col.key} className="min-w-0">
            <div className="flex items-center gap-2 mb-3 px-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
              <h3 className="font-medium text-ink-secondary text-[12px] uppercase tracking-wide">{col.label}</h3>
              <span className="text-[11px] text-ink-tertiary ml-auto font-mono">{bugsByStatus(col.key).length}</span>
            </div>
            <div className="space-y-2.5">
              {bugsByStatus(col.key).map((bug) => (
                <Link key={bug._id} to={`/bugs/${bug._id}`} className="panel p-3 block hover:border-ink-tertiary transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="mono-tag text-ink-tertiary">{bug.bugId}</span>
                    <PriorityBadge priority={bug.priority} />
                  </div>
                  <div className="text-[13px] font-medium text-ink-primary mb-2 leading-snug line-clamp-2">{bug.title}</div>
                  <div className="flex items-center justify-between pt-2 border-t border-stroke-soft">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {bug.assignedTo ? (
                        <>
                          <div className="w-[18px] h-[18px] rounded-full bg-accent-soft text-accent flex items-center justify-center text-[9px] font-semibold shrink-0">
                            {bug.assignedTo.name?.charAt(0)}
                          </div>
                          <span className="text-[11px] text-ink-secondary truncate">{bug.assignedTo.name}</span>
                        </>
                      ) : (
                        <span className="text-[11px] text-ink-tertiary">Unassigned</span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-ink-tertiary shrink-0">
                      <Clock size={10} />
                      {formatDistanceToNow(new Date(bug.createdAt), { addSuffix: false })}
                    </span>
                  </div>
                </Link>
              ))}
              {bugsByStatus(col.key).length === 0 && (
                <div className="text-[11px] text-ink-tertiary text-center py-8 border border-dashed border-stroke rounded-lg">
                  No bugs
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <CreateBugModal
          projectId={id}
          members={project.members}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); load(); }}
        />
      )}

      {confirmArchive && (
        <ConfirmDialog
          title={project.isArchived ? "Restore Project" : "Archive Project"}
          message={project.isArchived
            ? "This project will be visible again in the projects list."
            : "Archived projects are hidden from the main list. You can restore them later."}
          confirmLabel={project.isArchived ? "Restore" : "Archive"}
          danger={!project.isArchived}
          onConfirm={toggleArchive}
          onCancel={() => setConfirmArchive(false)}
        />
      )}
    </div>
  );
}
