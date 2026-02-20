/* session-api.js
 * Centralizes session-related client logic (no UI layout here):
 * - periodic session check
 * - ping heartbeat
 * - logout (manual/timeout/forced)
 * - logout-on-close beacon
 * - idle timeout warning with countdown + auto-logout
 * - pageshow cache handling
 * - toast notifications for logout reasons
 */

(function (global) {
  const DEFAULTS = {
    sessionCheckUrl: "/api/session-check",
    logoutUrl: "/logout",
    logoutOnCloseUrl: "/api/logout-on-close",
    pingUrl: "/ping",
    sessionCheckIntervalMs: 10_000,     // 10s
    pingIntervalMs: 20 * 60 * 1000,     // 20m
    idleWarnAfterMs: 25 * 60 * 1000,    // 25m
    idleCountdownSeconds: 300,          // 5m
    logoutButtonIds: ["btn_logout","logout-btn"],
    toastIds: { container: "logoutToast", message: "logoutToastMessage" },
    modalIds: { container: "timeoutModal", countdown: "countdown", stayBtn: "stayLoggedInBtn" },
    userEmail: undefined,
    sessionId: undefined
  };

  const S = { opts:null, idleTimer:null, warningTimer:null, countdown:0, sessionCheckTimer:null, pingTimer:null };

  const byId = id => document.getElementById(id);

  function showToast(message) {
    const c = byId(S.opts.toastIds.container), m = byId(S.opts.toastIds.message);
    if (!c || !m) return;
    m.textContent = message || "";
    c.classList.remove("hidden","opacity-0");
    c.classList.add("opacity-100");
    setTimeout(() => {
      c.classList.add("opacity-0");
      setTimeout(() => c.classList.add("hidden"), 500);
    }, 4000);
  }

  function checkToastFromUrl() {
    const p = new URLSearchParams(window.location.search);
    if (p.get("timeout") === "true") showToast("⚠️ You were logged out due to inactivity.");
    else if (p.get("force_logout") === "true") showToast("🚫 You were logged out because of inactivity in this session or a login elsewhere.");
    else if (p.get("manual") === "true") showToast("✅ You have been logged out successfully.");
    if ([...p.keys()].length) window.history.replaceState({}, document.title, window.location.pathname);
  }

  const safeFetch = (url, init) =>
    fetch(url, init).catch(err => { console.error("Fetch failed:", url, err); return new Response(null, { status: 0 }); });

  function pingServer(){ safeFetch(S.opts.pingUrl); }

  async function checkSession(){
    const res = await safeFetch(S.opts.sessionCheckUrl, { credentials: "include" });
    if (res.status === 401) {
      alert("Your session has expired or was terminated. Please log in again.");
      window.location.href = "/";
    }
  }

  async function performLogout(reason="manual"){
    try {
      try { localStorage.clear(); } catch {}
      try { sessionStorage.clear(); } catch {}
      await safeFetch(S.opts.logoutUrl, { method: "GET", credentials: "include" });
    } finally {
      window.location.href = `/?${encodeURIComponent(reason)}=true`;
    }
  }

  function attachLogoutButtons(){
    S.opts.logoutButtonIds.forEach(id => {
      const el = byId(id);
      if (el && !el._bound) {
        el.addEventListener("click", () => performLogout("manual"));
        el._bound = true;
      }
    });
  }

  function sendLogoutBeacon(){
    const { userEmail, sessionId, logoutOnCloseUrl } = S.opts;
    if (!userEmail || !sessionId || !navigator.sendBeacon) return;
    const data = new Blob([JSON.stringify({ email: userEmail, session_id: sessionId })], { type: "application/json" });
    navigator.sendBeacon(logoutOnCloseUrl, data);
  }

  function showWarningModal(){
    const { container, countdown, stayBtn } = S.opts.modalIds;
    const modal = byId(container), cd = byId(countdown), stay = byId(stayBtn);
    if (!modal || !cd) return;

    modal.classList.remove("hidden");
    S.countdown = S.opts.idleCountdownSeconds;
    cd.innerText = String(S.countdown);

    if (stay) {
      stay.onclick = () => { hideWarningModal(); pingServer(); startIdleTimer(); };
    }

    clearInterval(S.warningTimer);
    S.warningTimer = setInterval(() => {
      S.countdown -= 1;
      if (cd) cd.innerText = String(S.countdown);
      if (S.countdown <= 0) {
        clearInterval(S.warningTimer);
        performLogout("timeout");
      }
    }, 1000);
  }

  function hideWarningModal(){
    const modal = byId(S.opts.modalIds.container);
    if (modal) modal.classList.add("hidden");
    clearInterval(S.warningTimer); S.warningTimer = null;
  }

  function startIdleTimer(){
    clearTimeout(S.idleTimer);
    clearInterval(S.warningTimer);
    S.idleTimer = setTimeout(showWarningModal, S.opts.idleWarnAfterMs);
  }

  function onUserActivity(){
    pingServer();
    startIdleTimer();
  }

  function bindUserActivity(){
    ["mousemove","keydown","scroll","click"].forEach(evt =>
      document.addEventListener(evt, onUserActivity, { passive:true })
    );
  }

  function handlePageshow(e){ if (e.persisted) window.location.reload(); }

  const API = {
    init(options = {}) {
      S.opts = Object.assign({}, DEFAULTS, options);

      // timers
      clearInterval(S.sessionCheckTimer); S.sessionCheckTimer = setInterval(checkSession, S.opts.sessionCheckIntervalMs);
      clearInterval(S.pingTimer);         S.pingTimer        = setInterval(pingServer,   S.opts.pingIntervalMs);

      // lifecycle
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") sendLogoutBeacon(); });
      window.addEventListener("pagehide", sendLogoutBeacon);
      window.addEventListener("beforeunload", sendLogoutBeacon);
      window.addEventListener("pageshow", handlePageshow);

      // UI hooks
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => { attachLogoutButtons(); checkToastFromUrl(); });
      } else {
        attachLogoutButtons(); checkToastFromUrl();
      }

      // idle
      bindUserActivity();
      startIdleTimer();

      // immediate kick
      pingServer();
      checkSession();
    },
    logout: performLogout
  };

  global.SessionAPI = API;
})(window);
