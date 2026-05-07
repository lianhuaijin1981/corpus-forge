import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import Login from './pages/auth/Login'
import CorpusList from './pages/corpus/CorpusList'
import CorpusLibrary from './pages/corpus/CorpusLibrary'
import AnnotationList from './pages/annotation/AnnotationList'
import ReviewList from './pages/review/ReviewList'
import SearchPage from './pages/search/SearchPage'
import StatsPage from './pages/stats/StatsPage'
import AdminPage from './pages/admin/AdminPage'

// 路由守卫：已登录才能访问
function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

// 路由守卫：未登录才能访问（登录/注册页）
function RequireGuest({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* 游客页面 */}
      <Route
        path="/login"
        element={
          <RequireGuest>
            <Login />
          </RequireGuest>
        }
      />

      {/* 主应用页面（需登录） */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/corpus" replace />} />
        <Route path="corpus" element={<CorpusList />} />
        <Route path="corpus/library" element={<CorpusLibrary />} />
        <Route path="annotation" element={<AnnotationList />} />
        <Route path="review" element={<ReviewList />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>

      {/* 兜底 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
