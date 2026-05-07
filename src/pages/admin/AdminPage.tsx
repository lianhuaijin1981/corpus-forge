import { Typography, Card, Tabs, Table, Button, Space, Tag, Avatar, Input, Modal, message } from 'antd'
import {
  UserOutlined,
  SafetyOutlined,
  SettingOutlined,
  DatabaseOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useState } from 'react'
import type { User, UserRole, UserStatus } from '../../types'
import { useAuthStore } from '../../stores/authStore'

const { Title, Text } = Typography
const { confirm } = Modal

// Mock 数据（从 store 获取）
export default function AdminPage() {
  const { users } = useAuthStore()
  const [searchText, setSearchText] = useState('')

  const roleColor: Record<UserRole, string> = {
    super_admin: 'red',
    admin: 'volcano',
    creator: 'blue',
    annotator: 'green',
    reviewer: 'purple',
    user: 'default',
    guest: 'default',
  }

  const roleLabel: Record<UserRole, string> = {
    super_admin: '超级管理员',
    admin: '管理员',
    creator: '创建者',
    annotator: '标注员',
    reviewer: '审核员',
    user: '普通用户',
    guest: '访客',
  }

  const statusLabel: Record<UserStatus, string> = {
    active: '正常',
    disabled: '已禁用',
    pending: '待审核',
  }

  const columns = [
    { title: '用户', dataIndex: 'username', key: 'username',
      render: (text: string, record: User) => (
        <Space>
          <Avatar icon={<UserOutlined />} src={record.avatar} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '角色', dataIndex: 'roles', key: 'roles',
      render: (roles: UserRole[]) => roles.map(r => <Tag color={roleColor[r]}>{roleLabel[r]}</Tag>),
    },
    { title: '状态', dataIndex: 'status', key: 'status',
      render: (s: UserStatus) => <Tag>{statusLabel[s]}</Tag>,
    },
    { title: '部门', dataIndex: 'department', key: 'department' },
    { title: '操作', key: 'action',
      render: (_: any, record: User) => (
        <Space>
          <Button size="small" icon={<EditOutlined />}>编辑</Button>
          <Button size="small" danger icon={<DeleteOutlined />}
            onClick={() => {
              confirm({
                title: `确认禁用用户「${record.username}」？`,
                icon: <ExclamationCircleOutlined />,
                onOk() { message.success('操作成功'); },
              })
            }}
          >禁用</Button>
        </Space>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'users',
      label: <span><UserOutlined /> 用户管理</span>,
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Input placeholder="搜索用户..." prefix={<UserOutlined />} style={{ width: 250 }}
              value={searchText} onChange={e => setSearchText(e.target.value)}
            />
            <Button type="primary" icon={<PlusOutlined />}>新建用户</Button>
          </div>
          <Table rowKey="id" dataSource={users} columns={columns} size="small"
            pagination={{ pageSize: 10 }}
          />
        </>
      ),
    },
    {
      key: 'roles',
      label: <span><SafetyOutlined /> 角色权限</span>,
      children: (
        <Card size="small" title="角色列表">
          <Table rowKey="id" dataSource={[]} columns={[
            { title: '角色名', dataIndex: 'nameZh' },
            { title: '英文标识', dataIndex: 'name' },
            { title: '权限数', dataIndex: 'permissions', render: (p: string[]) => p?.length || 0 },
            { title: '级别', dataIndex: 'level' },
            { title: '操作', render: () => <Button size="small">编辑权限</Button> },
          ]} size="small" pagination={false} />
        </Card>
      ),
    },
    {
      key: 'system',
      label: <span><SettingOutlined /> 系统配置</span>,
      children: (
        <Card size="small" title="系统设置">
          <p>平台名称、Logo、会话超时、密码策略等配置项...</p>
        </Card>
      ),
    },
    {
      key: 'logs',
      label: <span><DatabaseOutlined /> 操作日志</span>,
      children: (
        <Card size="small" title="系统日志">
          <Table rowKey="id" dataSource={[]} columns={[
            { title: '时间', dataIndex: 'createdAt' },
            { title: '用户', dataIndex: 'userName' },
            { title: '操作', dataIndex: 'action' },
            { title: '目标', dataIndex: 'targetName' },
          ]} size="small" pagination={{ pageSize: 20 }} />
        </Card>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>系统管理</Title>
      <Card size="small">
        <Tabs items={tabItems} />
      </Card>
    </div>
  )
}
