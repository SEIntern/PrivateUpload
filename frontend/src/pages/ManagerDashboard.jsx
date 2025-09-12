import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Adminfile from "./Adminfile";
import FileUploadModal from "./FileUploadModal";
import { jwtDecode } from "jwt-decode";

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
      const res = await axios.get("http://localhost:5000/api/files/admin/users", {
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

  useEffect(() => {
    if (token) fetchUsers();
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
        <div className="flex gap-4">
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl shadow-lg transition transform hover:scale-105"
          >
            Logout
          </button>
        </div>
      </div>

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
                className={`p-3 mb-2 rounded-lg cursor-pointer transition font-medium ${selectedUser?._id === user._id
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

      {/* Modal for decrypt + preview + download */}
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
