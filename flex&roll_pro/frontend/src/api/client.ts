import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { API_CONFIG } from './config'
import type { ApiResponse } from '@/types'

// ─── HTTP Client ─────────────────────────────────────────────────────────────
// Typed axios wrapper. All endpoints go through this to ensure consistent
// error handling and response transformation.

let httpClient: AxiosInstance | null = null

function getHttpClient(): AxiosInstance {
  if (!httpClient) {
    httpClient = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        // TODO: Add auth token injection here when auth is implemented
        // 'Authorization': `Bearer ${getToken()}`
      },
    })

    // Request interceptor — add auth headers, logging, etc.
    httpClient.interceptors.request.use(
      (config) => {
        // TODO: Inject Bitrix24 user token here
        // config.headers.Authorization = `Bearer ${getAuthToken()}`
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor — normalize errors
    httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        const message = error.response?.data?.detail ?? error.message ?? 'Неизвестная ошибка'
        return Promise.reject(new Error(message))
      }
    )
  }
  return httpClient
}

async function get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await getHttpClient().get<ApiResponse<T>>(url, config)
  return res.data.data
}

async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await getHttpClient().post<ApiResponse<T>>(url, data, config)
  return res.data.data
}

async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await getHttpClient().put<ApiResponse<T>>(url, data, config)
  return res.data.data
}

async function del<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await getHttpClient().delete<ApiResponse<T>>(url, config)
  return res.data.data
}

export const apiClient = { get, post, put, delete: del }
