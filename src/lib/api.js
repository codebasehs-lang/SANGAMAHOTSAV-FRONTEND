import axios from 'axios';

const TOKEN_KEY = 'sangam_admin_token';

/** Shared Axios instance. Base URL uses the Vite dev proxy in dev. */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
});

const MAX_UPLOAD_SIZE_MB = 5;

// Attach the bearer token to every request when present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;

  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
  }

  return config;
});

// On 401, clear the token and redirect only for truly unauthenticated sessions.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const isRegistrantLogin =
        window.location.pathname === '/registrant/login' &&
        error.config?.url?.includes('/registrant-auth/login');
      const isRegistrantPasswordChange =
        window.location.pathname === '/registrant/dashboard' &&
        error.config?.url?.includes('/registrant-auth/change-password');

      if (!isRegistrantLogin && !isRegistrantPasswordChange) {
        localStorage.removeItem(TOKEN_KEY);
        if (window.location.pathname.startsWith('/registrant')) {
          window.location.assign('/registrant/login');
        } else if (!window.location.pathname.startsWith('/admin/login')) {
          window.location.assign('/admin/login');
        }
      }
    }

    if (error.response?.status === 413) {
      error.customMessage = `Request too large. Please upload files smaller than ${MAX_UPLOAD_SIZE_MB} MB.`;
    }

    return Promise.reject(error);
  }
);

export const tokenStore = {
  get: () => {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  },
  set: (token, remember = false) => {
    if (remember) {
      localStorage.setItem(TOKEN_KEY, token);
      sessionStorage.removeItem(TOKEN_KEY);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(TOKEN_KEY);
    }
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  },
};

/** Extract a human-readable message from an Axios error. */
export function getErrorMessage(error) {
  return (
    error?.customMessage ||
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong.'
  );
}

export default api;
