import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  App,
} from 'antd'
import {
  DatabaseOutlined,
  EditOutlined,
  AuditOutlined,
  SearchOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  UnorderedListOutlined,
  FolderOutlined,
  KeyOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useAuthStore } from '../stores/authStore'
import type { UserRole } from '../types'

const { Header, Sider, Content } = Layout
const { Text } = Typography

// 菜单项与角色权限映射
interface MenuItemConfig {
  key: string
  icon?: React.ReactNode
  label: string
  roles?: UserRole[] // 允许访问的角色，undefined 表示所有角色
  children?: MenuItemConfig[]
}

const menuConfig: MenuItemConfig[] = [
  {
    key: '/corpus-group',
    icon: <DatabaseOutlined />,
    label: '语料管理',
    children: [
      { key: '/corpus', icon: <UnorderedListOutlined />, label: '语料列表' },
      { key: '/corpus/library', icon: <FolderOutlined />, label: '语料库' },
    ],
  },
  { key: '/annotation', icon: <EditOutlined />, label: '标注任务' },
  { key: '/review', icon: <AuditOutlined />, label: '审核中心', roles: ['super_admin', 'admin', 'reviewer'] },
  { key: '/search', icon: <SearchOutlined />, label: '语料检索' },
  { key: '/stats', icon: <BarChartOutlined />, label: '统计分析' },
  { key: '/admin', icon: <SettingOutlined />, label: '系统管理', roles: ['super_admin', 'admin'] },
]

// 根据用户角色过滤菜单
function filterMenuByRole(
  items: MenuItemConfig[],
  userRoles: UserRole[]
): MenuProps['items'] {
  return items
    .filter((item) => {
      if (!item.roles) return true
      return item.roles.some((role) => userRoles.includes(role))
    })
    .map((item) => {
      const menuItem: NonNullable<MenuProps['items']>[number] = {
        key: item.key,
        icon: item.icon,
        label: item.label,
      }
      if (item.children) {
        const filteredChildren = filterMenuByRole(item.children, userRoles)
        if (filteredChildren && filteredChildren.length > 0) {
          (menuItem as { children: MenuProps['items'] }).children = filteredChildren
        }
      }
      return menuItem
    })
    .filter(Boolean)
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, logout, changePassword } = useAuthStore()
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordForm] = Form.useForm()
  const { message } = App.useApp()

  const pathname = location.pathname
  const selectedKey = pathname
  const defaultOpenKeys = pathname.startsWith('/corpus') ? ['/corpus-group'] : []
  const activeKey = pathname.startsWith('/annotation/') ? '/annotation' : selectedKey

  // 根据当前用户角色过滤菜单
  const userRoles = (currentUser?.roles || ['guest']) as UserRole[]
  const filteredMenuItems = filterMenuByRole(menuConfig, userRoles)

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'change-password',
      icon: <KeyOutlined />,
      label: '修改密码',
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ]

  const handleUserMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        // TODO: 跳转个人资料页
        break
      case 'change-password':
        passwordForm.resetFields()
        setPasswordModalOpen(true)
        break
      case 'logout':
        logout()
        navigate('/login')
        break
    }
  }

  const handleChangePassword = () => {
    passwordForm.validateFields().then((values) => {
      const result = changePassword(values.oldPassword, values.newPassword)
      if (result.success) {
        message.success(result.message)
        setPasswordModalOpen(false)
        passwordForm.resetFields()
      } else {
        message.error(result.message)
      }
    })
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Text strong style={{ color: '#fff', fontSize: collapsed ? 16 : 18 }}>
            {collapsed ? 'CF' : 'CorpusForge'}
          </Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeKey]}
          defaultOpenKeys={defaultOpenKeys}
          items={filteredMenuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <Dropdown
            menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
            placement="bottomRight"
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                icon={<UserOutlined />}
                src={currentUser?.avatar}
                size="small"
              />
              <Text>{currentUser?.username || '用户'}</Text>
            </Space>
          </Dropdown>
        </Header>

        <Content style={{ margin: 24, minHeight: 'calc(100vh - 112px)' }}>
          <Outlet />
        </Content>
      </Layout>

      {/* 修改密码弹窗 */}
      <Modal
        title="修改密码"
        open={passwordModalOpen}
        onOk={handleChangePassword}
        onCancel={() => setPasswordModalOpen(false)}
        okText="确认修改"
        cancelText="取消"
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="oldPassword"
            label="原密码"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}
