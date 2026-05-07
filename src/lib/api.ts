import axios from 'axios';

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

  // Check if we're on a customer-related route
  // Customer routes include: /customer/*, /checkout, /checkout/success, /order-status, /login, /register
  const isCustomerRoute = pathname.startsWith('/customer') ||
                          pathname.startsWith('/checkout') ||
                          pathname.startsWith('/order-status') ||
                          pathname.startsWith('/login') ||
                          pathname.startsWith('/register') ||
                          pathname.startsWith('/cart') ||
                          pathname.startsWith('/shop') ||
                          pathname.startsWith('/product') ||
                          pathname.startsWith('/wishlist') ||
                          pathname === '/';

  // For customer routes, use customer_token
  // For admin routes, use admin_token
  if (isCustomerRoute) {
    return localStorage.getItem('customer_token');
  }
  return localStorage.getItem('admin_token');
};

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

        // Check if we're on a customer-related route
        const isCustomerRoute = pathname.startsWith('/customer') ||
                                pathname.startsWith('/checkout') ||
                                pathname.startsWith('/order-status') ||
                                pathname.startsWith('/login') ||
                                pathname.startsWith('/register') ||
                                pathname.startsWith('/cart') ||
                                pathname.startsWith('/shop') ||
                                pathname.startsWith('/product') ||
                                pathname.startsWith('/wishlist') ||
                                pathname === '/';

        if (isCustomerRoute) {
          // Customer route - clear customer token and redirect to customer login
          localStorage.removeItem('customer_token');
          localStorage.removeItem('customer_data');
          window.location.href = '/login';
        } else {
          // Admin route - clear admin token and redirect to admin login
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          window.location.href = '/admin/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default api;
