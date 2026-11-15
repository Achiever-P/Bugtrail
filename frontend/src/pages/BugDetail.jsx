import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Clock, ArrowRight, Eye, EyeOff, Paperclip, Trash2, Pencil, X, Download, FileIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "../api/axios.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { PriorityBadge, SeverityTag, LabelTag } from "../components/Badges.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const TRANSITIONS = {
  open: ["in_progress", "closed"],
  in_progress: ["in_review", "open", "closed"],
  in_review: ["resolved", "in_progress"],
  resolved: ["closed", "reopened"],
  closed: ["reopened"],
  reopened: ["in_progress", "closed"],
};

const STATUS_LABELS = {
  open: "Open", in_progress: "In Progress", in_review: "In Review",
  resolved: "Resolved", closed: "Closed", reopened: "Reopened",
};

export default function BugDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [bug, setBug] = useState(null);
  const [activity, setActivity] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteComment, setConfirmDeleteComment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [allUsers, setAllUsers] = useState([]);

  const load = () => {
    setLoading(true);
    Promise.all([api.get(`/bugs/${id}`), api.get(`/bugs/${id}/comments`)])
      .then(([bRes, cRes]) => {
        setBug(bRes.data.bug);
        setActivity(bRes.data.activity);
        setComments(cRes.data.comments);
        setIsWatching(bRes.data.bug.watchers?.some((w) => (w._id || w) === user?._id));
      })
      .catch(() => toast?.error("Failed to load bug"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  useEffect(() => {
    api.get("/auth/users").then((res) => setAllUsers(res.data.users)).catch(() => {});
  }, []);

  const handleStatusChange = async (status) => {
    setUpdating(true);
    try {
      await api.patch(`/bugs/${id}/status`, { status });
      toast?.success(`Status changed to ${STATUS_LABELS[status]}`);
      load();
    } catch (err) {
      toast?.error(err.response?.data?.message || "Could not update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleAssign = async (userId) => {
    setUpdating(true);
    try {
      await api.patch(`/bugs/${id}/assign`, { userId: userId || null });
      toast?.success(userId ? "Bug assigned" : "Bug unassigned");
      load();
    } catch (err) {
      toast?.error(err.response?.data?.message || "Could not assign");
    } finally {
      setUpdating(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await api.post(`/bugs/${id}/comments`, { text: commentText });
      setCommentText("");
      toast?.success("Comment added");
      load();
    } catch (err) {
      toast?.error("Failed to add comment");
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) return;
    try {
      await api.patch(`/comments/${commentId}`, { text: editText });
      setEditingComment(null);
      toast?.success("Comment updated");
      load();
    } catch (err) {
      toast?.error(err.response?.data?.message || "Failed to update comment");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setConfirmDeleteComment(null);
      toast?.success("Comment deleted");
      load();
    } catch (err) {
      toast?.error("Failed to delete comment");
    }
  };

  const toggleWatch = async () => {
    try {
      const res = await api.post(`/bugs/${id}/watch`);
      setIsWatching(res.data.watching);
      toast?.success(res.data.watching ? "Watching this bug" : "Stopped watching");
    } catch (err) {
      toast?.error("Failed to toggle watch");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      await api.post(`/bugs/${id}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast?.success("File uploaded");
      load();
    } catch (err) {
      toast?.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = async (attachmentId) => {
    try {
      await api.delete(`/bugs/${id}/attachments/${attachmentId}`);
      toast?.success("Attachment removed");
      load();
    } catch (err) {
      toast?.error("Failed to remove attachment");
    }
  };

  const handleDeleteBug = async () => {
    try {
      await api.delete(`/bugs/${id}`);
      toast?.success("Bug deleted");
      navigate(bug.project?._id ? `/projects/${bug.project._id}` : "/bugs");
    } catch (err) {
      toast?.error("Failed to delete bug");
    }
  };

  const handleEditBug = async () => {
    try {
      await api.patch(`/bugs/${id}`, {
        ...editForm,
        labels: typeof editForm.labels === "string"
          ? editForm.labels.split(",").map((l) => l.trim()).filter(Boolean)
          : editForm.labels,
      });
      toast?.success("Bug updated");
      setIsEditing(false);
      load();
    } catch (err) {
      toast?.error("Failed to update bug");
    }
  };

  if (loading) return <div className="p-8 text-center text-ink-tertiary text-[13px]">Loading bug…</div>;
  if (!bug) return <div className="p-8 text-center text-ink-tertiary text-[13px]">Bug not found.</div>;

  const canManage = user?.role === "admin" || user?.role === "developer";
  const canDelete = user?.role === "admin";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <Link
          to={bug.project?._id ? `/projects/${bug.project._id}` : "/bugs"}
          className="flex items-center gap-1.5 text-[12px] text-ink-tertiary hover:text-ink-primary transition-colors"
        >
          <ArrowLeft size={13} /> Back to {bug.project?.name || "bugs"}
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={toggleWatch} className="btn-ghost flex items-center gap-1.5" title={isWatching ? "Stop watching" : "Watch this bug"}>
            {isWatching ? <EyeOff size={14} /> : <Eye size={14} />}
            {isWatching ? "Unwatch" : "Watch"}
          </button>
          {canDelete && (
            <button onClick={() => setConfirmDelete(true)} className="btn-ghost text-severity-p0 flex items-center gap-1.5">
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Bug details panel */}
          <div className="panel p-5">
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className="mono-tag text-ink-tertiary">{bug.bugId}</span>
              <StatusBadge status={bug.status} />
              {bug.dueDate && (
                <span className={`text-[11px] font-medium ${new Date(bug.dueDate) < new Date() && !["closed", "resolved"].includes(bug.status) ? "text-severity-p0" : "text-ink-tertiary"}`}>
                  Due {formatDistanceToNow(new Date(bug.dueDate), { addSuffix: true })}
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <input className="input text-[15px] font-semibold" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                <textarea className="input" rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" />
                <textarea className="input" rows={2} value={editForm.stepsToReproduce} onChange={(e) => setEditForm({ ...editForm, stepsToReproduce: e.target.value })} placeholder="Steps to reproduce" />
                <div className="grid grid-cols-2 gap-3">
                  <input className="input" value={editForm.expectedResult} onChange={(e) => setEditForm({ ...editForm, expectedResult: e.target.value })} placeholder="Expected result" />
                  <input className="input" value={editForm.actualResult} onChange={(e) => setEditForm({ ...editForm, actualResult: e.target.value })} placeholder="Actual result" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select className="input" value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                  </select>
                  <select className="input" value={editForm.severity} onChange={(e) => setEditForm({ ...editForm, severity: e.target.value })}>
                    <option value="minor">Minor</option><option value="major">Major</option><option value="critical">Critical</option><option value="blocker">Blocker</option>
                  </select>
                </div>
                <input className="input" value={editForm.labels} onChange={(e) => setEditForm({ ...editForm, labels: e.target.value })} placeholder="Labels (comma-separated)" />
                <input type="date" className="input" value={editForm.dueDate ? editForm.dueDate.split("T")[0] : ""} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value || null })} />
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button>
                  <button onClick={handleEditBug} className="btn-primary">Save Changes</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-[17px] font-semibold text-ink-primary leading-snug">{bug.title}</h1>
                  {canManage && (
                    <button
                      onClick={() => {
                        setEditForm({
                          title: bug.title, description: bug.description || "", stepsToReproduce: bug.stepsToReproduce || "",
                          expectedResult: bug.expectedResult || "", actualResult: bug.actualResult || "",
                          priority: bug.priority, severity: bug.severity,
                          labels: (bug.labels || []).join(", "), dueDate: bug.dueDate || "",
                        });
                        setIsEditing(true);
                      }}
                      className="btn-ghost flex items-center gap-1"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                  )}
                </div>

                <div className="flex items-center flex-wrap gap-2.5 mb-6">
                  <PriorityBadge priority={bug.priority} />
                  <span className="text-ink-tertiary text-[11px]">&middot;</span>
                  <SeverityTag severity={bug.severity} />
                  {bug.labels?.map((l) => <LabelTag key={l}>{l}</LabelTag>)}
                </div>

                {bug.description && (
                  <div className="mb-4">
                    <h3 className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wide mb-1.5">Description</h3>
                    <p className="text-[13px] text-ink-secondary whitespace-pre-wrap leading-relaxed">{bug.description}</p>
                  </div>
                )}
                {bug.stepsToReproduce && (
                  <div className="mb-4">
                    <h3 className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wide mb-1.5">Steps to Reproduce</h3>
                    <p className="text-[13px] text-ink-secondary whitespace-pre-wrap leading-relaxed">{bug.stepsToReproduce}</p>
                  </div>
                )}
                {(bug.expectedResult || bug.actualResult) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {bug.expectedResult && (
                      <div>
                        <h3 className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wide mb-1.5">Expected Result</h3>
                        <p className="text-[13px] text-ink-secondary">{bug.expectedResult}</p>
                      </div>
                    )}
                    {bug.actualResult && (
                      <div>
                        <h3 className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wide mb-1.5">Actual Result</h3>
                        <p className="text-[13px] text-ink-secondary">{bug.actualResult}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Attachments */}
          <div className="panel p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-ink-primary flex items-center gap-1.5">
                <Paperclip size={14} /> Attachments ({bug.attachments?.length || 0})
              </h3>
              <div>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-secondary text-[12px] flex items-center gap-1.5">
                  <Paperclip size={12} /> {uploading ? "Uploading…" : "Upload File"}
                </button>
              </div>
            </div>
            {bug.attachments?.length > 0 ? (
              <div className="space-y-2">
                {bug.attachments.map((att) => (
                  <div key={att._id} className="flex items-center justify-between py-2 px-3 bg-surface-raised rounded-md border border-stroke-soft">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileIcon size={14} className="text-ink-tertiary shrink-0" />
                      <span className="text-[13px] text-ink-primary truncate">{att.originalName || att.filename}</span>
                      <span className="text-[11px] text-ink-tertiary shrink-0">{att.size ? `${(att.size / 1024).toFixed(1)} KB` : ""}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a href={att.url} target="_blank" rel="noopener noreferrer" className="p-1 text-ink-tertiary hover:text-accent" title="Download">
                        <Download size={14} />
                      </a>
                      {(att.uploadedBy === user?._id || user?.role === "admin") && (
                        <button onClick={() => handleRemoveAttachment(att._id)} className="p-1 text-ink-tertiary hover:text-severity-p0" title="Remove">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[13px] text-ink-tertiary text-center py-4">No attachments yet.</div>
            )}
          </div>

          {/* Comments */}
          <div className="panel p-5">
            <h3 className="text-[13px] font-semibold text-ink-primary mb-4">Comments ({comments.length})</h3>
            <div className="space-y-4 mb-4">
              {comments.map((c) => (
                <div key={c._id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-accent-soft text-accent flex items-center justify-center text-[11px] font-semibold shrink-0">
                    {c.author?.avatarInitials || c.author?.name?.charAt(0)}
                  </div>
                  <div className="flex-1 bg-surface-raised border border-stroke-soft rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium text-ink-primary">{c.author?.name}</span>
                        <span className="text-[10px] text-ink-tertiary capitalize">{c.author?.role}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-ink-tertiary">
                          {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                        </span>
                        {(c.author?._id === user?._id) && (
                          <button
                            onClick={() => { setEditingComment(c._id); setEditText(c.text); }}
                            className="p-1 text-ink-tertiary hover:text-accent"
                            title="Edit"
                          >
                            <Pencil size={11} />
                          </button>
                        )}
                        {(c.author?._id === user?._id || user?.role === "admin") && (
                          <button
                            onClick={() => setConfirmDeleteComment(c._id)}
                            className="p-1 text-ink-tertiary hover:text-severity-p0"
                            title="Delete"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                    {editingComment === c._id ? (
                      <div className="flex gap-2 mt-1">
                        <input className="input flex-1" value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus />
                        <button onClick={() => handleEditComment(c._id)} className="btn-primary px-3 text-[12px]">Save</button>
                        <button onClick={() => setEditingComment(null)} className="btn-ghost text-[12px]">Cancel</button>
                      </div>
                    ) : (
                      <p className="text-[13px] text-ink-secondary whitespace-pre-wrap">{c.text}</p>
                    )}
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-[13px] text-ink-tertiary text-center py-4">No comments yet.</div>
              )}
            </div>
            <form onSubmit={handleComment} className="flex gap-2">
              <input
                className="input"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="submit" className="btn-primary px-3" disabled={!commentText.trim()}>
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="panel p-4">
            <h3 className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wide mb-3">Workflow</h3>
            <div className="flex flex-wrap gap-2 mb-5">
              {(TRANSITIONS[bug.status] || []).map((next) => (
                <button key={next} disabled={updating} onClick={() => handleStatusChange(next)} className="btn-secondary text-[12px] flex items-center gap-1.5">
                  {STATUS_LABELS[next]} <ArrowRight size={11} />
                </button>
              ))}
              {(TRANSITIONS[bug.status] || []).length === 0 && (
                <span className="text-[12px] text-ink-tertiary">No further transitions</span>
              )}
            </div>

            <h3 className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wide mb-2">Reported by</h3>
            <p className="text-[13px] text-ink-secondary mb-5">{bug.reportedBy?.name}</p>

            <h3 className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wide mb-2">Assignee</h3>
            {canManage ? (
              <select className="input mb-5" value={bug.assignedTo?._id || ""} onChange={(e) => handleAssign(e.target.value)} disabled={updating}>
                <option value="">Unassigned</option>
                {allUsers.map((m) => (
                  <option key={m._id} value={m._id}>{m.name} ({m.role})</option>
                ))}
              </select>
            ) : (
              <p className="text-[13px] text-ink-secondary mb-5">{bug.assignedTo?.name || "Unassigned"}</p>
            )}

            {bug.sprint && (
              <>
                <h3 className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wide mb-2">Sprint</h3>
                <p className="text-[13px] text-ink-secondary mb-5">{bug.sprint.name}</p>
              </>
            )}

            <h3 className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wide mb-2">
              Watchers ({bug.watchers?.length || 0})
            </h3>
            <div className="flex flex-wrap gap-1 mb-2">
              {bug.watchers?.map((w) => (
                <div key={w._id || w} className="w-6 h-6 rounded-full bg-accent-soft text-accent flex items-center justify-center text-[9px] font-semibold" title={w.name || ""}>
                  {w.avatarInitials || w.name?.charAt(0) || "?"}
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-4">
            <h3 className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Clock size={12} /> Activity
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activity.map((a) => (
                <div key={a._id} className="text-[12px] text-ink-tertiary border-l-2 border-stroke pl-3 py-0.5">
                  <span className="font-medium text-ink-secondary">{a.actor?.name}</span> {describeActivity(a)}
                  <div className="text-ink-tertiary/70 text-[11px] mt-0.5">
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </div>
                </div>
              ))}
              {activity.length === 0 && <div className="text-[12px] text-ink-tertiary">No activity yet.</div>}
            </div>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Bug"
          message={`Are you sure you want to delete ${bug.bugId}? This will also delete all comments and activity logs. This action cannot be undone.`}
          confirmLabel="Delete Bug"
          danger
          onConfirm={handleDeleteBug}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {confirmDeleteComment && (
        <ConfirmDialog
          title="Delete Comment"
          message="Are you sure you want to delete this comment?"
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDeleteComment(confirmDeleteComment)}
          onCancel={() => setConfirmDeleteComment(null)}
        />
      )}
    </div>
  );
}

function describeActivity(a) {
  switch (a.action) {
    case "created": return "created this bug";
    case "status_changed": return `changed status from ${a.fromValue} to ${a.toValue}`;
    case "assigned": return "assigned this bug";
    case "unassigned": return "unassigned this bug";
    case "priority_changed": return `changed priority from ${a.fromValue} to ${a.toValue}`;
    case "severity_changed": return `changed severity from ${a.fromValue} to ${a.toValue}`;
    case "commented": return "commented";
    case "reopened": return "reopened this bug";
    case "closed": return "closed this bug";
    case "updated": return "updated bug details";
    default: return "updated this bug";
  }
}
