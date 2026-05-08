import { useParams } from 'react-router-dom'
import AnnotationWorkspace from './AnnotationWorkspace'

export default function AnnotationWorkspacePage() {
  const { taskId } = useParams<{ taskId: string }>()
  return <AnnotationWorkspace taskId={taskId || ''} />
}
