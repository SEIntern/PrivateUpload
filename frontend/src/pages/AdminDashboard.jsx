import React, { useState, useEffect } from "react";
import axios from "axios";
import Adminfile from "./Adminfile";
import PendingRequests from "./PendingRequests";
import CreateUser from "./CreateUser";

export default function AdminDashboard() {
  const [token] = useState(localStorage.getItem("admin_token") || "");
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard | requests | create

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/files/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setManagers(res.data.filter((u) => u.role === "manager"));
      setUsers(res.data.filter((u) => u.role === "user" && u.status === "approved"));
    } catch (err) {
      console.error("Error fetching users:", err.response?.data || err.message);
    }
  };

  // Fetch files for selected user
  const fetchFiles = async (userId) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/files/admin/users/${userId}/files`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setFiles(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setFiles([]);
    setActiveTab("dashboard");
    fetchFiles(user._id);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 flex p-6 gap-6">
      {/* LEFT PANEL */}
      <div className="w-80 bg-white/10 backdrop-blur-md border border-white/20 text-white p-6 flex flex-col justify-between rounded-2xl shadow-lg">
        {/* Top Section */}
        <div>
          <h1 className="text-2xl font-extrabold mb-8">Admin Dashboard</h1>

          {/* Accounts Box */}
          <div className="bg-white/10 rounded-lg p-3 border border-white/20">
            <h2 className="font-semibold mb-3">Accounts</h2>

            <div className="space-y-3">
              {/* Managers Dropdown */}
              <details className="bg-white/5 rounded-lg p-2">
                <summary className="cursor-pointer font-medium text-indigo-200">
                  👔 Managers
                </summary>
                <ul className="mt-2 space-y-2 pl-4">
                  {managers.map((manager) => (
                    <li
                      key={manager._id}
                      onClick={() => handleUserClick(manager)}
                      className={`p-2 rounded-lg cursor-pointer transition ${
                        selectedUser?._id === manager._id
                          ? "bg-indigo-500 text-white"
                          : "hover:bg-white/20"
                      }`}
                    >
                      {manager.email}
                    </li>
                  ))}
                </ul>
              </details>

              {/* Users Dropdown */}
              <details className="bg-white/5 rounded-lg p-2">
                <summary className="cursor-pointer font-medium text-indigo-200">
                  👤 Users
                </summary>
                <ul className="mt-2 space-y-2 pl-4">
                  {users.map((user) => (
                    <li
                      key={user._id}
                      onClick={() => handleUserClick(user)}
                      className={`p-2 rounded-lg cursor-pointer transition ${
                        selectedUser?._id === user._id
                          ? "bg-indigo-500 text-white"
                          : "hover:bg-white/20"
                      }`}
                    >
                      {user.email}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </div>
        </div>

        {/* Bottom Section - Buttons */}
        <div className="flex flex-col gap-3 mt-8">
          <button
            onClick={() => setActiveTab("requests")}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow transition"
          >
            View Requests
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow transition"
          >
            + Create User
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-lg text-white">
        {activeTab === "dashboard" && (
          selectedUser ? (
            <>
              <h2 className="text-lg font-semibold mb-4 text-white/90">
                Files of{" "}
                <span className="text-yellow-300 font-bold">
                  {selectedUser.email}
                </span>
              </h2>
              {loading ? (
                <p className="text-white/70">Loading files...</p>
              ) : files.length > 0 ? (
                <table className="w-full border border-white/20 rounded-lg overflow-hidden text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                      <th className="p-3 border border-white/20">Filename</th>
                      <th className="p-3 border border-white/20">Uploaded At</th>
                      <th className="p-3 border border-white/20">Status</th>
                      <th className="p-3 border border-white/20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file) => (
                      <tr
                        key={file._id}
                        className="hover:bg-white/10 transition text-white/90"
                      >
                        <td className="p-3 border border-white/20">
                          {file.original_filename}
                        </td>
                        <td className="p-3 border border-white/20">
                          {new Date(file.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3 border border-white/20">
                          <span
                            className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                              file.status === "approved"
                                ? "bg-green-500/30 text-green-200"
                                : file.status === "pending"
                                ? "bg-yellow-500/30 text-yellow-200"
                                : "bg-red-500/30 text-red-200"
                            }`}
                          >
                            {file.status}
                          </span>
                        </td>
                        <td className="p-3 border border-white/20">
                          <button
                            onClick={() => setSelectedFile(file)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg shadow transition"
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-white/70">No files found for this user.</p>
              )}
            </>
          ) : (
            <p className="text-white/80">
              Select a user or manager to view files.
            </p>
          )
        )}

        {activeTab === "requests" && <PendingRequests token={token} />}
        {activeTab === "create" && <CreateUser token={token} />}
      </div>

      {/* File Modal */}
      {selectedFile && (
        <Adminfile
          file={selectedFile}
          token={token}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}
