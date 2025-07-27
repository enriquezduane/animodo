'use client';

import { useState, useEffect } from 'react';
import { Assignment, Announcement, Course } from '../types';
import { LuAlarmClock, LuMegaphone, LuEyeOff, LuEye, LuRefreshCw, LuUndo2, LuLayoutDashboard } from 'react-icons/lu';

interface OverviewProps {
    courses: Course[];
    urgentAssignments: (Assignment & { courseId: number })[];
    recentAnnouncements: (Announcement & { courseId: number })[];
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export default function Overview({ courses, urgentAssignments, recentAnnouncements, onRefresh, isRefreshing }: OverviewProps) {
    const [ignoredAssignments, setIgnoredAssignments] = useState<Set<number>>(new Set());
    const [showIgnored, setShowIgnored] = useState(false);

    // Load ignored assignments from localStorage
    useEffect(() => {
        const savedIgnored = localStorage.getItem('ignored_assignments');
        if (savedIgnored) {
            try {
                setIgnoredAssignments(new Set(JSON.parse(savedIgnored)));
            } catch (e) {
                console.warn('Failed to parse saved ignored assignments');
            }
        }
    }, []);

    // Save ignored assignments to localStorage
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            localStorage.setItem('ignored_assignments', JSON.stringify([...ignoredAssignments]));
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [ignoredAssignments]);

    const toggleIgnoreAssignment = (assignmentId: number) => {
        setIgnoredAssignments(prevIgnored => {
            const newIgnored = new Set(prevIgnored);
            if (newIgnored.has(assignmentId)) {
                newIgnored.delete(assignmentId);
            } else {
                newIgnored.add(assignmentId);
            }
            return newIgnored;
        });
    };

    // Filter out ignored assignments and take the first 5 non-ignored ones
    const filteredUrgentAssignments = urgentAssignments
        .filter(assignment => !ignoredAssignments.has(assignment.id))
        .slice(0, 5);

    // Get ignored assignments that are in the current urgent list
    const ignoredUrgentAssignments = urgentAssignments
        .filter(assignment => ignoredAssignments.has(assignment.id));

    const getCourseCode = (courseName: string) => {
        const match = courseName.match(/^([A-Z]+\d+)/);
        return match ? match[1] : courseName.split(' ')[0];
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'No due date';
        return new Date(dateString).toLocaleDateString();
    };

    const getTimeRemaining = (dueDateString: string | null) => {
        if (!dueDateString) return '';
        
        const now = new Date();
        const dueDate = new Date(dueDateString);
        const timeDiff = dueDate.getTime() - now.getTime();
        const absoluteDiff = Math.abs(timeDiff);
        
        const days = Math.floor(absoluteDiff / (1000 * 60 * 60 * 24));
        if (days > 0) return `${days}d`;
        
        const hours = Math.floor((absoluteDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (hours > 0) return `${hours}h`;
        
        const minutes = Math.floor((absoluteDiff % (1000 * 60 * 60)) / (1000 * 60));
        return `${minutes}m`;
    };

    const getTimeAgo = (postedDateString: string) => {
        const now = new Date();
        const postedDate = new Date(postedDateString);
        const timeDiff = now.getTime() - postedDate.getTime();
        
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    };

    const getSubmissionStatus = (assignment: Assignment) => {
        if (assignment.has_submitted_submissions && !assignment.submission) {
            return 'Group Submitted';
        }
        
        if (!assignment.submission) return 'Unsubmitted';
        
        const { workflow_state, score } = assignment.submission;
        
        if (workflow_state === 'graded' && score !== null) {
            return 'Graded';
        }
        
        if (workflow_state === 'submitted') {
            return 'Submitted';
        }
        
        if (workflow_state === 'pending_review') {
            return 'Pending Review';
        }
        
        return workflow_state.charAt(0).toUpperCase() + workflow_state.slice(1).replace('_', ' ');
    };

    const getStatusColor = (assignment: Assignment) => {
        const status = getSubmissionStatus(assignment);
        
        if (status === 'Unsubmitted') {
            if (!assignment.due_at) return '#6c757d'; // Gray for no due date
            
            const now = new Date();
            const dueDate = new Date(assignment.due_at);
            const timeDiff = dueDate.getTime() - now.getTime();
            const hoursLeft = timeDiff / (1000 * 60 * 60);
            
            if (timeDiff < 0) return '#dc3545'; // Red for overdue
            if (hoursLeft < 24) return '#fd7e14'; // Orange for almost due
            return '#ffc107'; // Yellow for due soon (covers both due soon and plenty of time)
        }
        
        if (status === 'Submitted') return '#28a745'; // Green for submitted
        if (status === 'Pending Review') return '#17a2b8'; // Blue for pending review
        if (status === 'Graded') return '#6f42c1'; // Purple for graded
        if (status === 'Group Submitted') return '#20c997'; // Teal-green for group
        
        return '#6c757d'; // Default gray
    };

    const getCombinedStatusLabel = (assignment: Assignment) => {
        const status = getSubmissionStatus(assignment);
        const timeRemaining = getTimeRemaining(assignment.due_at);
        
        if (status === 'Unsubmitted') {
            if (!assignment.due_at) return 'Low Priority';
            
            const now = new Date();
            const dueDate = new Date(assignment.due_at);
            const timeDiff = dueDate.getTime() - now.getTime();
            const hoursLeft = timeDiff / (1000 * 60 * 60);
            
            if (timeDiff < 0) {
                // Overdue
                const overdueDays = Math.floor(Math.abs(timeDiff) / (1000 * 60 * 60 * 24));
                const overdueHours = Math.floor((Math.abs(timeDiff) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                
                if (overdueDays > 0) {
                    return `OVERDUE (by ${overdueDays}${overdueDays === 1 ? ' day' : ' days'})!`;
                } else if (overdueHours > 0) {
                    return `OVERDUE (by ${overdueHours}${overdueHours === 1 ? ' hr' : ' hrs'})!`;
                } else {
                    const overdueMinutes = Math.floor((Math.abs(timeDiff) % (1000 * 60 * 60)) / (1000 * 60));
                    return `OVERDUE (by ${overdueMinutes}${overdueMinutes === 1 ? ' min' : ' mins'})!`;
                }
            }
            
            if (hoursLeft < 24) {
                const hours = Math.floor(hoursLeft);
                const minutes = Math.floor((hoursLeft % 1) * 60);
                if (hours > 0) {
                    return `ALMOST DUE (due in ${hours}${hours === 1 ? ' hr' : ' hrs'})`;
                } else {
                    return `ALMOST DUE (due in ${minutes}${minutes === 1 ? ' min' : ' mins'})`;
                }
            }
            
            const days = Math.floor(hoursLeft / 24);
            return `DUE SOON (due in ${days}${days === 1 ? ' day' : ' days'})`;
        }
        
        return status; // Use the actual status for submitted, graded, etc.
    };


    return (
        <div className="overview">
            <div className="overview-header">
                <h1><LuLayoutDashboard size={24} /> Overview</h1>
                {onRefresh && (
                    <button 
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
                        title="Refresh data to get latest assignments and announcements"
                    >
                        <LuRefreshCw size={20} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                )}
            </div>
            
            <div className="overview-section">
                <div className="section-header">
                    <h2><LuAlarmClock size={20} /> Urgent Assignments</h2>
                    {ignoredUrgentAssignments.length > 0 && (
                        <button 
                            onClick={() => setShowIgnored(!showIgnored)}
                            className={`ignored-toggle-btn ${showIgnored ? 'active' : ''}`}
                            title={`${showIgnored ? 'Hide' : 'Show'} ${ignoredUrgentAssignments.length} ignored assignment${ignoredUrgentAssignments.length === 1 ? '' : 's'}`}
                        >
                            <LuUndo2 size={16} />
                            {showIgnored ? 'Hide Ignored' : `Show Ignored (${ignoredUrgentAssignments.length})`}
                        </button>
                    )}
                </div>
                
                {filteredUrgentAssignments.length > 0 ? (
                    <div className="assignment-list">
                        {filteredUrgentAssignments.map(assignment => {
                            const course = courses.find(c => c.id === assignment.courseId);
                            const courseCode = course ? getCourseCode(course.name) : '';
                            const statusLabel = getCombinedStatusLabel(assignment);
                            const statusColor = getStatusColor(assignment);
                            
                            return (
                                <div key={assignment.id} className="assignment-card">
                                    <div className="assignment-header">
                                        <a href={assignment.html_url} target="_blank" rel="noreferrer" className="assignment-title">
                                            [{courseCode}] {assignment.name}
                                        </a>
                                        <div className="status-container">
                                            <span 
                                                className="status-badge" 
                                                style={{ backgroundColor: statusColor }}
                                            >
                                                {statusLabel}
                                            </span>
                                            <button
                                                onClick={() => toggleIgnoreAssignment(assignment.id)}
                                                className={`ignore-btn ${ignoredAssignments.has(assignment.id) ? 'ignored' : ''}`}
                                                title={ignoredAssignments.has(assignment.id) ? 'Unignore assignment' : 'Ignore assignment'}
                                            >
                                                {ignoredAssignments.has(assignment.id) ? 
                                                    <LuEye size={14} /> : 
                                                    <LuEyeOff size={14} />
                                                }
                                            </button>
                                        </div>
                                    </div>
                                    <div className="assignment-due">
                                        Due: {formatDate(assignment.due_at)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="empty-state">No urgent assignments</p>
                )}

                {/* Ignored Assignments Section */}
                {showIgnored && ignoredUrgentAssignments.length > 0 && (
                    <div className="ignored-assignments">
                        <h3 className="ignored-header">
                            <LuUndo2 size={18} />
                            Ignored Assignments ({ignoredUrgentAssignments.length})
                        </h3>
                        <div className="assignment-list">
                            {ignoredUrgentAssignments.map(assignment => {
                                const course = courses.find(c => c.id === assignment.courseId);
                                const courseCode = course ? getCourseCode(course.name) : '';
                                const statusLabel = getCombinedStatusLabel(assignment);
                                const statusColor = getStatusColor(assignment);
                                
                                return (
                                    <div key={assignment.id} className="assignment-card ignored-card">
                                        <div className="assignment-header">
                                            <a href={assignment.html_url} target="_blank" rel="noreferrer" className="assignment-title">
                                                [{courseCode}] {assignment.name}
                                            </a>
                                            <div className="status-container">
                                                <span 
                                                    className="status-badge" 
                                                    style={{ backgroundColor: statusColor }}
                                                >
                                                    {statusLabel}
                                                </span>
                                                <button
                                                    onClick={() => toggleIgnoreAssignment(assignment.id)}
                                                    className="restore-btn"
                                                    title="Restore this assignment to urgent list"
                                                >
                                                    <LuUndo2 size={14} />
                                                    Restore
                                                </button>
                                            </div>
                                        </div>
                                        <div className="assignment-due">
                                            Due: {formatDate(assignment.due_at)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="overview-section">
                <div className="section-header">
                    <h2><LuMegaphone size={20} /> Recent Announcements</h2>
                </div>
                
                {recentAnnouncements.length > 0 ? (
                    <div className="announcement-list">
                        {recentAnnouncements.map(announcement => {
                            const course = courses.find(c => c.id === announcement.courseId);
                            const courseCode = course ? getCourseCode(course.name) : '';
                            return (
                                <div key={announcement.id} className="announcement-card">
                                    <div className="announcement-header">
                                        <a href={announcement.url} target="_blank" rel="noreferrer" className="announcement-title">
                                            [{courseCode}] {announcement.title}
                                        </a>
                                    </div>
                                    <div className="announcement-meta">
                                        Posted: {formatDate(announcement.posted_at)} ({getTimeAgo(announcement.posted_at)})
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="empty-state">No recent announcements</p>
                )}
            </div>

            <style jsx>{`
                .overview {
                    padding: var(--spacing-lg);
                    background: var(--background-primary);
                    min-height: 100vh;
                }
                
                .overview-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: var(--spacing-lg);
                    padding-bottom: var(--spacing-sm);
                    border-bottom: 2px solid var(--border-color);
                }

                .overview h1 {
                    margin: 0;
                    color: var(--primary-color);
                    font-size: var(--font-size-2xl);
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                }

                .refresh-btn {
                    background: var(--accent-color);
                    color: white;
                    padding: var(--spacing-xs) var(--spacing-md);
                    border-radius: 0;
                    border: none;
                    cursor: pointer;
                    font-size: var(--font-size-sm);
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-xs);
                    box-shadow: var(--shadow-sm);
                    transition: all 0.2s ease;
                }

                .refresh-btn:hover:not(:disabled) {
                    background: #8FB61F;
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                }

                .refresh-btn:disabled {
                    background: var(--border-color);
                    color: var(--text-secondary);
                    cursor: not-allowed;
                    opacity: 0.7;
                }

                .refresh-btn.refreshing {
                    background: #8FB61F;
                }

                .refresh-btn.refreshing svg {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .overview-section {
                    margin-bottom: var(--spacing-lg);
                    background: var(--background-secondary);
                    border-radius: 0;
                    padding: var(--spacing-lg);
                    box-shadow: var(--shadow-md);
                    border: 1px solid var(--border-color);
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: var(--spacing-md);
                    padding-bottom: var(--spacing-xs);
                    border-bottom: 2px solid var(--border-color);
                }

                .section-header h2 {
                    margin: 0;
                    color: var(--primary-color);
                    font-size: var(--font-size-lg);
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-xs);
                }

                .ignored-toggle-btn {
                    background: var(--background-primary);
                    color: var(--text-primary);
                    padding: var(--spacing-xs) var(--spacing-sm);
                    border: 2px solid var(--border-color);
                    border-radius: 0;
                    cursor: pointer;
                    font-size: var(--font-size-sm);
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-xs);
                    box-shadow: var(--shadow-sm);
                    transition: all 0.2s ease;
                }

                .ignored-toggle-btn:hover {
                    background: var(--background-secondary);
                    border-color: var(--accent-color);
                    color: var(--primary-color);
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                }

                .ignored-toggle-btn.active {
                    background: var(--accent-color);
                    color: var(--dark-gray);
                    border-color: var(--accent-color);
                    font-weight: 700;
                }

                .ignored-assignments {
                    margin-top: var(--spacing-xl);
                    padding-top: var(--spacing-xl);
                    border-top: 2px solid var(--border-color);
                    background: rgba(167, 209, 41, 0.05);
                    border-radius: 0;
                    padding: var(--spacing-lg);
                }

                .ignored-header {
                    margin: 0 0 var(--spacing-md) 0;
                    color: var(--primary-color);
                    font-size: var(--font-size-lg);
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                    padding-bottom: var(--spacing-sm);
                    border-bottom: 1px solid var(--border-color);
                }

                .restore-btn {
                    background: var(--accent-color);
                    color: var(--dark-gray);
                    padding: var(--spacing-xs) var(--spacing-sm);
                    border: 2px solid var(--accent-color);
                    border-radius: 0;
                    cursor: pointer;
                    font-size: var(--font-size-xs);
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-xs);
                    box-shadow: var(--shadow-sm);
                    transition: all 0.2s ease;
                    min-width: auto;
                    height: auto;
                }

                .restore-btn:hover {
                    background: #8FB61F;
                    border-color: #8FB61F;
                    transform: translateY(-1px);
                    box-shadow: var(--shadow-md);
                }

                .assignment-list, .announcement-list {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-sm);
                }

                .assignment-card, .announcement-card {
                    background: var(--background-primary);
                    border: 2px solid var(--border-color);
                    border-radius: 0;
                    padding: var(--spacing-md);
                    box-shadow: var(--shadow-sm);
                    transition: all 0.2s ease;
                }

                .assignment-card:hover, .announcement-card:hover {
                    box-shadow: var(--shadow-md);
                    transform: translateY(-2px);
                    border-color: var(--accent-color);
                }

                .assignment-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: var(--spacing-sm);
                    margin-bottom: var(--spacing-xs);
                }

                .status-container {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                    flex-shrink: 0;
                }

                .assignment-title, .announcement-title {
                    color: var(--primary-color);
                    text-decoration: none;
                    font-weight: 600;
                    flex: 1;
                    font-size: var(--font-size-base);
                    transition: color 0.2s ease;
                }

                .assignment-title:hover, .announcement-title:hover {
                    color: var(--accent-color);
                    text-decoration: underline;
                }

                .status-badge {
                    color: white;
                    padding: var(--spacing-xs) var(--spacing-sm);
                    border-radius: 12px;
                    font-size: var(--font-size-xs);
                    font-weight: 600;
                    white-space: nowrap;
                    box-shadow: var(--shadow-sm);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .ignore-btn {
                    padding: var(--spacing-xs);
                    border: 2px solid var(--border-color);
                    background: var(--background-primary);
                    border-radius: 0;
                    cursor: pointer;
                    color: var(--text-primary);
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 28px;
                    height: 28px;
                }

                .ignore-btn:hover {
                    border-color: var(--accent-color);
                    color: var(--primary-color);
                    transform: scale(1.1);
                    box-shadow: var(--shadow-sm);
                }

                .ignore-btn.ignored {
                    border-color: var(--error-color);
                    color: var(--error-color);
                    background: rgba(239, 68, 68, 0.1);
                }

                .ignore-btn.ignored:hover {
                    border-color: #DC2626;
                    color: #DC2626;
                    background: rgba(239, 68, 68, 0.2);
                    transform: scale(1.1);
                }

                .assignment-due, .announcement-meta {
                    color: var(--text-secondary);
                    font-size: var(--font-size-sm);
                    font-weight: 500;
                    margin-top: var(--spacing-xs);
                }

                .ignored-card {
                    opacity: 0.8;
                    background: var(--background-primary);
                    border: 2px dashed var(--border-color);
                }

                .ignored-card:hover {
                    opacity: 1;
                    border-color: var(--accent-color);
                    border-style: solid;
                    transform: translateY(-2px);
                }

                .ignored-card .assignment-header {
                    background: var(--background-primary);
                    border: 2px solid var(--border-color);
                    border-radius: 0;
                    padding: var(--spacing-lg);
                    box-shadow: var(--shadow-sm);
                    margin-bottom: var(--spacing-sm);
                }

                .ignored-card .assignment-header .status-container {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: var(--spacing-xs);
                }

                .ignored-card .assignment-header .status-badge {
                    padding: var(--spacing-xs) var(--spacing-sm);
                    border-radius: var(--radius-lg);
                    font-size: var(--font-size-xs);
                    font-weight: 600;
                    white-space: nowrap;
                    box-shadow: var(--shadow-sm);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .ignored-card .assignment-header .restore-btn {
                    background: var(--accent-color);
                    color: var(--dark-gray);
                    padding: var(--spacing-xs) var(--spacing-sm);
                    border: 2px solid var(--accent-color);
                    border-radius: 0;
                    cursor: pointer;
                    font-size: var(--font-size-xs);
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-xs);
                    box-shadow: var(--shadow-sm);
                    transition: all 0.2s ease;
                    min-width: auto;
                    height: auto;
                }

                .ignored-card .assignment-header .restore-btn:hover {
                    background: #8FB61F;
                    border-color: #8FB61F;
                    transform: translateY(-1px);
                    box-shadow: var(--shadow-md);
                }

                .empty-state {
                    color: var(--text-secondary);
                    font-style: italic;
                    text-align: center;
                    padding: var(--spacing-2xl) var(--spacing-xl);
                    background: var(--background-primary);
                    border-radius: 0;
                    border: 2px dashed var(--border-color);
                    font-size: var(--font-size-base);
                }
                
                /* Responsive design */
                @media (max-width: 768px) {
                    .overview {
                        padding: var(--spacing-md);
                    }
                    
                    .overview h1 {
                        font-size: var(--font-size-xl);
                        margin-bottom: var(--spacing-md);
                    }
                    
                    .overview-section {
                        padding: var(--spacing-md);
                        margin-bottom: var(--spacing-md);
                    }
                    
                    .assignment-header {
                        flex-direction: column;
                        align-items: stretch;
                        gap: var(--spacing-xs);
                    }
                    
                    .status-container {
                        justify-content: flex-start;
                    }
                    
                    .assignment-card, .announcement-card {
                        padding: var(--spacing-sm);
                    }
                }
                
                @media (max-width: 480px) {
                    .overview {
                        padding: var(--spacing-sm);
                    }
                    
                    .overview h1 {
                        font-size: var(--font-size-lg);
                        flex-direction: column;
                        text-align: center;
                        gap: var(--spacing-xs);
                    }
                    
                    .overview-section h2 {
                        font-size: var(--font-size-base);
                        flex-direction: column;
                        text-align: center;
                        gap: var(--spacing-xs);
                    }
                }
            `}</style>
        </div>
    );
} 