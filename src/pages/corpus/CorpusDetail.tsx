import { Drawer, Descriptions, Tag, Space, Button, Timeline, Empty, Divider, message, Modal } from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  EyeOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Corpus, CorpusType, CorpusStatus } from '../../types'
import { useCorpusStore } from '../../stores/corpusStore'

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

interface CorpusDetailProps {
  open: boolean
  corpusId: string | null
  onClose: () => void
  onEdit: (corpus: Corpus) => void
  onDelete: (id: string) => void
}

export default function CorpusDetail({ open, corpusId, onClose, onEdit, onDelete }: CorpusDetailProps) {
  const { getCorpusById, getLibraryById, submitForReview, deleteCorpus } = useCorpusStore()
  const corpus = corpusId ? getCorpusById(corpusId) : null
  const library = corpus?.libraryId ? getLibraryById(corpus.libraryId) : null

  if (!corpus) {
    return (
      <Drawer title="语料详情" open={open} onClose={onClose} width={640}>
        <Empty description="语料不存在或已删除" />
      </Drawer>
    )
  }

  const handleSubmitReview = () => {
    submitForReview(corpus.id)
    message.success('已提交审核')
    onClose()
  }

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除语料「${corpus.title}」吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        deleteCorpus(corpus.id)
        message.success('删除成功')
        onClose()
        onDelete(corpus.id)
      },
    })
  }

  return (
    <Drawer
      title={
        <Space>
          <span>语料详情</span>
          <Tag color={typeColor[corpus.type]}>{typeLabel[corpus.type]}</Tag>
          <Tag color={statusColor[corpus.status]}>{statusLabel[corpus.status]}</Tag>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={640}
      extra={
        <Space>
          {corpus.status === 'draft' && (
            <Button type="primary" icon={<SendOutlined />} onClick={handleSubmitReview}>
              提交审核
            </Button>
          )}
          <Button icon={<EditOutlined />} onClick={() => { onClose(); onEdit(corpus) }}>
            编辑
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            删除
          </Button>
        </Space>
      }
    >
      {/* 基本信息 */}
      <Descriptions title="基本信息" column={2} bordered size="small">
        <Descriptions.Item label="标题" span={2}>{corpus.title}</Descriptions.Item>
        <Descriptions.Item label="语料类型">{typeLabel[corpus.type]}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={statusColor[corpus.status]}>{statusLabel[corpus.status]}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="所属语料库">{library?.name || '未分配'}</Descriptions.Item>
        <Descriptions.Item label="创建人">{corpus.creatorName}</Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {dayjs(corpus.createdAt).format('YYYY-MM-DD HH:mm')}
        </Descriptions.Item>
        <Descriptions.Item label="更新时间">
          {dayjs(corpus.updatedAt).format('YYYY-MM-DD HH:mm')}
        </Descriptions.Item>
      </Descriptions>

      {/* 标签 */}
      <div style={{ marginTop: 16 }}>
        <strong>标签：</strong>
        <Space wrap style={{ marginTop: 4 }}>
          {corpus.tags && corpus.tags.length > 0
            ? corpus.tags.map((tag, i) => <Tag key={i}>{tag}</Tag>)
            : <span style={{ color: '#999' }}>暂无标签</span>
          }
        </Space>
      </div>

      {/* 内容 */}
      <Divider>内容</Divider>
      {corpus.type === 'text' && corpus.content ? (
        <div
          style={{
            background: '#fafafa',
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            padding: 16,
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            maxHeight: 300,
            overflow: 'auto',
          }}
        >
          {corpus.content}
        </div>
      ) : corpus.fileUrl ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <EyeOutlined style={{ fontSize: 32, color: '#999', marginBottom: 8 }} />
          <div style={{ color: '#666', marginBottom: 8 }}>文件类型：{typeLabel[corpus.type]}</div>
          <Button icon={<DownloadOutlined />}>下载文件</Button>
        </div>
      ) : (
        <Empty description="暂无内容" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}

      {/* Metadata */}
      <Divider>元数据</Divider>
      <Descriptions column={2} size="small">
        <Descriptions.Item label="语言">{corpus.metadata?.language || '-'}</Descriptions.Item>
        <Descriptions.Item label="来源">{corpus.metadata?.source || '-'}</Descriptions.Item>
        <Descriptions.Item label="用途">{corpus.metadata?.purpose || '-'}</Descriptions.Item>
        <Descriptions.Item label="作者">{corpus.metadata?.author || '-'}</Descriptions.Item>
      </Descriptions>

      {/* 统计 */}
      {corpus.statistics && (
        <>
          <Divider>统计</Divider>
          <Descriptions column={3} size="small">
            <Descriptions.Item label="浏览次数">{corpus.statistics.viewCount}</Descriptions.Item>
            <Descriptions.Item label="下载次数">{corpus.statistics.downloadCount}</Descriptions.Item>
            <Descriptions.Item label="标注进度">{corpus.statistics.annotationProgress}%</Descriptions.Item>
          </Descriptions>
        </>
      )}

      {/* 版本历史 */}
      {corpus.versions && corpus.versions.length > 0 && (
        <>
          <Divider>版本历史</Divider>
          <Timeline
            items={corpus.versions.map(v => ({
              children: (
                <div>
                  <div style={{ fontWeight: 500 }}>版本 {v.version} - {v.editorName || '未知'}</div>
                  <div style={{ color: '#999', fontSize: 13 }}>
                    {dayjs(v.createdAt).format('YYYY-MM-DD HH:mm')}
                    {v.comment && ` · ${v.comment}`}
                  </div>
                </div>
              ),
            }))}
          />
        </>
      )}
    </Drawer>
  )
}
