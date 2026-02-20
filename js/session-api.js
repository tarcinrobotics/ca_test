(function (global) {
  const DEFAULTS = {
    logoutUrl: "/logout",
    logoutButtonIds: ["btn_logout", "logout-btn"]
  };

  const S = {
    opts: null,
    inited: false
  };

  const byId = id => document.getElementById(id);

  const safeFetch = (url, init) =>
    fetch(url, init).catch(err => { console.error("Fetch failed:", url, err); return new Response(null, { status: 0 }); });

  async function performLogout(reason = "manual") {
    try {
      try { localStorage.clear(); } catch { }
      try { sessionStorage.clear(); } catch { }

      await safeFetch(S.opts.logoutUrl, {
        method: "GET",
        credentials: "include",
        cache: "no-store"
      });
    } finally {
      window.location.href = `/?${encodeURIComponent(reason)}=true`;
    }
  }

  function attachLogoutButtons() {
    S.opts.logoutButtonIds.forEach(id => {
      const el = byId(id);
      if (el && !el._bound) {
        el.addEventListener("click", () => performLogout("manual"));
        el._bound = true;
      }
    });
  }

  const API = {
    init(options = {}) {
      if (S.inited) return;
      S.inited = true;
      S.opts = Object.assign({}, DEFAULTS, options);

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => { attachLogoutButtons(); });
      } else {
        attachLogoutButtons();
      }
    },
    logout: performLogout
  };

  global.SessionAPI = API;
})(window);
