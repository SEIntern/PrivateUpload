import React, { useState, useEffect } from "react";
import axios from "axios";
import Adminfile from "./AdminFile";

export default function ManagerList({ token }) {
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

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

  // Fetch files for a manager
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
    if (token) fetchManagers();
  }, [token]);

  const handleManagerClick = (manager) => {
    if (selectedManager && selectedManager._id === manager._id) {
      setSelectedManager(null);
      setFiles([]);
    } else {
      setSelectedManager(manager);
      fetchFiles(manager._id);
    }
  };

  return (
    <div className="text-white">
      <h2 className="text-xl font-bold mb-4">Managers</h2>

      <div className="flex gap-6">
        {/* Managers list */}
        <div className="w-72 bg-white/10 border border-white/20 rounded-lg p-3 overflow-y-auto max-h-[500px]">
          <h3 className="font-semibold mb-2">All Managers</h3>
          <ul className="space-y-2">
            {managers.map((manager) => (
              <li
                key={manager._id}
                onClick={() => handleManagerClick(manager)}
                className={`p-2 rounded-lg cursor-pointer transition ${
                  selectedManager?._id === manager._id
                    ? "bg-indigo-500 text-white"
                    : "hover:bg-white/20"
                }`}
              >
                {manager.email}
              </li>
            ))}
          </ul>
        </div>

        {/* Files section */}
        <div className="flex-1 bg-white/5 border border-white/20 rounded-lg p-4">
          {selectedManager ? (
            <>
              <h3 className="text-lg font-semibold mb-3">
                Files of{" "}
                <span className="text-yellow-300">{selectedManager.email}</span>
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
                <p>No files found for this manager.</p>
              )}
            </>
          ) : (
            <p>Select a manager to view files</p>
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
