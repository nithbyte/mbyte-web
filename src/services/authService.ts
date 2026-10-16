import { apiClient, tokenStorage } from "../lib/api-client";
import { mockUsers } from "../mock";
import { normalizeRole, getRoleLabel, type User } from "../types";

// Maintain active user state in memory
let activeUserId = "usr_mgr_001";

function formatUser(rawUser: any): User {
  const computedName =
    rawUser.name ||
    [rawUser.firstName, rawUser.lastName].filter(Boolean).join(" ").trim() ||
    rawUser.email?.split("@")[0] ||
    "User";

  let extractedRole = rawUser.role;
  if (!extractedRole && Array.isArray(rawUser.roles) && rawUser.roles.length > 0) {
    extractedRole = rawUser.roles[0];
  }
  if (!extractedRole && Array.isArray(rawUser.userRoles) && rawUser.userRoles.length > 0) {
    extractedRole = rawUser.userRoles[0]?.role?.type || rawUser.userRoles[0]?.role;
  }
  if (!extractedRole && rawUser.email) {
    const emailLower = rawUser.email.toLowerCase();
    if (emailLower.includes("superadmin") || emailLower === "superadmin@mbyte.app") {
      extractedRole = "SUPER_ADMIN";
    } else if (emailLower.startsWith("admin@") || emailLower === "admin@novispharma.com") {
      extractedRole = "COMPANY_ADMIN";
    }
  }

  const role = normalizeRole(extractedRole || "MANAGER");

  return {
    id: rawUser.id,
    organizationId: rawUser.organizationId || null,
    name: computedName,
    firstName: rawUser.firstName,
    lastName: rawUser.lastName,
    email: rawUser.email,
    phone: rawUser.phone || "+91 98400 22222",
    role,
    employeeId: rawUser.medicalRepresentative?.employeeCode || rawUser.employeeId || "EMP-001",
    designation:
      rawUser.designation ||
      rawUser.medicalRepresentative?.designation ||
      getRoleLabel(role),
    territoryId: rawUser.medicalRepresentative?.territoryId || rawUser.territoryId,
    status: rawUser.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
    createdAt: rawUser.createdAt,
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

    try {
      const res = await apiClient.get<any>("/auth/me");
      if (res && res.id) {
        return formatUser(res);
      }
    } catch (err) {
      console.warn("Backend /auth/me call failed:", err);
    }

    if (activeUserId) {
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
      if (Array.isArray(items) && items.length > 0) {
        cachedUsers = items.map(formatUser);
        return cachedUsers;
      }
    } catch {
      // fallback to mock users if offline
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
  async login(credentials: { email: string; password?: string }): Promise<{ user: User; token: string }> {
    try {
      const res = await apiClient.post<any>("/auth/login", {
        email: credentials.email.trim(),
        password: credentials.password || "Password123!",
      });

      if (res && res.accessToken) {
        tokenStorage.setTokens(res.accessToken, res.refreshToken);
        const user = formatUser(res.user);
        activeUserId = user.id;
        return {
          user,
          token: res.accessToken,
        };
      }
    } catch (err: any) {
      // Check if fallback to mock user for offline test credentials
      const matched = mockUsers.find(
        (u) => u.email.toLowerCase() === credentials.email.trim().toLowerCase()
      );
      if (matched) {
        const mockToken = `mock_jwt_token_${matched.id}`;
        tokenStorage.setTokens(mockToken);
        activeUserId = matched.id;
        const user = formatUser(matched);
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
    return Promise.resolve();
  },
};

export const getCurrentUser = () => authService.getCurrentUser();
export const getAllUsers = () => authService.getAllUsers();
export const switchUser = (userId: string) => authService.switchUser(userId);
export const login = (credentials: { email: string; password?: string }) => authService.login(credentials);
export const logout = () => authService.logout();
