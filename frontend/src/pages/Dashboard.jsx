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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-yellow-700 to-pink-500">
      <header className="flex justify-between items-center px-8 py-5 bg-zinc-800 shadow-lg rounded-b-lg">
        <div className="font-extrabold text-2xl text-blue-400 tracking-tight">Private File Upload</div>
        <div className="flex items-center gap-4">
          <span className="text-zinc-200 font-medium">{user?.email}</span>
          <button onClick={() => navigate("/changepassword")} className="bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-600 transition">Change Password</button>
          <button onClick={logout} className="bg-red-500 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-red-600 transition">Logout</button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-xl h-[70vh] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">Your Files</h1>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition">Upload File</button>
        </div>
        <FileList files={files} token={token} fetchFiles={fetchFiles} />
      </main>
      {showModal && <FileUploadModal onClose={() => { setShowModal(false); fetchFiles(); }} token={token} />}
    </div>
  );
}
