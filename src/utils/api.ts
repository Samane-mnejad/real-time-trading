interface ApiRequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Function to handle logout when 401 is received
const handleUnauthorized = () => {
  // Clear auth data from localStorage
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  
  // Trigger a custom event that the AuthContext can listen to
  window.dispatchEvent(new CustomEvent('auth:unauthorized'));
};

// Enhanced fetch function with automatic 401 handling
export const apiRequest = async (url: string, options: ApiRequestOptions = {}): Promise<Response> => {
  const token = localStorage.getItem('authToken');
  
  // Add default headers
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      console.warn('API request received 401 Unauthorized - logging out user');
      handleUnauthorized();
      throw new ApiError('Authorization token required', 401);
    }
    
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Convenience function for JSON requests
export const apiRequestJson = async <T = unknown>(url: string, options: ApiRequestOptions = {}): Promise<T> => {
  const response = await apiRequest(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(errorData.error || `Request failed with status ${response.status}`, response.status);
  }
  
  return response.json();
};

export { ApiError }; 