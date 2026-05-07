import { useState, useMemo, useCallback } from 'react'
import {
  Typography, Card, Button, Space, Input, Select, Tag, Badge, Table,
  Tooltip, Modal, message, Popconfirm, DatePicker, Dropdown, Statistic, Row, Col,
} from 'antd'
import type { TablePaginationConfig, TableProps } from 'antd'
import {
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  SendOutlined,
  ExportOutlined,
  ReloadOutlined,
  FilterOutlined,
  DownOutlined,
  FolderOpenOutlined,
  UnorderedListOutlined,
  ColumnWidthOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import type { Corpus, CorpusType, CorpusStatus } from '../../types'
import { useCorpusStore } from '../../stores/corpusStore'
import CorpusForm from './CorpusForm'
import CorpusDetail from './CorpusDetail'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

// ============ 常量映射 ============

const typeLabel: Record<CorpusType, string> = {
  text: '文本', audio: '音频', video: '视频', image: '图片',
}
const typeColor: Record<CorpusType, string> = {
  text: 'blue', audio: 'green', video: 'purple', image: 'orange',
}
const statusLabel: Record<CorpusStatus, string> = {
  draft: '草稿', pending_review: '待审核', approved: '已通过',
  rejected: '已拒绝', archived: '已归档',
}
const statusColor: Record<CorpusStatus, string> = {
  draft: 'default', pending_review: 'orange', approved: 'green',
  rejected: 'red', archived: 'default',
}

// ============ 筛选器类型 ============

interface ListFilters {
  keyword: string
  type?: CorpusType
  status?: CorpusStatus
  libraryId?: string
  creatorId?: string
  tags?: string[]
  dateRange?: [Dayjs, Dayjs]
}

const defaultFilters: ListFilters = { keyword: '' }

export default function CorpusList() {
  // ---- 状态 ----
  const [filters, setFilters] = useState<ListFilters>(defaultFilters)
  const [filterExpanded, setFilterExpanded] = useState(false)
  const [tableSize, setTableSize] = useState<'middle' | 'small' | 'large'>('middle')
  const [formOpen, setFormOpen] = useState(false)
  const [editingCorpus, setEditingCorpus] = useState<Corpus | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
    showQuickJumper: true,
  })

  const {
    getFilteredCorpus, deleteCorpus, deleteCorpusBatch,
    submitForReview, submitForReviewBatch, updateCorpus, libraries, corpusList,
  } = useCorpusStore()

  // ---- 提取所有标签（去重）----
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    corpusList.forEach(c => c.tags?.forEach(t => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [corpusList])

  // ---- 提取所有创建人（去重）----
  const allCreators = useMemo(() => {
    const map = new Map<string, string>()
    corpusList.forEach(c => {
      if (c.creatorId && c.creatorName && !map.has(c.creatorId)) {
        map.set(c.creatorId, c.creatorName)
      }
    })
    return Array.from(map.entries()).map(([id, name]) => ({ value: id, label: name }))
  }, [corpusList])

  // ---- 将 ListFilters 转为 Store 兼容格式 ----
  const storeFilters = useMemo(() => ({
    keyword: filters.keyword,
    type: filters.type,
    status: filters.status,
    libraryId: filters.libraryId,
  }), [filters.keyword, filters.type, filters.status, filters.libraryId])

  // ---- 筛选数据 ----
  const filteredData = useMemo(() => {
    let list = getFilteredCorpus(storeFilters)

    // 创建人筛选
    if (filters.creatorId) {
      list = list.filter(c => c.creatorId === filters.creatorId)
    }

    // 标签筛选
    if (filters.tags && filters.tags.length > 0) {
      list = list.filter(c =>
        filters.tags!.every(tag => c.tags?.includes(tag))
      )
    }

    // 日期范围筛选
    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      const start = filters.dateRange[0].startOf('day').valueOf()
      const end = filters.dateRange[1].endOf('day').valueOf()
      list = list.filter(c => {
        const t = new Date(c.updatedAt).getTime()
        return t >= start && t <= end
      })
    }

    return list
  }, [storeFilters, filters.creatorId, filters.tags, filters.dateRange, getFilteredCorpus])

  // ---- 统计 ----
  const statistics = useMemo(() => {
    const total = corpusList.length
    const byStatus: Record<string, number> = {}
    const byType: Record<string, number> = {}
    corpusList.forEach(c => {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1
      byType[c.type] = (byType[c.type] || 0) + 1
    })
    return { total, byStatus, byType }
  }, [corpusList])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.type) count++
    if (filters.status) count++
    if (filters.libraryId) count++
    if (filters.creatorId) count++
    if (filters.tags && filters.tags.length > 0) count++
    if (filters.dateRange) count++
    return count
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

  const handleAdd = () => { setEditingCorpus(null); setFormOpen(true) }
  const handleEdit = (corpus: Corpus) => { setEditingCorpus(corpus); setFormOpen(true) }
  const handleViewDetail = (id: string) => { setDetailId(id); setDetailOpen(true) }

  const handleDelete = (id: string) => {
    deleteCorpus(id)
    message.success('删除成功')
  }

  const handleBatchDelete = () => {
    Modal.confirm({
      title: '批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条语料吗？此操作不可撤销。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        deleteCorpusBatch(selectedRowKeys)
        setSelectedRowKeys([])
        message.success(`已删除 ${selectedRowKeys.length} 条语料`)
      },
    })
  }

  const handleBatchSubmitReview = () => {
    const draftIds = selectedRowKeys
    Modal.confirm({
      title: '批量提交审核',
      content: `确定要将选中的 ${draftIds.length} 条语料提交审核吗？`,
      okText: '提交',
      cancelText: '取消',
      onOk: () => {
        submitForReviewBatch(draftIds)
        setSelectedRowKeys([])
        message.success(`已提交 ${draftIds.length} 条语料审核`)
      },
    })
  }

  const handleBatchChangeLibrary = (libraryId: string) => {
    const lib = libraries.find(l => l.id === libraryId)
    Modal.confirm({
      title: '批量修改语料库',
      content: `确定将选中的 ${selectedRowKeys.length} 条语料移至「${lib?.name}」？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        selectedRowKeys.forEach(id => updateCorpus(id, { libraryId }))
        setSelectedRowKeys([])
        message.success(`已将 ${selectedRowKeys.length} 条语料移至「${lib?.name}」`)
      },
    })
  }

  const handleSubmitReview = (id: string) => {
    submitForReview(id)
    message.success('已提交审核')
  }

  const handleTableChange: TableProps<Corpus>['onChange'] = (pag, _filters, sorter) => {
    setPagination(pag)
  }

  // ---- 批量操作菜单 ----
  const batchMenuItems = [
    {
      key: 'review',
      icon: <SendOutlined />,
      label: `提交审核 (${selectedRowKeys.length})`,
      onClick: handleBatchSubmitReview,
    },
    {
      key: 'library',
      icon: <FolderOpenOutlined />,
      label: '修改语料库',
      children: libraries.map(l => ({
        key: l.id,
        label: l.name,
        onClick: () => handleBatchChangeLibrary(l.id),
      })),
    },
    { type: 'divider' as const },
    {
      key: 'export',
      icon: <ExportOutlined />,
      label: `导出选中 (${selectedRowKeys.length})`,
      onClick: () => message.info('导出功能开发中...'),
    },
    { type: 'divider' as const },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: `删除 (${selectedRowKeys.length})`,
      danger: true,
      onClick: handleBatchDelete,
    },
  ]

  // ---- 表格列定义 ----
  const columns: ColumnsType<Corpus> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 260,
      ellipsis: { showTitle: false },
      sorter: (a, b) => a.title.localeCompare(b.title, 'zh-CN'),
      render: (text: string, record: Corpus) => (
        <Tooltip title={text}>
          <a onClick={() => handleViewDetail(record.id)} style={{ fontWeight: 500 }}>{text}</a>
        </Tooltip>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      sorter: (a, b) => a.type.localeCompare(b.type),
      filters: Object.entries(typeLabel).map(([v, l]) => ({ text: l, value: v })),
      onFilter: (value, record) => record.type === value,
      render: (type: CorpusType) => <Tag color={typeColor[type]}>{typeLabel[type]}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      sorter: (a, b) => a.status.localeCompare(b.status),
      filters: Object.entries(statusLabel).map(([v, l]) => ({ text: l, value: v })),
      onFilter: (value, record) => record.status === value,
      render: (status: CorpusStatus) => (
        <Badge status={statusColor[status] as any} text={statusLabel[status]} />
      ),
    },
    {
      title: '语料库',
      dataIndex: 'libraryId',
      key: 'libraryId',
      width: 160,
      ellipsis: true,
      render: (libraryId: string | undefined) => {
        if (!libraryId) return <Text type="secondary">未分配</Text>
        const lib = libraries.find(l => l.id === libraryId)
        return <Tooltip title={lib?.description}>{lib?.name || libraryId}</Tooltip>
      },
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 180,
      ellipsis: true,
      render: (tags: string[]) => tags?.length > 0
        ? <>
            {tags.slice(0, 2).map((t, i) => <Tag key={i} style={{ marginBottom: 2 }}>{t}</Tag>)}
            {tags.length > 2 && <Tooltip title={tags.slice(2).join(', ')}><Tag>+{tags.length - 2}</Tag></Tooltip>}
          </>
        : <Text type="secondary">-</Text>,
    },
    {
      title: '创建人',
      dataIndex: 'creatorName',
      key: 'creatorName',
      width: 90,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      sorter: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      defaultSortOrder: 'descend',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: any, record: Corpus) => (
        <Space size={4}>
          <Tooltip title="查看详情">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          {record.status === 'draft' && (
            <Tooltip title="提交审核">
              <Button type="text" size="small" icon={<SendOutlined />} onClick={() => handleSubmitReview(record.id)} />
            </Tooltip>
          )}
          <Popconfirm
            title="确认删除？"
            description={`删除语料「${record.title}」？此操作不可撤销。`}
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
          <UnorderedListOutlined style={{ marginRight: 8 }} />
          语料管理
        </Title>
        <Space>
          {selectedRowKeys.length > 0 && (
            <Dropdown menu={{ items: batchMenuItems }} trigger={['click']}>
              <Button>
                批量操作 ({selectedRowKeys.length}) <DownOutlined />
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
            <Button icon={<ColumnWidthOutlined />} />
          </Dropdown>
          <Button icon={<ReloadOutlined />} onClick={() => { resetFilters(); message.success('已刷新') }}>刷新</Button>
          <Button icon={<ExportOutlined />}>导出</Button>
          <Button icon={<UploadOutlined />}>批量导入</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建语料</Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card size="small" hoverable style={{ textAlign: 'center' }}>
            <Statistic title="总语料" value={statistics.total} valueStyle={{ fontSize: 22 }} />
          </Card>
        </Col>
        {(['draft', 'pending_review', 'approved', 'rejected'] as CorpusStatus[]).map(s => (
          <Col key={s} span={4}>
            <Card
              size="small"
              hoverable
              style={{
                textAlign: 'center',
                cursor: 'pointer',
                border: filters.status === s ? '1.5px solid #1677ff' : undefined,
              }}
              onClick={() => updateFilter('status', filters.status === s ? undefined : s)}
            >
              <Statistic
                title={statusLabel[s]}
                value={statistics.byStatus[s] || 0}
                valueStyle={{ fontSize: 22, color: statusColor[s] === 'red' ? '#ff4d4f' : statusColor[s] === 'green' ? '#52c41a' : statusColor[s] === 'orange' ? '#fa8c16' : undefined }}
              />
            </Card>
          </Col>
        ))}
        <Col span={4}>
          <Card size="small" hoverable style={{ textAlign: 'center' }}>
            <Statistic title="已归档" value={statistics.byStatus['archived'] || 0} valueStyle={{ fontSize: 22, color: '#8c8c8c' }} />
          </Card>
        </Col>
      </Row>

      {/* 筛选栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索标题 / 标签 / 语言..."
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            allowClear
            value={filters.keyword}
            onChange={e => updateFilter('keyword', e.target.value || '')}
          />
          <Select
            placeholder="语料类型"
            style={{ width: 120 }}
            allowClear
            value={filters.type}
            onChange={v => updateFilter('type', v)}
            options={Object.entries(typeLabel).map(([v, l]) => ({ value: v, label: l }))}
          />
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            value={filters.status}
            onChange={v => updateFilter('status', v)}
            options={Object.entries(statusLabel).map(([v, l]) => ({ value: v, label: l }))}
          />
          <Select
            placeholder="语料库"
            style={{ width: 180 }}
            allowClear
            value={filters.libraryId}
            onChange={v => updateFilter('libraryId', v)}
            options={libraries.map(l => ({ value: l.id, label: l.name }))}
          />

          {/* 展开/收起按钮 */}
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

        {/* 展开的筛选区域 */}
        {filterExpanded && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #f0f0f0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Select
              placeholder="创建人"
              style={{ width: 140 }}
              allowClear
              value={filters.creatorId}
              onChange={v => updateFilter('creatorId', v)}
              options={allCreators}
            />
            <Select
              mode="multiple"
              placeholder="标签筛选"
              style={{ minWidth: 200, maxWidth: 360 }}
              allowClear
              maxTagCount={2}
              value={filters.tags}
              onChange={v => updateFilter('tags', v.length > 0 ? v : undefined)}
              options={allTags.map(t => ({ value: t, label: t }))}
            />
            <RangePicker
              placeholder={['创建开始', '创建结束']}
              style={{ width: 240 }}
              value={filters.dateRange as [Dayjs, Dayjs] | undefined}
              onChange={dates => updateFilter('dateRange', dates as [Dayjs, Dayjs] | undefined)}
              allowClear
            />
          </div>
        )}
      </Card>

      {/* 数据表格 */}
      <Card size="small">
        <Table<Corpus>
          rowKey="id"
          dataSource={filteredData}
          columns={columns}
          size={tableSize}
          scroll={{ x: 1400 }}
          pagination={pagination}
          onChange={handleTableChange}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
            // 跨页选择时保留已选项
            preserveSelectedRowKeys: true,
          }}
          rowClassName={record => record.status === 'rejected' ? 'row-rejected' : ''}
        />
      </Card>

      {/* 新建/编辑弹窗 */}
      <CorpusForm
        open={formOpen}
        editingCorpus={editingCorpus}
        onClose={() => { setFormOpen(false); setEditingCorpus(null) }}
        onSuccess={() => message.success(editingCorpus ? '语料已更新' : '语料已创建')}
      />

      {/* 详情抽屉 */}
      <CorpusDetail
        open={detailOpen}
        corpusId={detailId}
        onClose={() => { setDetailOpen(false); setDetailId(null) }}
        onEdit={(corpus) => { setDetailOpen(false); setEditingCorpus(corpus); setFormOpen(true) }}
        onDelete={() => {}}
      />
    </div>
  )
}
