import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Corpus, CorpusLibrary, CorpusType, CorpusStatus } from '../types'

// ============ Mock 数据 ============

const mockLibraries: CorpusLibrary[] = [
  {
    id: 'lib-001',
    name: '客服对话语料库',
    description: '包含产品咨询、售后、投诉等各类客服对话语料',
    type: 'public',
    ownerId: 'user-001',
    ownerName: 'creator1',
    tags: ['客服', '对话', 'NLP'],
    corpusCount: 5,
    accessRoles: ['creator', 'annotator', 'reviewer'],
    accessUsers: [],
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-03-20T10:30:00Z',
  },
  {
    id: 'lib-002',
    name: '语音识别训练集',
    description: '普通话语音识别训练数据，覆盖多种口音',
    type: 'project',
    ownerId: 'user-001',
    ownerName: 'creator1',
    tags: ['语音', 'ASR', '训练'],
    corpusCount: 3,
    accessRoles: ['annotator'],
    accessUsers: [],
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-03-18T14:20:00Z',
  },
  {
    id: 'lib-003',
    name: '商品图片描述',
    description: '电商商品图片及对应文字描述',
    type: 'public',
    ownerId: 'admin-001',
    ownerName: 'admin',
    tags: ['图片', '电商', '多模态'],
    corpusCount: 2,
    accessRoles: ['creator', 'annotator', 'reviewer', 'user'],
    accessUsers: [],
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-03-15T16:00:00Z',
  },
  {
    id: 'lib-004',
    name: '意图识别训练集',
    description: 'NLU 意图分类标注语料',
    type: 'private',
    ownerId: 'user-001',
    ownerName: 'creator1',
    tags: ['NLU', '意图', '分类'],
    corpusCount: 3,
    accessRoles: ['creator', 'annotator'],
    accessUsers: ['user-002'],
    createdAt: '2024-02-10T11:00:00Z',
    updatedAt: '2024-03-22T09:15:00Z',
  },
  {
    id: 'lib-005',
    name: '多语言通用语料',
    description: '中英日韩多语言平行语料',
    type: 'public',
    ownerId: 'admin-001',
    ownerName: 'admin',
    tags: ['多语言', '翻译', '平行语料'],
    corpusCount: 2,
    accessRoles: ['creator', 'annotator', 'reviewer', 'user', 'guest'],
    accessUsers: [],
    createdAt: '2024-02-20T08:30:00Z',
    updatedAt: '2024-03-25T11:00:00Z',
  },
]

const mockCorpus: Corpus[] = [
  {
    id: 'c-001', title: '客服对话-产品咨询001', type: 'text',
    content: '客户：请问这款手机支持5G吗？\n客服：是的，这款手机支持双模5G网络。',
    metadata: { language: '中文', source: '线上客服', purpose: 'NLP训练', author: 'creator1' },
    status: 'approved', libraryId: 'lib-001', creatorId: 'user-001', creatorName: 'creator1',
    tags: ['产品咨询', '5G'], versions: [], statistics: { viewCount: 45, downloadCount: 12, annotationProgress: 100 },
    createdAt: '2024-03-10T08:00:00Z', updatedAt: '2024-03-15T10:00:00Z',
  },
  {
    id: 'c-002', title: '客服对话-售后退换002', type: 'text',
    content: '客户：我买的鞋子有质量问题想退货\n客服：好的，请您提供订单号，我帮您处理退货申请。',
    metadata: { language: '中文', source: '线上客服', purpose: '意图识别' },
    status: 'approved', libraryId: 'lib-001', creatorId: 'user-001', creatorName: 'creator1',
    tags: ['售后', '退换货'], versions: [], statistics: { viewCount: 32, downloadCount: 8, annotationProgress: 100 },
    createdAt: '2024-03-11T09:30:00Z', updatedAt: '2024-03-16T11:00:00Z',
  },
  {
    id: 'c-003', title: '客服对话-投诉建议003', type: 'text',
    content: '客户：你们配送太慢了，都三天了还没到\n客服：非常抱歉给您带来不便，我马上帮您查询物流信息。',
    metadata: { language: '中文', source: '电话录音', purpose: '情感分析' },
    status: 'pending_review', libraryId: 'lib-001', creatorId: 'user-001', creatorName: 'creator1',
    tags: ['投诉', '配送'], versions: [], statistics: { viewCount: 18, downloadCount: 0, annotationProgress: 60 },
    createdAt: '2024-03-12T14:00:00Z', updatedAt: '2024-03-17T09:00:00Z',
  },
  {
    id: 'c-004', title: '普通话朗读-新闻004', type: 'audio',
    metadata: { language: '中文', source: '广播录音', purpose: 'ASR训练' },
    status: 'approved', libraryId: 'lib-002', creatorId: 'user-001', creatorName: 'creator1',
    fileUrl: '/mock/audio-news-004.wav', tags: ['普通话', '新闻'], versions: [],
    statistics: { viewCount: 28, downloadCount: 5, annotationProgress: 100 },
    createdAt: '2024-03-10T10:00:00Z', updatedAt: '2024-03-14T16:00:00Z',
  },
  {
    id: 'c-005', title: '方言对话-粤语005', type: 'audio',
    metadata: { language: '粤语', source: '电话录音', purpose: '方言识别' },
    status: 'draft', libraryId: 'lib-002', creatorId: 'user-001', creatorName: 'creator1',
    fileUrl: '/mock/audio-cantonese-005.wav', tags: ['粤语', '方言'], versions: [],
    statistics: { viewCount: 8, downloadCount: 0, annotationProgress: 0 },
    createdAt: '2024-03-15T11:00:00Z', updatedAt: '2024-03-15T11:00:00Z',
  },
  {
    id: 'c-006', title: '环境噪声语音006', type: 'audio',
    metadata: { language: '中文', source: '实地采集', purpose: '降噪训练' },
    status: 'pending_review', libraryId: 'lib-002', creatorId: 'user-001', creatorName: 'creator1',
    fileUrl: '/mock/audio-noise-006.wav', tags: ['噪声', '环境'], versions: [],
    statistics: { viewCount: 12, downloadCount: 2, annotationProgress: 40 },
    createdAt: '2024-03-18T15:00:00Z', updatedAt: '2024-03-19T10:00:00Z',
  },
  {
    id: 'c-007', title: '商品主图-手机007', type: 'image',
    content: '白色智能手机正面照，背景为浅灰色，展示全面屏设计',
    metadata: { language: '中文', source: '电商平台', purpose: '图像描述' },
    status: 'approved', libraryId: 'lib-003', creatorId: 'admin-001', creatorName: 'admin',
    fileUrl: '/mock/img-phone-007.jpg', tags: ['手机', '商品'], versions: [],
    statistics: { viewCount: 56, downloadCount: 15, annotationProgress: 100 },
    createdAt: '2024-03-08T08:00:00Z', updatedAt: '2024-03-12T14:00:00Z',
  },
  {
    id: 'c-008', title: '商品主图-运动鞋008', type: 'image',
    content: '红色运动鞋侧面照，白色鞋底，展示透气网面设计',
    metadata: { language: '中文', source: '电商平台', purpose: '图像描述' },
    status: 'approved', libraryId: 'lib-003', creatorId: 'admin-001', creatorName: 'admin',
    fileUrl: '/mock/img-shoe-008.jpg', tags: ['运动鞋', '商品'], versions: [],
    statistics: { viewCount: 42, downloadCount: 10, annotationProgress: 100 },
    createdAt: '2024-03-09T09:00:00Z', updatedAt: '2024-03-13T16:00:00Z',
  },
  {
    id: 'c-009', title: '意图-查询订单009', type: 'text',
    content: '我想查一下我的订单到哪了',
    metadata: { language: '中文', source: 'App日志', purpose: '意图识别' },
    status: 'approved', libraryId: 'lib-004', creatorId: 'user-001', creatorName: 'creator1',
    tags: ['查询订单', '意图'], versions: [],
    statistics: { viewCount: 22, downloadCount: 6, annotationProgress: 100 },
    createdAt: '2024-03-10T10:00:00Z', updatedAt: '2024-03-14T10:00:00Z',
  },
  {
    id: 'c-010', title: '意图-修改地址010', type: 'text',
    content: '帮我把收货地址改成北京市朝阳区xxx路xxx号',
    metadata: { language: '中文', source: 'App日志', purpose: '意图识别' },
    status: 'draft', libraryId: 'lib-004', creatorId: 'user-001', creatorName: 'creator1',
    tags: ['修改地址', '意图'], versions: [],
    statistics: { viewCount: 15, downloadCount: 3, annotationProgress: 50 },
    createdAt: '2024-03-12T11:00:00Z', updatedAt: '2024-03-16T09:00:00Z',
  },
  {
    id: 'c-011', title: '意图-取消订单011', type: 'text',
    content: '我不想要了，帮我取消这个订单',
    metadata: { language: '中文', source: 'App日志', purpose: '意图识别' },
    status: 'rejected', libraryId: 'lib-004', creatorId: 'user-001', creatorName: 'creator1',
    tags: ['取消订单', '意图'], versions: [],
    statistics: { viewCount: 10, downloadCount: 1, annotationProgress: 20 },
    createdAt: '2024-03-14T13:00:00Z', updatedAt: '2024-03-18T11:00:00Z',
  },
  {
    id: 'c-012', title: '中英平行-科技新闻012', type: 'text',
    content: '【中文】人工智能技术在医疗领域的应用日益广泛\n【English】AI technology is increasingly widely used in healthcare',
    metadata: { language: '中英', source: '新闻网站', purpose: '机器翻译' },
    status: 'approved', libraryId: 'lib-005', creatorId: 'admin-001', creatorName: 'admin',
    tags: ['中英', '科技', '翻译'], versions: [],
    statistics: { viewCount: 35, downloadCount: 9, annotationProgress: 100 },
    createdAt: '2024-03-05T08:00:00Z', updatedAt: '2024-03-10T10:00:00Z',
  },
  {
    id: 'c-013', title: '中英平行-旅游指南013', type: 'text',
    content: '【中文】北京故宫是世界上最大的宫殿建筑群\n【English】The Forbidden City in Beijing is the largest palace complex in the world',
    metadata: { language: '中英', source: '旅游网站', purpose: '机器翻译' },
    status: 'draft', libraryId: 'lib-005', creatorId: 'admin-001', creatorName: 'admin',
    tags: ['中英', '旅游', '翻译'], versions: [],
    statistics: { viewCount: 5, downloadCount: 0, annotationProgress: 0 },
    createdAt: '2024-03-20T14:00:00Z', updatedAt: '2024-03-20T14:00:00Z',
  },
  {
    id: 'c-014', title: '视频字幕-产品演示014', type: 'video',
    content: '产品功能演示视频字幕文本，包含功能介绍、操作步骤、注意事项等',
    metadata: { language: '中文', source: '内部录制', purpose: '字幕生成' },
    status: 'archived', libraryId: 'lib-001', creatorId: 'user-001', creatorName: 'creator1',
    fileUrl: '/mock/video-demo-014.mp4', tags: ['视频', '字幕'], versions: [],
    statistics: { viewCount: 60, downloadCount: 20, annotationProgress: 100 },
    createdAt: '2024-02-20T10:00:00Z', updatedAt: '2024-03-10T09:00:00Z',
  },
  {
    id: 'c-015', title: '情感分析-正面评价015', type: 'text',
    content: '这个产品非常好用，性价比很高，强烈推荐给大家！',
    metadata: { language: '中文', source: '电商评论', purpose: '情感分析' },
    status: 'approved', libraryId: 'lib-001', creatorId: 'user-001', creatorName: 'creator1',
    tags: ['情感分析', '正面'], versions: [],
    statistics: { viewCount: 25, downloadCount: 7, annotationProgress: 100 },
    createdAt: '2024-03-22T16:00:00Z', updatedAt: '2024-03-24T10:00:00Z',
  },
]

// ============ Store 类型 ============

interface CorpusFilters {
  keyword: string
  type?: CorpusType
  status?: CorpusStatus
  libraryId?: string
}

interface CorpusState {
  corpusList: Corpus[]
  libraries: CorpusLibrary[]

  // 语料 CRUD
  addCorpus: (corpus: Omit<Corpus, 'id' | 'createdAt' | 'updatedAt' | 'versions' | 'statistics'>) => Corpus
  updateCorpus: (id: string, updates: Partial<Corpus>) => void
  deleteCorpus: (id: string) => void
  deleteCorpusBatch: (ids: string[]) => void
  getCorpusById: (id: string) => Corpus | undefined
  submitForReview: (id: string) => void
  submitForReviewBatch: (ids: string[]) => void

  // 语料库 CRUD
  addLibrary: (library: Omit<CorpusLibrary, 'id' | 'createdAt' | 'updatedAt' | 'corpusCount'>) => CorpusLibrary
  updateLibrary: (id: string, updates: Partial<CorpusLibrary>) => void
  deleteLibrary: (id: string) => void
  getLibraryById: (id: string) => CorpusLibrary | undefined

  // 查询
  getFilteredCorpus: (filters: CorpusFilters) => Corpus[]
  refreshLibraryCounts: () => void
}

export type { CorpusFilters }

export const useCorpusStore = create<CorpusState>()(
  persist(
    (set, get) => ({
      corpusList: mockCorpus,
      libraries: mockLibraries,

      // ---- 语料 CRUD ----
      addCorpus: (data) => {
        const now = new Date().toISOString()
        const newCorpus: Corpus = {
          ...data,
          id: uuidv4(),
          versions: [],
          statistics: { viewCount: 0, downloadCount: 0, annotationProgress: 0 },
          createdAt: now,
          updatedAt: now,
        }
        set({ corpusList: [newCorpus, ...get().corpusList] })
        get().refreshLibraryCounts()
        return newCorpus
      },

      updateCorpus: (id, updates) => {
        set({
          corpusList: get().corpusList.map(c =>
            c.id === id
              ? (() => {
                  // 检测变化字段，用于版本记录
                  const changedFields: string[] = []
                  if (updates.content !== undefined && updates.content !== c.content) changedFields.push('内容')
                  if (updates.title !== undefined && updates.title !== c.title) changedFields.push('标题')
                  if (updates.type !== undefined && updates.type !== c.type) changedFields.push('类型')
                  if (updates.tags !== undefined && JSON.stringify(updates.tags) !== JSON.stringify(c.tags || [])) changedFields.push('标签')
                  if (updates.libraryId !== undefined && updates.libraryId !== c.libraryId) changedFields.push('语料库')
                  if (updates.metadata !== undefined) changedFields.push('元数据')

                  const shouldRecordVersion = changedFields.length > 0

                  return {
                    ...c,
                    ...updates,
                    updatedAt: new Date().toISOString(),
                    ...(shouldRecordVersion
                      ? {
                          versions: [
                            ...c.versions,
                            {
                              version: c.versions.length + 1,
                              content: updates.content !== undefined ? updates.content : c.content,
                              fileUrl: updates.fileUrl !== undefined ? updates.fileUrl : c.fileUrl,
                              editorId: updates.creatorId || c.creatorId,
                              editorName: updates.creatorName || c.creatorName,
                              comment: changedFields.join('、') || '属性更新',
                              createdAt: new Date().toISOString(),
                            },
                          ],
                        }
                      : {}),
                  }
                })()
              : c
          ),
        })
      },

      deleteCorpus: (id) => {
        set({ corpusList: get().corpusList.filter(c => c.id !== id) })
        get().refreshLibraryCounts()
      },

      deleteCorpusBatch: (ids) => {
        const idSet = new Set(ids)
        set({ corpusList: get().corpusList.filter(c => !idSet.has(c.id)) })
        get().refreshLibraryCounts()
      },

      getCorpusById: (id) => get().corpusList.find(c => c.id === id),

      submitForReview: (id) => {
        set({
          corpusList: get().corpusList.map(c =>
            c.id === id
              ? { ...c, status: 'pending_review' as CorpusStatus, updatedAt: new Date().toISOString() }
              : c
          ),
        })
      },

      submitForReviewBatch: (ids: string[]) => {
        const idSet = new Set(ids)
        set({
          corpusList: get().corpusList.map(c =>
            idSet.has(c.id)
              ? { ...c, status: 'pending_review' as CorpusStatus, updatedAt: new Date().toISOString() }
              : c
          ),
        })
      },

      // ---- 语料库 CRUD ----
      addLibrary: (data) => {
        const now = new Date().toISOString()
        const newLib: CorpusLibrary = {
          ...data,
          id: uuidv4(),
          corpusCount: 0,
          createdAt: now,
          updatedAt: now,
        }
        set({ libraries: [...get().libraries, newLib] })
        return newLib
      },

      updateLibrary: (id, updates) => {
        set({
          libraries: get().libraries.map(l =>
            l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
          ),
        })
      },

      deleteLibrary: (id) => {
        set({ libraries: get().libraries.filter(l => l.id !== id) })
      },

      getLibraryById: (id) => get().libraries.find(l => l.id === id),

      // ---- 查询 ----
      getFilteredCorpus: (filters) => {
        let list = [...get().corpusList]

        if (filters.keyword) {
          const kw = filters.keyword.toLowerCase()
          list = list.filter(
            c =>
              c.title.toLowerCase().includes(kw) ||
              c.tags?.some(t => t.toLowerCase().includes(kw)) ||
              c.metadata?.language?.includes(kw)
          )
        }

        if (filters.type) {
          list = list.filter(c => c.type === filters.type)
        }

        if (filters.status) {
          list = list.filter(c => c.status === filters.status)
        }

        if (filters.libraryId) {
          list = list.filter(c => c.libraryId === filters.libraryId)
        }

        // 按更新时间倒序
        list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

        return list
      },

      refreshLibraryCounts: () => {
        const { corpusList } = get()
        set({
          libraries: get().libraries.map(lib => ({
            ...lib,
            corpusCount: corpusList.filter(c => c.libraryId === lib.id).length,
          })),
        })
      },
    }),
    {
      name: 'corpusforge-corpus',
    }
  )
)
