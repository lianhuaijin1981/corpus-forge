import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '../types';
import { v4 as uuidv4 } from 'uuid';

// 模拟用户数据
const mockUsers: User[] = [
  {
    id: 'admin-001',
    username: 'admin',
    email: 'admin@corpusforge.com',
    phone: '13800138000',
    password: 'admin123',
    roles: ['super_admin'],
    status: 'active',
    department: '技术部',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-001',
    username: 'creator1',
    email: 'creator1@corpusforge.com',
    phone: '13800138001',
    password: 'test123',
    roles: ['creator'],
    status: 'active',
    department: '数据部',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'user-002',
    username: 'annotator1',
    email: 'annotator1@corpusforge.com',
    phone: '13800138002',
    password: 'test123',
    roles: ['annotator'],
    status: 'active',
    department: '标注部',
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'user-003',
    username: 'reviewer1',
    email: 'reviewer1@corpusforge.com',
    phone: '13800138003',
    password: 'test123',
    roles: ['reviewer'],
    status: 'active',
    department: '质量部',
    createdAt: '2024-01-25T00:00:00Z',
    updatedAt: '2024-01-25T00:00:00Z',
  },
];

interface AuthState {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  login: (username: string, password: string) => { success: boolean; message: string };
  register: (user: Partial<User>) => { success: boolean; message: string };
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  changePassword: (oldPassword: string, newPassword: string) => { success: boolean; message: string };
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  getUserById: (id: string) => User | undefined;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: mockUsers,
      isAuthenticated: false,

      login: (username: string, password: string) => {
        const user = get().users.find(
          u => u.username === username && u.password === password
        );
        
        if (!user) {
          // 检查是否存在该用户名
          const exists = get().users.find(u => u.username === username);
          if (exists && exists.status === 'disabled') {
            return { success: false, message: '账号已被禁用，请联系管理员' };
          }
          if (exists) {
            return { success: false, message: '密码错误' };
          }
          return { success: false, message: '账号不存在' };
        }

        if (user.status === 'disabled') {
          return { success: false, message: '账号已被禁用，请联系管理员' };
        }

        if (user.status === 'pending') {
          return { success: false, message: '账号待审核，请等待管理员审批' };
        }

        set({ currentUser: { ...user, lastLoginAt: new Date().toISOString() }, isAuthenticated: true });
        return { success: true, message: '登录成功' };
      },

      register: (userData: Partial<User>) => {
        const { users } = get();
        
        // 检查用户名是否已存在
        if (users.some(u => u.username === userData.username)) {
          return { success: false, message: '用户名已存在' };
        }
        
        // 检查邮箱是否已存在
        if (users.some(u => u.email === userData.email)) {
          return { success: false, message: '邮箱已被注册' };
        }

        const newUser: User = {
          id: uuidv4(),
          username: userData.username || '',
          email: userData.email || '',
          phone: userData.phone,
          password: userData.password || '123456',
          roles: ['creator'], // 默认角色
          status: 'pending', // 需要管理员审核
          department: userData.department,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({ users: [...users, newUser] });
        return { success: true, message: '注册成功，请等待管理员审核' };
      },

      logout: () => {
        set({ currentUser: null, isAuthenticated: false });
      },

      updateProfile: (updates: Partial<User>) => {
        const { currentUser, users } = get();
        if (!currentUser) return;

        const updatedUser = { ...currentUser, ...updates, updatedAt: new Date().toISOString() };
        const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
        
        set({ currentUser: updatedUser, users: updatedUsers });
      },

      changePassword: (oldPassword: string, newPassword: string) => {
        const { currentUser, users } = get();
        if (!currentUser) return { success: false, message: '未登录' };

        if (currentUser.password !== oldPassword) {
          return { success: false, message: '原密码错误' };
        }

        const updatedUser = { ...currentUser, password: newPassword, updatedAt: new Date().toISOString() };
        const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
        
        set({ currentUser: updatedUser, users: updatedUsers });
        return { success: true, message: '密码修改成功' };
      },

      hasPermission: (permission: string) => {
        const { currentUser } = get();
        if (!currentUser) return false;

        // 超级管理员拥有所有权限
        if (currentUser.roles.includes('super_admin')) return true;

        // 权限映射
        const rolePermissions: Record<string, string[]> = {
          admin: ['corpus:read', 'corpus:write', 'corpus:delete', 'corpus:export',
                  'annotation:read', 'annotation:write', 'annotation:review',
                  'user:manage', 'role:manage', 'system:config'],
          creator: ['corpus:read', 'corpus:write', 'corpus:upload'],
          annotator: ['corpus:read', 'annotation:read', 'annotation:write'],
          reviewer: ['corpus:read', 'annotation:read', 'annotation:review'],
          user: ['corpus:read'],
          guest: [],
        };

        return currentUser.roles.some(role => rolePermissions[role]?.includes(permission));
      },

      hasRole: (role: UserRole) => {
        const { currentUser } = get();
        return currentUser?.roles.includes(role) || false;
      },

      getUserById: (id: string) => {
        return get().users.find(u => u.id === id);
      },
    }),
    {
      name: 'corpusforge-auth',
    }
  )
);
