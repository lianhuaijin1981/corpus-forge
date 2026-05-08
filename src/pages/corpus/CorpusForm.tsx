import { useEffect, useCallback, useMemo, useRef } from 'react'
import { Modal, Form, Input, Select, Space, Upload, message, Typography, Divider } from 'antd'
import { InboxOutlined, FileOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import type { Corpus, CorpusType } from '../../types'
import { useCorpusStore } from '../../stores/corpusStore'

const { TextArea } = Input
const { Dragger } = Upload
const { Text, Link } = Typography

interface CorpusFormProps {
  open: boolean
  editingCorpus: Corpus | null
  onClose: () => void
  onSuccess: () => void
}

// ============ 静态选项 ============

const TYPE_OPTIONS = [
  { value: 'text', label: '文本' },
  { value: 'audio', label: '音频' },
  { value: 'video', label: '视频' },
  { value: 'image', label: '图片' },
]

const LANG_OPTIONS = [
  { value: '中文', label: '中文' },
  { value: '英文', label: '英文' },
  { value: '中英', label: '中英' },
  { value: '日文', label: '日文' },
  { value: '韩文', label: '韩文' },
  { value: '粤语', label: '粤语' },
]

const SOURCE_OPTIONS = [
  { value: '线上客服', label: '线上客服' },
  { value: '电话录音', label: '电话录音' },
  { value: '电商评论', label: '电商评论' },
  { value: '广播录音', label: '广播录音' },
  { value: '实地采集', label: '实地采集' },
  { value: 'App日志', label: 'App日志' },
  { value: '新闻网站', label: '新闻网站' },
  { value: '旅游网站', label: '旅游网站' },
  { value: '内部录制', label: '内部录制' },
  { value: '其他', label: '其他' },
]

const PURPOSE_OPTIONS = [
  { value: 'NLP训练', label: 'NLP训练' },
  { value: '意图识别', label: '意图识别' },
  { value: '情感分析', label: '情感分析' },
  { value: 'ASR训练', label: 'ASR训练' },
  { value: '方言识别', label: '方言识别' },
  { value: '降噪训练', label: '降噪训练' },
  { value: '图像描述', label: '图像描述' },
  { value: '机器翻译', label: '机器翻译' },
  { value: '字幕生成', label: '字幕生成' },
]

const ACCEPT_MAP: Record<CorpusType, string> = {
  text: '.txt,.csv,.json',
  audio: '.wav,.mp3,.flac,.ogg',
  video: '.mp4,.avi,.mov,.mkv',
  image: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
}

const TYPE_LABEL: Record<CorpusType, string> = {
  text: '文本', audio: '音频', video: '视频', image: '图片',
}

// ============ 工具函数 ============

const sanitizeFileName = (name: string) =>
  name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]/g, '_').slice(0, 80)

// ============ 组件 ============

export default function CorpusForm({ open, editingCorpus, onClose, onSuccess }: CorpusFormProps) {
  const [form] = Form.useForm()
  const watchType = Form.useWatch('type', form) as CorpusType | undefined
  const watchFileUrl = Form.useWatch('fileUrl', form) as string | undefined
  const watchLibraryId = Form.useWatch('libraryId', form)

  const { libraries, addCorpus, updateCorpus } = useCorpusStore()
  const currentUser = JSON.parse(localStorage.getItem('corpusforge-auth') || '{}')
  const userData = currentUser?.state?.currentUser

  const isEdit = !!editingCorpus
  const currentType: CorpusType = watchType || 'text'
  const isTextType = currentType === 'text'

  // 语料库选项（带类型标签）
  const libraryOptions = useMemo(
    () =>
      libraries.map(l => ({
        value: l.id,
        label: `${l.name}（${l.type === 'public' ? '公开' : l.type === 'private' ? '私有' : '项目'}）`,
      })),
    [libraries],
  )

  // 模拟文件上传
  const handleUpload = useCallback(
    (_: any) => ({
      async onSuccess() {
        await new Promise(r => setTimeout(r, 600))
        return true
      },
    }),
    [],
  )

  // 文件变化处理
  const handleFileChange = useCallback(
    (info: any) => {
      const { status, originFileObj } = info.file
      if (status === 'uploading') return
      if (status === 'done') {
        const fakeUrl = `/mock/${sanitizeFileName((originFileObj as File).name)}`
        form.setFieldValue('fileUrl', fakeUrl)
        message.success(`${(originFileObj as File).name} 上传成功（模拟）`)
      } else if (status === 'error') {
        message.error('上传失败，请重试')
      }
    },
    [form],
  )

  const handleRemoveFile = useCallback(() => {
    form.setFieldValue('fileUrl', undefined)
  }, [form])

  // 编辑态填充
  useEffect(() => {
    if (!open) return
    if (editingCorpus) {
      form.setFieldsValue({
        title: editingCorpus.title,
        type: editingCorpus.type,
        content: editingCorpus.content || '',
        fileUrl: editingCorpus.fileUrl || '',
        libraryId: editingCorpus.libraryId || undefined,
        tags: editingCorpus.tags || [],
        'metadata.language': editingCorpus.metadata?.language || '中文',
        'metadata.source': editingCorpus.metadata?.source || undefined,
        'metadata.purpose': editingCorpus.metadata?.purpose || undefined,
      })
    } else {
      form.resetFields()
      form.setFieldsValue({ type: 'text', 'metadata.language': '中文' })
    }
  }, [open, editingCorpus, form])

  // 切换类型时清空内容和文件（使用 useRef 避免每次渲染创建新对象）
  const prevTypeRef = useRef<CorpusType | undefined>(undefined)
  useEffect(() => {
    if (!open) return
    if (prevTypeRef.current !== undefined && prevTypeRef.current !== watchType) {
      form.setFieldsValue({ content: '', fileUrl: '' })
    }
    prevTypeRef.current = watchType
  }, [watchType, open, form])

  // 提交
  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const tags = (values.tags || []).slice(0, 10)
      const metadata = {
        language: values['metadata.language'] || '中文',
        source: values['metadata.source'] || '',
        purpose: values['metadata.purpose'] || '',
      }

      const commonData = {
        title: values.title,
        type: values.type,
        status: 'draft' as const,
        content: values.type === 'text' ? values.content : '',
        fileUrl: values.type !== 'text' ? values.fileUrl : '',
        libraryId: values.libraryId,
        tags,
        metadata,
        creatorId: userData?.id || (editingCorpus?.creatorId || 'user-001'),
        creatorName: userData?.username || (editingCorpus?.creatorName || 'creator1'),
      }

      if (isEdit && editingCorpus) {
        updateCorpus(editingCorpus.id, commonData)
        message.success('语料已更新，版本历史已记录')
      } else {
        addCorpus(commonData)
        message.success('语料创建成功')
      }

      form.resetFields()
      onSuccess()
      onClose()
    } catch (err: any) {
      if (err?.errorFields?.length > 0) {
        message.warning('请检查表单填写是否完整')
      }
    }
  }

  // ============ 渲染辅助 ============

  const renderContentField = () => {
    if (isTextType) {
      return (
        <Form.Item
          name="content"
          label="文本内容"
          rules={[
            { required: true, message: '请输入文本内容' },
            { max: 5000, message: '文本内容不能超过 5000 字' },
          ]}
        >
          <TextArea
            rows={6}
            placeholder="请输入文本内容（支持粘贴多行）"
            maxLength={5000}
            showCount={{ formatter: ({ value }) => `${value}/5000` }}
          />
        </Form.Item>
      )
    }

    // 非文本类型：文件上传
    return (
      <Form.Item label={`${TYPE_LABEL[currentType]}文件`}>
        {watchFileUrl ? (
          <div
            style={{
              border: '1px dashed #d9d9d9',
              borderRadius: 8,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#fafafa',
            }}
          >
            <Space>
              <FileOutlined style={{ fontSize: 20, color: '#1677ff' }} />
              <Text copyable>{watchFileUrl.replace('/mock/', '')}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                （模拟路径）
              </Text>
            </Space>
            <Link onClick={handleRemoveFile} style={{ color: '#ff4d4f' }}>
              <DeleteOutlined /> 移除
            </Link>
          </div>
        ) : (
          <Dragger
            name="file"
            accept={ACCEPT_MAP[currentType]}
            maxCount={1}
            showUploadList={false}
            customRequest={handleUpload as any}
            onChange={handleFileChange}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽上传{TYPE_LABEL[currentType]}文件</p>
            <p className="ant-upload-hint">
              支持 {ACCEPT_MAP[currentType]} 格式，单文件最大 500MB（模拟上传）
            </p>
          </Dragger>
        )}
        <Form.Item
          name="fileUrl"
          hidden
          rules={[{ required: !isTextType, message: `请上传${TYPE_LABEL[currentType]}文件` }]}
        >
          <Input />
        </Form.Item>
      </Form.Item>
    )
  }

  return (
    <Modal
      title={isEdit ? '编辑语料' : '新建语料'}
      open={open}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields()
        onClose()
      }}
      okText={isEdit ? '保存' : '创建'}
      cancelText="取消"
      width={700}
      destroyOnClose
      afterOpenChange={visible => {
        if (visible && !isEdit) {
          form.resetFields()
          form.setFieldsValue({ type: 'text', 'metadata.language': '中文' })
        }
      }}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }} requiredMark="optional">
        {/* ===== 标题 ===== */}
        <Form.Item
          name="title"
          label="标题"
          rules={[
            { required: true, message: '请输入语料标题' },
            { min: 2, message: '标题至少 2 个字符' },
            { max: 100, message: '标题不能超过 100 个字符' },
            {
              pattern: /^[^\<\>\"\'\%\&]+$/,
              message: '标题不能包含特殊字符 < > " \' % &',
            },
          ]}
        >
          <Input placeholder="请输入语料标题" maxLength={100} showCount allowClear />
        </Form.Item>

        {/* ===== 类型 + 语料库 ===== */}
        <Space size="large" style={{ display: 'flex', width: '100%' }}>
          <Form.Item
            name="type"
            label="语料类型"
            rules={[{ required: true, message: '请选择语料类型' }]}
            style={{ flex: 1 }}
          >
            <Select options={TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="libraryId"
            label="所属语料库"
            rules={[{ required: true, message: '请选择语料库' }]}
            style={{ flex: 2 }}
          >
            <Select placeholder="选择语料库" allowClear options={libraryOptions} />
          </Form.Item>
        </Space>

        {/* ===== 未选语料库提示 ===== */}
        {!watchLibraryId && (
          <div
            style={{
              padding: '6px 12px',
              background: '#fffbe6',
              borderRadius: 6,
              fontSize: 13,
              color: '#d46b08',
              marginBottom: 16,
            }}
          >
            <ExclamationCircleOutlined style={{ marginRight: 6 }} />
            未选择语料库，建议先选择所属语料库以便管理
          </div>
        )}

        {/* ===== 动态内容区域 ===== */}
        {renderContentField()}

        <Divider dashed style={{ margin: '8px 0 16px' }} />

        {/* ===== 标签 ===== */}
        <Form.Item
          name="tags"
          label="标签"
          rules={[{ type: 'array' as any, max: 10, message: '最多添加 10 个标签' }]}
        >
          <Select
            mode="tags"
            placeholder="输入标签后回车添加（最多 10 个）"
            style={{ width: '100%' }}
            maxTagCount={5}
          />
        </Form.Item>

        {/* ===== 元数据 ===== */}
        <Space size="large" style={{ display: 'flex', width: '100%' }}>
          <Form.Item name="metadata.language" label="语言" style={{ flex: 1 }}>
            <Select options={LANG_OPTIONS} />
          </Form.Item>
          <Form.Item name="metadata.source" label="来源" style={{ flex: 1 }}>
            <Select options={SOURCE_OPTIONS} allowClear placeholder="选择或输入来源" showSearch />
          </Form.Item>
          <Form.Item name="metadata.purpose" label="用途" style={{ flex: 1 }}>
            <Select options={PURPOSE_OPTIONS} allowClear placeholder="选择用途" showSearch />
          </Form.Item>
        </Space>

        {/* ===== 编辑态提示 ===== */}
        {isEdit && (
          <div
            style={{
              padding: '8px 12px',
              background: '#e6f4ff',
              borderRadius: 6,
              fontSize: 13,
              color: '#0958d9',
            }}
          >
            编辑后系统将自动记录版本变更历史（标题、内容、类型、标签、语料库、元数据的变更均会被追踪）
          </div>
        )}
      </Form>
    </Modal>
  )
}
