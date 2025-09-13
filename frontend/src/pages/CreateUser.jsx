import React, { useState, useEffect } from "react";
import axios from "axios";

export default function CreateUser({ token }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [managerEmail, setManagerEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState([]);

  // Fetch managers on mount
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/files/admin/users",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setManagers(res.data.filter((u) => u.role === "manager"));
      } catch (err) {
        console.error(
          "Error fetching managers:",
          err.response?.data || err.message
        );
      }
    };

    fetchManagers();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      await axios.post(
        "http://localhost:5000/api/auth/admin/create-user",
        { email, password, role, managerEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("✅ User created & credentials sent via email!");
      setEmail("");
      setPassword("");
      setManagerEmail("");
    } catch (err) {
      console.error("Error creating user:", err.response?.data || err.message);
      setMessage(`${err.response?.data?.message || "Failed to create user"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white/10 p-6 rounded-2xl shadow-lg">
      <h1 className="text-2xl font-extrabold text-green-300 mb-6">
        Create User
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:outline-none text-black"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm mb-1">Temporary Password</label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:outline-none text-black"
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-lg focus:outline-none text-black"
          >
            <option value="manager">Manager</option>
            <option value="user">Employee</option>
          </select>
        </div>

        {/* Manager Email (if user role) */}
        {role === "user" && (
          <div>
            <label className="block text-sm mb-1">Manager Email</label>
            <select
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none text-black"
            >
              <option value="">-- Select Manager --</option>
              {managers.map((manager) => (
                <option key={manager._id} value={manager.email}>
                  {manager.email}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
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
        <p className="mt-4 text-center font-medium text-yellow-200">{message}</p>
      )}
    </div>
  );
}
