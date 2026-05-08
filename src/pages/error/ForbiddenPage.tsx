import { Result, Button } from 'antd'

export default function ForbiddenPage() {
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
        status="403"
        title="403"
        subTitle="抱歉，您没有权限访问此页面。"
        extra={
          <Button type="primary" onClick={() => (window.location.href = '/corpus')}>
            回到首页
          </Button>
        }
      />
    </div>
  )
}
