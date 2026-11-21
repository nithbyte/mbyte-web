import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";

function resolveApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  // Preserve local development default when running locally against NestJS backend
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:4000/api/v1";
  }

  // In production, an explicit endpoint is required; do not invent or hardcode external endpoints
  return "";
}

export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Determines whether mock data fallback is permitted.
 * Mock fallback is ONLY permitted if explicitly opted into via NEXT_PUBLIC_ENABLE_MOCKS="true".
 */
export function isMockFallbackAllowed(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_MOCKS === "true";
}

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

// Helper to get cookie domain for sharing across subdomains (.mediqbyte.com)
function getCookieDomain(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname.toLowerCase();
  if (host.includes("localhost") || host.startsWith("127.")) {
    return "";
  }
  const parts = host.split(".");
  if (parts.length >= 2) {
    return "." + parts.slice(-2).join(".");
  }
  return "";
}

function getCookie(name: string): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days = 7) {
  if (typeof window === "undefined") return;
  const domain = getCookieDomain();
  const domainAttr = domain ? `; domain=${domain}` : "";
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/${domainAttr}; expires=${expires}; SameSite=Lax${secure}`;
}

function removeCookie(name: string) {
  if (typeof window === "undefined") return;
  const domain = getCookieDomain();
  const domainAttr = domain ? `; domain=${domain}` : "";
  document.cookie = `${name}=; path=/${domainAttr}; Max-Age=0; SameSite=Lax`;
}

// Token storage abstraction (localStorage in browser, in-memory in Node/SSR/tests)
let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;

export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window !== "undefined" && window.localStorage) {
      let token = window.localStorage.getItem("mbyte_admin_access_token");
      if (!token) {
        token = getCookie("mbyte_auth_token");
        if (token) {
          window.localStorage.setItem("mbyte_admin_access_token", token);
        }
      }
      return token || memoryAccessToken;
    }
    return memoryAccessToken;
  },

  getRefreshToken: (): string | null => {
    if (typeof window !== "undefined" && window.localStorage) {
      let refresh = window.localStorage.getItem("mbyte_admin_refresh_token");
      if (!refresh) {
        refresh = getCookie("mbyte_refresh_token");
        if (refresh) {
          window.localStorage.setItem("mbyte_admin_refresh_token", refresh);
        }
      }
      return refresh || memoryRefreshToken;
    }
    return memoryRefreshToken;
  },

  setTokens: (access: string, refresh?: string): void => {
    memoryAccessToken = access;
    if (refresh) memoryRefreshToken = refresh;
    if (typeof window !== "undefined") {
      if (window.localStorage) {
        window.localStorage.setItem("mbyte_admin_access_token", access);
        if (refresh) window.localStorage.setItem("mbyte_admin_refresh_token", refresh);
      }
      setCookie("mbyte_auth_token", access);
      if (refresh) setCookie("mbyte_refresh_token", refresh);
    }
  },

  clearTokens: (): void => {
    memoryAccessToken = null;
    memoryRefreshToken = null;
    if (typeof window !== "undefined") {
      if (window.localStorage) {
        window.localStorage.removeItem("mbyte_admin_access_token");
        window.localStorage.removeItem("mbyte_admin_refresh_token");
      }
      removeCookie("mbyte_auth_token");
      removeCookie("mbyte_refresh_token");
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

// Ensure a valid authenticated manager session exists if token is already present
let authPromise: Promise<string | null> | null = null;
export async function ensureAuthenticated(): Promise<string | null> {
  const existing = tokenStorage.getAccessToken();
  if (existing && !isTokenExpired(existing)) return existing;
  return null;
}

// Request Interceptor: Attach Bearer JWT if available and validate endpoint
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Validate that API endpoint is configured in production
    const effectiveBase = config.baseURL || API_BASE_URL;
    if (!effectiveBase && process.env.NODE_ENV === "production") {
      throw new ApiError(
        "Missing NEXT_PUBLIC_API_URL configuration. Production deployments require an explicit NEXT_PUBLIC_API_URL environment variable pointing to the MByte backend API.",
        500,
        "CONFIG_ERROR"
      );
    }

    let token = tokenStorage.getAccessToken();

    // If token exists but expired, and refreshToken exists, try to refresh
    if (token && isTokenExpired(token) && !config.url?.includes("/auth/login") && !config.url?.includes("/auth/refresh")) {
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        try {
          const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const newAccessToken = refreshRes.data?.data?.accessToken || refreshRes.data?.accessToken;
          const newRefreshToken = refreshRes.data?.data?.refreshToken || refreshRes.data?.refreshToken;
          if (newAccessToken) {
            tokenStorage.setTokens(newAccessToken, newRefreshToken);
            token = newAccessToken;
          }
        } catch {
          tokenStorage.clearTokens();
          token = null;
        }
      } else {
        token = null;
      }
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach active tenant context header for Super Admin or client-selected company
    if (typeof window !== "undefined" && config.headers && !config.headers["x-tenant-id"]) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const orgFromUrl = urlParams.get("orgId") || urlParams.get("organizationId");
        const storedUserRaw = window.localStorage.getItem("mbyte_auth_user");
        let isSuperAdmin = false;
        if (storedUserRaw) {
          try {
            const parsed = JSON.parse(storedUserRaw);
            if (parsed?.state?.user?.role === "SUPER_ADMIN") isSuperAdmin = true;
          } catch {}
        }
        const storedOrg = isSuperAdmin ? null : window.localStorage.getItem("mbyte_selected_org_id");
        const activeOrg = orgFromUrl || storedOrg;
        if (activeOrg && activeOrg !== "ALL") {
          config.headers["x-tenant-id"] = activeOrg;
          config.headers["x-organization-id"] = activeOrg;
        }
      } catch {}
    }

    // When transmitting FormData, remove static Content-Type so browser can attach boundary parameter
    if (typeof FormData !== "undefined" && config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
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
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/logout")
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
        const freshToken = await ensureAuthenticated();
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
