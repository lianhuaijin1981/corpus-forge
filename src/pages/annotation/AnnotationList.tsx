import { useState, useMemo, useCallback } from 'react'
import {
  Typography, Card, Button, Space, Input, Select, Tag, Badge, Table, Progress,
  Tooltip, Modal, message, Popconfirm, Dropdown, Statistic, Row, Col,
} from 'antd'
import type { TablePaginationConfig, ColumnsType } from 'antd/es/table'
import {
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  FilterOutlined,
  DownOutlined,
  FlagOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { AnnotationTask } from '../../types'
import { useAnnotationStore } from '../../stores/annotationStore'
import { useAuthStore } from '../../stores/authStore'
import AnnotationForm from './AnnotationForm'
import AnnotationDetail from './AnnotationDetail'

const { Title, Text } = Typography

// ============ 常量映射 ============

const STATUS_LABEL: Record<AnnotationTask['status'], string> = {
  pending: '待开始',
  in_progress: '进行中',
  paused: '已暂停',
  completed: '已完成',
  stopped: '已停止',
}

const STATUS_COLOR: Record<AnnotationTask['status'], string> = {
  pending: 'default',
  in_progress: 'processing',
  paused: 'warning',
  completed: 'success',
  stopped: 'error',
}

const PRIORITY_LABEL: Record<AnnotationTask['priority'], string> = {
  high: '高',
  medium: '中',
  low: '低',
}

const PRIORITY_COLOR: Record<AnnotationTask['priority'], string> = {
  high: '#f5222d',
  medium: '#fa8c16',
  low: '#52c41a',
}

// ============ 筛选类型 ============

interface ListFilters {
  keyword: string
  status?: AnnotationTask['status']
  priority?: AnnotationTask['priority']
  creatorId?: string
}

const defaultFilters: ListFilters = { keyword: '' }

// ============ 组件 ============

export default function AnnotationList() {
  // ---- 状态 ----
  const [filters, setFilters] = useState<ListFilters>(defaultFilters)
  const [filterExpanded, setFilterExpanded] = useState(false)
  const [tableSize, setTableSize] = useState<'middle' | 'small' | 'large'>('middle')
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<AnnotationTask | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50'],
    showTotal: (total: number, range: [number, number]) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
    showQuickJumper: true,
  })

  const {
    tasks,
    deleteTask,
    deleteTaskBatch,
    startTask,
    pauseTask,
    getFilteredTasks,
  } = useAnnotationStore()
  const { users } = useAuthStore()

  // ---- 筛选相关 ----
  const creatorOptions = useMemo(
    () =>
      users
        .filter(u => u.roles.some(r => ['admin', 'super_admin', 'creator'].includes(r)))
        .map(u => ({ value: u.id, label: u.username })),
    [users],
  )

  const filteredData = useMemo(() => {
    return getFilteredTasks({
      keyword: filters.keyword || undefined,
      status: filters.status,
      priority: filters.priority,
      creatorId: filters.creatorId,
    })
  }, [filters, getFilteredTasks])

  const statistics = useMemo(() => {
    const total = tasks.length
    const byStatus: Record<string, number> = {}
    tasks.forEach(t => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1
    })
    return { total, byStatus }
  }, [tasks])

  const activeFilterCount = useMemo(() => {
    let c = 0
    if (filters.status) c++
    if (filters.priority) c++
    if (filters.creatorId) c++
    return c
  }, [filters])

  const hasAnyFilter = activeFilterCount > 0 || !!filters.keyword

  // ---- 回调 ----
  const updateFilter = useCallback(<K extends keyof ListFilters>(key: K, value: ListFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, current: 1 }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
    setPagination(prev => ({ ...prev, current: 1 }))
    setSelectedRowKeys([])
  }, [])

  const handleAdd = useCallback(() => { setEditingTask(null); setFormOpen(true) }, [])
  const handleEdit = useCallback((task: AnnotationTask) => {
    setEditingTask(task)
    setFormOpen(true)
  }, [])
  const handleViewDetail = useCallback((id: string) => {
    setDetailId(id)
    setDetailOpen(true)
  }, [])

  const handleDelete = useCallback((id: string) => {
    deleteTask(id)
    message.success('删除成功')
  }, [deleteTask])

  const handleBatchDelete = useCallback(() => {
    Modal.confirm({
      title: '批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个任务吗？此操作不可撤销。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        deleteTaskBatch(selectedRowKeys)
        setSelectedRowKeys([])
        message.success(`已删除 ${selectedRowKeys.length} 个任务`)
      },
    })
  }, [selectedRowKeys, deleteTaskBatch])

  const handleTableChange = useCallback((pag: TablePaginationConfig) => {
    setPagination(pag)
  }, [])

  // ---- 批量操作菜单 ----
  const batchMenuItems = [
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: `删除（${selectedRowKeys.length}）`,
      danger: true,
      onClick: handleBatchDelete,
    },
  ]

  // ---- 表格列定义 ----
  const columns: ColumnsType<AnnotationTask> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      ellipsis: { showTitle: false },
      sorter: (a: AnnotationTask, b: AnnotationTask) => a.name.localeCompare(b.name, 'zh-CN'),
      render: (text: string, record: AnnotationTask) => (
        <Tooltip title={text}>
          <a onClick={() => handleViewDetail(record.id)} style={{ fontWeight: 500 }}>{text}</a>
        </Tooltip>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      sorter: (a: AnnotationTask, b: AnnotationTask) => a.priority.localeCompare(b.priority),
      filters: (['high', 'medium', 'low'] as const).map(p => ({
        text: PRIORITY_LABEL[p],
        value: p,
      })),
      onFilter: (value: any, record: AnnotationTask) => record.priority === value,
      render: (priority: AnnotationTask['priority']) => (
        <Tag color={PRIORITY_COLOR[priority]}>{PRIORITY_LABEL[priority]}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      sorter: (a: AnnotationTask, b: AnnotationTask) => a.status.localeCompare(b.status),
      filters: (['pending', 'in_progress', 'paused', 'completed', 'stopped'] as const).map(s => ({
        text: STATUS_LABEL[s],
        value: s,
      })),
      onFilter: (value: any, record: AnnotationTask) => record.status === value,
      render: (status: AnnotationTask['status']) => (
        <Badge status={STATUS_COLOR[status] as any} text={STATUS_LABEL[status]} />
      ),
    },
    {
      title: '进度',
      key: 'progress',
      width: 160,
      sorter: (a: AnnotationTask, b: AnnotationTask) => {
        const pA = a.statistics.total > 0 ? (a.statistics.completed / a.statistics.total) : 0
        const pB = b.statistics.total > 0 ? (b.statistics.completed / b.statistics.total) : 0
        return pA - pB
      },
      render: (_: any, record: AnnotationTask) => {
        const percent = record.statistics.total > 0
          ? Math.round((record.statistics.completed / record.statistics.total) * 100)
          : 0
        return (
          <Tooltip title={`已完成 ${record.statistics.completed}/${record.statistics.total}`}>
            <Progress percent={percent} size="small" style={{ maxWidth: 140, margin: 0 }} />
          </Tooltip>
        )
      },
    },
    {
      title: '语料数',
      key: 'corpusCount',
      width: 80,
      sorter: (a: AnnotationTask, b: AnnotationTask) => a.statistics.total - b.statistics.total,
      render: (_: any, record: AnnotationTask) => (
        <Text>{record.statistics.total}</Text>
      ),
    },
    {
      title: '标注员',
      dataIndex: 'annotatorIds',
      key: 'annotatorIds',
      width: 140,
      render: (ids: string[]) => {
        if (!ids || ids.length === 0) return <Text type="secondary">未分配</Text>
        const names = ids.map(id => {
          const u = users.find(u => u.id === id)
          return u ? u.username : id
        })
        return (
          <Space size={2} wrap>
            {names.slice(0, 2).map((n, i) => <Tag key={i} color="blue">{n}</Tag>)}
            {names.length > 2 && <Tag>+{names.length - 2}</Tag>}
          </Space>
        )
      },
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 120,
      sorter: (a: AnnotationTask, b: AnnotationTask) => {
        const aT = a.deadline ? new Date(a.deadline).getTime() : 0
        const bT = b.deadline ? new Date(b.deadline).getTime() : 0
        return aT - bT
      },
      render: (date: string) =>
        date ? <Text>{dayjs(date).format('YYYY-MM-DD')}</Text> : <Text type="secondary">-</Text>,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      sorter: (a: AnnotationTask, b: AnnotationTask) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      defaultSortOrder: 'descend',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: any, record: AnnotationTask) => (
        <Space size={4}>
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record.id)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          {record.status === 'pending' && (
            <Tooltip title="启动">
              <Button
                type="text"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => { startTask(record.id); message.success('任务已启动') }}
              />
            </Tooltip>
          )}
          {record.status === 'in_progress' && (
            <Tooltip title="暂停">
              <Button
                type="text"
                size="small"
                icon={<PauseCircleOutlined />}
                onClick={() => { pauseTask(record.id); message.info('任务已暂停') }}
              />
            </Tooltip>
          )}
          {record.status === 'paused' && (
            <Tooltip title="恢复">
              <Button
                type="text"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => { startTask(record.id); message.success('任务已恢复') }}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="确认删除？"
            description={`删除任务「${record.name}」？此操作不可撤销。`}
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="删除">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // ============ 渲染 ============

  return (
    <div>
      {/* 页面标题 + 工具栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <FlagOutlined style={{ marginRight: 8 }} />
          标注任务
        </Title>
        <Space>
          {selectedRowKeys.length > 0 && (
            <Dropdown menu={{ items: batchMenuItems }} trigger={['click']}>
              <Button>
                批量操作（{selectedRowKeys.length}）<DownOutlined />
              </Button>
            </Dropdown>
          )}
          <Dropdown
            menu={{
              items: [
                { key: 'small', label: '紧凑' },
                { key: 'middle', label: '默认' },
                { key: 'large', label: '宽松' },
              ],
              onClick: ({ key }) => setTableSize(key as 'small' | 'middle' | 'large'),
            }}
            trigger={['click']}
          >
            <Button icon={<FlagOutlined />} />
          </Dropdown>
          <Button icon={<ReloadOutlined />} onClick={resetFilters}>刷新</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新建任务
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        {[
          { title: '总任务', value: statistics.total, color: undefined },
          { title: '进行中', value: statistics.byStatus['in_progress'] || 0, color: '#1677ff' },
          { title: '已完成', value: statistics.byStatus['completed'] || 0, color: '#52c41a' },
          { title: '待开始', value: statistics.byStatus['pending'] || 0, color: '#faad14' },
          { title: '已暂停', value: statistics.byStatus['paused'] || 0, color: '#fa8c16' },
          { title: '已停止', value: statistics.byStatus['stopped'] || 0, color: '#ff4d4f' },
        ].map((s, i) => (
          <Col span={4} key={i}>
            <Card
              size="small"
              hoverable
              style={{
                textAlign: 'center',
                cursor: s.title === '总任务' ? 'default' : 'pointer',
                border: filters.status === getStatusByTitle(s.title) ? '1.5px solid #1677ff' : undefined,
              }}
              onClick={() => {
                const st = getStatusByTitle(s.title)
                if (st) updateFilter('status', filters.status === st ? undefined : st)
              }}
            >
              <Statistic
                title={s.title}
                value={s.value}
                valueStyle={s.color ? { color: s.color } : undefined}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 筛选栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索任务名称 / 描述..."
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            allowClear
            value={filters.keyword}
            onChange={e => updateFilter('keyword', e.target.value || '')}
          />
          <Select
            placeholder="状态"
            style={{ width: 130 }}
            allowClear
            value={filters.status}
            onChange={v => updateFilter('status', v)}
            options={Object.entries(STATUS_LABEL).map(([v, l]) => ({ value: v, label: l }))}
          />
          <Select
            placeholder="优先级"
            style={{ width: 120 }}
            allowClear
            value={filters.priority}
            onChange={v => updateFilter('priority', v)}
            options={Object.entries(PRIORITY_LABEL).map(([v, l]) => ({ value: v, label: l }))}
          />
          <Select
            placeholder="创建人"
            style={{ width: 140 }}
            allowClear
            value={filters.creatorId}
            onChange={v => updateFilter('creatorId', v)}
            options={creatorOptions}
          />
          <Button
            type="text"
            icon={<FilterOutlined />}
            onClick={() => setFilterExpanded(!filterExpanded)}
          >
            更多筛选{activeFilterCount > 0 && <Badge count={activeFilterCount} size="small" style={{ marginLeft: 4 }} />}
          </Button>
          {hasAnyFilter && (
            <Button size="small" onClick={resetFilters}>
              <ReloadOutlined /> 重置
            </Button>
          )}
        </div>
      </Card>

      {/* 数据表格 */}
      <Card size="small">
        <Table<AnnotationTask>
          rowKey="id"
          dataSource={filteredData}
          columns={columns}
          size={tableSize}
          scroll={{ x: 1300 }}
          pagination={pagination}
          onChange={handleTableChange}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
            preserveSelectedRowKeys: true,
          }}
        />
        {filteredData.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            暂无标注任务，点击「新建任务」开始创建
          </div>
        )}
      </Card>

      {/* 新建/编辑弹窗 */}
      <AnnotationForm
        open={formOpen}
        editingTask={editingTask}
        onClose={() => { setFormOpen(false); setEditingTask(null) }}
        onSuccess={() => message.success(editingTask ? '任务已更新' : '任务创建成功')}
      />

      {/* 详情 */}
      <AnnotationDetail
        taskId={detailId}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailId(null) }}
        onEdit={(task) => { setDetailOpen(false); setEditingTask(task); setFormOpen(true) }}
        onDelete={(id) => { deleteTask(id); message.success('任务已删除') }}
      />
    </div>
  )
}

// 辅助函数：根据卡片标题获取对应的 status 筛选值
function getStatusByTitle(title: string): AnnotationTask['status'] | null {
  const map: Record<string, AnnotationTask['status']> = {
    '进行中': 'in_progress',
    '已完成': 'completed',
    '待开始': 'pending',
    '已暂停': 'paused',
    '已停止': 'stopped',
  }
  return map[title] || null
}
