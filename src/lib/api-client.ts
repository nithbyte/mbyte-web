import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export class ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// Token storage abstraction (localStorage in browser, in-memory in Node/SSR/tests)
let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;

export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem("mbyte_admin_access_token") || memoryAccessToken;
    }
    return memoryAccessToken;
  },

  getRefreshToken: (): string | null => {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem("mbyte_admin_refresh_token") || memoryRefreshToken;
    }
    return memoryRefreshToken;
  },

  setTokens: (access: string, refresh?: string): void => {
    memoryAccessToken = access;
    if (refresh) memoryRefreshToken = refresh;
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("mbyte_admin_access_token", access);
      if (refresh) window.localStorage.setItem("mbyte_admin_refresh_token", refresh);
    }
  },

  clearTokens: (): void => {
    memoryAccessToken = null;
    memoryRefreshToken = null;
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem("mbyte_admin_access_token");
      window.localStorage.removeItem("mbyte_admin_refresh_token");
    }
  },
};

// Queue for handling multiple 401s during token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Create Axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload =
      typeof window !== "undefined"
        ? decodeURIComponent(
            window
              .atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          )
        : Buffer.from(base64, "base64").toString("utf8");
    const parsed = JSON.parse(jsonPayload);
    if (!parsed.exp) return false;
    return parsed.exp * 1000 <= Date.now() + 30000;
  } catch {
    return true;
  }
}

// Ensure a valid authenticated manager session exists
let authPromise: Promise<string | null> | null = null;
export async function ensureAuthenticated(force = false): Promise<string | null> {
  const existing = tokenStorage.getAccessToken();
  if (existing && !force && !isTokenExpired(existing)) return existing;

  if (authPromise) return authPromise;

  authPromise = (async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: "manager.chennai@novispharma.com",
        password: "Password123!",
      });

      const data = res.data?.data || res.data;
      if (data?.accessToken) {
        tokenStorage.setTokens(data.accessToken, data.refreshToken);
        return data.accessToken;
      }
    } catch (err) {
      console.warn("Auto-authentication with manager credentials failed, proceeding in offline mode:", err);
    } finally {
      authPromise = null;
    }
    return null;
  })();

  return authPromise;
}

// Request Interceptor: Attach Bearer JWT
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let token = tokenStorage.getAccessToken();
    if ((!token || isTokenExpired(token)) && !config.url?.includes("/auth/login")) {
      token = await ensureAuthenticated(true);
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Unwrap { success: true, data: ..., meta: ... } envelope and handle 401
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.data && response.data.success !== undefined) {
      if (response.data.data !== undefined) {
        const data = response.data.data;
        if (response.data.meta && typeof data === "object" && data !== null) {
          (data as any)._meta = response.data.meta;
        }
        return data;
      }
    }
    return response.data;
  },
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        tokenStorage.clearTokens();
        // Re-authenticate as manager
        const newToken = await ensureAuthenticated();
        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        }
        return Promise.reject(extractApiError(error));
      }

      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken =
          refreshResponse.data?.data?.accessToken ||
          refreshResponse.data?.accessToken;
        const newRefreshToken =
          refreshResponse.data?.data?.refreshToken ||
          refreshResponse.data?.refreshToken ||
          refreshToken;

        if (newAccessToken) {
          tokenStorage.setTokens(newAccessToken, newRefreshToken);
          processQueue(null, newAccessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return axiosInstance(originalRequest);
        } else {
          throw new Error("No access token returned from refresh endpoint");
        }
      } catch (refreshErr) {
        tokenStorage.clearTokens();
        const freshToken = await ensureAuthenticated(true);
        if (freshToken) {
          processQueue(null, freshToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${freshToken}`;
          }
          return axiosInstance(originalRequest);
        }
        processQueue(refreshErr, null);
        return Promise.reject(extractApiError(refreshErr));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(extractApiError(error));
  }
);

function extractApiError(error: any): ApiError {
  if (error instanceof ApiError) return error;

  const status = error.response?.status || 500;
  const data = error.response?.data;

  let message = "An unexpected error occurred. Please try again.";
  let code = "NETWORK_ERROR";

  if (data) {
    if (data.error && typeof data.error === "object") {
      message = data.error.message || message;
      code = data.error.code || code;
    } else if (typeof data.message === "string") {
      message = data.message;
    } else if (Array.isArray(data.message)) {
      message = data.message.join(", ");
    }
  } else if (error.message) {
    message = error.message;
  }

  return new ApiError(message, status, code, data?.details);
}

export const apiClient = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    axiosInstance.get(url, config) as unknown as Promise<T>,

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    axiosInstance.post(url, data, config) as unknown as Promise<T>,

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    axiosInstance.put(url, data, config) as unknown as Promise<T>,

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    axiosInstance.patch(url, data, config) as unknown as Promise<T>,

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    axiosInstance.delete(url, config) as unknown as Promise<T>,

  axios: axiosInstance,
};
