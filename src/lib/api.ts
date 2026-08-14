const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const api = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // Check for access token first, fallback to guest token
  const accessToken = localStorage.getItem("access_token");
  const guestToken = localStorage.getItem("guest_token");
  const token = accessToken || guestToken;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = Array.isArray(errorData.message) ? errorData.message.join(", ") : errorData.message;
      }
    } catch (e) {
      // Ignore JSON parse error, use default statusText
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses (like 204 No Content)
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  
  return null;
};
