import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bug, AlertTriangle, CheckCircle2, Timer, Clock, BarChart3, TrendingUp, Users } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, LineChart, Line, Legend,
} from "recharts";
import api from "../api/axios.js";
import { StatCard } from "../components/Common.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { PriorityBadge } from "../components/Badges.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDistanceToNow } from "date-fns";

const STATUS_COLORS = {
  open: "#f0475a", in_progress: "#f0a02b", in_review: "#4c8dff",
  resolved: "#3ecf8e", closed: "#6b7385", reopened: "#c77dff",
};

const PRIORITY_COLORS = { critical: "#f0475a", high: "#f0a02b", medium: "#e6c227", low: "#3ecf8e" };
const SEVERITY_COLORS = { blocker: "#f0475a", critical: "#f0a02b", major: "#e6c227", minor: "#3ecf8e" };

const tooltipStyle = {
  background: "#171b26", border: "1px solid #1f2430", borderRadius: 8, fontSize: 12, color: "#e7e9ee",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState("");
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    api.get("/projects").then((res) => setProjects(res.data.projects)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = projectFilter ? `?project=${projectFilter}` : "";
    api.get(`/dashboard${params}`)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [projectFilter]);

  if (loading) return <div className="p-8 text-center text-ink-tertiary text-[13px]">Loading dashboard…</div>;
  if (!data) return <div className="p-8 text-center text-ink-tertiary text-[13px]">Could not load dashboard.</div>;

  const { totals, byStatus, byPriority, bySeverity, byProject, byAssignee, bugsOverTime, recentBugs, recentActivity } = data;

  const statusChartData = byStatus.map((s) => ({
    name: s._id?.replace("_", " ") || "unknown", value: s.count, color: STATUS_COLORS[s._id] || "#6b7385",
  }));

  const priorityChartData = byPriority.map((p) => ({
    name: p._id, count: p.count, fill: PRIORITY_COLORS[p._id] || "#4c8dff",
  }));

  const severityChartData = bySeverity.map((s) => ({
    name: s._id, count: s.count, fill: SEVERITY_COLORS[s._id] || "#4c8dff",
  }));

  const projectChartData = (byProject || []).map((p) => ({ name: p.key || p.name, count: p.count }));
  const assigneeChartData = (byAssignee || []).map((a) => ({ name: a.name, count: a.count }));
  const timelineData = (bugsOverTime || []).map((d) => ({ date: d._id?.slice(5), count: d.count }));

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[18px] font-semibold text-ink-primary tracking-tight">Dashboard</h1>
          <p className="text-ink-tertiary text-[13px] mt-0.5">Overview of bug activity across your projects</p>
        </div>
        <select className="input w-auto" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="">All projects</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard eyebrow="Total Bugs" value={totals.totalBugs} icon={Bug} />
        <StatCard eyebrow="Open Issues" value={totals.openBugs} icon={AlertTriangle} accent="state-open" />
        <StatCard eyebrow="Resolved" value={totals.resolvedBugs} icon={CheckCircle2} accent="state-resolved" />
        <StatCard eyebrow="Assigned to Me" value={totals.myAssigned} icon={Timer} accent="accent" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard eyebrow="In Progress" value={totals.inProgressBugs} icon={TrendingUp} accent="state-progress" />
        <StatCard eyebrow="Critical Bugs" value={totals.criticalBugs} icon={AlertTriangle} accent="state-open" warn />
        <StatCard eyebrow="Overdue" value={totals.overdueBugs} icon={Clock} warn />
        <StatCard eyebrow="Projects" value={totals.totalProjects} icon={BarChart3} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="panel p-5">
          <h2 className="text-[13px] font-semibold text-ink-primary mb-4">Bugs by Status</h2>
          <div className="h-56 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusChartData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3} stroke="none">
                  {statusChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {statusChartData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-[11px] text-ink-secondary">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="capitalize">{s.name}</span>
                <span className="text-ink-tertiary">({s.value})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="text-[13px] font-semibold text-ink-primary mb-4">Bugs by Priority</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1e29" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8b93a7" }} axisLine={{ stroke: "#1f2430" }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#8b93a7" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#171b26" }} contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {priorityChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="panel p-5">
          <h2 className="text-[13px] font-semibold text-ink-primary mb-4">Bugs by Severity</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1e29" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8b93a7" }} axisLine={{ stroke: "#1f2430" }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#8b93a7" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#171b26" }} contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {severityChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {timelineData.length > 0 && (
          <div className="panel p-5">
            <h2 className="text-[13px] font-semibold text-ink-primary mb-4">Bugs Created Over Time (30 days)</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1e29" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8b93a7" }} axisLine={{ stroke: "#1f2430" }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#8b93a7" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="count" stroke="#4c8dff" strokeWidth={2} dot={{ fill: "#4c8dff", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Charts row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {projectChartData.length > 0 && (
          <div className="panel p-5">
            <h2 className="text-[13px] font-semibold text-ink-primary mb-4">Bugs by Project</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1e29" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#8b93a7" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#8b93a7" }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#4c8dff" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {assigneeChartData.length > 0 && (
          <div className="panel p-5">
            <h2 className="text-[13px] font-semibold text-ink-primary mb-4">Active Bugs by Developer</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assigneeChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1e29" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#8b93a7" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#8b93a7" }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#c77dff" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Recent activity + bugs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold text-ink-primary">Recent Bugs</h2>
            <Link to="/bugs" className="text-[12px] text-accent font-medium hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-stroke-soft">
            {recentBugs.map((bug) => (
              <Link key={bug._id} to={`/bugs/${bug._id}`} className="flex items-center justify-between py-2.5 hover:bg-surface-raised -mx-2 px-2 rounded-md transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="mono-tag text-ink-tertiary shrink-0">{bug.bugId}</span>
                  <span className="text-[13px] font-medium text-ink-primary truncate">{bug.title}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <PriorityBadge priority={bug.priority} />
                  <StatusBadge status={bug.status} />
                </div>
              </Link>
            ))}
            {recentBugs.length === 0 && <div className="text-center text-ink-tertiary text-[13px] py-6">No bugs reported yet.</div>}
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="text-[13px] font-semibold text-ink-primary mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {(recentActivity || []).map((a) => (
              <div key={a._id} className="text-[12px] text-ink-tertiary border-l-2 border-stroke pl-3 py-0.5">
                <span className="font-medium text-ink-secondary">{a.actor?.name}</span>{" "}
                {a.action === "created" ? "created" : a.action === "commented" ? "commented on" : a.action.replace("_", " ")}{" "}
                {a.bug && (
                  <Link to={`/bugs/${a.bug._id}`} className="text-accent hover:underline">
                    {a.bug.bugId}
                  </Link>
                )}
                {a.fromValue && a.toValue && <span> ({a.fromValue} → {a.toValue})</span>}
                <div className="text-ink-tertiary/70 text-[10px] mt-0.5">
                  {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                </div>
              </div>
            ))}
            {(!recentActivity || recentActivity.length === 0) && (
              <div className="text-center text-ink-tertiary text-[13px] py-6">No recent activity.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
