import { useState, useEffect } from 'react'
import {
  Typography, Card, Button, Space, Input, Table, Tag, Modal, Form,
  Select, Descriptions, Popconfirm, message,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import type { CorpusLibrary, UserRole } from '../../types'
import { useCorpusStore } from '../../stores/corpusStore'

const { Title, Text } = Typography
const { TextArea } = Input

const typeLabel: Record<string, string> = {
  public: '公开', private: '私有', project: '项目',
}
const typeColor: Record<string, string> = {
  public: 'green', private: 'red', project: 'blue',
}
const roleLabel: Record<UserRole, string> = {
  super_admin: '超级管理员', admin: '管理员', creator: '创建者',
  annotator: '标注员', reviewer: '审核员', user: '普通用户', guest: '访客',
}

export default function CorpusLibraryPage() {
  const { libraries, addLibrary, updateLibrary, deleteLibrary, refreshLibraryCounts } = useCorpusStore()
  const [searchText, setSearchText] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLib, setEditingLib] = useState<CorpusLibrary | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLib, setDetailLib] = useState<CorpusLibrary | null>(null)
  const [form] = Form.useForm()

  const isEdit = !!editingLib

  // 刷新语料库计数
  useEffect(() => { refreshLibraryCounts() }, [refreshLibraryCounts])

  const filteredLibraries = searchText
    ? libraries.filter(l => l.name.toLowerCase().includes(searchText.toLowerCase()) || l.description?.toLowerCase().includes(searchText.toLowerCase()))
    : libraries

  const handleAdd = () => {
    setEditingLib(null)
    form.resetFields()
    form.setFieldsValue({ type: 'public' })
    setModalOpen(true)
  }

  const handleEdit = (lib: CorpusLibrary) => {
    setEditingLib(lib)
    form.setFieldsValue({
      name: lib.name,
      description: lib.description || '',
      type: lib.type,
      tags: lib.tags || [],
      accessRoles: lib.accessRoles || [],
    })
    setModalOpen(true)
  }

  const handleViewDetail = (lib: CorpusLibrary) => {
    setDetailLib(lib)
    setDetailOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteLibrary(id)
    message.success('语料库已删除')
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      const tags = values.tags || []
      const accessRoles = values.accessRoles || []

      if (isEdit && editingLib) {
        updateLibrary(editingLib.id, { name: values.name, description: values.description, type: values.type, tags, accessRoles })
        message.success('语料库已更新')
      } else {
        // 获取当前用户
        const userData = JSON.parse(localStorage.getItem('corpusforge-auth') || '{}')
        const user = userData?.state?.currentUser
        addLibrary({
          name: values.name,
          description: values.description || '',
          type: values.type,
          tags,
          accessRoles,
          accessUsers: [],
          ownerId: user?.id || 'admin-001',
          ownerName: user?.username || 'admin',
        })
        message.success('语料库已创建')
      }

      form.resetFields()
      setModalOpen(false)
      setEditingLib(null)
    } catch {
      // 校验失败
    }
  }

  const columns: ColumnsType<CorpusLibrary> = [
    {
      title: '语料库名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: CorpusLibrary) => (
        <a onClick={() => handleViewDetail(record)} style={{ fontWeight: 500 }}>{name}</a>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => <Tag color={typeColor[type]}>{typeLabel[type]}</Tag>,
    },
    {
      title: '语料数量',
      dataIndex: 'corpusCount',
      key: 'corpusCount',
      width: 100,
      sorter: (a, b) => a.corpusCount - b.corpusCount,
      render: (count: number) => <Text>{count} 条</Text>,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      ellipsis: true,
      render: (tags: string[]) => tags?.length > 0
        ? tags.slice(0, 3).map((t, i) => <Tag key={i} style={{ marginBottom: 2 }}>{t}</Tag>)
        : <Text type="secondary">-</Text>,
    },
    {
      title: '创建人',
      dataIndex: 'ownerName',
      key: 'ownerName',
      width: 90,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      sorter: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: CorpusLibrary) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="确认删除？"
            description={`删除语料库「${record.name}」？`}
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>语料库管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建语料库</Button>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索语料库名称..."
          prefix={<SearchOutlined />}
          style={{ width: 280 }}
          allowClear
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
      </Card>

      <Card size="small">
        <Table<CorpusLibrary>
          rowKey="id"
          dataSource={filteredLibraries}
          columns={columns}
          size="middle"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `共 ${total} 个语料库`,
          }}
        />
      </Card>

      {/* 新建/编辑 Modal */}
      <Modal
        title={isEdit ? '编辑语料库' : '新建语料库'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => { setModalOpen(false); form.resetFields(); setEditingLib(null) }}
        okText={isEdit ? '保存' : '创建'}
        cancelText="取消"
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入语料库名称' }]}>
            <Input placeholder="请输入语料库名称" maxLength={50} showCount />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="语料库描述" maxLength={200} showCount />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'public', label: '公开' },
                { value: 'private', label: '私有' },
                { value: 'project', label: '项目' },
              ]}
            />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入标签后回车" />
          </Form.Item>
          <Form.Item name="accessRoles" label="可访问角色">
            <Select
              mode="multiple"
              placeholder="选择可访问的角色"
              options={Object.entries(roleLabel)
                .filter(([k]) => k !== 'super_admin' && k !== 'guest')
                .map(([v, l]) => ({ value: v, label: l }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情 Modal */}
      <Modal
        title="语料库详情"
        open={detailOpen}
        onCancel={() => { setDetailOpen(false); setDetailLib(null) }}
        footer={[
          <Button key="edit" type="primary" icon={<EditOutlined />}
            onClick={() => { setDetailOpen(false); if (detailLib) handleEdit(detailLib) }}
          >
            编辑
          </Button>,
          <Button key="close" onClick={() => { setDetailOpen(false); setDetailLib(null) }}>
            关闭
          </Button>,
        ]}
        width={560}
      >
        {detailLib && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="名称" span={2}>{detailLib.name}</Descriptions.Item>
            <Descriptions.Item label="类型">
              <Tag color={typeColor[detailLib.type]}>{typeLabel[detailLib.type]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="语料数量">{detailLib.corpusCount} 条</Descriptions.Item>
            <Descriptions.Item label="创建人">{detailLib.ownerName}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{dayjs(detailLib.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>{detailLib.description || '-'}</Descriptions.Item>
            <Descriptions.Item label="标签" span={2}>
              <Space wrap>
                {detailLib.tags.map((t, i) => <Tag key={i}>{t}</Tag>)}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="可访问角色" span={2}>
              <Space wrap>
                {detailLib.accessRoles.map((r, i) => <Tag key={i} color="blue">{roleLabel[r as UserRole] || r}</Tag>)}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
