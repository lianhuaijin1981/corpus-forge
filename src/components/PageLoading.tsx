import { useState, useEffect } from 'react'
import { Spin } from 'antd'

interface PageLoadingProps {
  tip?: string
  delay?: number
}

/**
 * 页面级加载组件
 * 支持 delay 延迟显示，避免闪烁
 */
export default function PageLoading({ tip = '加载中...', delay = 200 }: PageLoadingProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  if (!show) return null

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 300,
        padding: 48,
      }}
    >
      <Spin size="large" tip={tip}>
        <div style={{ minHeight: 100 }} />
      </Spin>
    </div>
  )
}
