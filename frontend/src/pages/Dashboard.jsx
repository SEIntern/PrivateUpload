import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import FileUploadModal from './FileUploadModal';
import FileList from './FileList';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout, token } = useAuth();
  const [files, setFiles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const fetchFiles = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/files', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(res.data);
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-yellow-700 to-pink-500 flex">
      {/* Left Sidebar */}
      <aside className="w-64 border-2 border-zinc-700 bg-gradient-to-b from-blue-900/70 via-zinc-900/70 to-pink-900/70
 m-4 p-6 flex flex-col justify-between rounded-lg">
        <div>
          <div className="font-extrabold text-xl text-blue-400 tracking-tight mb-6">
            Private File Upload
          </div>
          <div className="text-sm text-gray-300 mb-10">
            Manager: <span className="font-semibold text-white">{user?.managerEmail}</span>
          </div>
          <span className="text-zinc-200 font-medium">{user?.email}</span>
        </div>
        <div className="flex flex-col gap-4 mt-10">
          <button
            onClick={() => navigate("/changepassword")}
            className="bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-600 transition"
          >
            Change Password
          </button>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </aside>


      {/* Right Main Content */}
      <main className="flex-1 p-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">Your Files</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition"
          >
            Upload File
          </button>
        </div>
        <div
          className="bg-gradient-to-b from-blue-900/70 via-zinc-900/70 to-pink-900/70
 rounded-xl shadow-xl p-6 h-[80vh] overflow-y-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <FileList files={files} token={token} fetchFiles={fetchFiles} />
        </div>
      </main>

      {showModal && (
        <FileUploadModal
          onClose={() => {
            setShowModal(false);
            fetchFiles();
          }}
          token={token}
        />
      )}
    </div>
  );
}
