import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Bug, FolderClosed, Inbox, Eye, History, LogOut, LayoutGrid,
  Users, Settings, ChevronLeft, Menu, Plus, Milestone,
} from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    api.get("/projects").then((res) => setProjects(res.data.projects)).catch(() => {});
  }, [location.pathname]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const workspaceLinks = [
    { icon: Inbox, label: "Assigned to me", to: "/workspace/assigned" },
    { icon: Eye, label: "Watching", to: "/workspace/watching" },
    { icon: History, label: "Recently closed", to: "/workspace/recently-closed" },
  ];

  const navClasses = (isActive) =>
    `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
      isActive ? "bg-surface-raised text-ink-primary" : "text-ink-secondary hover:text-ink-primary"
    }`;

  const sidebarContent = (
    <>
      <div className="h-14 flex items-center gap-2 px-4 border-b border-stroke shrink-0">
        <div className="bg-accent text-white p-1.5 rounded-md">
          <Bug size={15} strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <span className="font-semibold text-[14px] text-ink-primary tracking-tight">BugTrail</span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <NotificationBell />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 text-ink-tertiary hover:text-ink-primary rounded-md transition-colors"
          >
            <ChevronLeft size={14} className={`transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <NavLink to="/" end className={({ isActive }) => navClasses(isActive)}>
            <LayoutGrid size={15} />
            {!collapsed && "Dashboard"}
          </NavLink>

          <NavLink to="/bugs" className={({ isActive }) => `mt-1 ${navClasses(isActive)}`}>
            <Bug size={15} />
            {!collapsed && "All Bugs"}
          </NavLink>

          {!collapsed && (
            <>
              <div className="px-2.5 text-[11px] font-semibold text-ink-tertiary tracking-wider mt-5 mb-2">
                PROJECTS
              </div>
              <div className="space-y-0.5">
                {projects.slice(0, 8).map((p) => (
                  <NavLink
                    key={p._id}
                    to={`/projects/${p._id}`}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors ${
                        isActive
                          ? "bg-surface-raised text-ink-primary font-medium"
                          : "text-ink-secondary hover:text-ink-primary"
                      }`
                    }
                  >
                    <FolderClosed size={14} className="shrink-0" />
                    <span className="truncate">{p.name}</span>
                  </NavLink>
                ))}
                <NavLink
                  to="/projects"
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] text-ink-tertiary hover:text-ink-secondary transition-colors"
                >
                  View all projects
                </NavLink>
              </div>

              <div className="px-2.5 text-[11px] font-semibold text-ink-tertiary tracking-wider mt-5 mb-2">
                MY WORKSPACE
              </div>
              <div className="space-y-0.5">
                {workspaceLinks.map((l) => (
                  <NavLink
                    key={l.label}
                    to={l.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors ${
                        isActive ? "bg-surface-raised text-ink-primary font-medium" : "text-ink-secondary hover:text-ink-primary"
                      }`
                    }
                  >
                    <l.icon size={14} /> {l.label}
                  </NavLink>
                ))}
              </div>

              {(user?.role === "admin") && (
                <>
                  <div className="px-2.5 text-[11px] font-semibold text-ink-tertiary tracking-wider mt-5 mb-2">
                    ADMIN
                  </div>
                  <NavLink
                    to="/admin/users"
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors ${
                        isActive ? "bg-surface-raised text-ink-primary font-medium" : "text-ink-secondary hover:text-ink-primary"
                      }`
                    }
                  >
                    <Users size={14} /> User Management
                  </NavLink>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="border-t border-stroke p-3 shrink-0">
        <div className="flex items-center gap-2.5 px-1.5 py-1.5">
          <div className="w-7 h-7 rounded-full bg-accent-soft text-accent flex items-center justify-center text-[11px] font-semibold shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-ink-primary truncate">{user?.name}</div>
              <div className="text-[11px] text-ink-tertiary capitalize">{user?.role}</div>
            </div>
          )}
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="p-1.5 text-ink-tertiary hover:text-ink-primary rounded-md transition-colors"
            title="Log out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 p-2 bg-surface border border-stroke rounded-md text-ink-secondary"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-64"
        } shrink-0 h-screen sticky top-0 flex flex-col bg-canvas border-r border-stroke transition-all duration-200 ${
          mobileOpen ? "fixed inset-y-0 left-0 z-50" : "hidden lg:flex"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
