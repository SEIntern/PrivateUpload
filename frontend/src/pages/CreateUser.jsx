import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function CreateUser() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); // 🔹 NEW state
  const navigate = useNavigate();

  const token = localStorage.getItem("admin_token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true); // 🔹 Start loading

    try {
      await axios.post(
        "http://localhost:5000/api/auth/admin/create-user",
        { email, password, role },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("✅ User created & credentials sent via email!");
      setEmail("");
      setPassword("");

      // go back to dashboard after short delay
      setTimeout(() => navigate("/admin-dashboard"), 1000);
    } catch (err) {
      console.error("Error creating user:", err.response?.data || err.message);
      setMessage(
        `❌ ${err.response?.data?.message || "Failed to create user"}`
      );
    } finally {
      setLoading(false); // 🔹 Stop loading
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-700 via-purple-800 to-cyan-500 p-6">
      <div className="bg-white/90 shadow-2xl rounded-2xl p-8 w-full max-w-md backdrop-blur">
        <h1 className="text-3xl font-extrabold text-center text-indigo-700 mb-6">
          Create User
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Temporary Password
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="manager">Manager</option>
              <option value="user">Employee</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading} // 🔹 Prevent multiple clicks
            className={`w-full py-2 rounded-lg font-semibold shadow transition transform ${
              loading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105"
            }`}
          >
            {loading ? "Creating..." : "Create User"}
          </button>
        </form>

        {/* Feedback */}
        {message && (
          <p className="mt-4 text-center font-medium text-gray-700">{message}</p>
        )}

        {/* Back to Dashboard */}
        <button
          onClick={() => navigate("/admin-dashboard")}
          className="mt-6 w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold shadow transition"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
