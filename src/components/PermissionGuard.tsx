import { type ReactNode } from 'react'
import { useAuthStore } from '../stores/authStore'
import type { UserRole } from '../types'
import ForbiddenPage from '../pages/error/ForbiddenPage'

interface PermissionGuardProps {
  /** 允许访问的角色列表 */
  roles?: UserRole[]
  /** 需要的权限标识 */
  permission?: string
  /** 子元素 */
  children: ReactNode
  /** 无权限时的回退内容，默认显示403页面 */
  fallback?: ReactNode
}

/**
 * 权限守卫组件
 * 根据角色或权限控制子组件的可见性
 */
export default function PermissionGuard({
  roles,
  permission,
  children,
  fallback,
}: PermissionGuardProps) {
  const { currentUser, hasPermission } = useAuthStore()

  // 角色检查
  if (roles && roles.length > 0) {
    if (!currentUser || !roles.includes(currentUser.role as UserRole)) {
      return fallback ? <>{fallback}</> : <ForbiddenPage />
    }
  }

  // 权限检查
  if (permission) {
    if (!hasPermission(permission)) {
      return fallback ? <>{fallback}</> : <ForbiddenPage />
    }
  }

  return <>{children}</>
}

/**
 * 高阶组件：为组件添加权限控制
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: { roles?: UserRole[]; permission?: string }
) {
  return function PermissionWrapped(props: P) {
    return (
      <PermissionGuard roles={options.roles} permission={options.permission}>
        <WrappedComponent {...props} />
      </PermissionGuard>
    )
  }
}

/**
 * Hook：检查当前用户是否拥有指定角色或权限
 */
export function usePermission() {
  const { currentUser, hasPermission } = useAuthStore()

  return {
    /** 当前用户 */
    currentUser,
    /** 检查是否拥有指定角色 */
    hasRole: (role: UserRole): boolean => {
      return currentUser?.role === role
    },
    /** 检查是否拥有指定角色之一 */
    hasAnyRole: (roles: UserRole[]): boolean => {
      return roles.includes(currentUser?.role as UserRole)
    },
    /** 检查是否拥有指定权限 */
    hasPermission,
    /** 是否是管理员（super_admin 或 admin） */
    isAdmin: (): boolean => {
      return currentUser?.role === 'super_admin' || currentUser?.role === 'admin'
    },
    /** 是否是超级管理员 */
    isSuperAdmin: (): boolean => {
      return currentUser?.role === 'super_admin'
    },
  }
}
