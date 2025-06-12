import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/validate"],
    queryFn: async () => {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return null;
      }
      
      try {
        const response = await apiRequest("POST", "/api/auth/validate", { authToken });
        return await response.json();
      } catch (err: any) {
        // Clear invalid token
        if (err.message?.includes('401')) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
        return null;
      }
    },
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error
  };
}