import { Typography, Card, Button, Space, Badge, Progress, Row, Col, Statistic } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
} from '@ant-design/icons'
import type { AnnotationStatus } from '../../types'

const { Title, Text } = Typography

const statusColor: Record<AnnotationStatus, string> = {
  pending: 'default',
  in_progress: 'processing',
  submitted: 'blue',
  approved: 'success',
  rejected: 'error',
}

const statusLabel: Record<AnnotationStatus, string> = {
  pending: '待分配',
  in_progress: '进行中',
  submitted: '已提交',
  approved: '已通过',
  rejected: '已拒绝',
}

// Mock 数据
const mockTasks = [
  { id: 't-001', name: '客服对话-NER标注', corpusCount: 200, completed: 156, status: 'in_progress' as AnnotationStatus, deadline: '2024-04-01' },
  { id: 't-002', name: '商品评论-情感标注', corpusCount: 500, completed: 500, status: 'approved' as AnnotationStatus, deadline: '2024-03-25' },
  { id: 't-003', name: '意图识别-分类标注', corpusCount: 300, completed: 80, status: 'pending' as AnnotationStatus, deadline: '2024-04-10' },
]

export default function AnnotationList() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>标注任务</Title>
        <Button type="primary" icon={<PlusOutlined />}>创建任务</Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card size="small"><Statistic title="总任务数" value={mockTasks.length} prefix={<EditOutlined />} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="进行中" value={mockTasks.filter(t => t.status === 'in_progress').length} valueStyle={{ color: '#1677ff' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="已完成" value={mockTasks.filter(t => t.status === 'approved').length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="待分配" value={mockTasks.filter(t => t.status === 'pending').length} valueStyle={{ color: '#faad14' }} /></Card></Col>
      </Row>

      {/* 任务列表 */}
      {mockTasks.map(task => (
        <Card key={task.id} size="small" style={{ marginBottom: 12 }} hoverable>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space direction="vertical" size={4} style={{ flex: 1 }}>
              <Space>
                <Text strong>{task.name}</Text>
                <Badge status={statusColor[task.status] as any} text={statusLabel[task.status]} />
              </Space>
              <Text type="secondary" style={{ fontSize: 13 }}>
                进度：{task.completed}/{task.corpusCount} · 截止：{task.deadline}
              </Text>
              <Progress percent={Math.round((task.completed / task.corpusCount) * 100)} size="small" style={{ maxWidth: 300 }} />
            </Space>
            <Button size="small" icon={<EditOutlined />}>查看</Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
