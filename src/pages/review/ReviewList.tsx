import { Typography, Card, Button, Space, Tag, Badge } from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import type { ReviewStatus } from '../../types'

const { Title, Text } = Typography

const statusColor: Record<ReviewStatus, string> = {
  pending: 'orange',
  in_review: 'blue',
  approved: 'green',
  rejected: 'red',
}

const statusLabel: Record<ReviewStatus, string> = {
  pending: '待审核',
  in_review: '审核中',
  approved: '已通过',
  rejected: '已拒绝',
}

// Mock 数据
const mockReviews = [
  { id: 'r-001', corpusTitle: '客服对话语料-产品咨询', type: 'annotation' as const, status: 'pending' as ReviewStatus, submitterName: 'annotator1', submittedAt: '2024-03-20 14:30' },
  { id: 'r-002', corpusTitle: '语音识别训练集-普通话', type: 'corpus' as const, status: 'in_review' as ReviewStatus, submitterName: 'creator1', submittedAt: '2024-03-21 09:15' },
  { id: 'r-003', corpusTitle: '意图识别语料-NLU', type: 'annotation' as const, status: 'approved' as ReviewStatus, submitterName: 'annotator1', submittedAt: '2024-03-18 16:45' },
  { id: 'r-004', corpusTitle: '商品图片描述语料', type: 'corpus' as const, status: 'rejected' as ReviewStatus, submitterName: 'creator1', submittedAt: '2024-03-19 11:20' },
]

export default function ReviewList() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>审核中心</Title>
        <Space>
          <Badge count={mockReviews.filter(r => r.status === 'pending').length} size="small">
            <Button icon={<ClockCircleOutlined />}>待审核</Button>
          </Badge>
        </Space>
      </div>

      {mockReviews.map(item => (
        <Card key={item.id} size="small" style={{ marginBottom: 12 }} hoverable>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space direction="vertical" size={4} style={{ flex: 1 }}>
              <Space>
                <Text strong>{item.corpusTitle}</Text>
                <Tag color={item.type === 'corpus' ? 'blue' : 'purple'}>
                  {item.type === 'corpus' ? '语料审核' : '标注审核'}
                </Tag>
                <Badge status={statusColor[item.status] as any} text={statusLabel[item.status]} />
              </Space>
              <Text type="secondary" style={{ fontSize: 13 }}>
                提交人：{item.submitterName} · 提交时间：{item.submittedAt}
              </Text>
            </Space>
            <Space>
              <Button size="small" icon={<EyeOutlined />}>查看详情</Button>
              {item.status === 'pending' && (
                <>
                  <Button size="small" type="primary" icon={<CheckCircleOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a' }}>通过</Button>
                  <Button size="small" danger icon={<CloseCircleOutlined />}>拒绝</Button>
                </>
              )}
            </Space>
          </div>
        </Card>
      ))}
    </div>
  )
}
