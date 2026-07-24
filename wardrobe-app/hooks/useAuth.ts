import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, token, isAuthenticated, login, logout } = useAuthStore();
  return { user, token, isAuthenticated, login, logout };
}

/** Convenience selector for the currently authenticated user (or null). */
export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}
