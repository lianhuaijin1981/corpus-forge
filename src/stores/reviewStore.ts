import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { ReviewTask, ReviewStatus } from '../types'

// ============ Mock 数据 ============

const mockReviews: ReviewTask[] = [
  {
    id: 'r-001',
    corpusId: 'c-003',
    corpusTitle: '客服对话-投诉建议003',
    type: 'corpus',
    status: 'pending',
    reviewerId: '',
    submitterId: 'user-001',
    submitterName: 'creator1',
    submittedAt: '2024-03-17T09:00:00Z',
  },
  {
    id: 'r-002',
    corpusId: 'c-006',
    corpusTitle: '环境噪声语音006',
    type: 'corpus',
    status: 'pending',
    reviewerId: '',
    submitterId: 'user-001',
    submitterName: 'creator1',
    submittedAt: '2024-03-19T10:00:00Z',
  },
  {
    id: 'r-003',
    corpusId: 'c-001',
    corpusTitle: '客服对话-产品咨询001',
    type: 'annotation',
    status: 'approved',
    reviewerId: 'user-003',
    reviewerName: 'reviewer1',
    submitterId: 'user-002',
    submitterName: 'annotator1',
    result: 'approved',
    comment: '标注质量优秀，格式规范',
    submittedAt: '2024-03-12T10:00:00Z',
    reviewedAt: '2024-03-13T14:00:00Z',
  },
  {
    id: 'r-004',
    corpusId: 'c-002',
    corpusTitle: '客服对话-售后退换002',
    type: 'annotation',
    status: 'rejected',
    reviewerId: 'user-003',
    reviewerName: 'reviewer1',
    submitterId: 'user-002',
    submitterName: 'annotator1',
    result: 'rejected',
    comment: '实体边界标注不准确，需重新标注',
    submittedAt: '2024-03-14T11:00:00Z',
    reviewedAt: '2024-03-15T09:30:00Z',
  },
  {
    id: 'r-005',
    corpusId: 'c-007',
    corpusTitle: '商品主图-手机007',
    type: 'corpus',
    status: 'in_review',
    reviewerId: 'user-003',
    reviewerName: 'reviewer1',
    submitterId: 'admin-001',
    submitterName: 'admin',
    submittedAt: '2024-03-20T08:00:00Z',
  },
]

// ============ Store 类型 ============

interface ReviewFilters {
  keyword?: string
  type?: 'corpus' | 'annotation'
  status?: ReviewStatus
  submitterId?: string
  reviewerId?: string
}

interface ReviewState {
  reviews: ReviewTask[]
  // CRUD
  addReview: (data: Omit<ReviewTask, 'id' | 'submittedAt'>) => ReviewTask
  getReviewById: (id: string) => ReviewTask | undefined
  getReviewsByCorpusId: (corpusId: string) => ReviewTask[]
  // 审核操作
  approveReview: (id: string, reviewerId: string, reviewerName: string, comment?: string) => void
  rejectReview: (id: string, reviewerId: string, reviewerName: string, comment: string) => void
  startReview: (id: string, reviewerId: string, reviewerName: string) => void
  // 查询
  getFilteredReviews: (filters: ReviewFilters) => ReviewTask[]
  getPendingCount: () => number
}

export type { ReviewFilters }

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      reviews: mockReviews,

      addReview: (data) => {
        const newReview: ReviewTask = {
          ...data,
          id: uuidv4(),
          submittedAt: new Date().toISOString(),
        }
        set({ reviews: [newReview, ...get().reviews] })
        return newReview
      },

      getReviewById: (id) => get().reviews.find(r => r.id === id),

      getReviewsByCorpusId: (corpusId) =>
        get().reviews.filter(r => r.corpusId === corpusId),

      approveReview: (id, reviewerId, reviewerName, comment) => {
        set({
          reviews: get().reviews.map(r =>
            r.id === id
              ? {
                  ...r,
                  status: 'approved' as ReviewStatus,
                  result: 'approved',
                  reviewerId,
                  reviewerName,
                  comment: comment || '',
                  reviewedAt: new Date().toISOString(),
                }
              : r
          ),
        })
      },

      rejectReview: (id, reviewerId, reviewerName, comment) => {
        set({
          reviews: get().reviews.map(r =>
            r.id === id
              ? {
                  ...r,
                  status: 'rejected' as ReviewStatus,
                  result: 'rejected',
                  reviewerId,
                  reviewerName,
                  comment,
                  reviewedAt: new Date().toISOString(),
                }
              : r
          ),
        })
      },

      startReview: (id, reviewerId, reviewerName) => {
        set({
          reviews: get().reviews.map(r =>
            r.id === id
              ? {
                  ...r,
                  status: 'in_review' as ReviewStatus,
                  reviewerId,
                  reviewerName,
                }
              : r
          ),
        })
      },

      getFilteredReviews: (filters) => {
        let list = [...get().reviews]

        if (filters.keyword) {
          const kw = filters.keyword.toLowerCase()
          list = list.filter(
            r =>
              r.corpusTitle?.toLowerCase().includes(kw) ||
              r.submitterName?.toLowerCase().includes(kw)
          )
        }

        if (filters.type) {
          list = list.filter(r => r.type === filters.type)
        }

        if (filters.status) {
          list = list.filter(r => r.status === filters.status)
        }

        if (filters.submitterId) {
          list = list.filter(r => r.submitterId === filters.submitterId)
        }

        if (filters.reviewerId) {
          list = list.filter(r => r.reviewerId === filters.reviewerId)
        }

        list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        return list
      },

      getPendingCount: () =>
        get().reviews.filter(r => r.status === 'pending').length,
    }),
    {
      name: 'corpusforge-review',
    }
  )
)
