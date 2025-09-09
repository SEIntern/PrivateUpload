import React, { useState } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';

function isImage(filename) {
  return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(filename);
}

export default function FileDownloadModal({ file, token, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewing, setPreviewing] = useState(false);

  const getKey = () => localStorage.getItem('encryption_key');

  const handlePreview = async () => {
    setPreviewing(true);
    setError('');
    try {
      console.log('[Preview] Fetching file metadata...');
      const { data } = await axios.get(`http://localhost:5000/api/files/${file._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[Preview] File metadata:', data);
      const response = await fetch(data.url);
      const encrypted = await response.arrayBuffer();
      console.log('[Preview] Encrypted arrayBuffer length:', encrypted.byteLength);
      const key = getKey();
      if (!key) throw new Error('No encryption key found');
      console.log('[Preview] Using key:', key);
      const iv = CryptoJS.enc.Hex.parse(data.iv);
      console.log('[Preview] Using IV:', data.iv);
      function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
      }
      const encryptedBase64 = arrayBufferToBase64(encrypted);
      console.log('[Preview] Encrypted base64 length:', encryptedBase64.length);
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: CryptoJS.enc.Base64.parse(encryptedBase64) },
        CryptoJS.enc.Hex.parse(key),
        { iv }
      );
      console.log('[Preview] Decrypted:', decrypted);
      function wordArrayToUint8Array(wordArray) {
        const words = wordArray.words;
        const sigBytes = wordArray.sigBytes;
        const u8 = new Uint8Array(sigBytes);
        for (let i = 0; i < sigBytes; ++i) {
          u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        }
        return u8;
      }
      const typedArray = wordArrayToUint8Array(decrypted);
      console.log('[Preview] TypedArray length:', typedArray.length);
      function getMimeType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        switch (ext) {
          case 'jpg':
          case 'jpeg':
            return 'image/jpeg';
          case 'png':
            return 'image/png';
          case 'gif':
            return 'image/gif';
          case 'bmp':
            return 'image/bmp';
          case 'webp':
            return 'image/webp';
          default:
            return 'application/octet-stream';
        }
      }
      const mimeType = getMimeType(file.original_filename);
      console.log('[Preview] Blob mimeType:', mimeType);
      const blob = new Blob([typedArray], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      console.log('[Preview] Preview URL:', url);
      setPreviewUrl(url);
      setPreviewing(false);
    } catch (err) {
      setError('Failed to decrypt or preview file: ' + (err.message || err));
      setPreviewing(false);
      console.error('[Preview] Error:', err);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      const { data } = await axios.get(`http://localhost:5000/api/files/${file._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const response = await fetch(data.url);
      const encrypted = await response.arrayBuffer();
      const key = getKey();
      if (!key) throw new Error('No encryption key found');
      const iv = CryptoJS.enc.Hex.parse(data.iv);
      function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
      }
      const encryptedBase64 = arrayBufferToBase64(encrypted);
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: CryptoJS.enc.Base64.parse(encryptedBase64) },
        CryptoJS.enc.Hex.parse(key),
        { iv }
      );
      function wordArrayToUint8Array(wordArray) {
        const words = wordArray.words;
        const sigBytes = wordArray.sigBytes;
        const u8 = new Uint8Array(sigBytes);
        for (let i = 0; i < sigBytes; ++i) {
          u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        }
        return u8;
      }
      const typedArray = wordArrayToUint8Array(decrypted);
      const blob = new Blob([typedArray], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.original_filename;
      a.click();
      window.URL.revokeObjectURL(url);
      setDownloading(false);
      onClose();
    } catch (err) {
      setError('Failed to decrypt or download file');
      setDownloading(false);
    }
  };

  React.useEffect(() => {
    return () => {
      if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="fixed inset-0 bg-zinc-700 bg-opacity-95 flex items-center justify-center z-50">
  <div className="bg-white p-6 rounded shadow-md w-[700px] max-w-full relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500">&times;</button>
        <h2 className="text-xl font-bold mb-4">Download & Preview File</h2>
        {error && <div className="mb-2 text-red-500">{error}</div>}
        <div className="mb-4">{file.original_filename}</div>
        {isImage(file.original_filename) && (
          <>
            <button onClick={handlePreview} className="w-full bg-blue-600 text-white py-2 rounded mb-2" disabled={previewing}>{previewing ? 'Decrypting...' : 'Preview'}</button>
            {previewUrl && <img src={previewUrl} alt="preview" className="mb-2 max-w-full object-contain mx-auto" style={{ width: '100%', height: 'auto', maxHeight: '500px' }} />}
          </>
        )}
        <button onClick={handleDownload} className="w-full bg-green-600 text-white py-2 rounded" disabled={downloading}>{downloading ? 'Downloading...' : 'Download'}</button>
      </div>
    </div>
  );
}
