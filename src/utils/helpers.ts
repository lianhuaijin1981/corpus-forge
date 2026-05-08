import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

/**
 * 格式化日期时间
 */
export function formatDateTime(date: string | Date, format = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!date) return '-'
  return dayjs(date).format(format)
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(date: string | Date): string {
  if (!date) return '-'
  return dayjs(date).fromNow()
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 截断文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || ''
  return text.slice(0, maxLength) + '...'
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastTime = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastTime >= interval) {
      lastTime = now
      fn(...args)
    }
  }
}

/**
 * 生成唯一 ID
 */
export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 8)
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`
}

/**
 * 深拷贝
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * 下载文件
 */
export function downloadFile(content: string, filename: string, type = 'text/plain'): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 下载二进制文件
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 获取状态颜色
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    draft: 'default',
    pending_review: 'processing',
    pending: 'processing',
    approved: 'success',
    in_progress: 'processing',
    submitted: 'warning',
    rejected: 'error',
    archived: 'default',
    in_review: 'processing',
    completed: 'success',
    stopped: 'default',
    active: 'success',
    disabled: 'error',
  }
  return colorMap[status] || 'default'
}

/**
 * 获取状态显示文本
 */
export function getStatusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    draft: '草稿',
    pending_review: '待审核',
    pending: '待处理',
    approved: '已通过',
    in_progress: '进行中',
    submitted: '已提交',
    rejected: '已驳回',
    archived: '已归档',
    in_review: '审核中',
    completed: '已完成',
    stopped: '已停止',
    active: '启用',
    disabled: '禁用',
  }
  return labelMap[status] || status
}

/**
 * 获取优先级颜色
 */
export function getPriorityColor(priority: string): string {
  const colorMap: Record<string, string> = {
    urgent: '#f5222d',
    high: '#fa8c16',
    medium: '#1890ff',
    low: '#52c41a',
  }
  return colorMap[priority] || '#1890ff'
}

/**
 * 获取优先级显示文本
 */
export function getPriorityLabel(priority: string): string {
  const labelMap: Record<string, string> = {
    urgent: '紧急',
    high: '高',
    medium: '中',
    low: '低',
  }
  return labelMap[priority] || priority
}

/**
 * 安全的 JSON 解析
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

/**
 * classnames 合并
 */
export function cx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
