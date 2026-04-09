// Global runtime configuration used by API wrapper.
const CONFIG = {
  API_BASE_URL:
    window.location.protocol === "http:" || window.location.protocol === "https:"
      ? `${window.location.origin}/api`
      : "http://localhost:3137/api",
  MOCK_MODE: false
};
