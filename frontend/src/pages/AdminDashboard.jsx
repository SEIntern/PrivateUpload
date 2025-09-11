import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Adminfile from "./Adminfile";

export default function AdminDashboard() {
  const [token] = useState(localStorage.getItem("admin_token") || "");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/login");
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/files/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("❌ Error fetching users:", err.response?.data || err.message);
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
    fetchFiles(user._id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-700 via-purple-800 to-cyan-500 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-white drop-shadow-lg">
          Admin Dashboard
        </h1>
        <div className="flex gap-4">
          {/* Create User Button */}
          <button
            onClick={() => navigate("/create-user")}
            className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-xl shadow-lg transition transform hover:scale-105"
          >
            + Create User
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl shadow-lg transition transform hover:scale-105"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
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

        {/* User Files */}
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
              ) : files.length > 0 ? (
                <table className="w-full border rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                      <th className="p-3 border">Filename</th>
                      <th className="p-3 border">Uploaded At</th>
                      <th className="p-3 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file) => (
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
            <p className="text-purple-700">
              Select a user to view their files.
            </p>
          )}
        </div>
      </div>

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
