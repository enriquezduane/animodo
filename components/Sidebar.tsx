'use client';

import React from 'react';
import { LuLayoutDashboard, LuClipboardList, LuMegaphone, LuLogOut, LuRefreshCw } from 'react-icons/lu';
import { SidebarProps, DashboardSection } from './types';
import styles from './styles/sidebar.module.css';

interface SidebarNavigationItem {
  readonly id: DashboardSection;
  readonly label: string;
  readonly icon: React.ReactElement;
}

/**
 * Formats a user's full name to extract just the first name
 */
const getFormattedFirstName = (fullName: string): string => {
    const parts = fullName.split(',');
    if (parts.length < 2) return fullName;

    const firstAndMiddleNames = parts[1].trim();
    const firstName = firstAndMiddleNames.split(' ')[0];

    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
};

/**
 * Navigation items configuration
 */
const SIDEBAR_ITEMS: readonly SidebarNavigationItem[] = [
    { id: DashboardSection.OVERVIEW, label: 'Overview', icon: <LuLayoutDashboard size={16} /> },
    { id: DashboardSection.ASSIGNMENTS, label: 'Assignments', icon: <LuClipboardList size={16} /> },
    { id: DashboardSection.ANNOUNCEMENTS, label: 'Announcements', icon: <LuMegaphone size={16} /> }
] as const;

export default function Sidebar({ userName, onLogout, onSectionChange, currentSection, onRefresh, isRefreshing }: SidebarProps): React.ReactElement {

    return (
        <div className={styles.sidebar}>
            <div className={styles.header}>
                <img 
                    src="/animodo-logo.png" 
                    alt="Animodo" 
                    className={styles.logo}
                />
                <h2 className={styles.welcomeMessage}>
                    Welcome, {userName ? getFormattedFirstName(userName) : 'User'}!
                </h2>
            </div>

            <nav className={styles.nav}>
                {SIDEBAR_ITEMS.map((item: SidebarNavigationItem) => (
                    <button
                        key={item.id}
                        onClick={() => onSectionChange(item.id)}
                        className={`${styles.navItem} ${currentSection === item.id ? styles.active : ''}`}
                    >
                        <span className={styles.navIcon}>{item.icon}</span>
                        <span className={styles.navLabel}>{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className={styles.footer}>
                <div className={styles.refreshSection}>
                    <p className={styles.syncNote}>Data is not synced automatically</p>
                    <button 
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className={`${styles.refreshButton} ${isRefreshing ? styles.refreshing : ''}`}
                        title="Refresh data to get latest assignments and announcements"
                    >
                        <LuRefreshCw size={16} className={styles.refreshIcon} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                </div>
                <button onClick={onLogout} className={styles.logoutButton}>
                    <LuLogOut size={16} /> Exit
                </button>
            </div>
        </div>
    );
} 
