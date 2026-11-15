import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bug } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-[360px]">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-accent text-white p-2 rounded-lg mb-3">
            <Bug size={20} strokeWidth={2.5} />
          </div>
          <h1 className="text-[15px] font-semibold text-ink-primary">Sign in to BugTrail</h1>
          <p className="text-[13px] text-ink-tertiary mt-1">Track and resolve issues across your team</p>
        </div>

        <form onSubmit={handleSubmit} className="panel p-6 space-y-4">
          {error && (
            <div className="bg-severity-p0/10 border border-severity-p0/30 text-severity-p0 text-[13px] px-3 py-2 rounded-md">
              {error}
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-[13px] text-ink-tertiary mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-accent font-medium hover:underline">Register</Link>
        </p>

        <div className="mt-6 panel px-3.5 py-3 text-[12px] text-ink-tertiary">
          <div className="font-medium text-ink-secondary mb-1">Demo accounts · password123</div>
          <div className="font-mono text-[11px] leading-relaxed">
            admin@bugtracker.dev &middot; aditi@bugtracker.dev (dev) &middot; kavya@bugtracker.dev (tester)
          </div>
        </div>
      </div>
    </div>
  );
}
