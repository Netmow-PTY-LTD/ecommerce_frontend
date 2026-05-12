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

  // For admin routes, prefer admin_token, fallback to customer_token if needed
  // For other routes, prefer customer_token
  let token = null;
  if (isAdminRoute) {
    token = localStorage.getItem('admin_token');
  } else {
    token = localStorage.getItem('customer_token');
  }

  // If we're on an admin route but have no admin_token, try customer_token just in case 
  // (though usually they are separate)
  if (!token && isAdminRoute) {
    token = localStorage.getItem('customer_token');
  }

  return token;
};

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Log for debugging (remove in production)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url} - Auth token added`);
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
      }

      // Check if the request specifically asked to skip the redirect
      if (error.config?.skipAuthRedirect) {
        return Promise.reject(error);
      }

      // Clear token and redirect to appropriate login
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;

        // NEVER redirect from the success page - we want users to see their confirmation
        if (pathname === '/checkout/success') {
          return Promise.reject(error);
        }

        // Admin route detection
        const isAdminRoute = pathname.startsWith('/admin');

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
        } else {
          // Customer route - clear customer token and redirect to customer login
          if (process.env.NODE_ENV === 'development') {
            console.warn('[API] Clearing customer_token due to 401 error');
          }
          localStorage.removeItem('customer_token');
          localStorage.removeItem('customer_data');
          
          if (pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default api;
