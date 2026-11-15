import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Bell, Check, CheckCheck, Bug as BugIcon, MessageSquare, UserPlus, ArrowRightLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import api from "../api/axios.js";

const TYPE_ICONS = {
  bug_assigned: UserPlus,
  bug_reassigned: ArrowRightLeft,
  bug_status_changed: ArrowRightLeft,
  bug_commented: MessageSquare,
  bug_due_soon: BugIcon,
  project_member_added: UserPlus,
  project_member_removed: UserPlus,
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const bellRef = useRef(null);
  const dropdownRef = useRef(null);

  const load = () => {
    api.get("/notifications?unread=false").then((res) => {
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    }).catch(() => {});
  };

  // Calculate dropdown position relative to the viewport using the bell button's rect
  const updatePosition = useCallback(() => {
    if (!bellRef.current) return;
    const rect = bellRef.current.getBoundingClientRect();
    const dropdownWidth = 360;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Find the sidebar element to get its right edge
    const sidebar = bellRef.current.closest("aside");
    const sidebarRight = sidebar ? sidebar.getBoundingClientRect().right : rect.right;

    // Position: align the dropdown to the right of the sidebar, vertically aligned with the bell
    let left = sidebarRight + 4; // 4px gap from the sidebar edge
    let top = rect.top; // align with the top of the bell button

    // If the dropdown would overflow the right edge of the viewport, anchor to the right side
    if (left + dropdownWidth > viewportWidth - 16) {
      left = viewportWidth - dropdownWidth - 16;
    }

    // Ensure it doesn't go off the left edge
    if (left < 8) {
      left = 8;
    }

    // Calculate max height so the dropdown doesn't overflow the viewport bottom
    const maxHeight = Math.min(viewportHeight - top - 16, viewportHeight * 0.6);

    setDropdownStyle({
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${dropdownWidth}px`,
      maxHeight: `${maxHeight}px`,
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      api.get("/notifications/unread-count").then((res) => setUnreadCount(res.data.count)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Recalculate position when opening and on scroll/resize
  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true); // capture phase for inner scrolls
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (
        bellRef.current && !bellRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await api.patch("/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const dropdown = open
    ? createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="bg-surface border border-stroke rounded-lg shadow-2xl flex flex-col animate-in fade-in slide-in-from-left-2 duration-150"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-stroke shrink-0">
            <h3 className="text-[13px] font-semibold text-ink-primary">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[11px] text-accent hover:underline flex items-center gap-1">
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-ink-tertiary">No notifications</div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICONS[n.type] || BugIcon;
                return (
                  <div
                    key={n._id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-stroke-soft hover:bg-surface-raised transition-colors ${
                      !n.isRead ? "bg-accent/5" : ""
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-ink-primary">{n.title}</div>
                      <div className="text-[11px] text-ink-tertiary truncate">{n.message}</div>
                      <div className="text-[10px] text-ink-tertiary mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </div>
                      {n.bug && (
                        <Link
                          to={`/bugs/${n.bug._id}`}
                          onClick={() => { setOpen(false); if (!n.isRead) markRead(n._id); }}
                          className="text-[11px] text-accent hover:underline mt-0.5 inline-block"
                        >
                          {n.bug.bugId} — {n.bug.title?.slice(0, 40)}
                        </Link>
                      )}
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => markRead(n._id)}
                        className="shrink-0 p-1 text-ink-tertiary hover:text-accent transition-colors"
                        title="Mark as read"
                      >
                        <Check size={12} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={bellRef}
        onClick={() => { setOpen(!open); if (!open) load(); }}
        className="relative p-1.5 text-ink-tertiary hover:text-ink-primary rounded-md transition-colors"
        title="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-severity-p0 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {dropdown}
    </>
  );
}
