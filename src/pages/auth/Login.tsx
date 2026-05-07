import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuthStore } from '../../stores/authStore'

const { Title, Text } = Typography

export default function Login() {
  const [loading, setLoading] = useState(false)
  const login = useAuthStore(s => s.login)
  const navigate = useNavigate()

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true)
    // 模拟异步
    await new Promise(r => setTimeout(r, 300))
    const result = login(values.username, values.password)
    setLoading(false)
    if (result.success) {
      message.success(result.message)
      navigate('/')
    } else {
      message.error(result.message)
    }
  }

  return (
    <div className="login-container">
      <Card
        style={{
          width: 400,
          borderRadius: 12,
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ marginBottom: 4 }}>
            CorpusForge
          </Title>
          <Text type="secondary">语料库智能管理系统</Text>
        </div>

        <Form
          name="login"
          size="large"
          onFinish={handleLogin}
          autoComplete="off"
          initialValues={{ username: 'admin', password: 'admin123' }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 12 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            演示账号：admin / admin123
          </Text>
        </div>
      </Card>
    </div>
  )
}
