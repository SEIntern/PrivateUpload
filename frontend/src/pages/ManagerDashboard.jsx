import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Adminfile from "./Adminfile";
import FileUploadModal from "./FileUploadModal";
import { jwtDecode } from "jwt-decode";
import { Bell } from "lucide-react";

export default function ManagerDashboard() {
  const [token] = useState(localStorage.getItem("token") || "");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFiles, setUserFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const [manager, setManager] = useState(null);
  const [managerFiles, setManagerFiles] = useState([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const [pendingFiles, setPendingFiles] = useState([]);
  const [showRequests, setShowRequests] = useState(false);

  const [actionLoading, setActionLoading] = useState({});

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setManager(decoded);
      } catch (err) {
        console.error("Invalid token:", err);
      }
    }
  }, [token]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/files/manager/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const normalUsers = res.data.filter((u) => u.role === "user");
      setUsers(normalUsers);
    } catch (err) {
      console.error("Error fetching users:", err.response?.data || err.message);
    }
  };

  const fetchUserFiles = async (userId) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/files/admin/users/${userId}/files`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserFiles(res.data);
    } catch (err) {
      console.error(err);
      setUserFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagerFiles = async () => {
    if (!manager?.id) return;
    try {
      const res = await axios.get(
        `http://localhost:5000/api/files/admin/users/${manager.id}/files`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setManagerFiles(res.data);
    } catch (err) {
      console.error("Error fetching manager files:", err.response?.data || err.message);
    }
  };

  const fetchPendingFiles = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/files/manager/files", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingFiles(res.data);
    } catch (err) {
      console.error("Error fetching pending files:", err.response?.data || err.message);
    }
  };

  const handleAction = async (fileId, action) => {
    try {
      setActionLoading((prev) => ({ ...prev, [fileId]: action }));
      await axios.put(
        `http://localhost:5000/api/files/status/${fileId}`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPendingFiles();
    } catch (err) {
      console.error("Error updating file status:", err.response?.data || err.message);
    } finally {
      setActionLoading((prev) => {
        const updated = { ...prev };
        delete updated[fileId];
        return updated;
      });
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchPendingFiles();
    }
  }, [token]);

  useEffect(() => {
    if (manager?.id) fetchManagerFiles();
  }, [manager]);

  const handleUserClick = (user) => {
    if (selectedUser?._id === user._id) {
      // If same user clicked again → hide box
      setSelectedUser(null);
      setUserFiles([]);
    } else {
      // Else → show clicked user's files
      setSelectedUser(user);
      fetchUserFiles(user._id);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-indigo-500 flex">

      {/* Left Sidebar */}
      <aside className="w-64 border-2 border-zinc-700 bg-gradient-to-b from-blue-900/70 via-zinc-900/70 to-pink-900/70
       m-4 p-6 flex flex-col justify-between rounded-lg">
        <div>
          <div className="font-extrabold text-xl text-blue-400 tracking-tight mb-6">
            Manager Dashboard
          </div>
          <div className="text-sm text-gray-300 mb-6">
            Email: <span className="font-semibold text-white">{manager?.email}</span>
          </div>

          {/* Notifications */}
          <div className="flex gap-2 items-center mb-6">
            <button
              onClick={() => setShowRequests(!showRequests)}
              className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-full shadow-lg hover:bg-indigo-100 transition relative"
            >
              <Bell size={20} />
              <span className="text-sm font-medium">Pending Request</span>
              {pendingFiles.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingFiles.length}
                </span>
              )}
            </button>
          </div>

          {/* Users List */}
          <div className="bg-white/10 rounded-lg p-3 h-64 overflow-y-auto">
            <h2 className="text-sm font-bold mb-2 text-purple-400">Users</h2>
            <ul>
              {users.map((user) => (
                <li
                  key={user._id}
                  onClick={() => handleUserClick(user)}
                  className={`p-2 mb-2 rounded-lg cursor-pointer transition text-sm font-medium ${selectedUser?._id === user._id
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                    : "hover:bg-purple-500 text-gray-200"
                    }`}
                >
                  {user.email}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-10">
          <button
            onClick={() => navigate("/changepassword")}
            className="bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-600 transition"
          >
            Change Password
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Right Content */}
      <main className="flex-1 p-10 space-y-10 overflow-y-auto">

        {/* Pending Approvals */}
        {/* Manager's Own Files */}
        <div className="border-zinc-700 bg-gradient-to-b from-blue-900/70 via-zinc-900/70 to-pink-900/70 shadow-2xl rounded-2xl p-6 backdrop-blur">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-indigo-200">Your Files</h2>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-xl shadow-lg transition"
            >
              + Upload File
            </button>
          </div>
          {managerFiles.length > 0 ? (
            <table className="w-full border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  <th className="p-3 border">Filename</th>
                  <th className="p-3 border">Uploaded At</th>
                  <th className="p-3 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {managerFiles.map((file) => (
                  <tr key={file._id} className="hover:bg-indigo-900/40 transition">
                    <td className="p-3 border text-gray-200">{file.original_filename}</td>
                    <td className="p-3 border text-gray-300">
                      {new Date(file.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3 border flex gap-2">
                      <button
                        onClick={() => setSelectedFile(file)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow transition"
                      >
                        Open
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm("Are you sure you want to delete this file?")) {
                            try {
                              await axios.delete(
                                `http://localhost:5000/api/files/${file._id}`,
                                { headers: { Authorization: `Bearer ${token}` } }
                              );
                              setManagerFiles((prev) => prev.filter((f) => f._id !== file._id));
                            } catch (err) {
                              console.error("Delete error:", err.response?.data || err.message);
                              alert("Failed to delete file");
                            }
                          }
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-300">You haven’t uploaded any files yet.</p>
          )}
        </div>

        {showRequests && (
          <div className="border-zinc-700 bg-gradient-to-b from-blue-900/70 via-zinc-900/70 to-pink-900/70 shadow-2xl rounded-2xl p-6 backdrop-blur">
            <h2 className="text-xl font-bold text-indigo-200 mb-4">Pending Approvals</h2>
            {pendingFiles.length > 0 ? (
              <table className="w-full border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    <th className="p-3 border">Filename</th>
                    <th className="p-3 border">Uploaded By</th>
                    <th className="p-3 border">Uploaded At</th>
                    <th className="p-3 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingFiles.map((file) => (
                    <tr key={file._id} className="hover:bg-indigo-900/40 transition">
                      <td className="p-3 border text-gray-200">{file.original_filename}</td>
                      <td className="p-3 border text-gray-300">{file.owner?.email}</td>
                      <td className="p-3 border text-gray-300">
                        {new Date(file.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3 border flex gap-2">
                        <button
                          onClick={() => handleAction(file._id, "approve")}
                          disabled={actionLoading[file._id] === "approve"}
                          className={`px-3 py-1 rounded text-white transition ${actionLoading[file._id] === "approve"
                              ? "bg-green-300 cursor-not-allowed"
                              : "bg-green-500 hover:bg-green-600"
                            }`}
                        >
                          {actionLoading[file._id] === "approve" ? "Approving..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleAction(file._id, "reject")}
                          disabled={actionLoading[file._id] === "reject"}
                          className={`px-3 py-1 rounded text-white transition ${actionLoading[file._id] === "reject"
                              ? "bg-red-300 cursor-not-allowed"
                              : "bg-red-500 hover:bg-red-600"
                            }`}
                        >
                          {actionLoading[file._id] === "reject" ? "Rejecting..." : "Reject"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-300">No pending files right now.</p>
            )}
          </div>
        )}

        {/* User Files Box */}
        {selectedUser && (
          <div className="border-zinc-700 bg-gradient-to-b from-blue-900/70 via-zinc-900/70 to-pink-900/70 shadow-2xl rounded-2xl p-6 backdrop-blur">
            <h2 className="text-lg font-semibold mb-4 text-indigo-200">
              Files of <span className="text-purple-300 font-bold">{selectedUser.email}</span>
            </h2>
            {loading ? (
              <p className="text-gray-300">Loading files...</p>
            ) : userFiles.length > 0 ? (
              <table className="w-full border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    <th className="p-3 border">Filename</th>
                    <th className="p-3 border">Uploaded At</th>
                    <th className="p-3 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userFiles.map((file) => (
                    <tr key={file._id} className="hover:bg-indigo-900/40 transition">
                      <td className="p-3 border text-gray-200">{file.original_filename}</td>
                      <td className="p-3 border text-gray-300">
                        {new Date(file.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3 border">
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
              <p className="text-gray-300">No files found for this user.</p>
            )}
          </div>
        )}


      </main>


      {/* Upload Modal */}
      {uploadModalOpen && (
        <FileUploadModal
          token={token}
          onClose={() => {
            setUploadModalOpen(false);
            fetchManagerFiles();
          }}
        />
      )}

      {/* File Preview Modal */}
      {selectedFile && (
        <Adminfile file={selectedFile} token={token} onClose={() => setSelectedFile(null)} />
      )}
    </div>
  );
}
