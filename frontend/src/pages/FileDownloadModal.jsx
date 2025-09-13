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

  // Get key from API if available (admin), else from localStorage (user)
  const getKey = () => {
    if (file.encryptionKey) return file.encryptionKey; 
    return localStorage.getItem('encryption_key');
  };

  const handlePreview = async () => {
    setPreviewing(true);
    setError('');
    try {
      const { data } = await axios.get(
        `http://localhost:5000/api/files/${file._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

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
          case 'pdf':
            return 'application/pdf';
          case 'doc':
            return 'application/msword';
          case 'docx':
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          case 'xls':
            return 'application/vnd.ms-excel';
          case 'xlsx':
            return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          default:
            return 'application/octet-stream';
        }
      }

      const mimeType = getMimeType(file.original_filename);
      const blob = new Blob([typedArray], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
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
      const { data } = await axios.get(
        `http://localhost:5000/api/files/${file._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

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
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4">Download & Preview File</h2>
        {error && <div className="mb-2 text-red-500">{error}</div>}
        <div className="mb-4">{file.original_filename}</div>
        {(() => {
          const ext = file.original_filename.split('.').pop().toLowerCase();
          if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'pdf'].includes(ext)) {
            return (
              <>
                <button
                  onClick={handlePreview}
                  className="w-full bg-blue-600 text-white py-2 rounded mb-2"
                  disabled={previewing}
                >
                  {previewing ? 'Decrypting...' : 'Preview'}
                </button>
                {previewUrl &&
                  (ext === 'pdf' ? (
                    <iframe
                      src={previewUrl}
                      title="PDF Preview"
                      width="100%"
                      height="500px"
                      className="mb-2"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="preview"
                      className="mb-2 max-w-full object-contain mx-auto"
                      style={{ width: '100%', height: 'auto', maxHeight: '500px' }}
                    />
                  ))}
              </>
            );
          }
          return null;
        })()}
        <button
          onClick={handleDownload}
          className="w-full bg-green-600 text-white py-2 rounded"
          disabled={downloading}
        >
          {downloading ? 'Downloading...' : 'Download'}
        </button>
      </div>
    </div>
  );
}
