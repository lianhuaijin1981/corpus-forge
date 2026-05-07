import { useParams, useNavigate } from 'react-router-dom'
import { Button, Typography } from 'antd'
import AnnotationDetail from './AnnotationDetail'

const { Title } = Typography

export default function AnnotationDetailPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()

  if (!taskId) {
    return (
      <div style={{ padding: 24 }}>
        <Title level={4}>参数错误</Title>
        <Button type="link" onClick={() => navigate('/annotation')}>
          返回任务列表
        </Button>
      </div>
    )
  }

  return (
    <AnnotationDetail
      taskId={taskId}
      open={true}
      onClose={() => navigate('/annotation')}
      onEdit={(_task) => {
        navigate('/annotation')
      }}
      onDelete={() => {
        navigate('/annotation')
      }}
    />
  )
}
