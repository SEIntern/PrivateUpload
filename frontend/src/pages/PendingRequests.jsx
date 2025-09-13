import React, { useEffect, useState } from "react";
import axios from "axios";

export default function PendingRequests({ token }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [managers, setManagers] = useState([]);
  const [managerEmailMap, setManagerEmailMap] = useState({});
  const [loadingIds, setLoadingIds] = useState([]);

  // Fetch pending requests
  const fetchPending = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/files/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingRequests(res.data.filter((u) => u.status === "pending"));
    } catch (err) {
      console.error("Error fetching pending requests:", err.response?.data || err.message);
    }
  };

  // Fetch managers
  const fetchManagers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/files/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setManagers(res.data.filter((u) => u.role === "manager"));
    } catch (err) {
      console.error("Error fetching managers:", err.response?.data || err.message);
    }
  };

  // Approve/Reject
  const handleAction = async (userId, action) => {
    try {
      setLoadingIds((prev) => [...prev, userId]);
      const res = await axios.put(
        `http://localhost:5000/api/auth/status/${userId}`,
        {
          action,
          managerEmail: action === "approve" ? managerEmailMap[userId] || "" : "",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPendingRequests((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, status: res.data.status } : u
        )
      );
      await fetchPending();
    } catch (err) {
      console.error("Error approving/rejecting:", err.response?.data || err.message);
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  useEffect(() => {
    if (token) {
      fetchPending();
      fetchManagers();
    }
  }, [token]);

  const renderStatus = (status) => {
    if (status === "approved")
      return <span className="px-2 py-1 text-xs font-bold text-green-700 bg-green-100 rounded-full">Approved</span>;
    if (status === "rejected")
      return <span className="px-2 py-1 text-xs font-bold text-red-700 bg-red-100 rounded-full">Rejected</span>;
    return <span className="px-2 py-1 text-xs font-bold text-yellow-700 bg-yellow-100 rounded-full">Pending</span>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-yellow-300">
          Pending User Requests
        </h1>
        <button
          onClick={fetchPending}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg shadow transition"
        >
          🔄 Refresh
        </button>
      </div>

      {pendingRequests.length > 0 ? (
        <table className="w-full border rounded-lg overflow-hidden text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <th className="p-3 border">Email</th>
              <th className="p-3 border">Role</th>
              <th className="p-3 border">Manager Email</th>
              <th className="p-3 border">Status</th>
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingRequests.map((user) => (
              <tr key={user._id} className="hover:bg-white/10 transition text-white/90">
                <td className="p-3 border">{user.email}</td>
                <td className="p-3 border capitalize">{user.role}</td>
                <td className="p-3 border">
                  {user.role === "user" ? (
                    <select
                      value={managerEmailMap[user._id] || ""}
                      onChange={(e) =>
                        setManagerEmailMap({
                          ...managerEmailMap,
                          [user._id]: e.target.value,
                        })
                      }
                      className="px-3 py-1 border rounded-lg w-full text-black"
                    >
                      <option value="">Select Manager</option>
                      {managers.map((m) => (
                        <option key={m._id} value={m.email}>
                          {m.email}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-gray-300">N/A</span>
                  )}
                </td>
                <td className="p-3 border">{renderStatus(user.status)}</td>
                <td className="p-3 border flex gap-2">
                  <button
                    onClick={() => handleAction(user._id, "approve")}
                    disabled={loadingIds.includes(user._id)}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-3 py-1 rounded-lg shadow"
                  >
                    {loadingIds.includes(user._id) ? "..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleAction(user._id, "reject")}
                    disabled={loadingIds.includes(user._id)}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-3 py-1 rounded-lg shadow"
                  >
                    {loadingIds.includes(user._id) ? "..." : "Reject"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-white/70">No pending requests.</p>
      )}
    </div>
  );
}
