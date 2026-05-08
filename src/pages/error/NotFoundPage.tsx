import { Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
      }}
    >
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在。"
        extra={[
          <Button key="back" onClick={() => navigate(-1)}>
            返回上一页
          </Button>,
          <Button key="home" type="primary" onClick={() => navigate('/corpus')}>
            回到首页
          </Button>,
        ]}
      />
    </div>
  )
}
