import { apiClient, tokenStorage } from "../lib/api-client";
import { mockUsers } from "../mock";
import type { User } from "../types";

// Maintain active user state in memory, defaulted to the regional sales manager
let activeUserId = "usr_mgr_001";

function formatUser(rawUser: any): User {
  const computedName =
    rawUser.name ||
    [rawUser.firstName, rawUser.lastName].filter(Boolean).join(" ").trim() ||
    rawUser.email?.split("@")[0] ||
    "User";

  const role = Array.isArray(rawUser.roles)
    ? rawUser.roles[0]
    : rawUser.role || "MANAGER";

  return {
    id: rawUser.id,
    organizationId: rawUser.organizationId || "org_novis_001",
    name: computedName,
    firstName: rawUser.firstName,
    lastName: rawUser.lastName,
    email: rawUser.email,
    phone: rawUser.phone || "+91 98400 22222",
    role,
    employeeId: rawUser.medicalRepresentative?.employeeCode || rawUser.employeeId || "MGR-001",
    designation:
      rawUser.designation ||
      rawUser.medicalRepresentative?.designation ||
      (role === "MANAGER" ? "Area Sales Manager" : "Administrator"),
    territoryId: rawUser.medicalRepresentative?.territoryId || rawUser.territoryId,
    status: rawUser.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
    createdAt: rawUser.createdAt,
  };
}

let cachedUsers: User[] = [];

export const authService = {
  /**
   * Retrieves the currently active authenticated session user.
   * Drop-in replaceable with: GET /api/v1/auth/me
   */
  async getCurrentUser(): Promise<User> {
    try {
      const res = await apiClient.get<any>("/auth/me");
      if (res && res.id) {
        return formatUser(res);
      }
    } catch (err) {
      console.warn("Real /auth/me call failed, falling back to mock user:", err);
    }

    const rawUser =
      mockUsers.find((u) => u.id === activeUserId) ||
      mockUsers.find((u) => u.role === "MANAGER") ||
      mockUsers[0];

    return Promise.resolve(formatUser(rawUser));
  },

  /**
   * Retrieves all users for directory and persona switching.
   * Drop-in replaceable with: GET /api/v1/users
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const res = await apiClient.get<any[]>("/users", { params: { limit: 50 } });
      if (Array.isArray(res) && res.length > 0) {
        cachedUsers = res.map(formatUser);
        return cachedUsers;
      }
    } catch {
      // fallback
    }

    cachedUsers = mockUsers.map(formatUser);
    return Promise.resolve(cachedUsers);
  },

  /**
   * Switches the active persona session (for demo, multi-role testing, or manager delegation).
   */
  async switchUser(userId: string): Promise<User> {
    const targetUser =
      cachedUsers.find((u) => u.id === userId) ||
      mockUsers.find((u) => u.id === userId);
    if (!targetUser) {
      throw new Error(`User with ID ${userId} not found.`);
    }
    activeUserId = userId;
    return Promise.resolve(formatUser(targetUser));
  },

  /**
   * Authenticates user with credentials.
   * Drop-in replaceable with: POST /api/v1/auth/login
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
    } catch (err) {
      console.warn("Real /auth/login call failed, checking mock credentials:", err);
    }

    const matched = mockUsers.find(
      (u) => u.email.toLowerCase() === credentials.email.trim().toLowerCase()
    );

    if (!matched) {
      throw new Error("Invalid credentials. Please verify your email.");
    }

    activeUserId = matched.id;
    return Promise.resolve({
      user: formatUser(matched),
      token: `mock_jwt_token_${matched.id}_${Date.now()}`,
    });
  },

  /**
   * Ends current authenticated session.
   * Drop-in replaceable with: POST /api/v1/auth/logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // keep
    }
    tokenStorage.clearTokens();
    activeUserId = "usr_mgr_001";
    return Promise.resolve();
  },
};

export const getCurrentUser = () => authService.getCurrentUser();
export const getAllUsers = () => authService.getAllUsers();
export const switchUser = (userId: string) => authService.switchUser(userId);
export const login = (credentials: { email: string; password?: string }) => authService.login(credentials);
export const logout = () => authService.logout();
