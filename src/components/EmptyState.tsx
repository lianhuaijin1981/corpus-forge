import { Empty, Button } from 'antd'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  actionText?: string
  onAction?: () => void
}

/**
 * 通用空状态组件
 */
export default function EmptyState({
  title,
  description = '暂无数据',
  icon,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        minHeight: 200,
      }}
    >
      <Empty
        image={icon || Empty.PRESENTED_IMAGE_SIMPLE}
        description={description}
      >
        {title && (
          <p style={{ fontSize: 16, color: 'rgba(0,0,0,0.65)', marginBottom: 8 }}>{title}</p>
        )}
        {actionText && onAction && (
          <Button type="primary" onClick={onAction}>
            {actionText}
          </Button>
        )}
      </Empty>
    </div>
  )
}
