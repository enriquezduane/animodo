'use client';

import { useState } from 'react';

interface SidebarProps {
    userName: string | null;
    onLogout: () => void;
    onSectionChange: (section: string) => void;
    currentSection: string;
}

export default function Sidebar({ userName, onLogout, onSectionChange, currentSection }: SidebarProps) {
    const getFormattedFirstName = (fullName: string) => {
        const parts = fullName.split(',');
        if (parts.length < 2) return fullName;
        
        const firstAndMiddleNames = parts[1].trim();
        const firstName = firstAndMiddleNames.split(' ')[0];
        
        return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    };

    const sidebarItems = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'assignments', label: 'Assignments', icon: '📝' },
        { id: 'announcements', label: 'Announcements', icon: '📢' }
    ];

    return (
        <div className="sidebar">
            <div className="sidebar-header">
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
                <button onClick={onLogout} className="logout-btn">
                    🚪 Logout
                </button>
            </div>
            
            <style jsx>{`
                .sidebar {
                    width: 250px;
                    height: 100vh;
                    background: #f8f9fa;
                    border-right: 1px solid #e9ecef;
                    display: flex;
                    flex-direction: column;
                    position: fixed;
                    left: 0;
                    top: 0;
                    z-index: 100;
                }
                
                .sidebar-header {
                    padding: 20px;
                    border-bottom: 1px solid #e9ecef;
                    background: #fff;
                }
                
                .sidebar-header h2 {
                    margin: 0;
                    font-size: 18px;
                    color: #495057;
                }
                
                .sidebar-nav {
                    flex: 1;
                    padding: 20px 0;
                }
                
                .sidebar-item {
                    width: 100%;
                    padding: 12px 20px;
                    border: none;
                    background: none;
                    text-align: left;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 14px;
                    color: #6c757d;
                    transition: all 0.2s ease;
                }
                
                .sidebar-item:hover {
                    background: #e9ecef;
                    color: #495057;
                }
                
                .sidebar-item.active {
                    background: #007bff;
                    color: white;
                    font-weight: 500;
                }
                
                .sidebar-icon {
                    font-size: 16px;
                }
                
                .sidebar-label {
                    flex: 1;
                }
                
                .sidebar-footer {
                    padding: 20px;
                    border-top: 1px solid #e9ecef;
                }
                
                .logout-btn {
                    width: 100%;
                    padding: 10px;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    justify-content: center;
                    transition: background-color 0.2s ease;
                }
                
                .logout-btn:hover {
                    background: #c82333;
                }
            `}</style>
        </div>
    );
} 