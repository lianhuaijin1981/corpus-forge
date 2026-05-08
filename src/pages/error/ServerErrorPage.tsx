import { Result, Button } from 'antd'

export default function ServerErrorPage() {
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
        status="500"
        title="500"
        subTitle="抱歉，服务器出了点问题，请稍后再试。"
        extra={[
          <Button key="retry" type="primary" onClick={() => window.location.reload()}>
            重新加载
          </Button>,
          <Button key="home" onClick={() => (window.location.href = '/corpus')}>
            回到首页
          </Button>,
        ]}
      />
    </div>
  )
}
