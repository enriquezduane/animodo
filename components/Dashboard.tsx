'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Overview from './pages/Overview';
import Assignments from './pages/Assignments';
import Announcements from './pages/Announcements';
import { DashboardSection } from './types';
import { useDashboardData } from './hooks/useDashboardData';
import styles from './styles/common.module.css';

/**
 * Main dashboard component following Single Responsibility Principle
 * Handles navigation and section rendering
 */
export default function DashboardClient(): React.ReactElement {
    const router = useRouter();
    const [currentSection, setCurrentSection] = useState<DashboardSection>(DashboardSection.OVERVIEW);
    const [expandedAssignmentCourses, setExpandedAssignmentCourses] = useState<Set<number>>(new Set());
    const [expandedAnnouncementCourses, setExpandedAnnouncementCourses] = useState<Set<number>>(new Set());
    const [showOverdueAssignments, setShowOverdueAssignments] = useState(false);
    const [showNoDueDates, setShowNoDueDates] = useState(false);
    const [showOldAnnouncements, setShowOldAnnouncements] = useState(false);

    // Use custom hook for data management
    const {
        courses,
        loading,
        error,
        userName,
        isRefreshing,
        handleRefresh,
        handleLogout,
        getUrgentAssignments,
        getRecentAnnouncements,
        getCoursesWithAssignments,
        getCoursesWithAnnouncements
    } = useDashboardData();

    /**
     * Handle course expansion toggle for assignments
     */
    const handleToggleAssignmentCourse = (courseId: number): void => {
        setExpandedAssignmentCourses(prev => {
            const newExpanded = new Set(prev);
            if (newExpanded.has(courseId)) {
                newExpanded.delete(courseId);
            } else {
                newExpanded.add(courseId);
            }
            return newExpanded;
        });
    };

    /**
     * Handle course expansion toggle for announcements
     */
    const handleToggleAnnouncementCourse = (courseId: number): void => {
        setExpandedAnnouncementCourses(prev => {
            const newExpanded = new Set(prev);
            if (newExpanded.has(courseId)) {
                newExpanded.delete(courseId);
            } else {
                newExpanded.add(courseId);
            }
            return newExpanded;
        });
    };

    /**
     * Render loading state
     */
    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.loadingContent}>
                    <div className={styles.spinner}></div>
                    <div className={styles.loadingText}>Loading data...</div>
                    <div className={styles.loadingSubtext}>This might take a few seconds</div>
                </div>
            </div>
        );
    }

    /**
     * Render error state
     */
    if (error) {
        return (
            <div className={styles.error}>
                <div>Error: {error}</div>
            </div>
        );
    }

    /**
     * Render current section based on navigation
     */
    const renderCurrentSection = (): React.ReactElement => {
        switch (currentSection) {
            case DashboardSection.OVERVIEW:
                return (
                    <Overview
                        courses={courses}
                        urgentAssignments={getUrgentAssignments()}
                        recentAnnouncements={getRecentAnnouncements()}
                    />
                );
            case DashboardSection.ASSIGNMENTS:
                return (
                    <Assignments
                        coursesWithAssignments={getCoursesWithAssignments()}
                        courses={courses}
                        expandedCourses={expandedAssignmentCourses}
                        showOverdueAssignments={showOverdueAssignments}
                        showNoDueDates={showNoDueDates}
                        onToggleCourse={handleToggleAssignmentCourse}
                        onToggleOverdue={() => setShowOverdueAssignments(!showOverdueAssignments)}
                        onToggleNoDueDates={() => setShowNoDueDates(!showNoDueDates)}
                    />
                );
            case DashboardSection.ANNOUNCEMENTS:
                return (
                    <Announcements
                        coursesWithAnnouncements={getCoursesWithAnnouncements(showOldAnnouncements)}
                        courses={courses}
                        expandedCourses={expandedAnnouncementCourses}
                        showOldAnnouncements={showOldAnnouncements}
                        onToggleCourse={handleToggleAnnouncementCourse}
                        onToggleOldAnnouncements={() => setShowOldAnnouncements(!showOldAnnouncements)}
                    />
                );
            default:
                return <div className={styles.error}>Section not found</div>;
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar 
                userName={userName}
                onLogout={handleLogout}
                onSectionChange={setCurrentSection}
                currentSection={currentSection}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
            />
            <main className="main-content">
                {renderCurrentSection()}
            </main>
            
            <style jsx>{`
                .dashboard-layout {
                    display: flex;
                    height: 100vh;
                    background: var(--background-primary);
                    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .main-content {
                    flex: 1;
                    margin-left: 250px;
                    overflow-y: auto;
                    background: var(--background-primary);
                    min-height: 100vh;
                    max-width: none;
                }
                
                /* Responsive design */
                @media (max-width: 768px) {
                    .main-content {
                        margin-left: 200px;
                    }
                }
                
                @media (max-width: 480px) {
                    .dashboard-layout {
                        flex-direction: column;
                        height: auto;
                    }
                    
                    .main-content {
                        margin-left: 0;
                        min-height: calc(100vh - 200px);
                    }
                }
            `}</style>
        </div>
    );
}
