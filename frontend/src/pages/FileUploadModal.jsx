import React, { useRef, useState } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';

export default function FileUploadModal({ onClose, token }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Generate or retrieve encryption key (per user, for demo use localStorage)
  const getKey = () => {
    let key = localStorage.getItem('encryption_key');
    if (!key) {
      key = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex); // 256 bits
      localStorage.setItem('encryption_key', key);
    }
    return key;
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    setUploading(true);
    const file = fileRef.current.files[0];
    if (!file) return setError('No file selected');
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const wordArray = CryptoJS.lib.WordArray.create(ev.target.result);
        const iv = CryptoJS.lib.WordArray.random(16);
        const key = getKey();
        const encrypted = CryptoJS.AES.encrypt(wordArray, CryptoJS.enc.Hex.parse(key), { iv });
        // Store ciphertext as Base64 string in Blob
        const encryptedBase64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
        const encryptedBlob = new Blob([encryptedBase64], { type: 'application/octet-stream' });
        const formData = new FormData();
        formData.append('file', encryptedBlob, file.name);
        formData.append('iv', iv.toString(CryptoJS.enc.Hex));
        await axios.post('http://localhost:5000/api/files/upload', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUploading(false);
        onClose();
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError('Upload failed');
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-[400px] max-w-full relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 text-2xl">&times;</button>
        <h2 className="text-2xl font-extrabold mb-6 text-blue-700 text-center">Upload Encrypted File</h2>
        {error && <div className="mb-4 text-red-500 text-center font-semibold">{error}</div>}
        <form onSubmit={handleUpload}>
          <input type="file" ref={fileRef} className="mb-6 w-full border border-gray-300 rounded-lg p-2" required />
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
        </form>
      </div>
    </div>
  );
}
