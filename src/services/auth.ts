// Authentication service
import Cookies from 'js-cookie';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  error?: string;
}

// This is a mock authentication service. In a real application, 
// you would replace this with actual API calls to your backend
export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        // Store token in cookie with 7 days expiry
        Cookies.set('authToken', data.token, { expires: 7, secure: true, sameSite: 'strict' });
        return { success: true, token: data.token };
      }
      return { success: false, error: data.detail || 'Invalid email or password' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login. Please try again.' };
    }
  },

  logout() {
    Cookies.remove('authToken');
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
  },

  isAuthenticated(): boolean {
    return !!Cookies.get('authToken') || !!localStorage.getItem('authToken') || !!sessionStorage.getItem('authToken');
  }
}; 