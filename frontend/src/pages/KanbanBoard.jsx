import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, GripVertical } from "lucide-react";
import api from "../api/axios.js";
import { PriorityBadge, SeverityTag } from "../components/Badges.jsx";
import { useToast } from "../context/ToastContext.jsx";

const COLUMNS = [
  { key: "open", label: "Open", color: "bg-state-open" },
  { key: "in_progress", label: "In Progress", color: "bg-state-progress" },
  { key: "in_review", label: "In Review", color: "bg-state-review" },
  { key: "resolved", label: "Resolved", color: "bg-state-resolved" },
  { key: "closed", label: "Closed", color: "bg-state-closed" },
  { key: "reopened", label: "Reopened", color: "bg-state-reopened" },
];

const TRANSITIONS = {
  open: ["in_progress", "closed"],
  in_progress: ["in_review", "open", "closed"],
  in_review: ["resolved", "in_progress"],
  resolved: ["closed", "reopened"],
  closed: ["reopened"],
  reopened: ["in_progress", "closed"],
};

export default function KanbanBoard() {
  const { id } = useParams();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedBug, setDraggedBug] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [filterAssignee, setFilterAssignee] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.get(`/projects/${id}`), api.get(`/bugs?project=${id}&limit=200`)])
      .then(([pRes, bRes]) => {
        setProject(pRes.data.project);
        setBugs(bRes.data.bugs);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  const handleDragStart = (e, bug) => {
    setDraggedBug(bug);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", bug._id);
  };

  const handleDragOver = (e, colKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colKey);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverCol(null);

    if (!draggedBug || draggedBug.status === targetStatus) {
      setDraggedBug(null);
      return;
    }

    const allowed = TRANSITIONS[draggedBug.status] || [];
    if (!allowed.includes(targetStatus)) {
      toast?.error(`Cannot move from ${draggedBug.status.replace("_", " ")} to ${targetStatus.replace("_", " ")}`);
      setDraggedBug(null);
      return;
    }

    try {
      await api.patch(`/bugs/${draggedBug._id}/status`, { status: targetStatus });
      toast?.success(`Bug moved to ${targetStatus.replace("_", " ")}`);
      load();
    } catch (err) {
      toast?.error(err.response?.data?.message || "Failed to update status");
    }
    setDraggedBug(null);
  };

  if (loading) return <div className="p-8 text-center text-ink-tertiary text-[13px]">Loading board…</div>;
  if (!project) return <div className="p-8 text-center text-ink-tertiary text-[13px]">Project not found.</div>;

  const filteredBugs = filterAssignee
    ? bugs.filter((b) => b.assignedTo?._id === filterAssignee)
    : bugs;

  const bugsByStatus = (status) => filteredBugs.filter((b) => b.status === status);

  const members = project.members || [];

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 py-6">
      <Link to={`/projects/${id}`} className="flex items-center gap-1.5 text-[12px] text-ink-tertiary hover:text-ink-primary mb-4 transition-colors">
        <ArrowLeft size={13} /> Back to {project.name}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[18px] font-semibold text-ink-primary tracking-tight">Kanban Board</h1>
          <p className="text-ink-tertiary text-[13px] mt-0.5">{project.name} · Drag bugs between columns to update status</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="input w-auto"
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
          >
            <option value="">All assignees</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "60vh" }}>
        {COLUMNS.map((col) => {
          const colBugs = bugsByStatus(col.key);
          const isValidDrop = draggedBug && TRANSITIONS[draggedBug.status]?.includes(col.key);
          const isDragOver = dragOverCol === col.key;

          return (
            <div
              key={col.key}
              className={`min-w-[260px] w-[260px] shrink-0 flex flex-col rounded-lg transition-colors ${
                isDragOver && isValidDrop
                  ? "bg-accent/10 border-2 border-dashed border-accent"
                  : isDragOver && !isValidDrop
                  ? "bg-severity-p0/10 border-2 border-dashed border-severity-p0"
                  : "bg-surface-sunken border border-stroke"
              }`}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-stroke">
                <span className={`w-2 h-2 rounded-full ${col.color}`} />
                <h3 className="font-medium text-ink-secondary text-[12px] uppercase tracking-wide">{col.label}</h3>
                <span className="text-[11px] text-ink-tertiary ml-auto font-mono">{colBugs.length}</span>
              </div>
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {colBugs.map((bug) => (
                  <div
                    key={bug._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, bug)}
                    className="panel p-3 cursor-grab active:cursor-grabbing hover:border-ink-tertiary transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="mono-tag text-ink-tertiary">{bug.bugId}</span>
                      <GripVertical size={12} className="text-ink-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <Link to={`/bugs/${bug._id}`} className="text-[13px] font-medium text-ink-primary leading-snug line-clamp-2 hover:text-accent transition-colors block mb-2">
                      {bug.title}
                    </Link>
                    <div className="flex items-center gap-2 flex-wrap">
                      <PriorityBadge priority={bug.priority} />
                      <SeverityTag severity={bug.severity} />
                    </div>
                    {bug.assignedTo && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-stroke-soft">
                        <div className="w-[16px] h-[16px] rounded-full bg-accent-soft text-accent flex items-center justify-center text-[8px] font-semibold">
                          {bug.assignedTo.name?.charAt(0)}
                        </div>
                        <span className="text-[11px] text-ink-secondary">{bug.assignedTo.name}</span>
                      </div>
                    )}
                  </div>
                ))}
                {colBugs.length === 0 && (
                  <div className="text-[11px] text-ink-tertiary text-center py-6">
                    {draggedBug && isValidDrop ? "Drop here" : "No bugs"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
