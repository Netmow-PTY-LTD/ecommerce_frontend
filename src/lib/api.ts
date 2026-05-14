import axios from 'axios';

// Extend AxiosRequestConfig to include our custom property
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuthRedirect?: boolean;
  }
  export interface InternalAxiosRequestConfig {
    skipAuthRedirect?: boolean;
  }
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to determine which auth to use based on route
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;

  const pathname = window.location.pathname;

  // Admin routes specifically start with /admin
  const isAdminRoute = pathname.startsWith('/admin');

  // For admin routes, use admin_token
  // For other routes, prefer customer_token, but fall back to admin_token for admins viewing public pages
  let token = null;
  let usedKey = '';

  if (isAdminRoute) {
    token = localStorage.getItem('admin_token');
    usedKey = 'admin_token';
  } else {
    // On public routes, try customer_token first, then fall back to admin_token
    token = localStorage.getItem('customer_token');
    usedKey = 'customer_token';

    // If no customer token, check if admin is logged in (for admins viewing public pages)
    if (!token || token === 'undefined' || token === 'null' || token === '') {
      const adminToken = localStorage.getItem('admin_token');
      if (adminToken && adminToken !== 'undefined' && adminToken !== 'null' && adminToken !== '') {
        token = adminToken;
        usedKey = 'admin_token (fallback)';
      }
    }
  }

  // Robust check for various falsy or invalid values
  if (!token || token === 'undefined' || token === 'null' || token === '') {
    token = null;
  }

  // Debugging log for development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API Auth] Route: ${pathname}, Using: ${usedKey}, Token valid: ${!!token}`);
  }

  return token;
};

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      if (process.env.NODE_ENV === 'development') {
        const authHeader = config.headers.Authorization as string;
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url} - Token: ${authHeader ? authHeader.substring(0, 20) + '...' : 'none'}`);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url} - No auth token`);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`[API 401 Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} - Unauthorized`);
        console.error('[API 401 Details]', {
          headers: error.response?.headers,
          data: error.response?.data
        });
      }

      // Check if the request specifically asked to skip the redirect
      if (error.config?.skipAuthRedirect) {
        return Promise.reject(error);
      }

      // Clear token and redirect to appropriate login
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;

        // NEVER redirect from checkout pages or success page - users should be able to complete guest checkout
        if (pathname.startsWith('/checkout') || pathname === '/checkout/success') {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[API] 401 error on checkout page - not redirecting to login (guest checkout allowed)');
          }
          return Promise.reject(error);
        }

        // Admin route detection
        const isAdminRoute = pathname.startsWith('/admin');

        // Customer/Account protected routes that require authentication
        const protectedCustomerRoutes = ['/customer/', '/account/', '/wishlist'];
        const isProtectedCustomerRoute = protectedCustomerRoutes.some(route => pathname.startsWith(route));

        if (isAdminRoute) {
          // Admin route - clear admin token and redirect to admin login
          if (process.env.NODE_ENV === 'development') {
            console.warn('[API] Clearing admin_token due to 401 error');
          }
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');

          // Only redirect if we're not already on the login page to avoid loops
          if (pathname !== '/admin/login') {
            window.location.href = '/admin/login';
          }
        } else if (isProtectedCustomerRoute) {
          // Protected customer route - clear customer token and redirect to login
          if (process.env.NODE_ENV === 'development') {
            console.warn('[API] Clearing customer_token due to 401 error');
          }
          localStorage.removeItem('customer_token');
          localStorage.removeItem('customer_data');

          if (pathname !== '/login') {
            window.location.href = '/login';
          }
        } else {
          // Public route (/, /shop, /categories, etc.) - do NOT redirect, just let the error pass through
          if (process.env.NODE_ENV === 'development') {
            console.warn('[API] 401 error on public route - not redirecting to login');
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default api;
