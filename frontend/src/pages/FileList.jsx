import React, { useState } from 'react';
import FileDownloadModal from './FileDownloadModal';
import axios from 'axios';

export default function FileList({ files, token, fetchFiles }) {
  const [selected, setSelected] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    setDeletingId(fileId);
    try {
      await axios.delete(`http://localhost:5000/api/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFiles();
    } catch (err) {
      alert('Failed to delete file.');
    }
    setDeletingId(null);
  };

  // small helper to color status
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-400 font-bold';
      case 'rejected':
        return 'text-red-400 font-bold';
      default:
        return 'text-yellow-400 font-semibold';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white ">
        {files.map((file) => (
          <div
            key={file._id}
            className="bg-zinc-600 rounded-xl shadow-lg p-6 flex flex-col gap-2"
          >
            <div className="font-semibold text-lg text-gray-200 truncate">
              {file.original_filename}
            </div>
            <div className="text-xs text-gray-400">
              Uploaded: {new Date(file.createdAt).toLocaleString()}
            </div>

            {/* Show Status */}
            <div className={`text-sm ${getStatusColor(file.status)}`}>
              Status: {file.status || 'pending'}
            </div>

            <div className="flex gap-2 mt-auto">
              <button
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                onClick={() => setSelected(file)}
              >
                Download & Preview
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                onClick={() => handleDelete(file._id)}
                disabled={deletingId === file._id}
              >
                {deletingId === file._id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
      {selected && (
        <FileDownloadModal
          file={selected}
          token={token}
          onClose={() => {
            setSelected(null);
            fetchFiles();
          }}
        />
      )}
    </div>
  );
}
