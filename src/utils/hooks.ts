import { useState, useCallback } from 'react'
import { message } from 'antd'

/**
 * 操作确认 Hook
 * 封装常见的 CRUD 操作：loading 状态、成功/失败提示
 */
export function useAsyncAction<T = void>() {
  const [loading, setLoading] = useState(false)

  const execute = useCallback(async (
    action: () => Promise<T>,
    options?: {
      successMessage?: string
      errorMessage?: string
      onSuccess?: (result: T) => void
      onError?: (error: Error) => void
    }
  ): Promise<T | undefined> => {
    setLoading(true)
    try {
      const result = await action()
      if (options?.successMessage) {
        message.success(options.successMessage)
      }
      options?.onSuccess?.(result)
      return result
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '操作失败'
      if (options?.errorMessage) {
        message.error(options.errorMessage)
      } else {
        message.error(errMsg)
      }
      options?.onError?.(error as Error)
      return undefined
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, execute }
}

/**
 * 本地存储 Hook
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue] as const
}

/**
 * 分页 Hook
 */
export function usePagination(defaultPageSize = 10) {
  const [current, setCurrent] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [total, setTotal] = useState(0)

  const onChange = useCallback((page: number, size: number) => {
    setCurrent(page)
    setPageSize(size)
  }, [])

  const reset = useCallback(() => {
    setCurrent(1)
  }, [])

  return {
    current,
    pageSize,
    total,
    setTotal,
    onChange,
    reset,
    paginationConfig: {
      current,
      pageSize,
      total,
      onChange,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (t: number) => `共 ${t} 条`,
    },
  }
}
