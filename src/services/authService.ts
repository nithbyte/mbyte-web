import { apiClient, tokenStorage, isMockFallbackAllowed } from "../lib/api-client";
import { mockUsers } from "../mock";
import { normalizeRole, getRoleLabel, type User } from "../types";
import { useAuthStore } from "@/store/useAuthStore";
import { getRootDomain } from "../lib/subdomain";

// Maintain active user state in memory
let activeUserId = "";

function formatUser(rawUser: any): User {
  let firstName = rawUser.firstName;
  let lastName = rawUser.lastName;

  if (
    rawUser.email?.toLowerCase() === "superadmin@mediqbyte.com" ||
    rawUser.email?.toLowerCase() === "superadmin@mbyte.app" ||
    firstName === "Antigravity" ||
    firstName === "Platform" && lastName === "Admin" ||
    rawUser.role === "SUPER_ADMIN" ||
    rawUser.roles?.includes("SUPER_ADMIN") ||
    rawUser.userRoles?.some((ur: any) => ur.role?.type === "SUPER_ADMIN" || ur.role === "SUPER_ADMIN")
  ) {
    firstName = "Super";
    lastName = "Admin";
  }

  const computedName =
    (firstName === "Super" && lastName === "Admin")
      ? "Super Admin"
      : rawUser.name
          ?.replace(/Antigravity\s*(SuperAdmin|PlatformAdmin|Super\s*Admin)/gi, "Super Admin")
          .replace(/Antigravity/gi, "")
          .trim() ||
        [firstName, lastName].filter(Boolean).join(" ").trim() ||
        rawUser.email?.split("@")[0] ||
        "User";

  let extractedRole = rawUser.role;
  if (rawUser.isSuperAdmin === true || (Array.isArray(rawUser.roles) && rawUser.roles.includes("SUPER_ADMIN"))) {
    extractedRole = "SUPER_ADMIN";
  } else if (!extractedRole && Array.isArray(rawUser.roles) && rawUser.roles.length > 0) {
    extractedRole = rawUser.roles[0];
  }
  if (!extractedRole && Array.isArray(rawUser.userRoles) && rawUser.userRoles.length > 0) {
    extractedRole = rawUser.userRoles[0]?.role?.type || rawUser.userRoles[0]?.role;
  }
  if (!extractedRole && rawUser.email) {
    const emailLower = rawUser.email.toLowerCase();
    if (emailLower.includes("superadmin") || emailLower === "superadmin@mediqbyte.com" || emailLower === "superadmin@mbyte.app") {
      extractedRole = "SUPER_ADMIN";
    } else if (emailLower.startsWith("admin@") || emailLower === "admin@novispharma.com") {
      extractedRole = "COMPANY_ADMIN";
    }
  }

  const role = normalizeRole(extractedRole || "MANAGER");

  const companyName =
    rawUser.organization?.name ||
    rawUser.organizationName ||
    rawUser.companyName ||
    (rawUser.organizationId === "org_apex_002" || rawUser.organizationId === "31524081-7b14-4925-a331-e4cd05a62e04"
      ? "Apex Healthcare"
      : rawUser.organizationId === "org_novis_001" || rawUser.organizationId === "28101346-8d53-4e0e-9433-feec8dbfeb28"
      ? "Novis Pharmaceuticals Pvt Ltd"
      : undefined);

  const employeeCode =
    rawUser.medicalRepresentative?.employeeCode ||
    rawUser.employeeCode ||
    rawUser.employeeId ||
    "EMP-001";

  return {
    id: rawUser.id,
    organizationId: rawUser.organizationId || rawUser.organization?.id || null,
    organization: rawUser.organization || null,
    organizationName: companyName,
    companyName: companyName,
    name: computedName,
    firstName: rawUser.firstName,
    lastName: rawUser.lastName,
    email: rawUser.email,
    phone: rawUser.phone || "+91 98400 22222",
    role,
    employeeId: employeeCode,
    employeeCode: employeeCode,
    designation:
      rawUser.designation ||
      rawUser.medicalRepresentative?.designation ||
      getRoleLabel(role),
    territoryId: rawUser.medicalRepresentative?.territoryId || rawUser.territoryId,
    territoryName: rawUser.medicalRepresentative?.territory?.name || rawUser.territoryName,
    status: rawUser.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
    createdAt: rawUser.createdAt,
    features: rawUser.features,
  };
}

let cachedUsers: User[] = [];

export const authService = {
  /**
   * Retrieves the currently active authenticated session user.
   * Calls: GET /api/v1/auth/me
   */
  async getCurrentUser(): Promise<User | null> {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      return null;
    }

    // Reject stale client mock tokens when mock mode is disabled
    if (token.startsWith("mock_") && !isMockFallbackAllowed()) {
      tokenStorage.clearTokens();
      activeUserId = "";
      cachedUsers = [];
      return null;
    }

    try {
      const res = await apiClient.get<any>("/auth/me");
      if (res && res.id) {
        const formatted = formatUser(res);
        activeUserId = formatted.id;
        return formatted;
      }
    } catch (err: any) {
      const status = err?.statusCode || err?.response?.status;
      if (status === 401 || status === 403) {
        // If we have an active valid session in store, don't destroy session on a transient query error
        const storeUser = useAuthStore.getState().user;
        if (storeUser && token) {
          try {
            const parts = token.split(".");
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              if (payload.exp && payload.exp * 1000 > Date.now()) {
                activeUserId = storeUser.id;
                return storeUser;
              }
            }
          } catch {}
        }
        tokenStorage.clearTokens();
        activeUserId = "";
        cachedUsers = [];
        return null;
      }
      console.warn("Backend /auth/me call failed:", err);
    }

    if (activeUserId && isMockFallbackAllowed()) {
      const rawUser = mockUsers.find((u) => u.id === activeUserId);
      if (rawUser) return formatUser(rawUser);
    }

    return null;
  },

  /**
   * Retrieves all users for directory and persona switching.
   * Calls: GET /api/v1/users
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const res = await apiClient.get<any>("/users", { params: { limit: 100 } });
      const items = Array.isArray(res) ? res : res?.items || [];
      if (Array.isArray(items)) {
        cachedUsers = items.map(formatUser);
        return cachedUsers;
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) {
        return [];
      }
      console.warn("Real /users call failed, falling back to mock:", err);
    }

    cachedUsers = mockUsers.map(formatUser);
    return Promise.resolve(cachedUsers);
  },

  /**
   * Switches the active persona session.
   */
  async switchUser(userId: string): Promise<User> {
    let targetUser =
      cachedUsers.find((u) => u.id === userId) ||
      mockUsers.find((u) => u.id === userId);

    if (!targetUser) {
      try {
        const remoteUser = await apiClient.get<any>(`/users/${userId}`);
        if (remoteUser && remoteUser.id) {
          targetUser = formatUser(remoteUser);
          cachedUsers.push(targetUser);
        }
      } catch {
        // Fallback: try refreshing user list from backend
        try {
          const all = await this.getAllUsers();
          targetUser = all.find((u) => u.id === userId);
        } catch {
          // ignore
        }
      }
    }

    if (!targetUser) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    activeUserId = userId;
    return Promise.resolve(formatUser(targetUser));
  },

  /**
   * Authenticates user with credentials via backend API.
   * Calls: POST /api/v1/auth/login
   */
  async login(credentials: {
    email: string;
    password?: string;
    tenantSlug?: string;
    companyCode?: string;
    organizationId?: string;
  }): Promise<{
    user?: User;
    token?: string;
    requiresCompanySelection?: boolean;
    selectionToken?: string;
    availableCompanies?: Array<{
      id: string;
      name: string;
      slug: string;
      code: string;
      logoUrl?: string;
      role?: string;
    }>;
  }> {
    // Clear any stale tokens or cached users from a previous session before authenticating
    tokenStorage.clearTokens();
    activeUserId = "";
    cachedUsers = [];

    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password || "";

    try {
      const res = await apiClient.post<any>("/auth/login", {
        email,
        password,
        ...(credentials.tenantSlug ? { tenantSlug: credentials.tenantSlug } : {}),
        ...(credentials.companyCode ? { companyCode: credentials.companyCode } : {}),
        ...(credentials.organizationId ? { organizationId: credentials.organizationId } : {}),
      });

      if (res && res.requiresCompanySelection) {
        return {
          requiresCompanySelection: true,
          selectionToken: res.selectionToken,
          availableCompanies: res.availableCompanies || [],
        };
      }

      if (res && res.accessToken && res.user) {
        tokenStorage.setTokens(res.accessToken, res.refreshToken);
        const user = formatUser(res.user);
        activeUserId = user.id;
        // Persist tenant org for API client header injection (all roles except super admin)
        if (typeof window !== "undefined") {
          try {
            if (user.role === "SUPER_ADMIN") {
              window.localStorage.removeItem("mbyte_selected_org_id");
            } else if (user.organizationId) {
              window.localStorage.setItem("mbyte_selected_org_id", user.organizationId);
            }
          } catch {}
        }
        return {
          user,
          token: res.accessToken,
        };
      }
    } catch (err: any) {
      const status = err?.statusCode || err?.response?.status;
      // Never fake-login when the server explicitly rejects credentials (4xx) or when mocks are disabled
      if ((status && status < 500) || !isMockFallbackAllowed()) {
        throw err;
      }

      const found = mockUsers.find((u) => u.email.toLowerCase() === email);
      if (found) {
        const mockToken = `mock_jwt_token_${found.id}`;
        tokenStorage.setTokens(mockToken);
        activeUserId = found.id;
        const user = formatUser(found);
        return {
          user,
          token: mockToken,
        };
      }
      throw err;
    }

    throw new Error("Invalid email or password");
  },

  /**
   * Completes login by selecting an authorized tenant company.
   */
  async selectCompany(
    organizationId: string,
    selectionToken: string,
  ): Promise<{ user: User; token: string }> {
    const res = await apiClient.post<any>("/auth/select-company", {
      organizationId,
      selectionToken,
    });
    if (res && res.accessToken && res.user) {
      tokenStorage.setTokens(res.accessToken, res.refreshToken);
      const user = formatUser(res.user);
      activeUserId = user.id;
      if (typeof window !== "undefined" && user.organizationId) {
        try { window.localStorage.setItem("mbyte_selected_org_id", user.organizationId); } catch {}
      }
      return { user, token: res.accessToken };
    }
    throw new Error("Failed to establish tenant session for selected company.");
  },

  /**
   * Switches tenant session to another authorized company.
   */
  async switchTenant(organizationId: string): Promise<{ user: User; token: string }> {
    const res = await apiClient.post<any>("/auth/switch-tenant", {
      organizationId,
    });
    if (res && res.accessToken && res.user) {
      tokenStorage.setTokens(res.accessToken, res.refreshToken);
      const user = formatUser(res.user);
      activeUserId = user.id;
      return { user, token: res.accessToken };
    }
    throw new Error("Failed to switch tenant organization.");
  },

  /**
   * Retrieves all authorized company memberships for the current user.
   */
  async getUserCompanies(): Promise<
    Array<{
      id: string;
      name: string;
      slug: string;
      code: string;
      logoUrl?: string;
      role?: string;
    }>
  > {
    try {
      const res = await apiClient.get<any>("/auth/companies");
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  /**
   * Pre-login Tenant Discovery.
   */
  async discoverTenant(identifier: string): Promise<any> {
    return apiClient.get<any>("/auth/tenant-discovery", {
      params: { identifier },
    });
  },

  /**
   * Ends current authenticated session.
   * Calls: POST /api/v1/auth/logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // ignore
    }
    tokenStorage.clearTokens();
    activeUserId = "";
    cachedUsers = [];
    try {
      useAuthStore.getState().logout();
      useAuthStore.persist?.clearStorage?.();
    } catch {}
    if (typeof window !== "undefined") {
      try {
        // Surgically remove only auth-related keys — do NOT call localStorage.clear()
        // which would nuke Zustand persist and cause stale-read redirect loops
        const authKeys = [
          "mbyte_auth_user",
          "mbyte_tenant_slug",
          "mbyte_selected_org_id",
        ];
        authKeys.forEach((k) => {
          try { window.localStorage.removeItem(k); } catch {}
        });
        window.sessionStorage.clear();
        const rootDomain = getRootDomain();
        const rootHost = rootDomain.split(":")[0];
        const cookieNames = [
          "mbyte_admin_access_token",
          "mbyte_admin_refresh_token",
          "mbyte_auth_token",
          "mbyte_refresh_token",
          "mbyte_tenant_subdomain",
          "mbyte_tenant_slug",
          "mbyte_selected_org_id",
          "mbyte_auth_user",
        ];
        cookieNames.forEach((name) => {
          // Clear wildcard domain (.mediqbyte.com)
          document.cookie = `${name}=; path=/; domain=.${rootHost}; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
          // Clear naked domain (mediqbyte.com)
          document.cookie = `${name}=; path=/; domain=${rootHost}; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
          // Clear host-only (current subdomain)
          document.cookie = `${name}=; path=/; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
        });
      } catch {}
    }
    return Promise.resolve();
  },
};

export const getCurrentUser = () => authService.getCurrentUser();
export const getAllUsers = () => authService.getAllUsers();
export const switchUser = (userId: string) => authService.switchUser(userId);
export const login = (credentials: {
  email: string;
  password?: string;
  tenantSlug?: string;
  companyCode?: string;
  organizationId?: string;
}) => authService.login(credentials);
export const selectCompany = (organizationId: string, selectionToken: string) =>
  authService.selectCompany(organizationId, selectionToken);
export const switchTenant = (organizationId: string) => authService.switchTenant(organizationId);
export const getUserCompanies = () => authService.getUserCompanies();
export const discoverTenant = (identifier: string) => authService.discoverTenant(identifier);
export const logout = () => authService.logout();
