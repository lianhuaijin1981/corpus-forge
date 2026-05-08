import { request, type ApiResponse, type PaginatedResponse } from './client'
import type { Corpus, CorpusLibrary } from '../types'

// ============ 语料相关 API ============

export const corpusApi = {
  /** 获取语料列表（分页） */
  getList(params: {
    page?: number
    pageSize?: number
    keyword?: string
    type?: string
    status?: string
    libraryId?: string
    creator?: string
    tags?: string[]
    dateRange?: [string, string]
  }): Promise<ApiResponse<PaginatedResponse<Corpus>>> {
    return request.get('/corpus', { params })
  },

  /** 获取语料详情 */
  getDetail(id: string): Promise<ApiResponse<Corpus>> {
    return request.get(`/corpus/${id}`)
  },

  /** 创建语料 */
  create(data: Partial<Corpus>): Promise<ApiResponse<Corpus>> {
    return request.post('/corpus', data)
  },

  /** 更新语料 */
  update(id: string, data: Partial<Corpus>): Promise<ApiResponse<Corpus>> {
    return request.put(`/corpus/${id}`, data)
  },

  /** 删除语料 */
  delete(id: string): Promise<ApiResponse<null>> {
    return request.delete(`/corpus/${id}`)
  },

  /** 批量删除 */
  batchDelete(ids: string[]): Promise<ApiResponse<null>> {
    return request.post('/corpus/batch-delete', { ids })
  },

  /** 提交审核 */
  submitForReview(id: string): Promise<ApiResponse<Corpus>> {
    return request.post(`/corpus/${id}/submit`)
  },

  /** 批量提交审核 */
  batchSubmitForReview(ids: string[]): Promise<ApiResponse<null>> {
    return request.post('/corpus/batch-submit', { ids })
  },

  /** 批量变更语料库 */
  batchChangeLibrary(ids: string[], libraryId: string): Promise<ApiResponse<null>> {
    return request.post('/corpus/batch-change-library', { ids, libraryId })
  },

  /** 导出语料 */
  export(ids: string[], format: 'json' | 'csv' = 'json'): Promise<ApiResponse<string>> {
    return request.post('/corpus/export', { ids, format })
  },

  /** 上传文件 */
  uploadFile(formData: FormData): Promise<ApiResponse<{ url: string; filename: string }>> {
    return request.post('/corpus/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// ============ 语料库相关 API ============

export const libraryApi = {
  /** 获取语料库列表 */
  getList(params?: {
    keyword?: string
    type?: string
  }): Promise<ApiResponse<CorpusLibrary[]>> {
    return request.get('/libraries', { params })
  },

  /** 获取语料库详情 */
  getDetail(id: string): Promise<ApiResponse<CorpusLibrary>> {
    return request.get(`/libraries/${id}`)
  },

  /** 创建语料库 */
  create(data: Partial<CorpusLibrary>): Promise<ApiResponse<CorpusLibrary>> {
    return request.post('/libraries', data)
  },

  /** 更新语料库 */
  update(id: string, data: Partial<CorpusLibrary>): Promise<ApiResponse<CorpusLibrary>> {
    return request.put(`/libraries/${id}`, data)
  },

  /** 删除语料库 */
  delete(id: string): Promise<ApiResponse<null>> {
    return request.delete(`/libraries/${id}`)
  },
}
