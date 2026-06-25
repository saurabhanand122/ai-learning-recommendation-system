'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSessionAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Lightbulb, 
  History, 
  MessageSquare, 
  Users, 
  Upload, 
  BarChart3, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Sun,
  Moon,
  Calendar,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';
import styles from '@/styles/Sidebar.module.css';

export default function Sidebar() {
  const { user, role, isMock, setMockRole, logout } = useSessionAuth();
  const { theme, toggleTheme, sidebarOpen, toggleSidebar, closeSidebar } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setMockRole(newRole);
    closeSidebar();
    // Redirect to the new role dashboard
    if (newRole === 'admin') router.push('/admin');
    else if (newRole === 'pod') router.push('/pod');
    else router.push('/student');
  };

  const handleLogout = () => {
    logout();
    closeSidebar();
    router.push('/');
  };

  // Define navigation based on role
  const getNavItems = () => {
    if (role === 'admin') {
      return [
        { label: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
        { label: 'Manage Students', path: '/admin/students', icon: Users },
        { label: 'Bulk Data Loader', path: '/admin/import', icon: Upload }
      ];
    }
    if (role === 'pod') {
      return [
        { label: 'POD Dashboard', path: '/pod', icon: LayoutDashboard },
        { label: 'Capacity Planning', path: '/pod/capacity', icon: BarChart3 },
        { label: 'Feedback Repository', path: '/pod/feedback', icon: MessageSquare }
      ];
    }
    // Student links (default)
    return [
      { label: 'Student Dashboard', path: '/student', icon: LayoutDashboard },
      { label: 'Get Recommendation', path: '/student/recommend', icon: Lightbulb },
      { label: 'Roadmap History', path: '/student/history', icon: History },
      { label: 'Courses & Feedback', path: '/student/courses', icon: MessageSquare },
      { label: 'My Calendar Schedule', path: '/student/schedule', icon: Calendar },
      { label: 'Degree Progress', path: '/student/progress', icon: CheckCircle2 }
    ];
  };

  const navItems = getNavItems();

  const getRoleIcon = () => {
    if (role === 'admin') return <ShieldCheck size={18} className={styles.roleIconAdmin} />;
    if (role === 'pod') return <UserCheck size={18} className={styles.roleIconPod} />;
    return <GraduationCap size={18} className={styles.roleIconStudent} />;
  };

  return (
    <>
      {/* Mobile Sticky/Fixed Navbar */}
      <div className={`${styles.mobileHeader} glass-panel`}>
        <button 
          className={styles.hamburgerBtn} 
          onClick={toggleSidebar} 
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        
        <div className={styles.mobileBrand} onClick={() => { closeSidebar(); router.push('/'); }}>
          <GraduationCap className={styles.mobileBrandIcon} />
          <span className={styles.mobileBrandName}>Path<span className="gradient-text">Craft</span></span>
        </div>
        
        {/* Balanced spacer */}
        <div style={{ width: 36 }}></div>
      </div>

      {/* Sidebar Backdrop Overlay on Mobile */}
      {sidebarOpen && (
        <div className={styles.backdrop} onClick={closeSidebar} />
      )}

      {/* Main Sidebar Element */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''} glass-panel`}>
        {/* Brand Logo */}
        <div className={styles.brand} onClick={() => { closeSidebar(); router.push('/'); }}>
          <GraduationCap className={styles.brandIcon} />
          <span className={styles.brandName}>Path<span className="gradient-text">Craft</span></span>
        </div>

        {/* User Profile Card */}
        {user && (
          <div className={styles.profileCard}>
            <div className={styles.avatar}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className={styles.profileInfo}>
              <h4 className={styles.profileName}>{user.name}</h4>
              <div className={styles.roleBadge}>
                {getRoleIcon()}
                <span className={styles.roleText}>{role.toUpperCase()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className={styles.menu}>
          <span className={styles.menuHeader}>Menu</span>
          <ul className={styles.menuList}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <li key={item.path}>
                  <Link 
                    href={item.path} 
                    className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
                    onClick={closeSidebar}
                  >
                    <Icon size={18} className={styles.itemIcon} />
                    <span className={styles.itemLabel}>{item.label}</span>
                    {isActive && <ChevronRight size={14} className={styles.activeIndicator} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className={styles.footer}>
          {isMock && (
            <div className={styles.roleSwitcher}>
              <span className={styles.switcherLabel}>Quick Switch Role</span>
              <select 
                value={role} 
                onChange={handleRoleChange}
                className={styles.switcherSelect}
              >
                <option value="student">Student Portal</option>
                <option value="admin">Admin Portal</option>
                <option value="pod">POD Portal</option>
              </select>
            </div>
          )}
          
          <button className={styles.themeToggleBtn} onClick={() => { toggleTheme(); closeSidebar(); }} title="Toggle Light/Dark Theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
