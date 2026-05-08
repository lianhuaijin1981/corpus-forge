import { Component, type ReactNode } from 'react'
import { Result, Button, Typography } from 'antd'

const { Paragraph, Text } = Typography

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    console.error('[ErrorBoundary] caught error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
          <Result
            status="error"
            title="页面出错了"
            subTitle="抱歉，页面遇到了意外错误。请尝试刷新页面或联系管理员。"
            extra={[
              <Button key="retry" type="primary" onClick={this.handleReset}>
                重试
              </Button>,
              <Button key="reload" onClick={this.handleReload}>
                刷新页面
              </Button>,
            ]}
          >
            <div style={{ textAlign: 'left', maxWidth: 560, margin: '0 auto' }}>
              <Paragraph>
                <Text
                  strong
                  style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)' }}
                >
                  错误详情：
                </Text>
              </Paragraph>
              <Paragraph>
                <code
                  style={{
                    padding: '8px 12px',
                    background: '#f5f5f5',
                    borderRadius: 4,
                    fontSize: 12,
                    wordBreak: 'break-all',
                    display: 'block',
                  }}
                >
                  {this.state.error?.message || '未知错误'}
                </code>
              </Paragraph>
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <Paragraph>
                  <Text
                    strong
                    style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)' }}
                  >
                    组件堆栈：
                  </Text>
                  <pre
                    style={{
                      fontSize: 11,
                      background: '#f5f5f5',
                      padding: 12,
                      borderRadius: 4,
                      maxHeight: 200,
                      overflow: 'auto',
                      marginTop: 8,
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </pre>
                </Paragraph>
              )}
            </div>
          </Result>
        </div>
      )
    }

    return this.props.children
  }
}
