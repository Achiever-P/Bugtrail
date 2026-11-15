import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import { PrivateRoute } from "./components/Common.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Projects from "./pages/Projects.jsx";
import ProjectDetail from "./pages/ProjectDetail.jsx";
import BugList from "./pages/BugList.jsx";
import BugDetail from "./pages/BugDetail.jsx";
import KanbanBoard from "./pages/KanbanBoard.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import SprintManagement from "./pages/SprintManagement.jsx";
import WorkspaceAssigned from "./pages/WorkspaceAssigned.jsx";
import WorkspaceWatching from "./pages/WorkspaceWatching.jsx";
import WorkspaceRecentlyClosed from "./pages/WorkspaceRecentlyClosed.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-canvas flex">
      <Sidebar />
      <div className="flex-1 min-w-0 lg:ml-0 ml-0">{children}</div>
    </div>
  );
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout><Dashboard /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <PrivateRoute>
            <Layout><Projects /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <PrivateRoute>
            <Layout><ProjectDetail /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/projects/:id/kanban"
        element={
          <PrivateRoute>
            <Layout><KanbanBoard /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/projects/:id/sprints"
        element={
          <PrivateRoute>
            <Layout><SprintManagement /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/bugs"
        element={
          <PrivateRoute>
            <Layout><BugList /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/bugs/:id"
        element={
          <PrivateRoute>
            <Layout><BugDetail /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/workspace/assigned"
        element={
          <PrivateRoute>
            <Layout><WorkspaceAssigned /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/workspace/watching"
        element={
          <PrivateRoute>
            <Layout><WorkspaceWatching /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/workspace/recently-closed"
        element={
          <PrivateRoute>
            <Layout><WorkspaceRecentlyClosed /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <PrivateRoute>
            <AdminRoute>
              <Layout><UserManagement /></Layout>
            </AdminRoute>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
