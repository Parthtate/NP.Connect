import { UserRole, User } from './types';

export const APP_NAME = "NP.Connect";

export const MOCK_USERS: Record<UserRole, User> = {
  [UserRole.ADMIN]: {
    id: 'adm-001',
    name: 'Alice Admin',
    email: 'alice@npconnect.com',
    role: UserRole.ADMIN,
    avatarUrl: 'https://picsum.photos/200/200?random=1'
  },
  [UserRole.HR]: {
    id: 'hr-001',
    name: 'Harry HR',
    email: 'harry@npconnect.com',
    role: UserRole.HR,
    avatarUrl: 'https://picsum.photos/200/200?random=2'
  },
  [UserRole.EMPLOYEE]: {
    id: 'emp-001',
    name: 'Emma Employee',
    email: 'emma@npconnect.com',
    role: UserRole.EMPLOYEE,
    avatarUrl: 'https://picsum.photos/200/200?random=3'
  }
};