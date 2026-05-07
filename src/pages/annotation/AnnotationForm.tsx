import { useEffect, useMemo } from 'react'
import { Modal, Form, Input, Select, Space, Tag, Typography, Divider, Alert } from 'antd'
import {
  UserOutlined,
  TagsOutlined,
} from '@ant-design/icons'
import type { AnnotationTask, Label } from '../../types'
import { useCorpusStore } from '../../stores/corpusStore'
import { useAuthStore } from '../../stores/authStore'

const { TextArea } = Input
const { Text } = Typography

interface AnnotationFormProps {
  open: boolean
  editingTask: AnnotationTask | null
  onClose: () => void
  onSuccess: () => void
}

// ============ 静态选项 ============

const PRIORITY_OPTIONS = [
  { value: 'high', label: '高', color: '#f5222d' },
  { value: 'medium', label: '中', color: '#fa8c16' },
  { value: 'low', label: '低', color: '#52c41a' },
]

const STATUS_OPTIONS = [
  { value: 'pending', label: '待开始' },
  { value: 'in_progress', label: '进行中' },
  { value: 'paused', label: '已暂停' },
  { value: 'completed', label: '已完成' },
  { value: 'stopped', label: '已停止' },
]

// 标注标签选项（模拟）
const LABEL_OPTIONS: Label[] = [
  { id: 'lb-ner-per', type: 'ner', name: 'person', nameZh: '人名', color: '#f5222d' },
  { id: 'lb-ner-org', type: 'ner', name: 'organization', nameZh: '机构名', color: '#1677ff' },
  { id: 'lb-ner-loc', type: 'ner', name: 'location', nameZh: '地名', color: '#52c41a' },
  { id: 'lb-ner-date', type: 'ner', name: 'date', nameZh: '日期', color: '#722ed1' },
  { id: 'lb-sent-pos', type: 'sentiment', name: 'positive', nameZh: '正面', color: '#fa8c16' },
  { id: 'lb-sent-neg', type: 'sentiment', name: 'negative', nameZh: '负面', color: '#eb2f96' },
  { id: 'lb-sent-neu', type: 'sentiment', name: 'neutral', nameZh: '中性', color: '#8c8c8c' },
  { id: 'lb-int-buy', type: 'intent', name: 'buy', nameZh: '购买意图', color: '#13c2c2' },
  { id: 'lb-int-query', type: 'intent', name: 'query_order', nameZh: '查询订单', color: '#2f54eb' },
  { id: 'lb-int-cancel', type: 'intent', name: 'cancel', nameZh: '取消意图', color: '#a0d911' },
  { id: 'lb-cls-rel', type: 'classification', name: 'relevant', nameZh: '相关', color: '#fa541c' },
  { id: 'lb-cls-irrel', type: 'classification', name: 'irrelevant', nameZh: '不相关', color: '#bfbfbf' },
]

// ============ 组件 ============

export default function AnnotationForm({
  open,
  editingTask,
  onClose,
  onSuccess,
}: AnnotationFormProps) {
  const [form] = Form.useForm()
  const isEdit = !!editingTask

  const { libraries } = useCorpusStore()
  const { users } = useAuthStore()

  // 可作为标注员的用户（有 annotator 或 reviewer 角色）
  const annotatorOptions = useMemo(
    () =>
      users
        .filter(u => u.status === 'active' && u.roles.some(r => ['annotator', 'reviewer', 'admin', 'super_admin'].includes(r)))
        .map(u => ({
          value: u.id,
          label: `${u.username}（${u.department || '未设置部门'}）`,
        })),
    [users],
  )

  // 可作为审核员的用户
  const reviewerOptions = useMemo(
    () =>
      users
        .filter(u => u.status === 'active' && u.roles.some(r => ['reviewer', 'admin', 'super_admin'].includes(r)))
        .map(u => ({
          value: u.id,
          label: `${u.username}（${u.department || '未设置部门'}）`,
        })),
    [users],
  )

  const libraryOptions = useMemo(
    () => libraries.map(l => ({ value: l.id, label: `${l.name}（${l.corpusCount} 条语料）` })),
    [libraries],
  )

  // 编辑态填充
  useEffect(() => {
    if (!open) return
    if (editingTask) {
      form.setFieldsValue({
        name: editingTask.name,
        description: editingTask.description || '',
        corpusLibraryId: editingTask.corpusLibraryId,
        labelSet: editingTask.labelSet?.map(l => l.id) || [],
        priority: editingTask.priority,
        status: editingTask.status,
        annotatorIds: editingTask.annotatorIds,
        reviewerId: editingTask.reviewerId || undefined,
        deadline: editingTask.deadline ? editingTask.deadline.slice(0, 10) : undefined,
      })
    } else {
      form.resetFields()
      form.setFieldsValue({ priority: 'medium', status: 'pending' })
    }
  }, [open, editingTask, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const { addTask, updateTask } = (await import('../../stores/annotationStore')).useAnnotationStore.getState()

      const commonData = {
        name: values.name,
        description: values.description || '',
        corpusLibraryId: values.corpusLibraryId,
        corpusIds: [], // 新建任务时为空，实际项目中应从语料库选择
        labelSet: LABEL_OPTIONS.filter(l => (values.labelSet || []).includes(l.id)),
        priority: values.priority,
        annotatorIds: values.annotatorIds || [],
        reviewerId: values.reviewerId || undefined,
        deadline: values.deadline ? new Date(values.deadline).toISOString() : undefined,
      }

      if (isEdit && editingTask) {
        updateTask(editingTask.id, {
          ...commonData,
          status: values.status || editingTask.status,
        })
      } else {
        addTask({
          ...commonData,
          status: 'pending',
          createdBy: 'admin-001',
        })
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      if (err?.errorFields?.length > 0) {
        // 表单校验失败，antd 会自动展示错误
      }
    }
  }

  return (
    <Modal
      title={isEdit ? '编辑标注任务' : '新建标注任务'}
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onClose() }}
      okText={isEdit ? '保存' : '创建'}
      cancelText="取消"
      width={720}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }} requiredMark="optional">
        {/* ===== 任务名称 ===== */}
        <Form.Item
          name="name"
          label="任务名称"
          rules={[
            { required: true, message: '请输入任务名称' },
            { max: 100, message: '任务名称不能超过 100 个字符' },
          ]}
        >
          <Input placeholder="例如：客服对话-NER标注" maxLength={100} showCount allowClear />
        </Form.Item>

        {/* ===== 任务描述 ===== */}
        <Form.Item
          name="description"
          label="任务描述"
        >
          <TextArea rows={3} placeholder="描述标注任务的目标和要求（选填）" maxLength={500} showCount />
        </Form.Item>

        <Divider dashed style={{ margin: '8px 0 16px' }} />

        {/* ===== 语料库 + 优先级 ===== */}
        <Space size="large" style={{ display: 'flex', width: '100%' }}>
          <Form.Item
            name="corpusLibraryId"
            label="关联语料库"
            rules={[{ required: true, message: '请选择语料库' }]}
            style={{ flex: 1 }}
          >
            <Select
              placeholder="选择语料库"
              allowClear
              options={libraryOptions}
              showSearch
            />
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请选择优先级' }]}
            style={{ width: 140 }}
          >
            <Select options={PRIORITY_OPTIONS} />
          </Form.Item>

          {isEdit && (
            <Form.Item
              name="status"
              label="状态"
              style={{ width: 140 }}
            >
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          )}
        </Space>

        {/* ===== 标注标签集 ===== */}
        <Form.Item
          name="labelSet"
          label={
            <Space>
              <TagsOutlined />
              <span>标注标签集</span>
            </Space>
          }
          rules={[{ required: true, message: '请至少选择一个标注标签' }]}
        >
          <Select
            mode="multiple"
            placeholder="选择此任务使用的标注标签"
            options={[
              {
                label: '命名实体（NER）',
                options: LABEL_OPTIONS.filter(l => l.type === 'ner').map(l => ({
                  value: l.id,
                  label: (
                    <Space>
                      <Tag color={l.color} style={{ margin: 0 }}>{l.nameZh}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>{l.name}</Text>
                    </Space>
                  ),
                })),
              },
              {
                label: '情感分析',
                options: LABEL_OPTIONS.filter(l => l.type === 'sentiment').map(l => ({
                  value: l.id,
                  label: (
                    <Space>
                      <Tag color={l.color} style={{ margin: 0 }}>{l.nameZh}</Tag>
                    </Space>
                  ),
                })),
              },
              {
                label: '意图识别',
                options: LABEL_OPTIONS.filter(l => l.type === 'intent').map(l => ({
                  value: l.id,
                  label: (
                    <Space>
                      <Tag color={l.color} style={{ margin: 0 }}>{l.nameZh}</Tag>
                    </Space>
                  ),
                })),
              },
              {
                label: '分类',
                options: LABEL_OPTIONS.filter(l => l.type === 'classification').map(l => ({
                  value: l.id,
                  label: (
                    <Space>
                      <Tag color={l.color} style={{ margin: 0 }}>{l.nameZh}</Tag>
                    </Space>
                  ),
                })),
              },
            ]}
          />
        </Form.Item>

        <Divider dashed style={{ margin: '8px 0 16px' }} />

        {/* ===== 分配标注员 + 审核员 ===== */}
        <Space size="large" style={{ display: 'flex', width: '100%' }}>
          <Form.Item
            name="annotatorIds"
            label={
              <Space>
                <UserOutlined />
                <span>分配标注员</span>
              </Space>
            }
            rules={[{ required: true, message: '请至少分配一名标注员' }]}
            style={{ flex: 1 }}
          >
            <Select
              mode="multiple"
              placeholder="选择标注员"
              options={annotatorOptions}
              maxTagCount={3}
            />
          </Form.Item>

          <Form.Item
            name="reviewerId"
            label={
              <Space>
                <UserOutlined />
                <span>审核员</span>
              </Space>
            }
            style={{ flex: 1 }}
          >
            <Select
              placeholder="选择审核员（选填）"
              allowClear
              options={reviewerOptions}
            />
          </Form.Item>
        </Space>

        {/* ===== 截止日期 ===== */}
        <Form.Item
          name="deadline"
          label="截止日期"
        >
          <Input type="date" style={{ width: 240 }} />
        </Form.Item>

        {/* ===== 提示 ===== */}
        <Alert
          type="info"
          showIcon
          message="关于语料分配"
          description="新建任务后，可在任务详情页中从关联语料库批量分配语料给标注员。当前版本为演示模式，语料分配功能正在完善中。"
          style={{ marginTop: 8 }}
        />
      </Form>
    </Modal>
  )
}
