import { useSyncExternalStore } from 'react';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from './config';

// Render free tier sleeps when idle; the first request can take ~50s+.
const WARM_TIMEOUT_MS = 15000;
const COLD_START_TIMEOUT_MS = 60000;
const WAKING_MESSAGE_DELAY_MS = 4000;

export const WAKING_MESSAGE = 'Waking up the server… this can take up to a minute.';

export const api = axios.create({
  baseURL: API_URL,
  timeout: WARM_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let _accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

// ── Cold-start tracking ────────────────────────────────────────────────
// Until the server has answered once this session, use a long timeout and
// tell the UI (via Loader) that the server is waking up.
let warmed = false;
let pending = 0;
let waking = false;
let wakeTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function setWaking(value: boolean): void {
  if (waking === value) return;
  waking = value;
  listeners.forEach((l) => l());
}

function onRequestStart(): void {
  pending += 1;
  if (!warmed && !wakeTimer) {
    wakeTimer = setTimeout(() => {
      wakeTimer = null;
      if (!warmed && pending > 0) setWaking(true);
    }, WAKING_MESSAGE_DELAY_MS);
  }
}

function onRequestSettled(gotResponse: boolean): void {
  pending = Math.max(0, pending - 1);
  if (gotResponse) warmed = true;
  if (warmed || pending === 0) {
    if (wakeTimer) {
      clearTimeout(wakeTimer);
      wakeTimer = null;
    }
    setWaking(false);
  }
}

export function useServerWaking(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => waking,
    () => false
  );
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  if (!warmed) {
    config.timeout = COLD_START_TIMEOUT_MS;
  }
  onRequestStart();
  return config;
});

api.interceptors.response.use(
  (response) => {
    onRequestSettled(true);
    return response;
  },
  (error: AxiosError) => {
    onRequestSettled(!!error.response);

    if (error.response?.status === 401) {
      setAccessToken(null);
    }

    const message =
      (error.response?.data as { message?: string; error?: string })?.message ||
      (error.response?.data as { message?: string; error?: string })?.error ||
      error.message ||
      'Something went wrong';

    return Promise.reject(new Error(message));
  }
);

export default api;
