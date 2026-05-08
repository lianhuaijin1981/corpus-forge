import { useState, useMemo, useCallback } from 'react'
import {
  Typography, Card, Button, Space, Input, Select, Tag, Badge, Table,
  Tooltip, Modal, message, Form, Row, Col, Statistic, Descriptions,
} from 'antd'
import type { TablePaginationConfig, ColumnsType } from 'antd/es/table'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  AuditOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ReviewTask, ReviewStatus } from '../../types'
import { useReviewStore } from '../../stores/reviewStore'
import { useAuthStore } from '../../stores/authStore'

const { Title, Text, TextArea: _TextArea } = Typography
const { TextArea } = Form.Item as any

// ============ 常量映射 ============

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: '待审核',
  in_review: '审核中',
  approved: '已通过',
  rejected: '已拒绝',
}

const STATUS_COLOR: Record<ReviewStatus, string> = {
  pending: 'orange',
  in_review: 'blue',
  approved: 'green',
  rejected: 'red',
}

const TYPE_LABEL: Record<'corpus' | 'annotation', string> = {
  corpus: '语料审核',
  annotation: '标注审核',
}

const TYPE_COLOR: Record<'corpus' | 'annotation', string> = {
  corpus: 'blue',
  annotation: 'purple',
}

// ============ 组件 ============

export default function ReviewList() {
  const [keyword, setKeyword] = useState('')
  const [filterType, setFilterType] = useState<'corpus' | 'annotation' | undefined>()
  const [filterStatus, setFilterStatus] = useState<ReviewStatus | undefined>()
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
  })

  // 审核弹窗状态
  const [reviewModal, setReviewModal] = useState<{
    open: boolean
    mode: 'approve' | 'reject'
    task: ReviewTask | null
  }>({ open: false, mode: 'approve', task: null })

  // 详情弹窗状态
  const [detailModal, setDetailModal] = useState<{ open: boolean; task: ReviewTask | null }>({
    open: false,
    task: null,
  })

  const [reviewComment, setReviewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { reviews, getFilteredReviews, approveReview, rejectReview, startReview, getPendingCount } =
    useReviewStore()
  const { currentUser } = useAuthStore()

  // ---- 统计 ----
  const statistics = useMemo(() => {
    const byStatus: Record<string, number> = {}
    reviews.forEach(r => {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1
    })
    return { total: reviews.length, byStatus }
  }, [reviews])

  // ---- 过滤数据 ----
  const filteredData = useMemo(() => {
    return getFilteredReviews({
      keyword: keyword || undefined,
      type: filterType,
      status: filterStatus,
    })
  }, [keyword, filterType, filterStatus, getFilteredReviews])

  const hasFilter = !!(keyword || filterType || filterStatus)

  const resetFilters = useCallback(() => {
    setKeyword('')
    setFilterType(undefined)
    setFilterStatus(undefined)
    setPagination(prev => ({ ...prev, current: 1 }))
  }, [])

  // ---- 操作处理 ----
  const handleStartReview = useCallback(
    (task: ReviewTask) => {
      startReview(task.id, currentUser?.id || '', currentUser?.username || '')
      message.success('已开始审核')
    },
    [currentUser, startReview],
  )

  const openApprove = useCallback((task: ReviewTask) => {
    setReviewComment('')
    setReviewModal({ open: true, mode: 'approve', task })
  }, [])

  const openReject = useCallback((task: ReviewTask) => {
    setReviewComment('')
    setReviewModal({ open: true, mode: 'reject', task })
  }, [])

  const handleReviewSubmit = async () => {
    const { mode, task } = reviewModal
    if (!task) return

    if (mode === 'reject' && !reviewComment.trim()) {
      message.warning('拒绝时必须填写审核意见')
      return
    }

    setSubmitting(true)
    await new Promise(r => setTimeout(r, 400)) // 模拟请求

    if (mode === 'approve') {
      approveReview(task.id, currentUser?.id || '', currentUser?.username || '', reviewComment)
      message.success('审核通过')
    } else {
      rejectReview(task.id, currentUser?.id || '', currentUser?.username || '', reviewComment)
      message.error('已拒绝')
    }

    setSubmitting(false)
    setReviewModal({ open: false, mode: 'approve', task: null })
  }

  const openDetail = useCallback((task: ReviewTask) => {
    setDetailModal({ open: true, task })
  }, [])

  // ---- 表格列 ----
  const columns: ColumnsType<ReviewTask> = [
    {
      title: '语料标题',
      dataIndex: 'corpusTitle',
      key: 'corpusTitle',
      width: 220,
      ellipsis: { showTitle: false },
      render: (text: string, record: ReviewTask) => (
        <Tooltip title={text}>
          <a onClick={() => openDetail(record)} style={{ fontWeight: 500 }}>
            {text || record.corpusId}
          </a>
        </Tooltip>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type: 'corpus' | 'annotation') => (
        <Tag color={TYPE_COLOR[type]}>{TYPE_LABEL[type]}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ReviewStatus) => (
        <Badge status={STATUS_COLOR[status] as any} text={STATUS_LABEL[status]} />
      ),
    },
    {
      title: '提交人',
      dataIndex: 'submitterName',
      key: 'submitterName',
      width: 100,
    },
    {
      title: '审核人',
      dataIndex: 'reviewerName',
      key: 'reviewerName',
      width: 100,
      render: (name?: string) => name || <Text type="secondary">-</Text>,
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 160,
      sorter: (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
      defaultSortOrder: 'descend',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '审核时间',
      dataIndex: 'reviewedAt',
      key: 'reviewedAt',
      width: 160,
      render: (date?: string) =>
        date ? dayjs(date).format('YYYY-MM-DD HH:mm') : <Text type="secondary">-</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: any, record: ReviewTask) => (
        <Space size={4}>
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openDetail(record)}
            />
          </Tooltip>
          {record.status === 'pending' && (
            <Tooltip title="开始审核">
              <Button
                type="text"
                size="small"
                icon={<ClockCircleOutlined />}
                onClick={() => handleStartReview(record)}
              />
            </Tooltip>
          )}
          {(record.status === 'pending' || record.status === 'in_review') && (
            <>
              <Tooltip title="通过">
                <Button
                  type="text"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  style={{ color: '#52c41a' }}
                  onClick={() => openApprove(record)}
                />
              </Tooltip>
              <Tooltip title="拒绝">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => openReject(record)}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <AuditOutlined style={{ marginRight: 8 }} />
          审核中心
        </Title>
        <Badge count={getPendingCount()} size="small" offset={[-2, 2]}>
          <Button icon={<ClockCircleOutlined />}>待审核 {getPendingCount()} 项</Button>
        </Badge>
      </div>

      {/* 统计卡片 */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        {[
          { title: '全部', value: statistics.total, status: undefined },
          { title: '待审核', value: statistics.byStatus['pending'] || 0, status: 'pending' as ReviewStatus },
          { title: '审核中', value: statistics.byStatus['in_review'] || 0, status: 'in_review' as ReviewStatus },
          { title: '已通过', value: statistics.byStatus['approved'] || 0, status: 'approved' as ReviewStatus },
          { title: '已拒绝', value: statistics.byStatus['rejected'] || 0, status: 'rejected' as ReviewStatus },
        ].map((s) => (
          <Col span={4} key={s.title}>
            <Card
              size="small"
              hoverable
              style={{
                textAlign: 'center',
                cursor: 'pointer',
                border: filterStatus === s.status && s.status ? '1.5px solid #1677ff' : undefined,
              }}
              onClick={() => {
                setFilterStatus(s.status)
                setPagination(prev => ({ ...prev, current: 1 }))
              }}
            >
              <Statistic
                title={s.title}
                value={s.value}
                valueStyle={{
                  fontSize: 22,
                  color:
                    s.status === 'pending' ? '#fa8c16'
                    : s.status === 'in_review' ? '#1677ff'
                    : s.status === 'approved' ? '#52c41a'
                    : s.status === 'rejected' ? '#ff4d4f'
                    : undefined,
                }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 筛选栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索语料标题 / 提交人..."
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            allowClear
            value={keyword}
            onChange={e => { setKeyword(e.target.value); setPagination(prev => ({ ...prev, current: 1 })) }}
          />
          <Select
            placeholder="审核类型"
            style={{ width: 130 }}
            allowClear
            value={filterType}
            onChange={v => { setFilterType(v); setPagination(prev => ({ ...prev, current: 1 })) }}
            options={[
              { value: 'corpus', label: '语料审核' },
              { value: 'annotation', label: '标注审核' },
            ]}
          />
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            value={filterStatus}
            onChange={v => { setFilterStatus(v); setPagination(prev => ({ ...prev, current: 1 })) }}
            options={Object.entries(STATUS_LABEL).map(([v, l]) => ({ value: v, label: l }))}
          />
          {hasFilter && (
            <Button size="small" icon={<ReloadOutlined />} onClick={resetFilters}>
              重置
            </Button>
          )}
        </div>
      </Card>

      {/* 数据表格 */}
      <Card size="small">
        <Table<ReviewTask>
          rowKey="id"
          dataSource={filteredData}
          columns={columns}
          size="middle"
          scroll={{ x: 1200 }}
          pagination={pagination}
          onChange={pag => setPagination(pag)}
          rowClassName={record =>
            record.status === 'rejected'
              ? 'row-rejected'
              : record.status === 'approved'
              ? 'row-approved'
              : ''
          }
        />
      </Card>

      {/* 审核弹窗（通过/拒绝） */}
      <Modal
        title={reviewModal.mode === 'approve' ? '确认通过审核' : '拒绝审核'}
        open={reviewModal.open}
        onOk={handleReviewSubmit}
        onCancel={() => setReviewModal({ open: false, mode: 'approve', task: null })}
        okText={reviewModal.mode === 'approve' ? '确认通过' : '确认拒绝'}
        okButtonProps={{
          style:
            reviewModal.mode === 'approve'
              ? { background: '#52c41a', borderColor: '#52c41a' }
              : { background: '#ff4d4f', borderColor: '#ff4d4f' },
          loading: submitting,
        }}
        cancelText="取消"
        width={480}
      >
        {reviewModal.task && (
          <div>
            <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fafafa', borderRadius: 6 }}>
              <Text strong>{reviewModal.task.corpusTitle}</Text>
              <span style={{ marginLeft: 8 }}>
                <Tag color={TYPE_COLOR[reviewModal.task.type]}>{TYPE_LABEL[reviewModal.task.type]}</Tag>
              </span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text>审核意见{reviewModal.mode === 'reject' ? '（拒绝时必填）' : '（选填）'}：</Text>
            </div>
            <textarea
              style={{
                width: '100%',
                minHeight: 80,
                padding: '8px 12px',
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                fontSize: 14,
                outline: 'none',
                resize: 'vertical',
              }}
              placeholder={reviewModal.mode === 'reject' ? '请填写拒绝原因，方便提交人修改...' : '可填写通过意见或建议...'}
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
            />
          </div>
        )}
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="审核详情"
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, task: null })}
        footer={[
          detailModal.task && (detailModal.task.status === 'pending' || detailModal.task.status === 'in_review') && (
            <Button
              key="approve"
              type="primary"
              icon={<CheckCircleOutlined />}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
              onClick={() => {
                setDetailModal({ open: false, task: null })
                if (detailModal.task) openApprove(detailModal.task)
              }}
            >
              通过
            </Button>
          ),
          detailModal.task && (detailModal.task.status === 'pending' || detailModal.task.status === 'in_review') && (
            <Button
              key="reject"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => {
                setDetailModal({ open: false, task: null })
                if (detailModal.task) openReject(detailModal.task)
              }}
            >
              拒绝
            </Button>
          ),
          <Button key="close" onClick={() => setDetailModal({ open: false, task: null })}>
            关闭
          </Button>,
        ]}
        width={560}
      >
        {detailModal.task && (
          <Descriptions column={2} bordered size="small" style={{ marginTop: 8 }}>
            <Descriptions.Item label="语料标题" span={2}>
              {detailModal.task.corpusTitle || detailModal.task.corpusId}
            </Descriptions.Item>
            <Descriptions.Item label="审核类型">
              <Tag color={TYPE_COLOR[detailModal.task.type]}>{TYPE_LABEL[detailModal.task.type]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge
                status={STATUS_COLOR[detailModal.task.status] as any}
                text={STATUS_LABEL[detailModal.task.status]}
              />
            </Descriptions.Item>
            <Descriptions.Item label="提交人">{detailModal.task.submitterName || '-'}</Descriptions.Item>
            <Descriptions.Item label="提交时间">
              {dayjs(detailModal.task.submittedAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="审核人">{detailModal.task.reviewerName || '待分配'}</Descriptions.Item>
            <Descriptions.Item label="审核时间">
              {detailModal.task.reviewedAt
                ? dayjs(detailModal.task.reviewedAt).format('YYYY-MM-DD HH:mm')
                : '-'}
            </Descriptions.Item>
            {detailModal.task.comment && (
              <Descriptions.Item label="审核意见" span={2}>
                {detailModal.task.comment}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
