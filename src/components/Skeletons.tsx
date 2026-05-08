import { Skeleton, Card, Row, Col } from 'antd'

/**
 * 表格骨架屏
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div style={{ padding: 16 }}>
      <Skeleton active paragraph={{ rows: 1 }} title={false} style={{ marginBottom: 16 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 16,
            padding: '12px 0',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton.Input
              key={j}
              active
              size="small"
              style={{ width: j === 0 ? 200 : 100, flex: j === 0 ? 1 : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * 卡片统计骨架屏
 */
export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Row gutter={16}>
      {Array.from({ length: count }).map((_, i) => (
        <Col span={24 / count} key={i}>
          <Card size="small">
            <Skeleton active paragraph={{ rows: 1 }} title={{ width: '40%' }} />
          </Card>
        </Col>
      ))}
    </Row>
  )
}

/**
 * 详情页骨架屏
 */
export function DetailSkeleton() {
  return (
    <div style={{ padding: 16 }}>
      <Skeleton active paragraph={{ rows: 1 }} title={{ width: '30%' }} style={{ marginBottom: 24 }} />
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Col span={6} key={i}>
            <Card size="small">
              <Skeleton active paragraph={{ rows: 1 }} title={{ width: '50%' }} />
            </Card>
          </Col>
        ))}
      </Row>
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    </div>
  )
}

/**
 * 表单骨架屏
 */
export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div style={{ padding: 16 }}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} style={{ marginBottom: 20 }}>
          <Skeleton.Input active size="small" style={{ width: 100, marginBottom: 8 }} />
          <Skeleton.Input active style={{ width: '100%', height: 32 }} />
        </div>
      ))}
    </div>
  )
}
