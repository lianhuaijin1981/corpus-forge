// CorpusForge 类型定义

export type UserStatus = 'active' | 'disabled' | 'pending';
export type CorpusType = 'text' | 'audio' | 'video' | 'image';
export type CorpusStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';
export type AnnotationStatus = 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
export type ReviewStatus = 'pending' | 'in_review' | 'approved' | 'rejected';
export type UserRole = 'super_admin' | 'admin' | 'creator' | 'annotator' | 'reviewer' | 'user' | 'guest';
export type LabelType = 'ner' | 'classification' | 'relation' | 'sentiment' | 'intent' | 'custom';

// 用户
export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  password?: string;
  roles: UserRole[];
  status: UserStatus;
  department?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// 角色
export interface Role {
  id: string;
  name: string;
  nameZh: string;
  description?: string;
  permissions: string[];
  level: number;
  isSystem: boolean;
  createdAt: string;
}

// 语料库
export interface CorpusLibrary {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'project';
  ownerId: string;
  ownerName?: string;
  tags: string[];
  corpusCount: number;
  accessRoles: UserRole[];
  accessUsers: string[];
  createdAt: string;
  updatedAt: string;
}

// 语料
export interface Corpus {
  id: string;
  title: string;
  type: CorpusType;
  content?: string;
  fileUrl?: string;
  metadata: {
    language: string;
    source?: string;
    purpose?: string;
    author?: string;
    createdAt?: string;
    [key: string]: any;
  };
  status: CorpusStatus;
  libraryId?: string;
  creatorId: string;
  creatorName?: string;
  annotatorIds?: string[];
  reviewerId?: string;
  labels?: Annotation[];
  versions: CorpusVersion[];
  tags: string[];
  statistics?: {
    viewCount: number;
    downloadCount: number;
    annotationProgress: number;
  };
  createdAt: string;
  updatedAt: string;
}

// 语料版本
export interface CorpusVersion {
  version: number;
  content?: string;
  fileUrl?: string;
  editorId: string;
  editorName?: string;
  comment?: string;
  createdAt: string;
}

// 标注
export interface Annotation {
  id: string;
  corpusId: string;
  taskId?: string;
  annotatorId: string;
  annotatorName?: string;
  labels: Label[];
  status: AnnotationStatus;
  comment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
}

// 标签
export interface Label {
  id: string;
  type: LabelType;
  name: string;
  nameZh: string;
  color: string;
  description?: string;
  parentId?: string;
  attributes?: LabelAttribute[];
  shortcut?: string;
}

// 标签属性
export interface LabelAttribute {
  name: string;
  type: 'text' | 'select' | 'number';
  options?: string[];
  required?: boolean;
}

// 标注任务
export interface AnnotationTask {
  id: string;
  name: string;
  description?: string;
  corpusLibraryId: string;
  corpusIds: string[];
  labelSet: Label[];
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'paused' | 'stopped';
  annotatorIds: string[];
  reviewerId?: string;
  deadline?: string;
  statistics: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    rejected: number;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 审核任务
export interface ReviewTask {
  id: string;
  corpusId: string;
  corpusTitle?: string;
  type: 'corpus' | 'annotation';
  status: ReviewStatus;
  reviewerId: string;
  reviewerName?: string;
  submitterId: string;
  submitterName?: string;
  result?: 'approved' | 'rejected';
  comment?: string;
  submittedAt: string;
  reviewedAt?: string;
}

// 导入记录
export interface ImportRecord {
  id: string;
  userId: string;
  userName?: string;
  method: 'manual' | 'upload' | 'api' | 'crawl';
  fileName?: string;
  totalCount: number;
  successCount: number;
  failCount: number;
  failReasons?: { corpus: string; reason: string }[];
  createdAt: string;
}

// 检索历史
export interface SearchHistory {
  id: string;
  userId: string;
  keyword: string;
  filters?: SearchFilters;
  resultCount: number;
  createdAt: string;
}

// 检索筛选
export interface SearchFilters {
  libraryId?: string;
  type?: CorpusType[];
  language?: string[];
  status?: CorpusStatus[];
  tags?: string[];
  dateRange?: [string, string];
  creatorId?: string;
}

// 收藏夹
export interface Favorite {
  id: string;
  userId: string;
  corpusId: string;
  corpusTitle?: string;
  folderName: string;
  createdAt: string;
}

// 统计
export interface Statistics {
  corpus: {
    total: number;
    byType: Record<CorpusType, number>;
    byStatus: Record<CorpusStatus, number>;
    byLanguage: Record<string, number>;
    growthTrend: { date: string; count: number }[];
  };
  annotation: {
    totalTasks: number;
    completedTasks: number;
    totalAnnotations: number;
    byLabel: Record<string, number>;
    averageTime: number;
  };
  users: {
    total: number;
    byRole: Record<UserRole, number>;
    activeUsers: number;
  };
}

// 日志
export interface Log {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  detail?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

// 登录日志
export interface LoginLog {
  id: string;
  userId: string;
  userName?: string;
  ip?: string;
  device?: string;
  browser?: string;
  status: 'success' | 'failed';
  failReason?: string;
  createdAt: string;
}

// 系统配置
export interface SystemConfig {
  platform: {
    name: string;
    logo?: string;
    copyright?: string;
    sessionTimeout: number;
    passwordMinLength: number;
    passwordRequireSpecial: boolean;
  };
  storage: {
    maxFileSize: number;
    allowedTypes: string[];
    storagePath: string;
  };
  notification: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
}

// 权限
export interface Permission {
  key: string;
  name: string;
  nameZh: string;
  description?: string;
  category: string;
}

// 通知
export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}
