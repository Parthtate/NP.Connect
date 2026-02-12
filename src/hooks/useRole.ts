import { useMemo } from 'react';
import { UserRole } from '../../types';
import { useAuth } from './useAuth';

interface RolePermissions {
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isAdmin: boolean;
  isHR: boolean;
  isEmployee: boolean;
  canManageEmployees: boolean;
  canViewAllData: boolean;
  canManageInvites: boolean;
  canApproveLeaves: boolean;
  canProcessPayroll: boolean;
  canManageSettings: boolean;
  canViewReports: boolean;
}

export function useRole(): RolePermissions {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    const userRole = user?.role;

    const hasRole = (role: UserRole | UserRole[]): boolean => {
      if (!userRole) return false;
      if (Array.isArray(role)) {
        return role.includes(userRole);
      }
      return userRole === role;
    };

    const isAdmin = userRole === UserRole.ADMIN;
    const isHR = userRole === UserRole.HR;
    const isEmployee = userRole === UserRole.EMPLOYEE;

    return {
      hasRole,
      isAdmin,
      isHR,
      isEmployee,
      
      // Permission flags
      canManageEmployees: isAdmin || isHR,
      canViewAllData: isAdmin || isHR,
      canManageInvites: isAdmin || isHR,
      canApproveLeaves: isAdmin || isHR,
      canProcessPayroll: isAdmin || isHR,
      canManageSettings: isAdmin,
      canViewReports: isAdmin || isHR,
    };
  }, [user?.role]);

  return permissions;
}
