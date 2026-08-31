(() => {
  const PROD_API_BASE = "https://api.xn----7sbocmxidei1bb9cwe.xn--p1ai";
  const LOCAL_API_BASE = "http://localhost:8090";
  const host = location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";
  window.SHADOW_CONFIG = {
    API_BASE: isLocal ? LOCAL_API_BASE : PROD_API_BASE,
  };
})();
