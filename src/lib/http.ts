// ABOUTME: Pre-configured Axios HTTP client with interceptors for auth, timing and error mapping
// ABOUTME: Used by all external API requests in the app.

import axios, { type AxiosError, type AxiosRequestHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

type TimedRequestConfig = InternalAxiosRequestConfig & { metadata?: { start: number } };

/**
 * Single Axios instance so all requests share baseURL, headers and interceptors.
 * Extend or override per-request config via axios request config argument.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/", // fallback to same origin
  timeout: 15000
});

// --- Request interceptor: attach headers ----------------------------------------------------
http.interceptors.request.use((config) => {
  const cfg = config as TimedRequestConfig;
  const token = localStorage.getItem("auth_token");
  if (token) {
    (cfg.headers as AxiosRequestHeaders)["Authorization"] = `Bearer ${token}`;
  }
  // mark request start time for later measurement
  cfg.metadata = { start: Date.now() };
  return cfg;
});

// --- Response interceptor: timing + error mapping ------------------------------------------
http.interceptors.response.use(
  (response: AxiosResponse) => {
    const meta = (response.config as TimedRequestConfig).metadata;
    if (meta) {
      const duration = Date.now() - meta.start;
      // TODO: add logging/analytics here
      console.debug(`HTTP ${response.config.url} – ${duration}ms`);
    }
    return response;
  },
  (error: AxiosError) => {
    const meta = (error.config as TimedRequestConfig | undefined)?.metadata;
    if (meta) {
      const duration = Date.now() - meta.start;
      console.debug(`HTTP ERROR ${error.config?.url} – ${duration}ms`);
    }

    // Normalise error shape
    const respData = error.response?.data as { message?: string } | undefined;
    const normalised = {
      message: respData?.message ?? error.message ?? "Unknown error",
      status: error.response?.status ?? 0,
      data: error.response?.data
    };

    return Promise.reject(normalised);
  }
);
