import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/admin/login", {
        email,
        password,
      });
      localStorage.setItem("admin_token", res.data.token);
      setLoading(false);
      navigate("/admin-dashboard"); // Change to your admin dashboard route
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed"
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-10 rounded-2xl shadow-xl w-96"
      >
        <h2 className="text-3xl font-extrabold mb-8 text-center text-red-700">
          Admin Login
        </h2>
        {error && (
          <div className="mb-4 text-red-500 text-center font-semibold">
            {error}
          </div>
        )}
        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
          required
        />
        <input
          type="password"
          placeholder="Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
          required
        />
        <button
          type="submit"
          className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <div className="mt-6 text-center text-sm text-gray-600">
          <Link to="/login" className="text-blue-600 hover:underline font-semibold">
            User Login
          </Link>
        </div>
      </form>
       </div>
  );
}