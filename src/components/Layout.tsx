import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Space,
  Typography,
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
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useAuthStore } from '../stores/authStore'

const { Header, Sider, Content } = Layout
const { Text } = Typography

const menuItems: MenuProps['items'] = [
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
  { key: '/review', icon: <AuditOutlined />, label: '审核中心' },
  { key: '/search', icon: <SearchOutlined />, label: '语料检索' },
  { key: '/stats', icon: <BarChartOutlined />, label: '统计分析' },
  { key: '/admin', icon: <SettingOutlined />, label: '系统管理' },
]

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, logout } = useAuthStore()

  const pathname = location.pathname
  // 精确匹配：/corpus/library 使用 /corpus/library，/corpus 使用 /corpus，其他路径原样
  const selectedKey = pathname
  // 语料管理子路径默认展开
  const defaultOpenKeys = pathname.startsWith('/corpus') ? ['/corpus-group'] : []
  // 对于 /annotation/:taskId 路径，高亮 /annotation
  const activeKey = pathname.startsWith('/annotation/') ? '/annotation' : selectedKey

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: () => {
        logout()
        navigate('/login')
      },
    },
  ]

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
          items={menuItems}
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
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
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
    </Layout>
  )
}
