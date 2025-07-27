'use client';

import { useState } from 'react';
import { LuLayoutDashboard, LuClipboardList, LuMegaphone, LuLogOut, LuRefreshCw } from 'react-icons/lu';

interface SidebarProps {
    userName: string | null;
    onLogout: () => void;
    onSectionChange: (section: string) => void;
    currentSection: string;
    onRefresh: () => void;
    isRefreshing: boolean;
}

export default function Sidebar({ userName, onLogout, onSectionChange, currentSection, onRefresh, isRefreshing }: SidebarProps) {
    const getFormattedFirstName = (fullName: string) => {
        const parts = fullName.split(',');
        if (parts.length < 2) return fullName;

        const firstAndMiddleNames = parts[1].trim();
        const firstName = firstAndMiddleNames.split(' ')[0];

        return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    };

    const sidebarItems = [
        { id: 'overview', label: 'Overview', icon: <LuLayoutDashboard size={16} /> },
        { id: 'assignments', label: 'Assignments', icon: <LuClipboardList size={16} /> },
        { id: 'announcements', label: 'Announcements', icon: <LuMegaphone size={16} /> }
    ];

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <img 
                    src="/animodo-logo.png" 
                    alt="Animodo" 
                    className="sidebar-logo"
                />
                <h2>Welcome, {userName ? getFormattedFirstName(userName) : 'User'}!</h2>
            </div>

            <nav className="sidebar-nav">
                {sidebarItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onSectionChange(item.id)}
                        className={`sidebar-item ${currentSection === item.id ? 'active' : ''}`}
                    >
                        <span className="sidebar-icon">{item.icon}</span>
                        <span className="sidebar-label">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="refresh-section">
                    <p className="sync-note">Data is not synced automatically</p>
                    <button 
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
                        title="Refresh data to get latest assignments and announcements"
                    >
                        <LuRefreshCw size={16} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                </div>
                <button onClick={onLogout} className="logout-btn">
                    <LuLogOut size={16} /> Exit
                </button>
            </div>

            <style jsx>{`
                .sidebar {
                    width: 250px;
                    height: 100vh;
                    background: var(--background-secondary);
                    border-right: 2px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                    position: fixed;
                    left: 0;
                    top: 0;
                    z-index: 100;
                    box-shadow: var(--shadow-md);
                }
                
                .sidebar-header {
                    padding: var(--spacing-xl);
                    border-bottom: 2px solid var(--border-color);
                    background: var(--background-primary);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--spacing-md);
                }
                
                .sidebar-logo {
                    width: 120px;
                    height: auto;
                    max-width: 100%;
                    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
                }
                
                .sidebar-header h2 {
                    margin: 0;
                    font-size: var(--font-size-lg);
                    color: var(--primary-color);
                    font-weight: 600;
                    text-align: center;
                }
                
                .sidebar-nav {
                    flex: 1;
                    padding: var(--spacing-xl) 0;
                }
                
                .sidebar-item {
                    width: 100%;
                    padding: var(--spacing-md) var(--spacing-xl);
                    border: none;
                    background: none;
                    text-align: left;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-md);
                    font-size: var(--font-size-sm);
                    color: var(--text-primary);
                    transition: all 0.2s ease;
                    font-weight: 500;
                }
                
                .sidebar-item:hover {
                    background: var(--background-primary);
                    color: var(--primary-color);
                    transform: translateX(4px);
                }
                
                .sidebar-item.active {
                    background: linear-gradient(135deg, var(--accent-color), #8FB61F);
                    color: var(--dark-gray);
                    font-weight: 600;
                    box-shadow: var(--shadow-sm);
                    border-radius: 0;
                    margin-right: var(--spacing-sm);
                }
                
                .sidebar-item.active:hover {
                    transform: none;
                    background: linear-gradient(135deg, #8FB61F, var(--accent-color));
                }
                
                .sidebar-icon {
                    font-size: 16px;
                    flex-shrink: 0;
                }
                
                .sidebar-label {
                    flex: 1;
                }
                
                .sidebar-footer {
                    padding: var(--spacing-xl);
                    border-top: 2px solid var(--border-color);
                    background: var(--background-primary);
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-md);
                }

                .refresh-section {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-sm);
                }

                .sync-note {
                    font-size: var(--font-size-xs);
                    color: var(--text-secondary);
                    text-align: center;
                    margin: 0;
                    line-height: 1.4;
                }

                .refresh-btn {
                    width: 100%;
                    padding: var(--spacing-sm);
                    background: var(--accent-color);
                    color: var(--dark-gray);
                    border: none;
                    border-radius: 0;
                    cursor: pointer;
                    font-size: var(--font-size-xs);
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-xs);
                    justify-content: center;
                    transition: all 0.2s ease;
                    box-shadow: var(--shadow-sm);
                }

                .refresh-btn:hover:not(:disabled) {
                    background: #8FB61F;
                    transform: translateY(-1px);
                    box-shadow: var(--shadow-md);
                }

                .refresh-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .refresh-btn.refreshing {
                    background: var(--text-secondary);
                    color: white;
                }

                .refresh-btn.refreshing svg {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .logout-btn {
                    width: 100%;
                    padding: var(--spacing-md);
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: 0;
                    cursor: pointer;
                    font-size: var(--font-size-sm);
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                    justify-content: center;
                    transition: all 0.2s ease;
                    box-shadow: var(--shadow-sm);
                }
                
                .logout-btn:hover {
                    background: #1E3426;
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                }
                
                .logout-btn:active {
                    transform: translateY(0);
                }
                
                /* Responsive design */
                @media (max-width: 768px) {
                    .sidebar {
                        width: 200px;
                    }
                    
                    .sidebar-header,
                    .sidebar-footer {
                        padding: var(--spacing-lg);
                    }
                    
                    .sidebar-logo {
                        width: 100px;
                    }
                    
                    .sidebar-item {
                        padding: var(--spacing-sm) var(--spacing-lg);
                        font-size: var(--font-size-xs);
                    }
                    
                    .sidebar-header h2 {
                        font-size: var(--font-size-base);
                    }
                }
                
                @media (max-width: 480px) {
                    .sidebar {
                        width: 100%;
                        height: auto;
                        position: relative;
                        border-right: none;
                        border-bottom: 2px solid var(--border-color);
                    }
                    
                    .sidebar-header {
                        padding: var(--spacing-md);
                    }
                    
                    .sidebar-logo {
                        width: 80px;
                    }
                    
                    .sidebar-nav {
                        padding: var(--spacing-md) 0;
                    }
                    
                    .sidebar-item.active {
                        border-radius: 0;
                        margin-right: 0;
                    }
                }
            `}</style>
        </div>
    );
} 
