(() => {
  const PROD_API_BASE = "https://api.xn----7sbocmxidei1bb9cwe.xn--p1ai";
  const FALLBACK_API_BASE = "https://web-production-0ab2f.up.railway.app";
  const LOCAL_API_BASE = "http://localhost:8090";
  const host = location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";

  if (!isLocal && typeof window.fetch === "function") {
    const origFetch = window.fetch.bind(window);
    let useFallback = false;
    const FB_KEY = "show_api_fallback_until";
    try {
      if (Number(sessionStorage.getItem(FB_KEY) || 0) > Date.now()) useFallback = true;
    } catch {}

    const toUrl = (input) => (typeof input === "string" ? input : input && input.url ? input.url : "");
    const swap = (url) => FALLBACK_API_BASE + url.slice(PROD_API_BASE.length);
    const rebuild = (input, url) => (typeof input === "string" ? url : new Request(url, input));
    const markFallback = () => {
      useFallback = true;
      try { sessionStorage.setItem(FB_KEY, String(Date.now() + 30 * 60 * 1000)); } catch {}
    };

    window.fetch = async (input, init) => {
      const url = toUrl(input);
      if (!url || !url.startsWith(PROD_API_BASE)) return origFetch(input, init);
      if (useFallback) return origFetch(rebuild(input, swap(url)), init);
      let opts = init;
      let timer = null;
      if (!(init && init.signal) && typeof AbortController === "function") {
        const ac = new AbortController();
        timer = setTimeout(() => ac.abort(), 4000);
        opts = Object.assign({}, init, { signal: ac.signal });
      }
      try {
        const res = await origFetch(input, opts);
        if (timer) clearTimeout(timer);
        if (res.status >= 502 && res.status <= 504) {
          markFallback();
          return origFetch(rebuild(input, swap(url)), init);
        }
        return res;
      } catch (err) {
        if (timer) clearTimeout(timer);
        if (init && init.signal && init.signal.aborted) throw err;
        markFallback();
        return origFetch(rebuild(input, swap(url)), init);
      }
    };
  }

  window.SHADOW_CONFIG = {
    API_BASE: isLocal ? LOCAL_API_BASE : PROD_API_BASE,
  };
})();
