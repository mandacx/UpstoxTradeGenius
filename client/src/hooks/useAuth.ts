import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const authToken = localStorage.getItem('authToken');
      
      if (!authToken) {
        return null;
      }
      
      try {
        const response = await fetch("/api/auth/user", {
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // Clear invalid token
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
          }
          return null;
        }
        
        return await response.json();
      } catch (err: any) {
        console.error("Auth error:", err);
        // Clear invalid token on any error
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        return null;
      }
    },
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error
  };
}