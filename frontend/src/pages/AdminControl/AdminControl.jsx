import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NotchedHeroNav from "../../components/layout/NotchedHeroNav";
import { UserPlus, Trash2, Shield, Activity, RefreshCw, Database, Globe, Zap } from "lucide-react";
import * as adminApi from "../../services/adminApi";
import * as scraperApi from "../../services/scraperApi";
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

const POLL_MS = 20000;

const AdminControl = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newAdminId, setNewAdminId] = useState("");

  const [kbStats, setKbStats] = useState(null);
  const [scraperRunning, setScraperRunning] = useState(false);
  const [scraperRuns, setScraperRuns] = useState([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbMessage, setKbMessage] = useState("");
  const [kbError, setKbError] = useState("");
  const kbInitialLoad = useRef(true);

  // Live admin status — starts null (checking), then true/false
  const [isAdmin, setIsAdmin] = useState(null);

  const token = localStorage.getItem("mugate_token");
  const jwtPayload = (() => {
    if (!token) return null;
    try { return JSON.parse(atob(token.split(".")[1])); }
    catch { return null; }
  })();
  const currentUniversityId = jwtPayload ? String(jwtPayload.universityId || "") : "";

  const sortedAdmins = useMemo(() => {
    return [...admins].sort((a, b) => {
      const aSelf = String(a.universityId) === String(currentUniversityId);
      const bSelf = String(b.universityId) === String(currentUniversityId);
      if (aSelf && !bSelf) return -1;
      if (!aSelf && bSelf) return 1;
      return 0;
    });
  }, [admins, currentUniversityId]);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const adminList = await adminApi.getAdmins();
      setAdmins(adminList);
      if (silent) setError("");
    } catch (err) {
      setError(err.message || "Failed to load admin management data.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const loadKbData = useCallback(async ({ silent = false } = {}) => {
    const showSpinner = !silent && kbInitialLoad.current;
    if (showSpinner) setKbLoading(true);
    try {
      const results = await Promise.allSettled([
        scraperApi.getKbStats(),
        scraperApi.getScraperStatus(),
        scraperApi.getScraperRuns(5),
      ]);

      const [statsResult, statusResult, runsResult] = results;
      let anyOk = false;

      if (statsResult.status === "fulfilled") {
        setKbStats(statsResult.value);
        anyOk = true;
      }
      if (statusResult.status === "fulfilled") {
        setScraperRunning(Boolean(statusResult.value?.running));
        anyOk = true;
      }
      if (runsResult.status === "fulfilled") {
        setScraperRuns(runsResult.value || []);
        anyOk = true;
      }

      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length === results.length) {
        setKbError(failures[0].reason?.message || "Failed to load knowledge base stats.");
      } else if (anyOk) {
        setKbError("");
      } else if (failures.length > 0) {
        setKbError(failures[0].reason?.message || "Some knowledge base stats failed to load.");
      }
    } catch (err) {
      setKbError(err.message || "Failed to load knowledge base stats.");
    } finally {
      if (showSpinner) setKbLoading(false);
      kbInitialLoad.current = false;
    }
  }, []);

  useEffect(() => {
    if (!token) { navigate("/?auth=login"); return; }

    adminApi.checkMyAdminStatus()
      .then(status => {
        if (!status) { navigate("/?auth=admin"); return; }
        setIsAdmin(true);
      })
      .catch(() => navigate("/?auth=admin"));
  }, [token, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    loadData({ silent: false });
    loadKbData({ silent: false });
    const interval = setInterval(() => {
      loadData({ silent: true });
      loadKbData({ silent: true });
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [isAdmin, loadData, loadKbData]);

  useEffect(() => {
    try {
      const channel = new BroadcastChannel("mugate_admin_updates");
      channel.onmessage = () => loadData({ silent: true });
      return () => channel.close();
    } catch { /* BroadcastChannel unsupported — cross-tab sync skipped */ }
  }, [loadData]);

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
      await loadData({ silent: false });
      broadcast();
    } catch (err) {
      setError(err.message || "Failed to add administrator.");
    }
  };

  const handleRemoveAdmin = async (universityId, name, isSuperAdmin) => {
    if (isSuperAdmin) {
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
      await loadData({ silent: false });
      broadcast();
    } catch (err) {
      setError(err.message || "Failed to revoke administrator privilege.");
    }
  };

  const handleKbAction = async (action) => {
    setKbMessage("");
    setKbError("");
    setError("");
    try {
      if (action === "crawl") await scraperApi.startFullCrawl();
      else if (action === "sync") await scraperApi.startIncrementalSync();
      else if (action === "rescrape") {
        if (!window.confirm("This will delete all knowledge base data and rebuild from scratch. Continue?")) return;
        await scraperApi.startRescrape();
      }
      else if (action === "reindex") await scraperApi.reindexVectors();
      else if (action === "sitemap") await scraperApi.refreshSitemap();
      setKbMessage(`Action "${action}" started successfully.`);
      await loadKbData({ silent: true });
    } catch (err) {
      setKbError(err.message || `Failed to run ${action}.`);
    }
  };

  const handleManualRefresh = () => {
    loadData({ silent: false });
    loadKbData({ silent: false });
  };

  const formatLastScraped = (value) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return "—";
    }
  };

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

  return (
    <div className="admin-ctrl-container">
      <div className="admin-ctrl-nav-wrap">
        <NotchedHeroNav
          maskFrame={false}
          rightSlot={
            <button
              className="nav-demo-btn-solidroad"
              onClick={() => navigate("/profile", { replace: true })}
            >
              Back <span className="circle-arrow-icon" style={{ display: "inline-flex", marginLeft: "8px", background: "rgba(255,255,255,0.3)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </span>
            </button>
          }
        />
      </div>

      <div className="admin-ctrl-glow-left" />
      <div className="admin-ctrl-glow-right" />

      <div className="admin-ctrl-card">
        <div className="admin-ctrl-header">
          <div className="admin-ctrl-title-group">
            <Shield className="admin-ctrl-shield-icon" size={28} />
            <h1 className="admin-ctrl-title">Control Panel</h1>
          </div>
          <button onClick={handleManualRefresh} className="admin-ctrl-refresh-btn" title="Refresh Activity">
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
        </div>

        {error && <div className="admin-ctrl-alert error">{error}</div>}
        {success && <div className="admin-ctrl-alert success">{success}</div>}

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

        <div className="admin-ctrl-section">
          <h2 className="admin-ctrl-subtitle">
            <Database size={18} style={{ marginRight: 8, verticalAlign: "middle" }} />
            MuChat Knowledge Base
            {scraperRunning && <span className="badge-self" style={{ marginLeft: 8 }}>Crawling...</span>}
          </h2>
          {kbError && <div className="admin-ctrl-alert error">{kbError}</div>}
          {kbMessage && <div className="admin-ctrl-alert success">{kbMessage}</div>}
          {kbLoading && !kbStats ? (
            <div className="admin-ctrl-loading"><div className="spinner" /><p>Loading KB stats...</p></div>
          ) : (
            <div className="admin-kb-stats">
              <div className="admin-kb-stat">
                <strong>{kbStats?.chromaChunks ?? 0}</strong>
                <span>Vector Chunks</span>
              </div>
              <div className="admin-kb-stat">
                <strong style={{ fontSize: "0.85rem" }}>{formatLastScraped(kbStats?.lastScrapedAt)}</strong>
                <span>Last Scraped</span>
              </div>
            </div>
          )}
          <div className="admin-kb-actions">
            <button onClick={() => handleKbAction("crawl")} disabled={scraperRunning} className="admin-ctrl-submit-btn">
              <Globe size={14} /> Full Crawl
            </button>
            <button onClick={() => handleKbAction("sync")} disabled={scraperRunning} className="admin-ctrl-submit-btn">
              <RefreshCw size={14} /> Incremental Sync
            </button>
            <button onClick={() => handleKbAction("reindex")} className="admin-ctrl-submit-btn">
              <Zap size={14} /> Reindex Vectors
            </button>
            <button onClick={() => handleKbAction("sitemap")} disabled={scraperRunning} className="admin-ctrl-submit-btn">
              Sitemap Refresh
            </button>
            <button onClick={() => handleKbAction("rescrape")} disabled={scraperRunning} className="admin-demote-btn" style={{ padding: "8px 16px" }}>
              Full Rescrape
            </button>
          </div>
          {scraperRuns.length > 0 && (
            <div className="admin-ctrl-table-wrapper" style={{ marginTop: 16 }}>
              <table className="admin-ctrl-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Pages</th>
                    <th>Started</th>
                  </tr>
                </thead>
                <tbody>
                  {scraperRuns.map(run => (
                    <tr key={run.id}>
                      <td>{run.runType}</td>
                      <td>{run.status}</td>
                      <td>{run.pagesScraped}</td>
                      <td>{run.startedAt ? new Date(run.startedAt).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
                    const isSuper = adm.isSuperAdmin === true || adm.isSuperAdmin === 1;
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
                            onClick={() => handleRemoveAdmin(adm.universityId, adm.name, isSuper)}
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
