import { request, type ApiResponse } from './client'
import type { User } from '../types'

// ============ 认证相关 API ============

export const authApi = {
  /** 登录 */
  login(username: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return request.post('/auth/login', { username, password })
  },

  /** 退出登录 */
  logout(): Promise<ApiResponse<null>> {
    return request.post('/auth/logout')
  },

  /** 获取当前用户信息 */
  getProfile(): Promise<ApiResponse<User>> {
    return request.get('/auth/profile')
  },

  /** 修改密码 */
  changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<null>> {
    return request.post('/auth/change-password', { oldPassword, newPassword })
  },

  /** 更新个人资料 */
  updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return request.put('/auth/profile', data)
  },

  /** 注册 */
  register(data: { username: string; password: string; email?: string }): Promise<ApiResponse<User>> {
    return request.post('/auth/register', data)
  },
}

// ============ 用户管理 API（管理员） ============

export const userApi = {
  /** 获取用户列表 */
  getList(params?: {
    keyword?: string
    status?: string
    role?: string
  }): Promise<ApiResponse<User[]>> {
    return request.get('/users', { params })
  },

  /** 创建用户 */
  create(data: Partial<User>): Promise<ApiResponse<User>> {
    return request.post('/users', data)
  },

  /** 更新用户 */
  update(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
    return request.put(`/users/${id}`, data)
  },

  /** 删除用户 */
  delete(id: string): Promise<ApiResponse<null>> {
    return request.delete(`/users/${id}`)
  },

  /** 批量禁用 */
  batchDisable(ids: string[]): Promise<ApiResponse<null>> {
    return request.post('/users/batch-disable', { ids })
  },

  /** 批量启用 */
  batchEnable(ids: string[]): Promise<ApiResponse<null>> {
    return request.post('/users/batch-enable', { ids })
  },

  /** 批量分配角色 */
  batchAssignRole(ids: string[], role: string): Promise<ApiResponse<null>> {
    return request.post('/users/batch-assign-role', { ids, role })
  },
}

// ============ 搜索相关 API ============

export const searchApi = {
  /** 全文搜索 */
  search(params: {
    keyword: string
    type?: string
    status?: string
    libraryId?: string
    dateRange?: [string, string]
    page?: number
    pageSize?: number
  }): Promise<ApiResponse<{ list: unknown[]; total: number }>> {
    return request.get('/search', { params })
  },

  /** 获取搜索建议 */
  getSuggestions(keyword: string): Promise<ApiResponse<string[]>> {
    return request.get('/search/suggestions', { params: { keyword } })
  },
}

// ============ 统计相关 API ============

export const statsApi = {
  /** 获取概览统计 */
  getOverview(): Promise<ApiResponse<Record<string, unknown>>> {
    return request.get('/stats/overview')
  },

  /** 获取增长趋势 */
  getGrowthTrend(period: 'month' | 'quarter' | 'year' = 'month'): Promise<ApiResponse<unknown>> {
    return request.get('/stats/growth-trend', { params: { period } })
  },

  /** 获取分布统计 */
  getDistribution(type: 'corpus_type' | 'corpus_status' | 'language' | 'task_status'): Promise<ApiResponse<unknown>> {
    return request.get('/stats/distribution', { params: { type } })
  },

  /** 导出统计报告 */
  exportReport(format: 'json' | 'csv' = 'json'): Promise<ApiResponse<string>> {
    return request.get('/stats/export', { params: { format } })
  },
}

// ============ 系统管理 API ============

export const systemApi = {
  /** 获取系统配置 */
  getConfig(): Promise<ApiResponse<Record<string, unknown>>> {
    return request.get('/system/config')
  },

  /** 更新系统配置 */
  updateConfig(data: Record<string, unknown>): Promise<ApiResponse<null>> {
    return request.put('/system/config', data)
  },

  /** 获取操作日志 */
  getLogs(params: {
    page?: number
    pageSize?: number
    action?: string
    operator?: string
    dateRange?: [string, string]
  }): Promise<ApiResponse<{ list: unknown[]; total: number }>> {
    return request.get('/system/logs', { params })
  },
}
