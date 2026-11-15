import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bug } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "reporter" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
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
          <h1 className="text-[15px] font-semibold text-ink-primary">Create your account</h1>
          <p className="text-[13px] text-ink-tertiary mt-1">Join your team on BugTrail</p>
        </div>

        <form onSubmit={handleSubmit} className="panel p-6 space-y-4">
          {error && (
            <div className="bg-severity-p0/10 border border-severity-p0/30 text-severity-p0 text-[13px] px-3 py-2 rounded-md">
              {error}
            </div>
          )}
          <div>
            <label className="label">Full name</label>
            <input name="name" className="input" value={form.name} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              name="email"
              className="input"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              name="password"
              className="input"
              value={form.password}
              onChange={handleChange}
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="label">Role</label>
            <select name="role" className="input" value={form.role} onChange={handleChange}>
              <option value="reporter">Reporter</option>
              <option value="tester">Tester</option>
              <option value="developer">Developer</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-[13px] text-ink-tertiary mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-accent font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
