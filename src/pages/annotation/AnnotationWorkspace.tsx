import { useState, useMemo, useCallback } from 'react'
import {
  Card,
  Button,
  Space,
  Tag,
  Typography,
  Tooltip,
  Progress,
  Badge,
  Radio,
  Empty,
  Divider,
  App,
} from 'antd'
import {
  CheckOutlined,
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
  FlagOutlined,
  UndoOutlined,
  RedoOutlined,
  ExpandOutlined,
  CompressOutlined,
  SaveOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { useAnnotationStore } from '../../stores/annotationStore'
import { useCorpusStore } from '../../stores/corpusStore'
import type { Label, Corpus } from '../../types'

const { Text, Title, Paragraph } = Typography

// ============ 标注区域高亮文本 ============

interface TextSpan {
  id: string
  text: string
  start: number
  end: number
  labelId: string
}

interface HighlightedTextProps {
  content: string
  spans: TextSpan[]
  labels: Label[]
  selectedLabelId: string | null
  onTextSelect: (text: string, start: number, end: number) => void
}

function HighlightedText({ content, spans, labels, selectedLabelId, onTextSelect }: HighlightedTextProps) {
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !selectedLabelId) return

    const text = selection.toString().trim()
    if (!text) return

    const contentStr = content
    const start = contentStr.indexOf(text, selection.anchorOffset)
    if (start !== -1) {
      onTextSelect(text, start, start + text.length)
    }
    selection.removeAllRanges()
  }, [content, selectedLabelId, onTextSelect])

  // 构建高亮渲染
  const renderedParts = useMemo(() => {
    if (!spans || spans.length === 0) {
      return <span>{content}</span>
    }

    // 按起始位置排序
    const sorted = [...spans].sort((a, b) => a.start - b.start)
    const parts: React.ReactNode[] = []
    let lastEnd = 0

    sorted.forEach((span, idx) => {
      // 未高亮文本
      if (span.start > lastEnd) {
        parts.push(
          <span key={`text-${idx}`}>{content.slice(lastEnd, span.start)}</span>
        )
      }

      // 高亮文本
      const label = labels.find(l => l.id === span.labelId)
      parts.push(
        <span
          key={`hl-${idx}`}
          style={{
            backgroundColor: label ? `${label.color}25` : '#ffe58f40',
            borderBottom: `2px solid ${label?.color || '#faad14'}`,
            padding: '1px 2px',
            borderRadius: 2,
            cursor: 'pointer',
          }}
          title={label?.nameZh || '未命名标签'}
        >
          {content.slice(span.start, span.end)}
          <Tag
            color={label?.color}
            style={{
              fontSize: 10,
              lineHeight: '14px',
              padding: '0 3px',
              marginLeft: 2,
              verticalAlign: 'super',
            }}
          >
            {label?.nameZh || '?'}
          </Tag>
        </span>
      )

      lastEnd = span.end
    })

    // 末尾未高亮文本
    if (lastEnd < content.length) {
      parts.push(<span key="text-last">{content.slice(lastEnd)}</span>)
    }

    return parts
  }, [content, spans, labels])

  return (
    <div
      onMouseUp={handleMouseUp}
      style={{
        fontSize: 16,
        lineHeight: 2,
        userSelect: 'text',
        cursor: selectedLabelId ? 'crosshair' : 'default',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}
    >
      {renderedParts}
    </div>
  )
}

// ============ 分类标注选择 ============

interface ClassificationSelectProps {
  labels: Label[]
  selectedLabels: string[]
  onChange: (selected: string[]) => void
  multiple?: boolean
}

function ClassificationSelect({ labels, selectedLabels, onChange, multiple = false }: ClassificationSelectProps) {
  const handleToggle = (labelId: string) => {
    if (multiple) {
      const newSelected = selectedLabels.includes(labelId)
        ? selectedLabels.filter(id => id !== labelId)
        : [...selectedLabels, labelId]
      onChange(newSelected)
    } else {
      onChange(selectedLabels.includes(labelId) ? [] : [labelId])
    }
  }

  return (
    <Space wrap>
      {labels.map(label => (
        <Tag
          key={label.id}
          color={selectedLabels.includes(label.id) ? label.color : undefined}
          style={{
            cursor: 'pointer',
            fontSize: 14,
            padding: '4px 12px',
            opacity: selectedLabels.includes(label.id) ? 1 : 0.7,
          }}
          onClick={() => handleToggle(label.id)}
        >
          {label.nameZh}
        </Tag>
      ))}
    </Space>
  )
}

// ============ 标注工作区主组件 ============

interface AnnotationWorkspaceProps {
  taskId: string
}

export default function AnnotationWorkspace({ taskId }: AnnotationWorkspaceProps) {
  const { message } = App.useApp()
  const { tasks, updateTask } = useAnnotationStore()
  const { corpusList } = useCorpusStore()

  const task = tasks.find(t => t.id === taskId)

  // 标注状态
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null)
  const [spansMap, setSpansMap] = useState<Record<string, TextSpan[]>>({})
  const [classificationsMap, setClassificationsMap] = useState<Record<string, string[]>>({})
  const [annotationStatusMap, setAnnotationStatusMap] = useState<Record<string, 'pending' | 'completed' | 'skipped'>>({})
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [history, setHistory] = useState<Array<{ spans: Record<string, TextSpan[]>; classifications: Record<string, string[]> }>>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // 获取当前任务的语料列表
  const corpusItems = useMemo(() => {
    if (!task) return []
    return task.corpusIds
      .map(id => corpusList.find(c => c.id === id))
      .filter((c): c is Corpus => !!c)
  }, [task, corpusList])

  const currentCorpus = corpusItems[currentIndex]
  const currentSpans = currentCorpus ? (spansMap[currentCorpus.id] || []) : []
  const currentClassifications = currentCorpus ? (classificationsMap[currentCorpus.id] || []) : []

  // 根据标签类型决定标注模式
  const annotationMode = useMemo(() => {
    if (!task || !task.labelSet.length) return 'none'
    const types = new Set(task.labelSet.map(l => l.type))
    if (types.has('ner') || types.has('relation')) return 'span'
    if (types.has('classification') || types.has('sentiment') || types.has('intent')) return 'classification'
    return 'span'
  }, [task])

  // 进度统计
  const completedCount = Object.values(annotationStatusMap).filter(s => s === 'completed').length
  const totalCount = corpusItems.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // 处理文本选择标注（NER模式）
  const handleTextSelect = useCallback((text: string, start: number, end: number) => {
    if (!selectedLabelId || !currentCorpus) return

    // 检查重叠
    const overlaps = currentSpans.some(
      span => (start < span.end && end > span.start)
    )
    if (overlaps) {
      message.warning('该区域已有标注，请先删除重叠标注')
      return
    }

    const newSpan: TextSpan = {
      id: `span-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text,
      start,
      end,
      labelId: selectedLabelId,
    }

    pushHistory()
    setSpansMap(prev => ({
      ...prev,
      [currentCorpus.id]: [...(prev[currentCorpus.id] || []), newSpan],
    }))
  }, [selectedLabelId, currentCorpus, currentSpans, message])

  // 删除标注
  const handleDeleteSpan = useCallback((spanId: string) => {
    if (!currentCorpus) return
    pushHistory()
    setSpansMap(prev => ({
      ...prev,
      [currentCorpus.id]: (prev[currentCorpus.id] || []).filter(s => s.id !== spanId),
    }))
  }, [currentCorpus])

  // 分类标注变更
  const handleClassificationChange = useCallback((selected: string[]) => {
    if (!currentCorpus) return
    pushHistory()
    setClassificationsMap(prev => ({
      ...prev,
      [currentCorpus.id]: selected,
    }))
  }, [currentCorpus])

  // 历史记录管理
  const pushHistory = useCallback(() => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push({ spans: { ...spansMap }, classifications: { ...classificationsMap } })
      return newHistory.slice(-50) // 最多保留50步
    })
    setHistoryIndex(prev => prev + 1)
  }, [spansMap, classificationsMap, historyIndex])

  const handleUndo = useCallback(() => {
    if (historyIndex < 0) return
    const state = history[historyIndex]
    setSpansMap(state.spans)
    setClassificationsMap(state.classifications)
    setHistoryIndex(prev => prev - 1)
  }, [history, historyIndex])

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return
    const state = history[historyIndex + 1]
    setSpansMap(state.spans)
    setClassificationsMap(state.classifications)
    setHistoryIndex(prev => prev + 1)
  }, [history, historyIndex])

  // 导航
  const handlePrev = () => setCurrentIndex(prev => Math.max(0, prev - 1))
  const handleNext = () => setCurrentIndex(prev => Math.min(totalCount - 1, prev + 1))

  // 标记当前语料
  const handleMarkCompleted = () => {
    if (!currentCorpus) return
    setAnnotationStatusMap(prev => ({ ...prev, [currentCorpus.id]: 'completed' }))
    message.success('已标记为完成')
    if (currentIndex < totalCount - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handleMarkSkipped = () => {
    if (!currentCorpus) return
    setAnnotationStatusMap(prev => ({ ...prev, [currentCorpus.id]: 'skipped' }))
    message.info('已跳过')
    if (currentIndex < totalCount - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  // 提交所有标注
  const handleSubmitAll = () => {
    if (!task) return
    const completed = Object.values(annotationStatusMap).filter(s => s === 'completed').length
    const total = corpusItems.length
    if (completed < total) {
      message.warning(`还有 ${total - completed} 条语料未完成标注`)
      return
    }

    // 更新任务统计
    updateTask(taskId, {
      statistics: {
        total,
        completed,
        inProgress: 0,
        pending: 0,
        rejected: 0,
      },
    })
    message.success('所有标注已提交')
  }

  // 快捷键标签选择
  const handleLabelShortcut = useCallback((labelId: string) => {
    setSelectedLabelId(prev => prev === labelId ? null : labelId)
  }, [])

  if (!task) {
    return <Empty description="任务不存在" />
  }

  if (corpusItems.length === 0) {
    return <Empty description="该任务没有关联语料" />
  }

  return (
    <div style={isFullscreen ? {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 1000, background: '#f0f2f5', padding: 16, overflow: 'auto',
    } : undefined}>
      {/* 顶部工具栏 */}
      <Card
        size="small"
        style={{ marginBottom: 12 }}
        styles={{ body: { padding: '8px 16px' } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Text strong>{task.name}</Text>
            <Divider type="vertical" />
            <Text type="secondary">
              {currentIndex + 1} / {totalCount}
            </Text>
            <Progress
              percent={progressPercent}
              size="small"
              style={{ width: 120, marginLeft: 8 }}
            />
          </Space>
          <Space>
            <Tooltip title="撤销 (Ctrl+Z)">
              <Button
                size="small"
                icon={<UndoOutlined />}
                disabled={historyIndex < 0}
                onClick={handleUndo}
              />
            </Tooltip>
            <Tooltip title="重做 (Ctrl+Y)">
              <Button
                size="small"
                icon={<RedoOutlined />}
                disabled={historyIndex >= history.length - 1}
                onClick={handleRedo}
              />
            </Tooltip>
            <Tooltip title={isFullscreen ? '退出全屏' : '全屏模式'}>
              <Button
                size="small"
                icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
                onClick={() => setIsFullscreen(!isFullscreen)}
              />
            </Tooltip>
          </Space>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 12 }}>
        {/* 左侧：标注内容区 */}
        <Card
          style={{ flex: 1, minHeight: 500 }}
          title={
            <Space>
              <span>标注内容</span>
              {currentCorpus && (
                <Tag color="blue">{currentCorpus.type}</Tag>
              )}
            </Space>
          }
          extra={
            <Space>
              <Button
                icon={<LeftOutlined />}
                disabled={currentIndex === 0}
                onClick={handlePrev}
              />
              <Button
                icon={<RightOutlined />}
                disabled={currentIndex === totalCount - 1}
                onClick={handleNext}
              />
            </Space>
          }
        >
          {currentCorpus ? (
            <div>
              {/* 语料标题和状态 */}
              <div style={{ marginBottom: 16 }}>
                <Title level={5} style={{ marginBottom: 4 }}>
                  {currentCorpus.title}
                </Title>
                <Space size={4}>
                  <Tag color={
                    annotationStatusMap[currentCorpus.id] === 'completed' ? 'success' :
                    annotationStatusMap[currentCorpus.id] === 'skipped' ? 'warning' : 'default'
                  }>
                    {
                      annotationStatusMap[currentCorpus.id] === 'completed' ? '已完成' :
                      annotationStatusMap[currentCorpus.id] === 'skipped' ? '已跳过' : '待标注'
                    }
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    语言: {currentCorpus.metadata?.language || '未知'}
                  </Text>
                </Space>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              {/* 文本内容标注区 */}
              {currentCorpus.type === 'text' && currentCorpus.content && (
                <div
                  style={{
                    padding: 20,
                    background: '#fafafa',
                    borderRadius: 8,
                    border: '1px solid #f0f0f0',
                    minHeight: 300,
                  }}
                >
                  {annotationMode === 'span' ? (
                    <>
                      {selectedLabelId && (
                        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#e6f7ff', borderRadius: 4, fontSize: 13 }}>
                          <Text type="secondary">
                            请在下方文本中选择要标注的文本片段（已选标签：
                          </Text>
                          <Tag color={task.labelSet.find(l => l.id === selectedLabelId)?.color}>
                            {task.labelSet.find(l => l.id === selectedLabelId)?.nameZh}
                          </Tag>
                          <Text type="secondary">）</Text>
                        </div>
                      )}
                      <HighlightedText
                        content={currentCorpus.content}
                        spans={currentSpans}
                        labels={task.labelSet}
                        selectedLabelId={selectedLabelId}
                        onTextSelect={handleTextSelect}
                      />
                    </>
                  ) : (
                    <Paragraph style={{ fontSize: 16, lineHeight: 2 }}>
                      {currentCorpus.content}
                    </Paragraph>
                  )}
                </div>
              )}

              {/* 非文本语料提示 */}
              {currentCorpus.type !== 'text' && (
                <div style={{
                  padding: 40,
                  textAlign: 'center',
                  background: '#fafafa',
                  borderRadius: 8,
                  border: '1px dashed #d9d9d9',
                }}>
                  <Text type="secondary">
                    {currentCorpus.type === 'audio' ? '音频标注（需要音频播放器和波形编辑器）' :
                     currentCorpus.type === 'image' ? '图像标注（需要图像标注工具）' :
                     '视频标注（需要视频标注工具）'}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    该类型语料的标注功能将在后续版本实现
                  </Text>
                </div>
              )}

              {/* 已标注实体列表 */}
              {annotationMode === 'span' && currentSpans.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Text strong style={{ marginBottom: 8, display: 'block' }}>
                    已标注实体 ({currentSpans.length})
                  </Text>
                  <Space wrap>
                    {currentSpans.map(span => {
                      const label = task.labelSet.find(l => l.id === span.labelId)
                      return (
                        <Tag
                          key={span.id}
                          closable
                          onClose={() => handleDeleteSpan(span.id)}
                          color={label?.color}
                        >
                          {label?.nameZh}: {span.text}
                        </Tag>
                      )
                    })}
                  </Space>
                </div>
              )}
            </div>
          ) : (
            <Empty description="语料不存在或已被删除" />
          )}
        </Card>

        {/* 右侧：标注工具面板 */}
        <div style={{ width: 320 }}>
          {/* 标签选择面板 */}
          <Card
            size="small"
            title="标注标签"
            style={{ marginBottom: 12 }}
          >
            {task.labelSet.length === 0 ? (
              <Empty description="未配置标签" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : annotationMode === 'span' ? (
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                  选择标签后在文本中拖选标注
                </Text>
                <Radio.Group
                  value={selectedLabelId}
                  onChange={e => setSelectedLabelId(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {task.labelSet.map(label => (
                      <Radio key={label.id} value={label.id}>
                        <Space>
                          <span
                            style={{
                              display: 'inline-block',
                              width: 12,
                              height: 12,
                              borderRadius: 2,
                              backgroundColor: label.color,
                            }}
                          />
                          <span>{label.nameZh}</span>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            ({label.name})
                          </Text>
                          {label.shortcut && (
                            <Tag style={{ fontSize: 10, marginLeft: 4 }}>
                              {label.shortcut}
                            </Tag>
                          )}
                        </Space>
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </div>
            ) : (
              <ClassificationSelect
                labels={task.labelSet}
                selectedLabels={currentClassifications}
                onChange={handleClassificationChange}
                multiple={task.labelSet.some(l => l.type === 'classification')}
              />
            )}
          </Card>

          {/* 标注统计 */}
          <Card
            size="small"
            title="标注统计"
            style={{ marginBottom: 12 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">已完成</Text>
                <Badge
                  count={completedCount}
                  style={{ backgroundColor: '#52c41a' }}
                  overflowCount={999}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">待标注</Text>
                <Badge
                  count={totalCount - completedCount - Object.values(annotationStatusMap).filter(s => s === 'skipped').length}
                  style={{ backgroundColor: '#1890ff' }}
                  overflowCount={999}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">已跳过</Text>
                <Badge
                  count={Object.values(annotationStatusMap).filter(s => s === 'skipped').length}
                  style={{ backgroundColor: '#faad14' }}
                  overflowCount={999}
                />
              </div>
              <Progress
                percent={progressPercent}
                size="small"
                status={progressPercent === 100 ? 'success' : 'active'}
              />
            </div>
          </Card>

          {/* 操作按钮 */}
          <Card size="small" title="操作">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleMarkCompleted}
                disabled={!currentCorpus || annotationStatusMap[currentCorpus?.id] === 'completed'}
                block
              >
                标记完成
              </Button>
              <Button
                icon={<FlagOutlined />}
                onClick={handleMarkSkipped}
                disabled={!currentCorpus}
                block
              >
                跳过
              </Button>
              <Divider style={{ margin: '8px 0' }} />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSubmitAll}
                disabled={completedCount < totalCount}
                block
              >
                提交所有标注
              </Button>
              <Button
                icon={<SaveOutlined />}
                onClick={() => message.success('标注已自动保存')}
                block
              >
                保存草稿
              </Button>
            </Space>
          </Card>
        </div>
      </div>
    </div>
  )
}
