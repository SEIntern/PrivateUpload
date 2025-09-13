import React, { useState, useEffect } from "react";
import axios from "axios";
import Adminfile from "./AdminFile";

export default function UserList({ token }) {
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // fetch managers + users
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

  // fetch files for a user
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
    if (selectedUser && selectedUser._id === user._id) {
      setSelectedUser(null);
      setFiles([]);
    } else {
      setSelectedUser(user);
      fetchFiles(user._id);
    }
  };

  return (
    <div className="text-white">
      <h2 className="text-xl font-bold mb-4">Users by Manager</h2>

      <div className="flex gap-6">
        {/* Users by Manager dropdown */}
        <div className="w-72 bg-white/10 border border-white/20 rounded-lg p-3 overflow-y-auto max-h-[500px]">
          <h3 className="font-semibold mb-2">Managers</h3>
          <ul className="space-y-2">
            {managers.map((manager) => {
              const managerUsers = users.filter(
                (u) => u.managerEmail === manager.email
              );
              return (
                <li key={manager._id} className="mb-2">
                  <details className="bg-white/5 rounded-lg p-2">
                    <summary className="cursor-pointer text-indigo-200 font-medium">
                      {manager.email}
                    </summary>
                    <ul className="mt-2 space-y-2 pl-4">
                      {managerUsers.length > 0 ? (
                        managerUsers.map((user) => (
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
                        ))
                      ) : (
                        <li className="text-sm text-white/60">No users</li>
                      )}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Files section */}
        <div className="flex-1 bg-white/5 border border-white/20 rounded-lg p-4">
          {selectedUser ? (
            <>
              <h3 className="text-lg font-semibold mb-3">
                Files of{" "}
                <span className="text-yellow-300">{selectedUser.email}</span>
              </h3>

              {loading ? (
                <p>Loading files...</p>
              ) : files.length > 0 ? (
                <table className="w-full border border-white/20 text-sm rounded-lg overflow-hidden">
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
                <p>No files found.</p>
              )}
            </>
          ) : (
            <p>Select a user to view files</p>
          )}
        </div>
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
