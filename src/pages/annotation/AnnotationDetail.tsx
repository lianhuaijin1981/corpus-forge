import { useMemo, useCallback } from 'react'
import {
  Typography, Card, Button, Space, Tag, Badge, Descriptions, Progress,
  Table, message, Modal, Tooltip, Statistic, Row, Col,
} from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  FlagOutlined,
  FormOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import type { AnnotationTask, Corpus } from '../../types'
import { useAnnotationStore } from '../../stores/annotationStore'
import { useCorpusStore } from '../../stores/corpusStore'
import { useAuthStore } from '../../stores/authStore'

const { Title, Text } = Typography

const STATUS_COLOR: Record<AnnotationTask['status'], string> = {
  pending: 'default',
  in_progress: 'processing',
  paused: 'warning',
  completed: 'success',
  stopped: 'error',
}

const STATUS_LABEL: Record<AnnotationTask['status'], string> = {
  pending: '待开始',
  in_progress: '进行中',
  paused: '已暂停',
  completed: '已完成',
  stopped: '已停止',
}

const PRIORITY_COLOR: Record<AnnotationTask['priority'], string> = {
  high: '#f5222d',
  medium: '#fa8c16',
  low: '#52c41a',
}

const PRIORITY_LABEL: Record<AnnotationTask['priority'], string> = {
  high: '高',
  medium: '中',
  low: '低',
}

interface AnnotationDetailProps {
  taskId: string | null
  open: boolean
  onClose: () => void
  onEdit: (task: AnnotationTask) => void
  onDelete: (id: string) => void
}

export default function AnnotationDetail({
  taskId,
  open,
  onClose,
  onEdit,
  onDelete,
}: AnnotationDetailProps) {
  const navigate = useNavigate()
  const { tasks, startTask, pauseTask, stopTask, completeTask } = useAnnotationStore()
  const { corpusList, getLibraryById } = useCorpusStore()
  const { users } = useAuthStore()

  const task = useMemo(() => tasks.find(t => t.id === taskId) || null, [tasks, taskId])

  const taskCorpus = useMemo(() => {
    if (!task) return [] as Corpus[]
    return corpusList.filter(c => task.corpusIds.includes(c.id))
  }, [task, corpusList])

  const getUserName = useCallback((id?: string) => {
    if (!id) return '-'
    const u = users.find(u => u.id === id)
    return u ? u.username : id
  }, [users])

  const handleStart = () => {
    if (!task) return
    startTask(task.id)
    message.success('任务已启动')
  }

  const handlePause = () => {
    if (!task) return
    pauseTask(task.id)
    message.info('任务已暂停')
  }

  const handleStop = () => {
    if (!task) return
    Modal.confirm({
      title: '停止任务',
      content: '确定要停止此任务吗？停止后标注员将无法继续标注。',
      okText: '确认停止',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        stopTask(task.id)
        message.warning('任务已停止')
      },
    })
  }

  const handleComplete = () => {
    if (!task) return
    completeTask(task.id)
    message.success('任务已标记为完成')
  }

  const handleDelete = () => {
    if (!task) return
    Modal.confirm({
      title: '删除任务',
      content: `确定要删除任务「${task.name}」吗？此操作不可撤销。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        onDelete(task.id)
        onClose()
      },
    })
  }

  const corpusColumns: ColumnsType<Corpus> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 240,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => {
        const map: Record<string, { label: string; color: string }> = {
          text: { label: '文本', color: 'blue' },
          audio: { label: '音频', color: 'green' },
          video: { label: '视频', color: 'purple' },
          image: { label: '图片', color: 'orange' },
        }
        const m = map[type] || { label: type, color: 'default' }
        return <Tag color={m.color}>{m.label}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const map: Record<string, { label: string; status: string }> = {
          draft: { label: '草稿', status: 'default' },
          pending_review: { label: '待审核', status: 'warning' },
          approved: { label: '已通过', status: 'success' },
          rejected: { label: '已拒绝', status: 'error' },
          archived: { label: '已归档', status: 'default' },
        }
        const m = map[status] || { label: status, status: 'default' }
        return <Badge status={m.status as any} text={m.label} />
      },
    },
    {
      title: '标注进度',
      key: 'progress',
      width: 150,
      render: (_: any, record: Corpus) => {
        const progress = record.statistics?.annotationProgress || 0
        return <Progress percent={progress} size="small" />
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ]

  if (!open || !task) return null

  const lib = getLibraryById(task.corpusLibraryId)

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* 顶部操作栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={onClose}>返回列表</Button>
          <Title level={4} style={{ margin: 0 }}>{task.name}</Title>
          <Badge status={STATUS_COLOR[task.status] as any} text={STATUS_LABEL[task.status]} />
        </Space>
        <Space>
          {task.status === 'in_progress' && (
            <Button
              type="primary"
              icon={<FormOutlined />}
              onClick={() => navigate(`/annotation/${task.id}/workspace`)}
            >
              开始标注
            </Button>
          )}
          {task.status === 'pending' && (
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleStart}>
              启动任务
            </Button>
          )}
          {task.status === 'in_progress' && (
            <Button icon={<PauseCircleOutlined />} onClick={handlePause}>暂停</Button>
          )}
          {task.status === 'paused' && (
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleStart}>恢复</Button>
          )}
          {(task.status === 'in_progress' || task.status === 'paused') && (
            <Button danger icon={<StopOutlined />} onClick={handleStop}>停止</Button>
          )}
          {task.status !== 'completed' && task.status !== 'stopped' && (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleComplete}>标记完成</Button>
          )}
          <Button icon={<EditOutlined />} onClick={() => onEdit(task)}>编辑</Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>删除</Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        {[
          { title: '总语料', value: task.statistics.total, color: undefined },
          { title: '已完成', value: task.statistics.completed, color: '#52c41a' },
          { title: '进行中', value: task.statistics.inProgress, color: '#1677ff' },
          { title: '待处理', value: task.statistics.pending, color: '#faad14' },
          { title: '已拒绝', value: task.statistics.rejected, color: '#ff4d4f' },
          {
            title: '总体进度',
            value: task.statistics.total > 0
              ? Math.round((task.statistics.completed / task.statistics.total) * 100)
              : 0,
            suffix: '%',
            color: task.statistics.completed === task.statistics.total ? '#52c41a' : '#1677ff',
          },
        ].map((s, i) => (
          <Col span={4} key={i}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title={s.title}
                value={s.value}
                suffix={s.suffix || ''}
                valueStyle={s.color ? { color: s.color } : undefined}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 任务信息 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label={<><FileTextOutlined /> 任务描述</>}>
            {task.description || <Text type="secondary">无</Text>}
          </Descriptions.Item>
          <Descriptions.Item label={<><FlagOutlined /> 优先级</>}>
            <Tag color={PRIORITY_COLOR[task.priority]}>{PRIORITY_LABEL[task.priority]}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={<><FileTextOutlined /> 关联语料库</>}>
            {lib ? (
              <a onClick={() => message.info(`跳转语料库：${lib.name}（演示模式）`)}>{lib.name}</a>
            ) : (
              <Text type="secondary">未关联</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label={<><ClockCircleOutlined /> 截止日期</>}>
            {task.deadline ? dayjs(task.deadline).format('YYYY-MM-DD') : <Text type="secondary">未设置</Text>}
          </Descriptions.Item>
          <Descriptions.Item label={<><UserOutlined /> 标注员</>}>
            <Space size={4}>
              {task.annotatorIds?.map(id => (
                <Tag key={id} color="blue">{getUserName(id)}</Tag>
              )) || <Text type="secondary">未分配</Text>}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label={<><UserOutlined /> 审核员</>}>
            {task.reviewerId ? (
              <Tag color="green">{getUserName(task.reviewerId)}</Tag>
            ) : (
              <Text type="secondary">未分配</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="创建人">
            {getUserName(task.createdBy)}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(task.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 标注标签集 */}
      {task.labelSet && task.labelSet.length > 0 && (
        <Card size="small" title="标注标签集" style={{ marginBottom: 16 }}>
          <Space wrap>
            {task.labelSet.map(l => (
              <Tooltip key={l.id} title={`${l.name}（${l.type}）`}>
                <Tag color={l.color}>{l.nameZh || l.name}</Tag>
              </Tooltip>
            ))}
          </Space>
        </Card>
      )}

      {/* 关联语料表格 */}
      <Card
        size="small"
        title={`关联语料（${taskCorpus.length} 条）`}
        extra={
          <Button type="link" disabled>
            从语料库添加（开发中）
          </Button>
        }
      >
        <Table<Corpus>
          rowKey="id"
          dataSource={taskCorpus}
          columns={corpusColumns}
          size="small"
          pagination={false}
          scroll={{ x: 900 }}
        />
        {taskCorpus.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            暂无关联语料，请在编辑任务时从语料库中添加
          </div>
        )}
      </Card>
    </div>
  )
}
