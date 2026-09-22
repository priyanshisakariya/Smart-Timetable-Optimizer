import axios from "axios";

// Central Axios instance configured for the Smart Timetable Optimizer API
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to automatically attach JWT token if available
API.interceptors.request.use((config) => {
  const user = localStorage.getItem("user");
  if (user) {
    try {
      const parsedUser = JSON.parse(user);
      if (parsedUser.token) {
        config.headers.Authorization = `Bearer ${parsedUser.token}`;
      }
    } catch (e) {
      // ignore parse error
    }
  }
  return config;
});

export default API;
