import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Trash2, Shield, Activity, RefreshCw } from "lucide-react";
import * as adminApi from "../../services/adminApi";
import logo from "../Home/assets/Images/Logo2 colored.png";
import "../Home/Home.css";
import "./AdminControl.css";

// Broadcast admin changes across all open tabs
const broadcast = () => {
  try {
    const ch = new BroadcastChannel("mugate_admin_updates");
    ch.postMessage({ type: "admin_changed" });
    ch.close();
  } catch { /* BroadcastChannel unsupported — cross-tab sync skipped */ }
};

const AdminControl = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newAdminId, setNewAdminId] = useState("");

  // Live admin status — starts null (checking), then true/false
  const [isAdmin, setIsAdmin] = useState(null);

  const token = localStorage.getItem("mugate_token");
  const jwtPayload = (() => {
    if (!token) return null;
    try { return JSON.parse(atob(token.split(".")[1])); }
    catch { return null; }
  })();
  const currentUniversityId = jwtPayload ? String(jwtPayload.universityId || "") : "";

  // Sort admins to put current logged in user (You) first
  const sortedAdmins = useMemo(() => {
    return [...admins].sort((a, b) => {
      const aSelf = String(a.universityId) === String(currentUniversityId);
      const bSelf = String(b.universityId) === String(currentUniversityId);
      if (aSelf && !bSelf) return -1;
      if (!aSelf && bSelf) return 1;
      return 0;
    });
  }, [admins, currentUniversityId]);

  // ── Data loader ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const adminList = await adminApi.getAdmins();
      setAdmins(adminList);
    } catch (err) {
      setError(err.message || "Failed to load admin management data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Effect 1: Verify admin status via live DB call on mount ──────────────────
  useEffect(() => {
    if (!token) { navigate("/"); return; }

    adminApi.checkMyAdminStatus()
      .then(status => {
        if (!status) { navigate("/"); return; }
        setIsAdmin(true);
      })
      .catch(() => navigate("/"));
  }, [token, navigate]);

  // ── Effect 2: Load data + poll every 5 s once admin is confirmed ─────────────
  useEffect(() => {
    if (!isAdmin) return;
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [isAdmin, loadData]);

  // ── Effect 3: BroadcastChannel — receive admin changes from other tabs ────────
  useEffect(() => {
    try {
      const channel = new BroadcastChannel("mugate_admin_updates");
      channel.onmessage = () => loadData();
      return () => channel.close();
    } catch { /* BroadcastChannel unsupported — cross-tab sync skipped */ }
  }, [loadData]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleAddAdmin = async () => {
    const trimmedId = newAdminId.trim();
    if (!trimmedId) {
      setError("Please enter a student ID to add as admin.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      await adminApi.addAdmin(trimmedId);
      setSuccess("Administrator privilege granted successfully.");
      setNewAdminId("");
      await loadData();
      broadcast();
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
    if (!window.confirm(`Are you sure you want to demote ${name || "this user"}? They will lose all admin capabilities.`)) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await adminApi.removeAdmin(universityId);
      setSuccess("Administrator privilege revoked successfully.");
      await loadData();
      broadcast();
    } catch (err) {
      setError(err.message || "Failed to revoke administrator privilege.");
    }
  };

  // ── Gate: show spinner while verifying access ────────────────────────────────
  if (isAdmin === null) {
    return (
      <div className="admin-ctrl-container admin-ctrl-gate">
        <div className="admin-ctrl-loading">
          <div className="spinner" />
          <p>Verifying access...</p>
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <div className="admin-ctrl-container">
      {/* NAVBAR */}
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
            <Link to="/roadmap" className="nav-events-link" style={{ marginLeft: "10px" }}>RoadMap</Link>
            <Link to="/about" className="nav-events-link" style={{ marginLeft: "10px" }}>About</Link>
            <Link to="/admin-control" className="nav-events-link" style={{ marginLeft: "10px" }}>Control</Link>
          </div>
          <div className="nav-group-right">
            <button
              className="nav-demo-btn-solidroad"
              onClick={() => navigate("/")}
            >
              Back <span className="circle-arrow-icon" style={{ display: "inline-flex", marginLeft: "8px", background: "rgba(255,255,255,0.3)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
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

        {/* Add Admin */}
        <div className="admin-ctrl-section add-admin-section">
          <h2 className="admin-ctrl-subtitle">
            <UserPlus size={18} style={{ marginRight: 8, verticalAlign: "middle" }} />
            Grant Admin Privileges
          </h2>
          <div className="admin-ctrl-form">
            <input
              type="text"
              value={newAdminId}
              onChange={(e) => setNewAdminId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddAdmin()}
              className="admin-ctrl-select"
              placeholder="Add a new admin by ID..."
              autoComplete="off"
              list=""
            />
            <button onClick={handleAddAdmin} className="admin-ctrl-submit-btn">
              Add Admin
            </button>
          </div>
        </div>

        {/* Admin List */}
        <div className="admin-ctrl-section admin-list-section">
          <h2 className="admin-ctrl-subtitle">
            <Activity size={18} style={{ marginRight: 8, verticalAlign: "middle" }} />
            Active Administrators ({admins.length})
          </h2>
          {loading && admins.length === 0 ? (
            <div className="admin-ctrl-loading">
              <div className="spinner" />
              <p>Loading administrators data...</p>
            </div>
          ) : (
            <div className="admin-ctrl-table-wrapper">
              <table className="admin-ctrl-table">
                <thead>
                  <tr>
                    <th>Administrator</th>
                    <th>University ID</th>
                    <th>Email</th>
                    <th>Activity Status</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAdmins.map(adm => {
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
                        <td style={{ textAlign: "center" }}>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminControl;
