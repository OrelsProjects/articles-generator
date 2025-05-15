import axios from "axios";

const axiosInstance = axios.create();

// Add a request interceptor
axiosInstance.interceptors.request.use(
  config => {
    try {
      // This works in browser ONLY (Next.js client side)
      if (typeof window !== "undefined") {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        config.headers["X-Timezone"] = timezone;
      }
    } catch (err) {
      // Fail silently if for some reason it breaks
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

export default axiosInstance;
