import React, { useState } from "react";
import Adminfile from "./AdminFile";
import PendingRequests from "./PendingRequests";
import CreateUser from "./CreateUser";
import UserList from "./UserList";
import ManagerList from "./ManagerList"; // new component

export default function AdminDashboard() {
  const [token] = useState(localStorage.getItem("admin_token") || "");
  const [activeTab, setActiveTab] = useState("dashboard");
  // dashboard | requests | create | users | managers

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 flex p-6 gap-6">
      {/* LEFT PANEL */}
      <div className="w-80 bg-white/10 backdrop-blur-md border border-white/20 text-white p-6 flex flex-col justify-between rounded-2xl shadow-lg">
        {/* Top Section */}
        <div>
          <h1 className="text-2xl font-extrabold mb-8">Admin Dashboard</h1>

          {/* Accounts Box */}
          <div className="bg-white/10 rounded-lg p-3 border border-white/20 max-h-[400px] overflow-y-auto scrollbar-hidden">
            <h2 className="font-semibold mb-3">Accounts</h2>

            <div className="flex flex-col gap-3 mt-8">
              {/* Managers Tab */}
              <button
                onClick={() => setActiveTab("managers")}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg shadow transition"
              >
                👔 Managers
              </button>
              {/* Users Tab */}
              <button
                onClick={() => setActiveTab("users")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow transition"
              >
                👤 Users
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section - Buttons */}
        <div className="flex flex-col gap-3 mt-8">
          <button
            onClick={() => setActiveTab("requests")}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow transition"
          >
            View Requests
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow transition"
          >
            + Create User
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-lg text-white">
        {activeTab === "requests" && <PendingRequests token={token} />}
        {activeTab === "create" && <CreateUser token={token} />}
        {activeTab === "users" && <UserList token={token} />}
        {activeTab === "managers" && <ManagerList token={token} />}

        {activeTab === "dashboard" && (
          <p className="text-white/80">Select a user or manager to view files.</p>
        )}
      </div>

      
    </div>
  );
}
