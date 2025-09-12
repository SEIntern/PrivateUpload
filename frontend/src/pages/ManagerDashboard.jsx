import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Adminfile from "./Adminfile";
import FileUploadModal from "./FileUploadModal";
import { jwtDecode } from "jwt-decode";
import { Bell } from "lucide-react"; // 🔔 notification icon

export default function ManagerDashboard() {
  const [token] = useState(localStorage.getItem("token") || "");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFiles, setUserFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Manager self state
  const [managerId, setManagerId] = useState(null);
  const [managerFiles, setManagerFiles] = useState([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Manager pending requests
  const [pendingFiles, setPendingFiles] = useState([]);
  const [showRequests, setShowRequests] = useState(false);

  // Approve/Reject loading state
  const [actionLoading, setActionLoading] = useState({});

  const navigate = useNavigate();

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Decode manager ID from token
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setManagerId(decoded.id);
      } catch (err) {
        console.error("❌ Invalid token:", err);
      }
    }
  }, [token]);

  // Fetch only normal users
  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/files/manager/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const normalUsers = res.data.filter((u) => u.role === "user");
      setUsers(normalUsers);
    } catch (err) {
      console.error("❌ Error fetching users:", err.response?.data || err.message);
    }
  };

  // Fetch selected user's files
  const fetchUserFiles = async (userId) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/files/admin/users/${userId}/files`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUserFiles(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setUserFiles([]);
      setLoading(false);
    }
  };

  // Fetch manager's own files
  const fetchManagerFiles = async () => {
    if (!managerId) return;
    try {
      const res = await axios.get(
        `http://localhost:5000/api/files/admin/users/${managerId}/files`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setManagerFiles(res.data);
    } catch (err) {
      console.error("❌ Error fetching manager files:", err.response?.data || err.message);
      setManagerFiles([]);
    }
  };

  // Fetch manager pending requests
  const fetchPendingFiles = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/files/manager/files", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingFiles(res.data);
    } catch (err) {
      console.error("❌ Error fetching pending files:", err.response?.data || err.message);
    }
  };

  // Update file status (approve/reject)
  const handleAction = async (fileId, action) => {
    try {
      // mark this file's action as loading
      setActionLoading((prev) => ({ ...prev, [fileId]: action }));

      await axios.put(
        `http://localhost:5000/api/files/status/${fileId}`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // refresh after action
      fetchPendingFiles();
    } catch (err) {
      console.error("❌ Error updating file status:", err.response?.data || err.message);
    } finally {
      // clear loading for this file
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
    if (managerId) fetchManagerFiles();
  }, [managerId]);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    fetchUserFiles(user._id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-teal-500 to-green-400 p-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-white drop-shadow-lg">
          Manager Dashboard
        </h1>
        <div className="flex gap-4 items-center">
          {/* 🔔 Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowRequests(!showRequests)}
              className="bg-white text-indigo-600 p-2 rounded-full shadow-lg hover:bg-indigo-100 transition"
            >
              <Bell size={24} />
              {pendingFiles.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingFiles.length}
                </span>
              )}
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl shadow-lg transition transform hover:scale-105"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Requests Modal */}
      {showRequests && (
        <div className="bg-white/95 shadow-2xl rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-indigo-700 mb-4">Pending Approvals</h2>
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
                  <tr key={file._id} className="hover:bg-indigo-50 transition">
                    <td className="p-3 border">{file.original_filename}</td>
                    <td className="p-3 border">{file.owner?.email}</td>
                    <td className="p-3 border">
                      {new Date(file.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3 border flex gap-2">
                      <button
                        onClick={() => handleAction(file._id, "approve")}
                        disabled={actionLoading[file._id] === "approve"}
                        className={`px-3 py-1 rounded text-white transition ${
                          actionLoading[file._id] === "approve"
                            ? "bg-green-300 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600"
                        }`}
                      >
                        {actionLoading[file._id] === "approve" ? "Approving..." : "Approve"}
                      </button>

                      <button
                        onClick={() => handleAction(file._id, "reject")}
                        disabled={actionLoading[file._id] === "reject"}
                        className={`px-3 py-1 rounded text-white transition ${
                          actionLoading[file._id] === "reject"
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
            <p className="text-gray-600">No pending files right now.</p>
          )}
        </div>
      )}

      {/* Users Section */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Users List */}
        <div className="col-span-1 bg-white/90 shadow-2xl rounded-2xl p-6 backdrop-blur">
          <h2 className="text-xl font-bold mb-4 text-purple-700">Users</h2>
          <ul>
            {users.map((user) => (
              <li
                key={user._id}
                onClick={() => handleUserClick(user)}
                className={`p-3 mb-2 rounded-lg cursor-pointer transition font-medium ${
                  selectedUser?._id === user._id
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                    : "hover:bg-purple-100 text-gray-700"
                }`}
              >
                {user.email}
              </li>
            ))}
          </ul>
        </div>

        {/* Selected User Files */}
        <div className="col-span-2 bg-white/90 shadow-2xl rounded-2xl p-6 backdrop-blur">
          {selectedUser ? (
            <>
              <h2 className="text-lg font-semibold mb-4 text-indigo-700">
                Files of{" "}
                <span className="text-purple-600 font-bold">
                  {selectedUser.email}
                </span>
              </h2>
              {loading ? (
                <p className="text-gray-500">Loading files...</p>
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
                      <tr
                        key={file._id}
                        className="hover:bg-indigo-50 transition"
                      >
                        <td className="p-3 border">{file.original_filename}</td>
                        <td className="p-3 border">
                          {new Date(file.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3 border">
                          <button
                            onClick={() => setSelectedFile(file)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg shadow transition transform hover:scale-105"
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500">No files found for this user.</p>
              )}
            </>
          ) : (
            <p className="text-purple-700">Select a user to view their files.</p>
          )}
        </div>
      </div>

      {/* Manager's Own Upload & Files */}
      <div className="bg-white/90 shadow-2xl rounded-2xl p-6 backdrop-blur">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-indigo-700">Your Files</h2>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-xl shadow-lg transition transform hover:scale-105"
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
                <tr key={file._id} className="hover:bg-indigo-50 transition">
                  <td className="p-3 border">{file.original_filename}</td>
                  <td className="p-3 border">
                    {new Date(file.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3 border">
                    <div className="flex gap-4">
                      <button
                        onClick={() => setSelectedFile(file)}
                        className="w-28 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow transition transform hover:scale-105"
                      >
                        Open
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm("Are you sure you want to delete this file?")) {
                            try {
                              await axios.delete(
                                `http://localhost:5000/api/files/${file._id}`,
                                {
                                  headers: { Authorization: `Bearer ${token}` },
                                }
                              );
                              setManagerFiles((prev) => prev.filter((f) => f._id !== file._id));
                            } catch (err) {
                              console.error("❌ Delete error:", err.response?.data || err.message);
                              alert("Failed to delete file");
                            }
                          }
                        }}
                        className="w-28 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow transition transform hover:scale-105"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">You haven’t uploaded any files yet.</p>
        )}
      </div>

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
        <Adminfile
          file={selectedFile}
          token={token}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}
