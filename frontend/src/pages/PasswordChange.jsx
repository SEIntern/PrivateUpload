import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PasswordChange() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { token } = useAuth(); // <-- IMPORTANT: get token from context

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // client-side checks
    if (!token) {
      setError('You are not authenticated. Please log in again.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (!oldPassword || !newPassword) {
      setError('Please fill both password fields.');
      return;
    }

    try {
      // debug log (remove in production)
      console.log('Sending change-password with token:', token?.slice?.(0, 20), '...');

      const res = await axios.post(
        'http://localhost:5000/api/auth/changepassword',
        { oldPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(res.data?.message || 'Password changed successfully');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      console.error('Change password error:', err);

      if (err.response) {
        // server responded with a status code
        const status = err.response.status;
        const serverMsg = err.response.data?.message || JSON.stringify(err.response.data);
        setError(`Error ${status}: ${serverMsg}`);
      } else if (err.request) {
        // request made but no response
        setError('No response from server. Check backend is running and CORS is configured.');
      } else {
        // something else
        setError(err.message || 'Something went wrong');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-yellow-700 to-pink-500">
      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-2xl shadow-xl w-96">
        <h2 className="text-2xl font-extrabold mb-6 text-center text-blue-700">Change Password</h2>

        {message && <div className="mb-4 text-green-600 text-center font-semibold">{message}</div>}
        {error && <div className="mb-4 text-red-500 text-center font-semibold">{error}</div>}

        <input
          type="password"
          placeholder="Old Password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          className="w-full mb-4 p-3 border border-gray-300 rounded-lg"
          required
        />

        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full mb-4 p-3 border border-gray-300 rounded-lg"
          required
        />

        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          className="w-full mb-6 p-3 border border-gray-300 rounded-lg"
          required
        />

        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
          Change Password
        </button>
      </form>
    </div>
  );
}
