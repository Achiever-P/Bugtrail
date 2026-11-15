import React, { useEffect, useState } from "react";
import { Search, Shield, UserCheck, UserX, ChevronDown } from "lucide-react";
import api from "../api/axios.js";
import { useToast } from "../context/ToastContext.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const ROLE_STYLES = {
  admin: "bg-severity-p0/15 text-severity-p0",
  developer: "bg-accent/15 text-accent",
  tester: "bg-severity-p1/15 text-severity-p1",
  reporter: "bg-state-resolved/15 text-state-resolved",
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [editingRole, setEditingRole] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(null);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);
    if (activeFilter) params.set("active", activeFilter);
    api
      .get(`/auth/users?${params.toString()}`)
      .then((res) => setUsers(res.data.users))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [search, roleFilter, activeFilter]);

  const updateRole = async (userId, newRole) => {
    try {
      await api.patch(`/auth/users/${userId}/role`, { role: newRole });
      toast?.success("Role updated");
      setEditingRole(null);
      load();
    } catch (err) {
      toast?.error(err.response?.data?.message || "Failed to update role");
    }
  };

  const toggleActive = async (user) => {
    try {
      await api.patch(`/auth/users/${user._id}/toggle-active`);
      toast?.success(user.isActive ? "User deactivated" : "User activated");
      setConfirmToggle(null);
      load();
    } catch (err) {
      toast?.error(err.response?.data?.message || "Failed to update user");
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-[18px] font-semibold text-ink-primary tracking-tight flex items-center gap-2">
          <Shield size={20} /> User Management
        </h1>
        <p className="text-ink-tertiary text-[13px] mt-0.5">Manage users, roles, and account status</p>
      </div>

      <div className="panel p-3 mb-5 flex flex-wrap gap-2.5 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <input
            placeholder="Search users by name or email..."
            className="input pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="developer">Developer</option>
          <option value="tester">Tester</option>
          <option value="reporter">Reporter</option>
        </select>
        <select className="input w-auto" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
          <option value="">All status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-surface-raised text-ink-tertiary text-[10px] uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold">User</th>
              <th className="text-left px-4 py-2.5 font-semibold">Role</th>
              <th className="text-left px-4 py-2.5 font-semibold">Status</th>
              <th className="text-right px-4 py-2.5 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stroke-soft">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-surface-raised transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-soft text-accent flex items-center justify-center text-[12px] font-semibold">
                      {u.avatarInitials || u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-ink-primary">{u.name}</div>
                      <div className="text-[11px] text-ink-tertiary">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {editingRole === u._id ? (
                    <select
                      className="input w-auto py-1"
                      defaultValue={u.role}
                      onChange={(e) => updateRole(u._id, e.target.value)}
                      onBlur={() => setEditingRole(null)}
                      autoFocus
                    >
                      <option value="admin">Admin</option>
                      <option value="developer">Developer</option>
                      <option value="tester">Tester</option>
                      <option value="reporter">Reporter</option>
                    </select>
                  ) : (
                    <button
                      onClick={() => setEditingRole(u._id)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${ROLE_STYLES[u.role] || ""}`}
                    >
                      {u.role} <ChevronDown size={10} />
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                      u.isActive ? "text-state-resolved" : "text-severity-p0"
                    }`}
                  >
                    {u.isActive ? <UserCheck size={12} /> : <UserX size={12} />}
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setConfirmToggle(u)}
                    className={`text-[12px] font-medium ${u.isActive ? "text-severity-p0 hover:underline" : "text-accent hover:underline"}`}
                  >
                    {u.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && users.length === 0 && (
          <div className="text-center text-ink-tertiary text-[13px] py-12">No users found.</div>
        )}
        {loading && <div className="text-center text-ink-tertiary text-[13px] py-12">Loading…</div>}
      </div>

      {confirmToggle && (
        <ConfirmDialog
          title={confirmToggle.isActive ? "Deactivate User" : "Activate User"}
          message={
            confirmToggle.isActive
              ? `${confirmToggle.name} will no longer be able to log in. Are you sure?`
              : `${confirmToggle.name} will be able to log in again.`
          }
          confirmLabel={confirmToggle.isActive ? "Deactivate" : "Activate"}
          danger={confirmToggle.isActive}
          onConfirm={() => toggleActive(confirmToggle)}
          onCancel={() => setConfirmToggle(null)}
        />
      )}
    </div>
  );
}
