import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type {
  AnnotationTask,
  Label,
} from '../types'

// ============ Mock 标注任务数据 ============

const mockLabels: Label[] = [
  { id: 'lb-ner-per', type: 'ner', name: 'person', nameZh: '人名', color: '#f5222d' },
  { id: 'lb-ner-org', type: 'ner', name: 'organization', nameZh: '机构名', color: '#1677ff' },
  { id: 'lb-ner-loc', type: 'ner', name: 'location', nameZh: '地名', color: '#52c41a' },
  { id: 'lb-sent-pos', type: 'sentiment', name: 'positive', nameZh: '正面', color: '#fa8c16' },
  { id: 'lb-sent-neg', type: 'sentiment', name: 'negative', nameZh: '负面', color: '#722ed1' },
  { id: 'lb-intent-buy', type: 'intent', name: 'buy', nameZh: '购买意图', color: '#13c2c2' },
  { id: 'lb-intent-query', type: 'intent', name: 'query_order', nameZh: '查询订单', color: '#eb2f96' },
  { id: 'lb-cls-rel', type: 'classification', name: 'relevant', nameZh: '相关', color: '#a0d911' },
]

const mockTasks: AnnotationTask[] = [
  {
    id: 'task-001',
    name: '客服对话-NER标注',
    description: '对客服对话语料进行人名、机构名、地名实体标注',
    corpusLibraryId: 'lib-001',
    corpusIds: ['c-001', 'c-002', 'c-003'],
    labelSet: [mockLabels[0], mockLabels[1], mockLabels[2]],
    priority: 'high',
    status: 'in_progress',
    annotatorIds: ['user-002'],
    reviewerId: 'user-003',
    deadline: '2024-04-01T00:00:00Z',
    statistics: { total: 3, completed: 2, inProgress: 1, pending: 0, rejected: 0 },
    createdBy: 'admin-001',
    createdAt: '2024-03-01T08:00:00Z',
    updatedAt: '2024-03-20T10:00:00Z',
  },
  {
    id: 'task-002',
    name: '商品评论-情感标注',
    description: '对电商商品评论进行正面/负面情感标注',
    corpusLibraryId: 'lib-003',
    corpusIds: ['c-007', 'c-008', 'c-015'],
    labelSet: [mockLabels[3], mockLabels[4]],
    priority: 'medium',
    status: 'completed',
    annotatorIds: ['user-002'],
    reviewerId: 'user-003',
    deadline: '2024-03-25T00:00:00Z',
    statistics: { total: 3, completed: 3, inProgress: 0, pending: 0, rejected: 0 },
    createdBy: 'admin-001',
    createdAt: '2024-03-05T09:00:00Z',
    updatedAt: '2024-03-24T16:00:00Z',
  },
  {
    id: 'task-003',
    name: '意图识别-分类标注',
    description: '对用户意图进行分类标注：购买、查询、取消等',
    corpusLibraryId: 'lib-004',
    corpusIds: ['c-009', 'c-010', 'c-011'],
    labelSet: [mockLabels[5], mockLabels[6], mockLabels[7]],
    priority: 'high',
    status: 'pending',
    annotatorIds: ['user-002'],
    reviewerId: 'user-003',
    deadline: '2024-04-10T00:00:00Z',
    statistics: { total: 3, completed: 0, inProgress: 0, pending: 3, rejected: 0 },
    createdBy: 'admin-001',
    createdAt: '2024-03-10T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
  },
  {
    id: 'task-004',
    name: '语音-ASR转写标注',
    description: '对普通话音频语料进行语音转写标注',
    corpusLibraryId: 'lib-002',
    corpusIds: ['c-004', 'c-005', 'c-006'],
    labelSet: [],
    priority: 'medium',
    status: 'paused',
    annotatorIds: ['user-002'],
    reviewerId: 'user-003',
    deadline: '2024-04-15T00:00:00Z',
    statistics: { total: 3, completed: 1, inProgress: 0, pending: 2, rejected: 0 },
    createdBy: 'user-001',
    createdAt: '2024-03-08T08:00:00Z',
    updatedAt: '2024-03-18T14:00:00Z',
  },
  {
    id: 'task-005',
    name: '多语言-平行语料对齐',
    description: '对中英平行语料进行句子级对齐标注',
    corpusLibraryId: 'lib-005',
    corpusIds: ['c-012', 'c-013'],
    labelSet: [mockLabels[7]],
    priority: 'low',
    status: 'in_progress',
    annotatorIds: ['user-002'],
    deadline: '2024-04-20T00:00:00Z',
    statistics: { total: 2, completed: 0, inProgress: 1, pending: 1, rejected: 0 },
    createdBy: 'admin-001',
    createdAt: '2024-03-15T11:00:00Z',
    updatedAt: '2024-03-22T09:00:00Z',
  },
]

// ============ Store 类型 ============

interface AnnotationState {
  tasks: AnnotationTask[]
  // CRUD
  addTask: (data: Omit<AnnotationTask, 'id' | 'createdAt' | 'updatedAt' | 'statistics'>) => AnnotationTask
  updateTask: (id: string, updates: Partial<AnnotationTask>) => void
  deleteTask: (id: string) => void
  deleteTaskBatch: (ids: string[]) => void
  getTaskById: (id: string) => AnnotationTask | undefined
  // 任务状态操作
  startTask: (id: string) => void
  pauseTask: (id: string) => void
  stopTask: (id: string) => void
  completeTask: (id: string) => void
  // 查询
  getFilteredTasks: (filters: {
    keyword?: string
    status?: AnnotationTask['status']
    priority?: AnnotationTask['priority']
    creatorId?: string
  }) => AnnotationTask[]
  // 根据语料ID获取所属任务
  getTasksByCorpusId: (corpusId: string) => AnnotationTask[]
}

// ============ Store 实现 ============

export const useAnnotationStore = create<AnnotationState>()(
  persist(
    (set, get) => ({
      tasks: mockTasks,

      addTask: (data) => {
        const now = new Date().toISOString()
        const newTask: AnnotationTask = {
          ...data,
          id: uuidv4(),
          statistics: {
            total: data.corpusIds.length,
            completed: 0,
            inProgress: 0,
            pending: data.corpusIds.length,
            rejected: 0,
          },
          createdAt: now,
          updatedAt: now,
        }
        set({ tasks: [newTask, ...get().tasks] })
        return newTask
      },

      updateTask: (id, updates) => {
        set({
          tasks: get().tasks.map(t =>
            t.id === id
              ? { ...t, ...updates, updatedAt: new Date().toISOString() }
              : t
          ),
        })
      },

      deleteTask: (id) => {
        set({ tasks: get().tasks.filter(t => t.id !== id) })
      },

      deleteTaskBatch: (ids) => {
        const idSet = new Set(ids)
        set({ tasks: get().tasks.filter(t => !idSet.has(t.id)) })
      },

      getTaskById: (id) => get().tasks.find(t => t.id === id),

      startTask: (id) => {
        set({
          tasks: get().tasks.map(t =>
            t.id === id
              ? { ...t, status: 'in_progress' as AnnotationTask['status'], updatedAt: new Date().toISOString() }
              : t
          ),
        })
      },

      pauseTask: (id) => {
        set({
          tasks: get().tasks.map(t =>
            t.id === id
              ? { ...t, status: 'paused' as AnnotationTask['status'], updatedAt: new Date().toISOString() }
              : t
          ),
        })
      },

      stopTask: (id) => {
        set({
          tasks: get().tasks.map(t =>
            t.id === id
              ? { ...t, status: 'stopped' as AnnotationTask['status'], updatedAt: new Date().toISOString() }
              : t
          ),
        })
      },

      completeTask: (id) => {
        set({
          tasks: get().tasks.map(t =>
            t.id === id
              ? { ...t, status: 'completed' as AnnotationTask['status'], updatedAt: new Date().toISOString() }
              : t
          ),
        })
      },

      getFilteredTasks: (filters) => {
        let list = [...get().tasks]

        if (filters.keyword) {
          const kw = filters.keyword.toLowerCase()
          list = list.filter(
            t => t.name.toLowerCase().includes(kw) || t.description?.toLowerCase().includes(kw)
          )
        }

        if (filters.status) {
          list = list.filter(t => t.status === filters.status)
        }

        if (filters.priority) {
          list = list.filter(t => t.priority === filters.priority)
        }

        if (filters.creatorId) {
          list = list.filter(t => t.createdBy === filters.creatorId)
        }

        list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        return list
      },

      getTasksByCorpusId: (corpusId) => {
        return get().tasks.filter(t => t.corpusIds.includes(corpusId))
      },
    }),
    {
      name: 'corpusforge-annotation',
    }
  )
)
