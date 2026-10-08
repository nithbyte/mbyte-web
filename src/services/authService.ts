import { mockUsers } from "../mock";
import type { User } from "../types";

// Maintain active user state in memory, defaulted to the regional sales manager
let activeUserId = "usr_mgr_001";

function formatUser(rawUser: User): User {
  const computedName =
    rawUser.name ||
    [rawUser.firstName, rawUser.lastName].filter(Boolean).join(" ").trim() ||
    rawUser.email.split("@")[0];

  return {
    ...rawUser,
    name: computedName,
    designation: rawUser.designation || (rawUser.role === "MANAGER" ? "Area Sales Manager" : "Administrator"),
  };
}

export const authService = {
  /**
   * Retrieves the currently active authenticated session user.
   * Drop-in replaceable with: GET /api/v1/auth/me
   */
  async getCurrentUser(): Promise<User> {
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
    return Promise.resolve(mockUsers.map(formatUser));
  },

  /**
   * Switches the active persona session (for demo, multi-role testing, or manager delegation).
   */
  async switchUser(userId: string): Promise<User> {
    const targetUser = mockUsers.find((u) => u.id === userId);
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
    // Reset to default manager for demo continuity
    activeUserId = "usr_mgr_001";
    return Promise.resolve();
  },
};

export const getCurrentUser = () => authService.getCurrentUser();
export const getAllUsers = () => authService.getAllUsers();
export const switchUser = (userId: string) => authService.switchUser(userId);
export const login = (credentials: { email: string; password?: string }) => authService.login(credentials);
export const logout = () => authService.logout();

