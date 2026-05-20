import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Trash2, Shield, Activity, RefreshCw } from "lucide-react";
import * as adminApi from "../../services/adminApi";
import logo from "../Home/assets/Images/Logo2 colored.png";
import "../Home/Home.css";
import "./AdminControl.css";

const AdminControl = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  const token = localStorage.getItem("mugate_token");
  const jwtPayload = (() => {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch { return null; }
  })();
  const currentUniversityId = jwtPayload ? String(jwtPayload.universityId || "") : "";

  // Check if current user is admin
  const isAdmin = (() => {
    if (jwtPayload && String(jwtPayload.universityId) === "101230004") return true;
    const userStr = localStorage.getItem("mugate_user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u && String(u.universityId) === "101230004") return true;
      } catch {}
    }
    return false;
  })();

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const adminList = await adminApi.getAdmins();
      const userList = await adminApi.getRegisteredUsers();
      setAdmins(adminList);
      
      // Filter out users who are already admins
      const adminIds = new Set(adminList.map(a => String(a.universityId)));
      const filteredUsers = userList.filter(u => u.universityId && !adminIds.has(String(u.universityId)));
      setUsers(filteredUsers);
    } catch (err) {
      setError(err.message || "Failed to load admin management data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Redirect non-admins away
    if (!token) {
      navigate("/");
      return;
    }
    // Verify admin identity
    const storedUser = localStorage.getItem("mugate_user");
    let isUserAdmin = false;
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (String(u.universityId) === "101230004") isUserAdmin = true;
      } catch {}
    }
    // If not super-admin directly, let the initial load check if they fail auth (which redirects via apiFetch)
    loadData();
  }, [navigate, token]);

  const handleAddAdmin = async () => {
    if (!selectedUser) {
      setError("Please select a student to add as admin.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      await adminApi.addAdmin(selectedUser);
      setSuccess("Administrator privilege granted successfully.");
      setSelectedUser("");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to add administrator.");
    }
  };

  const handleRemoveAdmin = async (universityId, name) => {
    if (universityId === "101230004") {
      setError("The primary super admin cannot be demoted.");
      return;
    }
    if (String(universityId) === String(currentUniversityId)) {
      setError("You cannot remove your own administrator privileges.");
      return;
    }
    if (!window.confirm(`Are you sure you want to demote ${name || 'this user'}? they will lose all admin capabilities.`)) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await adminApi.removeAdmin(universityId);
      setSuccess("Administrator privilege revoked successfully.");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to revoke administrator privilege.");
    }
  };

  return (
    <div className="admin-ctrl-container">
      {/* ORIGINAL NAVBAR FROM HOME */}
      <div className="hero-unified-frame" style={{ position: "absolute", top: 0, left: 0, width: "100%", zIndex: 100 }}>
        <nav className="hero-nav-notched">
          <div className="nav-group-left">
            <Link to="/internships">Internships</Link>
            <Link to="/resume-enhancer">Resume</Link>
            <Link to="/chatbot">Chatbot</Link>
            <Link to="/schedule">Scheduler</Link>
            <Link to="/capstone">Capstone</Link>
          </div>
          <div className="nav-group-center">
            <div className="branding-logo-box">
              <img src={logo} alt="MuGate Logo" className="nav-logo-black" />
              <span className="brand-name-black" style={{ color: "#0e220e" }}>MUGATE</span>
            </div>
            <Link to="/events" className="nav-events-link">Events</Link>
            <Link to="/roadmap" className="nav-events-link" style={{ marginLeft: '10px' }}>RoadMap</Link>
            <Link to="/about" className="nav-events-link" style={{ marginLeft: '10px' }}>About</Link>
            {isAdmin && (
              <Link to="/admin-control" className="nav-events-link" style={{ marginLeft: '10px' }}>Control</Link>
            )}
          </div>
          <div className="nav-group-right">
            <button
              className="nav-demo-btn-solidroad"
              onClick={() => navigate('/')}
            >
              Back <span className="circle-arrow-icon" style={{ display: "inline-flex", marginLeft: "8px", background: "rgba(255, 255, 255, 0.3)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </span>
            </button>
          </div>
        </nav>
      </div>

      <div className="admin-ctrl-glow-left" />
      <div className="admin-ctrl-glow-right" />

      <div className="admin-ctrl-card">
        {/* Header */}
        <div className="admin-ctrl-header">
          <div className="admin-ctrl-title-group">
            <Shield className="admin-ctrl-shield-icon" size={28} />
            <h1 className="admin-ctrl-title">Control Panel</h1>
          </div>
          <button onClick={loadData} className="admin-ctrl-refresh-btn" title="Refresh Activity">
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
        </div>

        {error && <div className="admin-ctrl-alert error">{error}</div>}
        {success && <div className="admin-ctrl-alert success">{success}</div>}

        {loading && admins.length === 0 ? (
          <div className="admin-ctrl-loading">
            <div className="spinner" />
            <p>Loading administrators data...</p>
          </div>
        ) : (
          <div className="admin-ctrl-content">
            {/* Add Admin Section */}
            <div className="admin-ctrl-section add-admin-section">
              <h2 className="admin-ctrl-subtitle">
                <UserPlus size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Grant Admin Privileges
              </h2>
              <div className="admin-ctrl-form">
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="admin-ctrl-select"
                >
                  <option value="">Select a student...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.universityId}>
                      {u.name} ({u.universityId}) - {u.email}
                    </option>
                  ))}
                </select>
                <button onClick={handleAddAdmin} className="admin-ctrl-submit-btn">
                  Add Admin
                </button>
              </div>
            </div>

            {/* List Admins Section */}
            <div className="admin-ctrl-section">
              <h2 className="admin-ctrl-subtitle">
                <Activity size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Active Administrators ({admins.length})
              </h2>
              <div className="admin-ctrl-table-wrapper">
                <table className="admin-ctrl-table">
                  <thead>
                    <tr>
                      <th>Administrator</th>
                      <th>University ID</th>
                      <th>Email</th>
                      <th>Activity Status</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map(adm => {
                      const isSelf = String(adm.universityId) === String(currentUniversityId);
                      const isSuper = adm.universityId === "101230004";
                      return (
                        <tr key={adm.id} className={isSelf ? "row-self" : ""}>
                          <td>
                            <div className="admin-table-identity">
                              <span className="admin-name">{adm.name}</span>
                              {isSelf && <span className="badge-self">You</span>}
                              {isSuper && <span className="badge-super">Super</span>}
                            </div>
                          </td>
                          <td><code className="admin-code">{adm.universityId}</code></td>
                          <td><span className="admin-email">{adm.email}</span></td>
                          <td>
                            <div className="admin-activity-status">
                              <span className={`status-indicator ${adm.isOnline ? "online" : "offline"}`} />
                              <span className="status-text">{adm.offlineDuration}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleRemoveAdmin(adm.universityId, adm.name)}
                              disabled={isSuper || isSelf}
                              className="admin-demote-btn"
                              title={isSuper ? "Super Admin cannot be demoted" : isSelf ? "You cannot demote yourself" : "Revoke Admin Privileges"}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminControl;
