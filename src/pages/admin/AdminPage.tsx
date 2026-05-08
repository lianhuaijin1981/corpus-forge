import {
  Typography, Card, Tabs, Table, Button, Space, Tag, Avatar,
  Input, Modal, message, Form, Select, Descriptions, Switch,
  Row, Col, Statistic, Popconfirm, Badge,
} from 'antd'
import {
  UserOutlined,
  SafetyOutlined,
  SettingOutlined,
  DatabaseOutlined,
  PlusOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  TeamOutlined,
  LockOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useState, useMemo, useRef } from 'react'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import type { User, UserRole, UserStatus, Log } from '../../types'
import { useAuthStore } from '../../stores/authStore'
import { v4 as uuidv4 } from 'uuid'

const { Title, Text } = Typography

const roleColor: Record<UserRole, string> = {
  super_admin: 'red', admin: 'volcano', creator: 'blue',
  annotator: 'green', reviewer: 'purple', user: 'default', guest: 'default',
}

const roleLabel: Record<UserRole, string> = {
  super_admin: '超级管理员', admin: '管理员', creator: '创建者',
  annotator: '标注员', reviewer: '审核员', user: '普通用户', guest: '访客',
}

const statusLabel: Record<UserStatus, string> = {
  active: '正常', disabled: '已禁用', pending: '待审核',
}

const statusColor: Record<UserStatus, string> = {
  active: 'green', disabled: 'red', pending: 'orange',
}

// ============ 操作日志 Store (module-level, persisted to localStorage) ============

const LOG_KEY = 'corpusforge-operation-logs'

function loadLogs(): Log[] {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return [
    { id: uuidv4(), userId: 'admin-001', userName: 'admin', action: '系统初始化', targetType: 'system', targetName: 'CorpusForge', createdAt: '2024-03-25T10:30:00Z' },
    { id: uuidv4(), userId: 'user-001', userName: 'creator1', action: '上传语料', targetType: 'corpus', targetName: '客服对话-产品咨询001', createdAt: '2024-03-24T16:20:00Z' },
    { id: uuidv4(), userId: 'user-003', userName: 'reviewer1', action: '审核通过', targetType: 'review', targetName: '客服对话-售后退换002', createdAt: '2024-03-23T09:15:00Z' },
    { id: uuidv4(), userId: 'admin-001', userName: 'admin', action: '创建标注任务', targetType: 'annotation', targetName: '客服对话-NER标注', createdAt: '2024-03-22T14:45:00Z' },
    { id: uuidv4(), userId: 'admin-001', userName: 'admin', action: '创建语料库', targetType: 'library', targetName: '意图识别训练集', createdAt: '2024-03-21T11:00:00Z' },
  ]
}

function saveLogs(logs: Log[]) {
  localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(0, 200)))
}

function appendLog(action: string, targetType: string, targetName: string, userId = 'admin-001', userName = 'admin') {
  const logs = loadLogs()
  const newLog: Log = {
    id: uuidv4(),
    userId,
    userName,
    action,
    targetType,
    targetName,
    createdAt: new Date().toISOString(),
  }
  saveLogs([newLog, ...logs])
  return newLog
}

// ============ 系统配置本地持久化 ============

const CONFIG_KEY = 'corpusforge-sys-config'

interface SysConfig {
  platformName: string
  sessionTimeout: number
  passwordMinLength: number
  passwordRequireSpecial: boolean
  maxFileSizeMB: number
  emailNotify: boolean
  smsNotify: boolean
  inAppNotify: boolean
}

const DEFAULT_CONFIG: SysConfig = {
  platformName: 'CorpusForge',
  sessionTimeout: 30,
  passwordMinLength: 6,
  passwordRequireSpecial: false,
  maxFileSizeMB: 500,
  emailNotify: true,
  smsNotify: false,
  inAppNotify: true,
}

function loadConfig(): SysConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return DEFAULT_CONFIG
}

function saveConfig(cfg: SysConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg))
}

// ============ 新建/编辑用户表单 ============

interface UserFormValues {
  username: string
  email: string
  phone?: string
  password?: string
  roles: UserRole[]
  status: UserStatus
  department?: string
}

function UserFormModal({
  open,
  editingUser,
  onClose,
  onSuccess,
}: {
  open: boolean
  editingUser: User | null
  onClose: () => void
  onSuccess: (action: string, name: string) => void
}) {
  const [form] = Form.useForm<UserFormValues>()
  const { users } = useAuthStore()
  const isEdit = !!editingUser

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      if (isEdit && editingUser) {
        useAuthStore.setState(state => ({
          users: state.users.map(u =>
            u.id === editingUser.id
              ? {
                  ...u,
                  username: values.username,
                  email: values.email,
                  phone: values.phone,
                  roles: values.roles,
                  status: values.status,
                  department: values.department,
                  updatedAt: new Date().toISOString(),
                  ...(values.password ? { password: values.password } : {}),
                }
              : u
          ),
        }))
        message.success('用户已更新')
        onSuccess('编辑用户', values.username)
      } else {
        if (users.some(u => u.username === values.username)) {
          form.setFields([{ name: 'username', errors: ['用户名已存在'] }])
          return
        }
        if (users.some(u => u.email === values.email)) {
          form.setFields([{ name: 'email', errors: ['邮箱已被注册'] }])
          return
        }
        const newUser: User = {
          id: uuidv4(),
          username: values.username,
          email: values.email,
          phone: values.phone,
          password: values.password || '123456',
          roles: values.roles,
          status: values.status || 'active',
          department: values.department,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        useAuthStore.setState(state => ({ users: [...state.users, newUser] }))
        message.success('用户已创建，默认密码：' + (values.password || '123456'))
        onSuccess('新建用户', values.username)
      }
      form.resetFields()
      onClose()
    } catch { /* form validation failed */ }
  }

  const afterOpenChange = (visible: boolean) => {
    if (visible && editingUser) {
      form.setFieldsValue({
        username: editingUser.username,
        email: editingUser.email,
        phone: editingUser.phone,
        roles: editingUser.roles,
        status: editingUser.status,
        department: editingUser.department,
      })
    } else if (!visible) {
      form.resetFields()
    }
  }

  return (
    <Modal
      title={isEdit ? '编辑用户' : '新建用户'}
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onClose() }}
      okText={isEdit ? '保存' : '创建'}
      cancelText="取消"
      width={560}
      afterOpenChange={afterOpenChange}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }} requiredMark="optional">
        <Form.Item
          name="username"
          label="用户名"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 3, message: '用户名至少 3 个字符' },
            { max: 32, message: '用户名不超过 32 个字符' },
          ]}
        >
          <Input placeholder="请输入用户名" allowClear disabled={isEdit} />
        </Form.Item>
        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '邮箱格式不正确' },
          ]}
        >
          <Input placeholder="请输入邮箱" allowClear />
        </Form.Item>
        <Space size="large" style={{ display: 'flex', width: '100%' }}>
          <Form.Item name="phone" label="手机号" style={{ flex: 1 }}>
            <Input placeholder="请输入手机号（选填）" />
          </Form.Item>
          <Form.Item name="department" label="部门" style={{ flex: 1 }}>
            <Input placeholder="所属部门（选填）" />
          </Form.Item>
        </Space>
        <Form.Item
          name="roles"
          label="角色"
          rules={[{ required: true, message: '请至少选择一个角色' }]}
        >
          <Select
            mode="multiple"
            placeholder="选择角色"
            options={Object.entries(roleLabel).map(([v, l]) => ({ value: v, label: l }))}
          />
        </Form.Item>
        <Space size="large" style={{ display: 'flex', width: '100%' }}>
          <Form.Item name="status" label="状态" style={{ flex: 1 }} initialValue="active">
            <Select
              options={[
                { value: 'active', label: '正常' },
                { value: 'pending', label: '待审核' },
                { value: 'disabled', label: '已禁用' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="password"
            label={isEdit ? '重置密码（选填）' : '初始密码'}
            style={{ flex: 1 }}
          >
            <Input.Password placeholder={isEdit ? '不填则不修改' : '默认 123456'} />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  )
}

// ============ 批量角色分配弹窗 ============

function BatchRoleModal({
  open,
  selectedUsers,
  onClose,
  onSuccess,
}: {
  open: boolean
  selectedUsers: User[]
  onClose: () => void
  onSuccess: (action: string, names: string) => void
}) {
  const [roles, setRoles] = useState<UserRole[]>([])

  const handleOk = () => {
    if (!roles.length) { message.warning('请至少选择一个角色'); return }
    useAuthStore.setState(state => ({
      users: state.users.map(u =>
        selectedUsers.some(su => su.id === u.id)
          ? { ...u, roles, updatedAt: new Date().toISOString() }
          : u
      ),
    }))
    message.success(`已为 ${selectedUsers.length} 个用户分配角色`)
    onSuccess('批量分配角色', selectedUsers.map(u => u.username).join('、'))
    setRoles([])
    onClose()
  }

  return (
    <Modal
      title={`批量分配角色（已选 ${selectedUsers.length} 人）`}
      open={open}
      onOk={handleOk}
      onCancel={() => { setRoles([]); onClose() }}
      okText="确认分配"
      width={440}
    >
      <Form layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="目标角色（将覆盖原角色）">
          <Select
            mode="multiple"
            placeholder="选择角色"
            value={roles}
            onChange={setRoles}
            options={Object.entries(roleLabel).map(([v, l]) => ({ value: v, label: l }))}
          />
        </Form.Item>
        <Text type="secondary" style={{ fontSize: 12 }}>
          <WarningOutlined style={{ marginRight: 4 }} />
          此操作将覆盖所选用户的现有角色，请谨慎操作。
        </Text>
      </Form>
    </Modal>
  )
}

// ============ 主组件 ============

export default function AdminPage() {
  const { users } = useAuthStore()
  const [searchText, setSearchText] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [detailUser, setDetailUser] = useState<User | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [batchRoleOpen, setBatchRoleOpen] = useState(false)
  const [logs, setLogs] = useState<Log[]>(loadLogs)
  const [sysConfig, setSysConfig] = useState<SysConfig>(loadConfig)
  const [configEdited, setConfigEdited] = useState(false)
  const [logSearch, setLogSearch] = useState('')
  const configFormRef = useRef<SysConfig>(sysConfig)

  const filteredUsers = useMemo(
    () =>
      searchText
        ? users.filter(
            u =>
              u.username.toLowerCase().includes(searchText.toLowerCase()) ||
              u.email.toLowerCase().includes(searchText.toLowerCase()) ||
              u.department?.toLowerCase().includes(searchText.toLowerCase())
          )
        : users,
    [users, searchText],
  )

  const selectedUsers = useMemo(
    () => users.filter(u => selectedRowKeys.includes(u.id)),
    [users, selectedRowKeys],
  )

  const handleLogAppend = (action: string, targetName: string, targetType = 'user') => {
    const newLog = appendLog(action, targetType, targetName)
    setLogs(prev => [newLog, ...prev])
  }

  const handleToggleStatus = (record: User) => {
    const isDisabling = record.status === 'active'
    Modal.confirm({
      title: isDisabling ? `确认禁用用户「${record.username}」？` : `确认启用用户「${record.username}」？`,
      content: isDisabling
        ? '禁用后该用户将无法登录系统。'
        : '启用后该用户可正常登录系统。',
      okText: isDisabling ? '确认禁用' : '确认启用',
      okType: isDisabling ? 'danger' : 'primary',
      cancelText: '取消',
      onOk: () => {
        const newStatus: UserStatus = isDisabling ? 'disabled' : 'active'
        useAuthStore.setState(state => ({
          users: state.users.map(u =>
            u.id === record.id
              ? { ...u, status: newStatus, updatedAt: new Date().toISOString() }
              : u
          ),
        }))
        message.success(isDisabling ? '用户已禁用' : '用户已启用')
        handleLogAppend(isDisabling ? '禁用用户' : '启用用户', record.username)
      },
    })
  }

  const handleApprovePending = (record: User) => {
    useAuthStore.setState(state => ({
      users: state.users.map(u =>
        u.id === record.id
          ? { ...u, status: 'active' as UserStatus, updatedAt: new Date().toISOString() }
          : u
      ),
    }))
    message.success(`用户「${record.username}」已审核通过`)
    handleLogAppend('审批通过用户', record.username)
  }

  // 批量禁用/启用
  const handleBatchToggle = (disable: boolean) => {
    const names = selectedUsers.map(u => u.username).join('、')
    Modal.confirm({
      title: `确认${disable ? '禁用' : '启用'}选中的 ${selectedUsers.length} 个用户？`,
      okType: disable ? 'danger' : 'primary',
      okText: disable ? '确认禁用' : '确认启用',
      cancelText: '取消',
      onOk: () => {
        const newStatus: UserStatus = disable ? 'disabled' : 'active'
        useAuthStore.setState(state => ({
          users: state.users.map(u =>
            selectedRowKeys.includes(u.id)
              ? { ...u, status: newStatus, updatedAt: new Date().toISOString() }
              : u
          ),
        }))
        message.success(`已${disable ? '禁用' : '启用'} ${selectedUsers.length} 个用户`)
        handleLogAppend(`批量${disable ? '禁用' : '启用'}用户`, names)
        setSelectedRowKeys([])
      },
    })
  }

  const handleSaveConfig = () => {
    saveConfig(sysConfig)
    setConfigEdited(false)
    message.success('系统配置已保存')
    handleLogAppend('修改系统配置', 'SystemConfig', 'system')
  }

  const handleResetConfig = () => {
    setSysConfig(DEFAULT_CONFIG)
    configFormRef.current = DEFAULT_CONFIG
    setConfigEdited(false)
    message.info('已恢复默认配置')
  }

  const updateConfig = (key: keyof SysConfig, value: any) => {
    setSysConfig(prev => {
      const next = { ...prev, [key]: value }
      configFormRef.current = next
      return next
    })
    setConfigEdited(true)
  }

  const filteredLogs = useMemo(
    () => logSearch
      ? logs.filter(l =>
          l.userName?.includes(logSearch) ||
          l.action.includes(logSearch) ||
          l.targetName?.includes(logSearch)
        )
      : logs,
    [logs, logSearch],
  )

  // ---- 用户统计摘要 ----
  const userSummary = useMemo(() => {
    const byRole: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    users.forEach(u => {
      byStatus[u.status] = (byStatus[u.status] || 0) + 1
      u.roles.forEach(r => { byRole[r] = (byRole[r] || 0) + 1 })
    })
    return { byRole, byStatus }
  }, [users])

  const columns: ColumnsType<User> = [
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      render: (text: string, record: User) => (
        <Space>
          <Avatar icon={<UserOutlined />} src={record.avatar} />
          <a onClick={() => setDetailUser(record)} style={{ fontWeight: 500 }}>{text}</a>
        </Space>
      ),
    },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: UserRole[]) =>
        roles.map((r, i) => <Tag key={i} color={roleColor[r]}>{roleLabel[r]}</Tag>),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: '正常', value: 'active' },
        { text: '已禁用', value: 'disabled' },
        { text: '待审核', value: 'pending' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (s: UserStatus) => <Tag color={statusColor[s]}>{statusLabel[s]}</Tag>,
    },
    { title: '部门', dataIndex: 'department', key: 'department' },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (d: string) => dayjs(d).format('YYYY-MM-DD'),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: User) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => { setEditingUser(record); setFormOpen(true) }}
          >
            编辑
          </Button>
          {record.status === 'pending' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleApprovePending(record)}
            >
              审批
            </Button>
          )}
          {record.status === 'active' ? (
            <Popconfirm
              title={`确认禁用「${record.username}」？`}
              onConfirm={() => handleToggleStatus(record)}
              okType="danger"
            >
              <Button size="small" danger icon={<StopOutlined />}>禁用</Button>
            </Popconfirm>
          ) : record.status === 'disabled' ? (
            <Popconfirm
              title={`确认启用「${record.username}」？`}
              onConfirm={() => handleToggleStatus(record)}
            >
              <Button size="small" icon={<CheckCircleOutlined />} style={{ color: '#52c41a', borderColor: '#52c41a' }}>
                启用
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ]

  const logColumns: ColumnsType<Log> = [
    { title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm') },
    { title: '用户', dataIndex: 'userName', key: 'userName', width: 100 },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: (action: string, record: Log) => {
        const colorMap: Record<string, string> = {
          '新建用户': 'blue', '编辑用户': 'cyan', '禁用用户': 'red', '启用用户': 'green',
          '审批通过用户': 'success', '批量禁用用户': 'red', '批量启用用户': 'green',
          '批量分配角色': 'purple', '修改系统配置': 'orange', '系统初始化': 'default',
        }
        return <Tag color={colorMap[action] || 'default'}>{action}</Tag>
      },
    },
    {
      title: '目标',
      dataIndex: 'targetName',
      key: 'targetName',
      render: (t: string, r: Log) => (
        <span>
          <Text type="secondary" style={{ fontSize: 11, marginRight: 4 }}>[{r.targetType}]</Text>
          {t}
        </span>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'users',
      label: <span><UserOutlined /> 用户管理</span>,
      children: (
        <>
          {/* 用户概览统计 */}
          <Row gutter={12} style={{ marginBottom: 16 }}>
            <Col span={4}>
              <Card size="small" style={{ background: '#f6ffed', textAlign: 'center' }}>
                <Statistic title="总用户" value={users.length} valueStyle={{ fontSize: 20 }} />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small" style={{ background: '#e6f4ff', textAlign: 'center' }}>
                <Statistic title="活跃" value={userSummary.byStatus['active'] || 0} valueStyle={{ fontSize: 20, color: '#52c41a' }} />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small" style={{ background: '#fff7e6', textAlign: 'center' }}>
                <Statistic title="待审核" value={userSummary.byStatus['pending'] || 0} valueStyle={{ fontSize: 20, color: '#fa8c16' }} />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small" style={{ background: '#fff1f0', textAlign: 'center' }}>
                <Statistic title="已禁用" value={userSummary.byStatus['disabled'] || 0} valueStyle={{ fontSize: 20, color: '#ff4d4f' }} />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" title={<Text style={{ fontSize: 12 }}>角色分布</Text>}>
                <Space wrap size={[4, 4]}>
                  {Object.entries(userSummary.byRole).map(([role, cnt]) => (
                    <Badge
                      key={role}
                      count={cnt}
                      overflowCount={99}
                      size="small"
                      style={{ backgroundColor: roleColor[role as UserRole] === 'default' ? '#d9d9d9' : undefined }}
                    >
                      <Tag color={roleColor[role as UserRole]}>{roleLabel[role as UserRole]}</Tag>
                    </Badge>
                  ))}
                </Space>
              </Card>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
            <Space>
              <Input
                placeholder="搜索用户名 / 邮箱 / 部门..."
                prefix={<SearchOutlined />}
                style={{ width: 260 }}
                allowClear
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
              {selectedRowKeys.length > 0 && (
                <Space>
                  <Text type="secondary">已选 {selectedRowKeys.length} 人</Text>
                  <Button size="small" danger icon={<StopOutlined />} onClick={() => handleBatchToggle(true)}>
                    批量禁用
                  </Button>
                  <Button size="small" icon={<CheckCircleOutlined />} onClick={() => handleBatchToggle(false)}>
                    批量启用
                  </Button>
                  <Button size="small" icon={<SafetyOutlined />} onClick={() => setBatchRoleOpen(true)}>
                    批量分配角色
                  </Button>
                  <Button size="small" type="text" onClick={() => setSelectedRowKeys([])}>
                    取消选择
                  </Button>
                </Space>
              )}
            </Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => { setEditingUser(null); setFormOpen(true) }}
            >
              新建用户
            </Button>
          </div>
          <Table
            rowKey="id"
            dataSource={filteredUsers}
            columns={columns}
            size="small"
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys as string[]),
            }}
            pagination={{ pageSize: 10, showTotal: t => `共 ${t} 个用户` }}
          />
        </>
      ),
    },
    {
      key: 'roles',
      label: <span><SafetyOutlined /> 角色权限</span>,
      children: (
        <Card size="small" title="角色及权限说明">
          <Table
            rowKey="id"
            dataSource={[
              { id: 'super_admin', name: 'super_admin', nameZh: '超级管理员', level: 1, desc: '拥有系统全部权限' },
              { id: 'admin', name: 'admin', nameZh: '管理员', level: 2, desc: '语料、标注、用户管理权限' },
              { id: 'creator', name: 'creator', nameZh: '创建者', level: 3, desc: '创建和管理语料、提交审核' },
              { id: 'annotator', name: 'annotator', nameZh: '标注员', level: 4, desc: '执行标注任务、查看语料' },
              { id: 'reviewer', name: 'reviewer', nameZh: '审核员', level: 5, desc: '审核语料和标注结果' },
              { id: 'user', name: 'user', nameZh: '普通用户', level: 6, desc: '只读查看语料' },
              { id: 'guest', name: 'guest', nameZh: '访客', level: 7, desc: '有限访问公开语料' },
            ]}
            columns={[
              {
                title: '角色',
                dataIndex: 'nameZh',
                key: 'nameZh',
                render: (t: string, r: any) => <Tag color={roleColor[r.id as UserRole]}>{t}</Tag>,
              },
              { title: '英文标识', dataIndex: 'name', key: 'name', width: 140 },
              { title: '级别', dataIndex: 'level', key: 'level', width: 60 },
              { title: '说明', dataIndex: 'desc', key: 'desc' },
              {
                title: '用户数',
                key: 'userCount',
                width: 80,
                render: (_: any, r: any) => (
                  <Badge
                    count={users.filter(u => u.roles.includes(r.id as UserRole)).length}
                    showZero
                    style={{ backgroundColor: '#1677ff' }}
                  />
                ),
              },
            ]}
            size="small"
            pagination={false}
          />
        </Card>
      ),
    },
    {
      key: 'system',
      label: <span><SettingOutlined /> 系统配置</span>,
      children: (
        <Card
          size="small"
          title="系统设置"
          extra={
            <Space>
              {configEdited && <Text type="warning" style={{ fontSize: 12 }}>有未保存的修改</Text>}
              <Button size="small" onClick={handleResetConfig}>恢复默认</Button>
              <Button size="small" type="primary" onClick={handleSaveConfig} disabled={!configEdited}>
                保存配置
              </Button>
            </Space>
          }
        >
          <Row gutter={24}>
            <Col span={12}>
              <Card size="small" title={<Space><LockOutlined />基础设置</Space>} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Row align="middle" justify="space-between">
                    <Text>平台名称</Text>
                    <Input
                      size="small"
                      style={{ width: 180 }}
                      value={sysConfig.platformName}
                      onChange={e => updateConfig('platformName', e.target.value)}
                    />
                  </Row>
                  <Row align="middle" justify="space-between">
                    <Text>会话超时（分钟）</Text>
                    <Input
                      size="small"
                      type="number"
                      style={{ width: 80 }}
                      value={sysConfig.sessionTimeout}
                      min={5}
                      max={480}
                      onChange={e => updateConfig('sessionTimeout', Number(e.target.value))}
                    />
                  </Row>
                  <Row align="middle" justify="space-between">
                    <Text>密码最短长度</Text>
                    <Input
                      size="small"
                      type="number"
                      style={{ width: 80 }}
                      value={sysConfig.passwordMinLength}
                      min={4}
                      max={20}
                      onChange={e => updateConfig('passwordMinLength', Number(e.target.value))}
                    />
                  </Row>
                  <Row align="middle" justify="space-between">
                    <Text>密码要求特殊字符</Text>
                    <Switch
                      size="small"
                      checked={sysConfig.passwordRequireSpecial}
                      onChange={v => updateConfig('passwordRequireSpecial', v)}
                    />
                  </Row>
                  <Row align="middle" justify="space-between">
                    <Text>最大文件大小（MB）</Text>
                    <Input
                      size="small"
                      type="number"
                      style={{ width: 80 }}
                      value={sysConfig.maxFileSizeMB}
                      min={10}
                      max={2048}
                      onChange={e => updateConfig('maxFileSizeMB', Number(e.target.value))}
                    />
                  </Row>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title={<Space><TeamOutlined />通知设置</Space>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Row align="middle" justify="space-between">
                    <Text>邮件通知</Text>
                    <Switch
                      size="small"
                      checked={sysConfig.emailNotify}
                      onChange={v => updateConfig('emailNotify', v)}
                    />
                  </Row>
                  <Row align="middle" justify="space-between">
                    <Text>短信通知</Text>
                    <Switch
                      size="small"
                      checked={sysConfig.smsNotify}
                      onChange={v => updateConfig('smsNotify', v)}
                    />
                  </Row>
                  <Row align="middle" justify="space-between">
                    <Text>站内通知</Text>
                    <Switch
                      size="small"
                      checked={sysConfig.inAppNotify}
                      onChange={v => updateConfig('inAppNotify', v)}
                    />
                  </Row>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      ),
    },
    {
      key: 'logs',
      label: (
        <span>
          <DatabaseOutlined /> 操作日志
          {logs.length > 0 && <Badge count={logs.length} overflowCount={99} size="small" style={{ marginLeft: 4 }} />}
        </span>
      ),
      children: (
        <Card size="small" title="系统操作日志" extra={
          <Input
            size="small"
            placeholder="搜索用户/操作/目标..."
            prefix={<SearchOutlined />}
            value={logSearch}
            onChange={e => setLogSearch(e.target.value)}
            allowClear
            style={{ width: 220 }}
          />
        }>
          <Table
            rowKey="id"
            dataSource={filteredLogs}
            columns={logColumns}
            size="small"
            pagination={{ pageSize: 15, showTotal: t => `共 ${t} 条日志` }}
          />
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

      {/* 新建/编辑用户弹窗 */}
      <UserFormModal
        open={formOpen}
        editingUser={editingUser}
        onClose={() => { setFormOpen(false); setEditingUser(null) }}
        onSuccess={(action, name) => handleLogAppend(action, name)}
      />

      {/* 批量角色分配弹窗 */}
      <BatchRoleModal
        open={batchRoleOpen}
        selectedUsers={selectedUsers}
        onClose={() => setBatchRoleOpen(false)}
        onSuccess={(action, names) => handleLogAppend(action, names)}
      />

      {/* 用户详情弹窗 */}
      <Modal
        title="用户详情"
        open={!!detailUser}
        onCancel={() => setDetailUser(null)}
        footer={[
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => { setDetailUser(null); setEditingUser(detailUser); setFormOpen(true) }}
          >
            编辑
          </Button>,
          <Button key="close" onClick={() => setDetailUser(null)}>关闭</Button>,
        ]}
        width={480}
      >
        {detailUser && (
          <Descriptions column={2} bordered size="small" style={{ marginTop: 8 }}>
            <Descriptions.Item label="用户名" span={2}>{detailUser.username}</Descriptions.Item>
            <Descriptions.Item label="邮箱" span={2}>{detailUser.email}</Descriptions.Item>
            <Descriptions.Item label="手机号">{detailUser.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="部门">{detailUser.department || '-'}</Descriptions.Item>
            <Descriptions.Item label="角色" span={2}>
              <Space wrap>
                {detailUser.roles.map((r, i) => (
                  <Tag key={i} color={roleColor[r]}>{roleLabel[r]}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusColor[detailUser.status]}>{statusLabel[detailUser.status]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(detailUser.createdAt).format('YYYY-MM-DD')}
            </Descriptions.Item>
            {detailUser.lastLoginAt && (
              <Descriptions.Item label="最后登录" span={2}>
                {dayjs(detailUser.lastLoginAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
