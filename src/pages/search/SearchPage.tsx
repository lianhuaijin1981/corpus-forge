import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Typography, Input, Card, Space, Tag, Button, Empty, Table,
  Select, Badge, Tooltip, message, Modal, Descriptions, DatePicker,
  Divider, Row, Col, Statistic,
} from 'antd'
import {
  SearchOutlined,
  HistoryOutlined,
  StarOutlined,
  StarFilled,
  CloseCircleOutlined,
  EyeOutlined,
  FilterOutlined,
  DownloadOutlined,
  PieChartOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { RangePickerProps } from 'antd/es/date-picker'
import dayjs from 'dayjs'
import type { Corpus, CorpusType, CorpusStatus } from '../../types'
import { useCorpusStore } from '../../stores/corpusStore'

const { Title, Text, Paragraph } = Typography
const { RangePicker } = DatePicker

// ============ 常量映射 ============

const TYPE_LABEL: Record<CorpusType, string> = {
  text: '文本', audio: '音频', video: '视频', image: '图片',
}
const TYPE_COLOR: Record<CorpusType, string> = {
  text: 'blue', audio: 'green', video: 'purple', image: 'orange',
}
const STATUS_LABEL: Record<CorpusStatus, string> = {
  draft: '草稿', pending_review: '待审核', approved: '已通过',
  rejected: '已拒绝', archived: '已归档',
}
const STATUS_COLOR: Record<CorpusStatus, string> = {
  draft: 'default', pending_review: 'orange', approved: 'success',
  rejected: 'error', archived: 'default',
}

// ============ 收藏持久化Key ============
const FAVORITES_KEY = 'corpusforge-search-favorites'
const HISTORY_KEY = 'corpusforge-search-history'

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch { /* ignore */ }
  return new Set()
}

function saveFavorites(ids: Set<string>) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...ids]))
}

function loadHistory(): { keyword: string; count: number }[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function saveHistory(history: { keyword: string; count: number }[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

// ============ 关键词高亮 ============

function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword) return <span>{text}</span>
  const kw = keyword.toLowerCase()
  const idx = text.toLowerCase().indexOf(kw)
  if (idx < 0) return <span>{text}</span>
  return (
    <span>
      {text.slice(0, idx)}
      <mark style={{ background: '#fff7b5', padding: 0 }}>{text.slice(idx, idx + kw.length)}</mark>
      {text.slice(idx + kw.length)}
    </span>
  )
}

// ============ 语料预览弹窗 ============

function CorpusPreviewModal({
  corpus,
  libraries,
  keyword,
  onClose,
}: {
  corpus: Corpus | null
  libraries: ReturnType<typeof useCorpusStore>['libraries']
  keyword: string
  onClose: () => void
}) {
  if (!corpus) return null
  const lib = libraries.find(l => l.id === corpus.libraryId)
  return (
    <Modal
      title={
        <Space>
          <Tag color={TYPE_COLOR[corpus.type]}>{TYPE_LABEL[corpus.type]}</Tag>
          <span>{corpus.title}</span>
        </Space>
      }
      open={!!corpus}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>关闭</Button>,
      ]}
      width={680}
    >
      <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="状态">
          <Badge status={STATUS_COLOR[corpus.status] as any} text={STATUS_LABEL[corpus.status]} />
        </Descriptions.Item>
        <Descriptions.Item label="语料库">
          {lib?.name || <Text type="secondary">未分配</Text>}
        </Descriptions.Item>
        <Descriptions.Item label="语言">{corpus.metadata?.language || '-'}</Descriptions.Item>
        <Descriptions.Item label="来源">{corpus.metadata?.source || '-'}</Descriptions.Item>
        <Descriptions.Item label="用途">{corpus.metadata?.purpose || '-'}</Descriptions.Item>
        <Descriptions.Item label="创建人">{corpus.creatorName || '-'}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{dayjs(corpus.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
        <Descriptions.Item label="更新时间">{dayjs(corpus.updatedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
        {corpus.tags?.length > 0 && (
          <Descriptions.Item label="标签" span={2}>
            <Space wrap>{corpus.tags.map((t, i) => <Tag key={i}>{t}</Tag>)}</Space>
          </Descriptions.Item>
        )}
        {corpus.statistics && (
          <Descriptions.Item label="浏览 / 下载" span={2}>
            {corpus.statistics.viewCount} / {corpus.statistics.downloadCount}
          </Descriptions.Item>
        )}
      </Descriptions>

      {corpus.content && (
        <>
          <Text strong>内容预览：</Text>
          <Card size="small" style={{ marginTop: 8, background: '#fafafa', maxHeight: 300, overflowY: 'auto' }}>
            <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
              <HighlightText text={corpus.content} keyword={keyword} />
            </Paragraph>
          </Card>
        </>
      )}
      {corpus.fileUrl && (
        <div style={{ marginTop: 12 }}>
          <Text strong>文件：</Text>
          <Text type="secondary" style={{ marginLeft: 8 }}>{corpus.fileUrl}</Text>
        </div>
      )}
    </Modal>
  )
}

// ============ CSV 导出 ============

function exportToCSV(data: Corpus[], keyword: string) {
  const headers = ['标题', '类型', '状态', '语言', '来源', '用途', '标签', '创建人', '更新时间']
  const rows = data.map(c => [
    c.title,
    TYPE_LABEL[c.type],
    STATUS_LABEL[c.status],
    c.metadata?.language || '',
    c.metadata?.source || '',
    c.metadata?.purpose || '',
    (c.tags || []).join('|'),
    c.creatorName || '',
    dayjs(c.updatedAt).format('YYYY-MM-DD HH:mm'),
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `语料检索结果_${keyword}_${dayjs().format('YYYYMMDD_HHmmss')}.csv`
  a.click()
  URL.revokeObjectURL(url)
  message.success(`已导出 ${data.length} 条结果`)
}

// ============ 组件 ============

export default function SearchPage() {
  const [keyword, setKeyword] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [filterType, setFilterType] = useState<CorpusType | undefined>()
  const [filterStatus, setFilterStatus] = useState<CorpusStatus | undefined>()
  const [filterLibraryId, setFilterLibraryId] = useState<string | undefined>()
  const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [showFilter, setShowFilter] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites)
  const [searchHistory, setSearchHistory] = useState<{ keyword: string; count: number }[]>(loadHistory)
  const [previewCorpus, setPreviewCorpus] = useState<Corpus | null>(null)

  const { corpusList, libraries } = useCorpusStore()

  // ---- 收藏持久化 ----
  useEffect(() => { saveFavorites(favorites) }, [favorites])
  useEffect(() => { saveHistory(searchHistory) }, [searchHistory])

  // ---- 搜索结果 ----
  const searchResults = useMemo<Corpus[]>(() => {
    if (!keyword.trim()) return []

    const kw = keyword.toLowerCase()
    let list = corpusList.filter(
      c =>
        c.title.toLowerCase().includes(kw) ||
        c.content?.toLowerCase().includes(kw) ||
        c.tags?.some(t => t.toLowerCase().includes(kw)) ||
        c.metadata?.language?.toLowerCase().includes(kw) ||
        c.metadata?.source?.toLowerCase().includes(kw) ||
        c.metadata?.purpose?.toLowerCase().includes(kw) ||
        c.creatorName?.toLowerCase().includes(kw)
    )

    if (filterType) list = list.filter(c => c.type === filterType)
    if (filterStatus) list = list.filter(c => c.status === filterStatus)
    if (filterLibraryId) list = list.filter(c => c.libraryId === filterLibraryId)

    if (filterDateRange?.[0] && filterDateRange?.[1]) {
      const start = filterDateRange[0].startOf('day').valueOf()
      const end = filterDateRange[1].endOf('day').valueOf()
      list = list.filter(c => {
        const t = new Date(c.createdAt).getTime()
        return t >= start && t <= end
      })
    }

    return list
  }, [keyword, filterType, filterStatus, filterLibraryId, filterDateRange, corpusList])

  // ---- 搜索结果统计 ----
  const resultStats = useMemo(() => {
    const byType: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    searchResults.forEach(c => {
      byType[c.type] = (byType[c.type] || 0) + 1
      byStatus[c.status] = (byStatus[c.status] || 0) + 1
    })
    return { byType, byStatus }
  }, [searchResults])

  const searched = keyword.trim().length > 0
  const hasFilters = !!(filterType || filterStatus || filterLibraryId || filterDateRange?.[0])

  // ---- 搜索提交 ----
  const handleSearch = useCallback(() => {
    const kw = inputValue.trim()
    if (!kw) return
    setKeyword(kw)
    setSearchHistory(prev => {
      const filtered = prev.filter(h => h.keyword !== kw)
      return [{ keyword: kw, count: filtered.length + 1 }, ...filtered].slice(0, 10)
    })
  }, [inputValue])

  const handleHistoryClick = useCallback((kw: string) => {
    setInputValue(kw)
    setKeyword(kw)
  }, [])

  const clearHistory = useCallback(() => {
    setSearchHistory([])
    localStorage.removeItem(HISTORY_KEY)
    message.success('已清空搜索历史')
  }, [])

  const toggleFavorite = useCallback((id: string, title: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        message.success(`已取消收藏「${title}」`)
      } else {
        next.add(id)
        message.success(`已收藏「${title}」`)
      }
      return next
    })
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilterType(undefined)
    setFilterStatus(undefined)
    setFilterLibraryId(undefined)
    setFilterDateRange(null)
  }, [])

  // ---- 表格列 ----
  const columns: ColumnsType<Corpus> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 280,
      ellipsis: { showTitle: false },
      render: (text: string) => (
        <Tooltip title={text}>
          <Text strong style={{ cursor: 'default' }}>
            <HighlightText text={text} keyword={keyword} />
          </Text>
        </Tooltip>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: CorpusType) => <Tag color={TYPE_COLOR[type]}>{TYPE_LABEL[type]}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: CorpusStatus) => (
        <Badge status={STATUS_COLOR[status] as any} text={STATUS_LABEL[status]} />
      ),
    },
    {
      title: '语料库',
      dataIndex: 'libraryId',
      key: 'libraryId',
      width: 160,
      ellipsis: true,
      render: (libraryId?: string) => {
        if (!libraryId) return <Text type="secondary">未分配</Text>
        const lib = libraries.find(l => l.id === libraryId)
        return lib?.name || libraryId
      },
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 160,
      render: (tags: string[]) =>
        tags?.length > 0
          ? tags.slice(0, 2).map((t, i) => <Tag key={i}>{t}</Tag>)
          : <Text type="secondary">-</Text>,
    },
    {
      title: '创建人',
      dataIndex: 'creatorName',
      key: 'creatorName',
      width: 90,
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
      width: 100,
      fixed: 'right',
      render: (_: any, record: Corpus) => (
        <Space size={4}>
          <Tooltip title="预览详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setPreviewCorpus(record)}
            />
          </Tooltip>
          <Tooltip title={favorites.has(record.id) ? '取消收藏' : '收藏'}>
            <Button
              type="text"
              size="small"
              icon={
                favorites.has(record.id)
                  ? <StarFilled style={{ color: '#faad14' }} />
                  : <StarOutlined />
              }
              onClick={() => toggleFavorite(record.id, record.title)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  // ---- 收藏列表 ----
  const favoriteList = useMemo(
    () => corpusList.filter(c => favorites.has(c.id)),
    [favorites, corpusList],
  )

  // ---- 热门标签（从真实数据中提取最常见标签） ----
  const hotTags = useMemo(() => {
    const tagCount: Record<string, number> = {}
    corpusList.forEach(c => c.tags?.forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1 }))
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([t]) => t)
  }, [corpusList])

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>语料检索</Title>

      {/* 搜索栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            size="large"
            placeholder="搜索标题、内容、标签、语言、来源..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onPressEnter={handleSearch}
            prefix={<SearchOutlined />}
            allowClear
            onClear={() => { setInputValue(''); setKeyword('') }}
          />
          <Button size="large" type="primary" onClick={handleSearch} icon={<SearchOutlined />}>
            搜索
          </Button>
        </Space.Compact>

        {/* 高级筛选 */}
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            type="text"
            size="small"
            icon={<FilterOutlined />}
            onClick={() => setShowFilter(v => !v)}
          >
            高级筛选 {hasFilters && <Badge dot />}
          </Button>
          {searched && (
            <Button
              type="text"
              size="small"
              icon={<PieChartOutlined />}
              onClick={() => setShowStats(v => !v)}
            >
              结果统计
            </Button>
          )}
          {hasFilters && (
            <Button
              size="small"
              type="text"
              danger
              icon={<CloseCircleOutlined />}
              onClick={clearAllFilters}
            >
              清除筛选
            </Button>
          )}
        </div>

        {showFilter && (
          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Select
              placeholder="语料类型"
              style={{ width: 120 }}
              allowClear
              value={filterType}
              onChange={setFilterType}
              options={Object.entries(TYPE_LABEL).map(([v, l]) => ({ value: v, label: l }))}
            />
            <Select
              placeholder="状态"
              style={{ width: 120 }}
              allowClear
              value={filterStatus}
              onChange={setFilterStatus}
              options={Object.entries(STATUS_LABEL).map(([v, l]) => ({ value: v, label: l }))}
            />
            <Select
              placeholder="语料库"
              style={{ width: 180 }}
              allowClear
              value={filterLibraryId}
              onChange={setFilterLibraryId}
              options={libraries.map(l => ({ value: l.id, label: l.name }))}
            />
            <RangePicker
              placeholder={['创建开始', '创建结束']}
              size="middle"
              value={filterDateRange as RangePickerProps['value']}
              onChange={val => setFilterDateRange(val as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
            />
          </div>
        )}
      </Card>

      {/* 搜索结果统计 */}
      {searched && showStats && searchResults.length > 0 && (
        <Card size="small" style={{ marginBottom: 16 }} title={<Space><PieChartOutlined />结果统计摘要</Space>}>
          <Row gutter={16}>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 12 }}>按类型分布</Text>
              <div style={{ marginTop: 4 }}>
                <Space wrap>
                  {Object.entries(resultStats.byType).map(([type, cnt]) => (
                    <Tag key={type} color={TYPE_COLOR[type as CorpusType]}>
                      {TYPE_LABEL[type as CorpusType]}: {cnt}
                    </Tag>
                  ))}
                </Space>
              </div>
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 12 }}>按状态分布</Text>
              <div style={{ marginTop: 4 }}>
                <Space wrap>
                  {Object.entries(resultStats.byStatus).map(([status, cnt]) => (
                    <Badge key={status} status={STATUS_COLOR[status as CorpusStatus] as any}
                      text={`${STATUS_LABEL[status as CorpusStatus]}: ${cnt}`} />
                  ))}
                </Space>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* 搜索结果 */}
      {searched ? (
        <Card
          size="small"
          title={
            <span>
              搜索「<Text strong>{keyword}</Text>」的结果
              <Text type="secondary" style={{ marginLeft: 8, fontSize: 13 }}>
                共 {searchResults.length} 条
              </Text>
            </span>
          }
          extra={
            <Space>
              {searchResults.length > 0 && (
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={() => exportToCSV(searchResults, keyword)}
                >
                  导出CSV
                </Button>
              )}
              <Button
                type="text"
                size="small"
                onClick={() => { setKeyword(''); setInputValue('') }}
              >
                清空搜索
              </Button>
            </Space>
          }
        >
          {searchResults.length === 0 ? (
            <Empty description={`未找到与"${keyword}"相关的语料`} style={{ padding: '40px 0' }} />
          ) : (
            <Table<Corpus>
              rowKey="id"
              dataSource={searchResults}
              columns={columns}
              size="middle"
              scroll={{ x: 1200 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              }}
            />
          )}
        </Card>
      ) : (
        <div>
          {/* 搜索历史 */}
          <Card
            size="small"
            title={
              <Space>
                <HistoryOutlined />
                <span>搜索历史</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
            extra={
              searchHistory.length > 0 && (
                <Button type="link" size="small" onClick={clearHistory}>
                  清空
                </Button>
              )
            }
          >
            {searchHistory.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无搜索历史" />
            ) : (
              <Space wrap>
                {searchHistory.map((h, i) => (
                  <Tag
                    key={i}
                    style={{ cursor: 'pointer', padding: '4px 10px', fontSize: 13 }}
                    onClick={() => handleHistoryClick(h.keyword)}
                  >
                    <HistoryOutlined style={{ marginRight: 4 }} />
                    {h.keyword}
                  </Tag>
                ))}
              </Space>
            )}
          </Card>

          {/* 热门标签 */}
          <Card size="small" title="热门标签（来自语料数据）" style={{ marginBottom: 16 }}>
            {hotTags.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无标签数据" />
            ) : (
              <Space wrap>
                {hotTags.map(tag => (
                  <Tag
                    key={tag}
                    color="blue"
                    style={{ cursor: 'pointer', padding: '4px 10px' }}
                    onClick={() => { setInputValue(tag); setKeyword(tag) }}
                  >
                    {tag}
                  </Tag>
                ))}
              </Space>
            )}
          </Card>

          {/* 语料库快速检索 */}
          <Card size="small" title="语料库快速检索" style={{ marginBottom: 16 }}>
            <Space wrap>
              {libraries.map(lib => (
                <Button
                  key={lib.id}
                  size="small"
                  type="dashed"
                  onClick={() => {
                    setFilterLibraryId(lib.id)
                    setShowFilter(true)
                    setInputValue(lib.name)
                    setKeyword(lib.name)
                  }}
                >
                  {lib.name}
                  <Text type="secondary" style={{ marginLeft: 4, fontSize: 11 }}>
                    ({lib.corpusCount})
                  </Text>
                </Button>
              ))}
            </Space>
          </Card>

          {/* 我的收藏 */}
          <Card
            size="small"
            title={
              <Space>
                <StarFilled style={{ color: '#faad14' }} />
                <span>我的收藏（{favoriteList.length}）</span>
              </Space>
            }
          >
            {favoriteList.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无收藏，在搜索结果中点击⭐收藏" />
            ) : (
              <>
                <Row gutter={[8, 8]}>
                  {favoriteList.map(f => (
                    <Col span={12} key={f.id}>
                      <Card
                        size="small"
                        style={{ cursor: 'pointer' }}
                        hoverable
                        onClick={() => setPreviewCorpus(f)}
                        extra={
                          <Button
                            type="text"
                            size="small"
                            icon={<StarFilled style={{ color: '#faad14' }} />}
                            onClick={e => { e.stopPropagation(); toggleFavorite(f.id, f.title) }}
                          />
                        }
                      >
                        <Space>
                          <Tag color={TYPE_COLOR[f.type]}>{TYPE_LABEL[f.type]}</Tag>
                          <Text ellipsis style={{ maxWidth: 180 }}>{f.title}</Text>
                        </Space>
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {f.metadata?.language} · {dayjs(f.updatedAt).format('MM-DD')}
                          </Text>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>

                {/* 收藏统计 */}
                {favoriteList.length > 0 && (
                  <>
                    <Divider style={{ margin: '12px 0 8px' }} />
                    <Space>
                      {Object.entries(TYPE_LABEL).map(([type, label]) => {
                        const cnt = favoriteList.filter(f => f.type === type).length
                        if (!cnt) return null
                        return (
                          <Statistic
                            key={type}
                            title={label}
                            value={cnt}
                            valueStyle={{ fontSize: 14 }}
                          />
                        )
                      })}
                    </Space>
                  </>
                )}
              </>
            )}
          </Card>
        </div>
      )}

      {/* 语料预览弹窗 */}
      <CorpusPreviewModal
        corpus={previewCorpus}
        libraries={libraries}
        keyword={keyword}
        onClose={() => setPreviewCorpus(null)}
      />
    </div>
  )
}
