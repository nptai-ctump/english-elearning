/**
 * API Client Configuration
 * - Axios instance setup
 * - Request/Response interceptors
 * - Token management
 * - Error handling
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// ==================== CONFIGURATION ====================

// API base URL
// Dùng relative path "/api" để tránh CORS trong GitHub Codespaces
const rawBase = import.meta.env.VITE_API_BASE || "/api";
const baseURL = rawBase.replace(/\/+$/, "");

// Request timeout (10 seconds)
const REQUEST_TIMEOUT = 10000;

// ==================== AXIOS INSTANCE ====================

export const api = axios.create({
  baseURL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  withCredentials: true,
});

// ==================== TOKEN MANAGEMENT ====================

/**
 * Lấy token từ localStorage
 */
export function getToken(): string | null {
  return localStorage.getItem("access_token");
}

/**
 * Lưu token vào localStorage
 */
export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem("access_token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem("access_token");
    delete api.defaults.headers.common["Authorization"];
  }
}

/**
 * Xóa token (đăng xuất)
 */
export function clearToken(): void {
  setToken(null);
  localStorage.removeItem("user");
}

/**
 * Lấy thông tin user hiện tại từ localStorage
 */
export function getCurrentUser() {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
}

// ==================== REQUEST INTERCEPTOR ====================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Tự động thêm token vào header nếu có
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request cho debugging
    if (import.meta.env.DEV) {
      console.log("🚀 API Request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// ==================== RESPONSE INTERCEPTOR ====================

api.interceptors.response.use(
  (response) => {
    // Log response cho debugging
    if (import.meta.env.DEV) {
      console.log("✅ API Response:", {
        url: response.config.url,
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Xử lý lỗi 401 - Unauthorized
    if (error.response?.status === 401) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        clearToken();

        // Alert thay vì toast
        console.error("❌ Unauthorized: Token hết hạn");
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");

        // Redirect đến trang login
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);

        return Promise.reject(error);
      }
    }

    // Xử lý lỗi 403 - Forbidden
    if (error.response?.status === 403) {
      console.error("❌ Forbidden: Không có quyền truy cập");
      alert("Bạn không có quyền truy cập chức năng này.");
    }

    // Xử lý lỗi 404 - Not Found
    if (error.response?.status === 404) {
      console.error("❌ Not Found: Không tìm thấy tài nguyên");
      alert("Không tìm thấy tài nguyên yêu cầu.");
    }

    // Xử lý lỗi 500 - Internal Server Error
    if (error.response?.status === 500) {
      console.error("❌ Server Error:", error.response?.data);
      alert("Lỗi máy chủ. Vui lòng thử lại sau.");
    }

    // Xử lý lỗi mạng hoặc timeout
    if (!error.response) {
      if (error.message.includes("timeout")) {
        console.error("❌ Timeout: Request timeout");
        alert("Request timeout. Vui lòng thử lại.");
      } else {
        console.error("❌ Network Error: Không thể kết nối server");
        alert("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.");
      }
    }

    // Log error cho debugging
    if (import.meta.env.DEV) {
      console.error("❌ API Error:", {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    return Promise.reject(error);
  }
);

// ==================== HELPER FUNCTIONS ====================

/**
 * Kiểm tra xem user đã đăng nhập chưa
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Kiểm tra role của user
 */
export function hasRole(requiredRole: string): boolean {
  const user = getCurrentUser();
  return user?.role === requiredRole;
}

/**
 * Lấy Authorization header
 */
export function getAuthHeader(): { Authorization: string } | {} {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ==================== EXPORT ====================

export default api;