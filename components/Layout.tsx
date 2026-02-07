import React from 'react';
import { User, UserRole, ViewState, NavItem } from '../types';
import { APP_NAME } from '../constants';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  Coffee, 
  DollarSign, 
  Settings, 
  LogOut, 
  Menu,
  BarChart3,
  FileText,
  Mail
} from 'lucide-react';

interface LayoutProps {
  user: User;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, currentView, onChangeView, onLogout, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Define navigation items based on Role
  const getNavItems = (role: UserRole): NavItem[] => {
    const items: NavItem[] = [
      { label: 'Dashboard', icon: LayoutDashboard, id: ViewState.DASHBOARD },
    ];

    if (role === UserRole.EMPLOYEE) {
       items.push({ label: 'My Attendance', icon: CalendarCheck, id: ViewState.MY_ATTENDANCE });
       items.push({ label: 'My Leaves', icon: Coffee, id: ViewState.MY_LEAVES });
       items.push({ label: 'Payslips', icon: FileText, id: ViewState.MY_PAYSLIPS });
    }

    if (role === UserRole.HR || role === UserRole.ADMIN) {
      items.push({ label: 'Employees', icon: Users, id: ViewState.EMPLOYEES });
      items.push({ label: 'Attendance', icon: CalendarCheck, id: ViewState.ATTENDANCE });
      items.push({ label: 'Leave Mgmt', icon: Coffee, id: ViewState.LEAVE });
      items.push({ label: 'Payroll', icon: DollarSign, id: ViewState.PAYROLL });
      items.push({ label: 'Reports', icon: BarChart3, id: ViewState.REPORTS });
    }

    // Settings only accessible to ADMIN
    if (role === UserRole.ADMIN) {
      items.push({ label: 'Settings', icon: Settings, id: ViewState.SETTINGS });
    }

    return items;
  };

  const navItems = getNavItems(user.role);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center justify-center border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-wider">{APP_NAME}</h1>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChangeView(item.id as ViewState);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
               {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        {/* Top Header Mobile */}
        <header className="bg-white shadow-sm border-b lg:hidden h-16 flex items-center justify-between px-4 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <span className="font-semibold text-slate-800">{APP_NAME}</span>
          <div className="w-8" /> {/* Spacer */}
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto pb-10">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;