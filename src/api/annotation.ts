import { request, type ApiResponse, type PaginatedResponse } from './client'
import type { AnnotationTask, ReviewTask } from '../types'

// ============ 标注任务相关 API ============

export const annotationApi = {
  /** 获取标注任务列表 */
  getList(params: {
    page?: number
    pageSize?: number
    keyword?: string
    status?: string
    priority?: string
    creator?: string
  }): Promise<ApiResponse<PaginatedResponse<AnnotationTask>>> {
    return request.get('/annotations', { params })
  },

  /** 获取标注任务详情 */
  getDetail(taskId: string): Promise<ApiResponse<AnnotationTask>> {
    return request.get(`/annotations/${taskId}`)
  },

  /** 创建标注任务 */
  create(data: Partial<AnnotationTask>): Promise<ApiResponse<AnnotationTask>> {
    return request.post('/annotations', data)
  },

  /** 更新标注任务 */
  update(taskId: string, data: Partial<AnnotationTask>): Promise<ApiResponse<AnnotationTask>> {
    return request.put(`/annotations/${taskId}`, data)
  },

  /** 删除标注任务 */
  delete(taskId: string): Promise<ApiResponse<null>> {
    return request.delete(`/annotations/${taskId}`)
  },

  /** 开始任务 */
  startTask(taskId: string): Promise<ApiResponse<AnnotationTask>> {
    return request.post(`/annotations/${taskId}/start`)
  },

  /** 暂停任务 */
  pauseTask(taskId: string): Promise<ApiResponse<AnnotationTask>> {
    return request.post(`/annotations/${taskId}/pause`)
  },

  /** 恢复任务 */
  resumeTask(taskId: string): Promise<ApiResponse<AnnotationTask>> {
    return request.post(`/annotations/${taskId}/resume`)
  },

  /** 停止任务 */
  stopTask(taskId: string): Promise<ApiResponse<AnnotationTask>> {
    return request.post(`/annotations/${taskId}/stop`)
  },

  /** 分配语料到任务 */
  assignCorpus(taskId: string, corpusIds: string[]): Promise<ApiResponse<null>> {
    return request.post(`/annotations/${taskId}/assign-corpus`, { corpusIds })
  },
}

// ============ 审核相关 API ============

export const reviewApi = {
  /** 获取审核任务列表 */
  getList(params: {
    page?: number
    pageSize?: number
    keyword?: string
    status?: string
    type?: string
    submitter?: string
    reviewer?: string
  }): Promise<ApiResponse<PaginatedResponse<ReviewTask>>> {
    return request.get('/reviews', { params })
  },

  /** 获取审核任务详情 */
  getDetail(id: string): Promise<ApiResponse<ReviewTask>> {
    return request.get(`/reviews/${id}`)
  },

  /** 开始审核 */
  startReview(id: string): Promise<ApiResponse<ReviewTask>> {
    return request.post(`/reviews/${id}/start`)
  },

  /** 通过审核 */
  approve(id: string, comment?: string): Promise<ApiResponse<ReviewTask>> {
    return request.post(`/reviews/${id}/approve`, { comment })
  },

  /** 驳回审核 */
  reject(id: string, reason: string): Promise<ApiResponse<ReviewTask>> {
    return request.post(`/reviews/${id}/reject`, { reason })
  },

  /** 批量通过 */
  batchApprove(ids: string[], comment?: string): Promise<ApiResponse<null>> {
    return request.post('/reviews/batch-approve', { ids, comment })
  },

  /** 批量驳回 */
  batchReject(ids: string[], reason: string): Promise<ApiResponse<null>> {
    return request.post('/reviews/batch-reject', { ids, reason })
  },
}
