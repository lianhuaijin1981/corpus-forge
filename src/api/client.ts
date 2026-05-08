import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd'

// API 响应通用结构
export interface ApiResponse<T = unknown> {
  code: number
  data: T
  message: string
}

// 分页响应结构
export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// 创建 axios 实例
const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // 请求拦截器
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // 从 localStorage 获取 token
      const authData = localStorage.getItem('corpusforge-auth')
      if (authData) {
        try {
          const parsed = JSON.parse(authData)
          const token = parsed?.state?.token
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`
          }
        } catch {
          // ignore parse error
        }
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      const { data } = response

      // 如果后端返回了 code 字段，按业务码处理
      if (data && typeof data.code === 'number') {
        if (data.code === 0 || data.code === 200) {
          return response
        }

        // 业务错误
        const errorMsg = data.message || '请求失败'
        message.error(errorMsg)

        // 特殊状态码处理
        if (data.code === 401) {
          handleUnauthorized()
        }

        return Promise.reject(new Error(errorMsg))
      }

      return response
    },
    (error) => {
      // HTTP 状态码错误处理
      if (error.response) {
        const { status, data } = error.response
        const errorMsg = data?.message || getDefaultErrorMessage(status)

        switch (status) {
          case 401:
            handleUnauthorized()
            break
          case 403:
            message.error('没有权限访问该资源')
            break
          case 404:
            message.error('请求的资源不存在')
            break
          case 422:
            message.error('请求参数验证失败')
            break
          case 429:
            message.error('请求过于频繁，请稍后再试')
            break
          case 500:
            message.error('服务器内部错误，请稍后再试')
            break
          case 502:
          case 503:
            message.error('服务暂时不可用，请稍后再试')
            break
          default:
            message.error(errorMsg)
        }
      } else if (error.code === 'ECONNABORTED') {
        message.error('请求超时，请检查网络连接')
      } else if (!axios.isCancel(error)) {
        message.error('网络连接异常，请检查网络设置')
      }

      return Promise.reject(error)
    }
  )

  return instance
}

const apiClient = createApiClient()

// 未授权处理
function handleUnauthorized() {
  message.warning('登录已过期，请重新登录')
  localStorage.removeItem('corpusforge-auth')
  // 延迟跳转，避免 message 被页面切换打断
  setTimeout(() => {
    window.location.href = '/login'
  }, 1500)
}

// 默认错误消息
function getDefaultErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: '请求参数错误',
    401: '未授权，请重新登录',
    403: '拒绝访问',
    404: '资源不存在',
    405: '请求方法不允许',
    408: '请求超时',
    422: '参数验证失败',
    429: '请求过于频繁',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务不可用',
    504: '网关超时',
  }
  return messages[status] || `请求失败 (${status})`
}

// 通用请求方法
export const request = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return apiClient.get(url, config).then((res) => res.data)
  },

  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return apiClient.post(url, data, config).then((res) => res.data)
  },

  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return apiClient.put(url, data, config).then((res) => res.data)
  },

  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return apiClient.patch(url, data, config).then((res) => res.data)
  },

  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return apiClient.delete(url, config).then((res) => res.data)
  },
}

export default apiClient
