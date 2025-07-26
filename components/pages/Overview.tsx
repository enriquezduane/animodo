'use client';

import { Assignment, Announcement, Course } from '../types';
import { LuAlarmClock, LuMegaphone } from 'react-icons/lu';

interface OverviewProps {
    courses: Course[];
    urgentAssignments: (Assignment & { courseId: number })[];
    recentAnnouncements: (Announcement & { courseId: number })[];
}

export default function Overview({ courses, urgentAssignments, recentAnnouncements }: OverviewProps) {
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
        if (days > 0) return `${days} days ago`;
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (hours > 0) return `${hours} hours ago`;
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        return `${minutes} minutes ago`;
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

    const getStatusLabel = (assignment: Assignment) => {
        const status = getSubmissionStatus(assignment);
        
        if (status === 'Unsubmitted') {
            if (!assignment.due_at) return 'Low Priority';
            
            const now = new Date();
            const dueDate = new Date(assignment.due_at);
            const timeDiff = dueDate.getTime() - now.getTime();
            const hoursLeft = timeDiff / (1000 * 60 * 60);
            
            if (timeDiff < 0) return 'Overdue!';
            if (hoursLeft < 24) return 'Almost Due';
            return 'Due Soon';
        }
        
        return status; // Use the actual status for submitted, graded, etc.
    };



    return (
        <div className="overview">
            <h1>Overview</h1>
            
            <div className="overview-section">
                <h2><LuAlarmClock size={20} /> Urgent Assignments</h2>
                {urgentAssignments.length > 0 ? (
                    <div className="assignment-list">
                        {urgentAssignments.map(assignment => {
                            const course = courses.find(c => c.id === assignment.courseId);
                            const courseCode = course ? getCourseCode(course.name) : '';
                            const statusLabel = getStatusLabel(assignment);
                            const statusColor = getStatusColor(assignment);
                            
                            return (
                                <div key={assignment.id} className="assignment-card">
                                    <div className="assignment-header">
                                        <a href={assignment.html_url} target="_blank" rel="noreferrer" className="assignment-title">
                                            [{courseCode}] {assignment.name}
                                        </a>
                                        <div className="status-container">
                                            {assignment.due_at && (
                                                <span className="days-countdown">
                                                    {getTimeRemaining(assignment.due_at)}
                                                </span>
                                            )}
                                            <span 
                                                className="status-badge" 
                                                style={{ backgroundColor: statusColor }}
                                            >
                                                {statusLabel}
                                            </span>
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
            </div>

            <div className="overview-section">
                <h2><LuMegaphone size={20} /> Recent Announcements</h2>
                {recentAnnouncements.length > 0 ? (
                    <div className="announcement-list">
                        {recentAnnouncements.map(announcement => {
                            const course = courses.find(c => c.id === announcement.courseId);
                            const courseCode = course ? getCourseCode(course.name) : '';
                            return (
                                <div key={announcement.id} className="announcement-card">
                                    <a href={announcement.url} target="_blank" rel="noreferrer" className="announcement-title">
                                        [{courseCode}] {announcement.title}
                                    </a>
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
                    padding: var(--spacing-xl);
                    background: var(--background-primary);
                    min-height: 100vh;
                }
                
                .overview h1 {
                    margin: 0 0 var(--spacing-2xl) 0;
                    color: var(--primary-color);
                    font-size: var(--font-size-3xl);
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-md);
                }

                .overview-section {
                    margin-bottom: var(--spacing-2xl);
                    background: var(--background-secondary);
                    border-radius: var(--radius-lg);
                    padding: var(--spacing-xl);
                    box-shadow: var(--shadow-md);
                    border: 1px solid var(--border-color);
                }

                .overview-section h2 {
                    margin: 0 0 var(--spacing-lg) 0;
                    color: var(--primary-color);
                    font-size: var(--font-size-xl);
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                    padding-bottom: var(--spacing-md);
                    border-bottom: 2px solid var(--border-color);
                }

                .assignment-list, .announcement-list {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-md);
                }

                .assignment-card, .announcement-card {
                    background: var(--background-primary);
                    border: 2px solid var(--border-color);
                    border-radius: var(--radius-md);
                    padding: var(--spacing-lg);
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
                    gap: var(--spacing-md);
                    margin-bottom: var(--spacing-sm);
                }

                .status-container {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                    flex-shrink: 0;
                }

                .days-countdown {
                    background: linear-gradient(135deg, var(--accent-color), #8FB61F);
                    color: var(--dark-gray);
                    padding: var(--spacing-xs) var(--spacing-sm);
                    border-radius: var(--radius-lg);
                    font-size: var(--font-size-xs);
                    font-weight: 700;
                    white-space: nowrap;
                    box-shadow: var(--shadow-sm);
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
                    border-radius: var(--radius-lg);
                    font-size: var(--font-size-xs);
                    font-weight: 600;
                    white-space: nowrap;
                    box-shadow: var(--shadow-sm);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .assignment-due, .announcement-meta {
                    color: var(--text-secondary);
                    font-size: var(--font-size-sm);
                    font-weight: 500;
                    margin-top: var(--spacing-xs);
                }

                .empty-state {
                    color: var(--text-secondary);
                    font-style: italic;
                    text-align: center;
                    padding: var(--spacing-2xl) var(--spacing-xl);
                    background: var(--background-primary);
                    border-radius: var(--radius-md);
                    border: 2px dashed var(--border-color);
                    font-size: var(--font-size-base);
                }
                
                /* Responsive design */
                @media (max-width: 768px) {
                    .overview {
                        padding: var(--spacing-lg);
                    }
                    
                    .overview h1 {
                        font-size: var(--font-size-2xl);
                        margin-bottom: var(--spacing-xl);
                    }
                    
                    .overview-section {
                        padding: var(--spacing-lg);
                        margin-bottom: var(--spacing-xl);
                    }
                    
                    .assignment-header {
                        flex-direction: column;
                        align-items: stretch;
                        gap: var(--spacing-sm);
                    }
                    
                    .status-container {
                        justify-content: flex-start;
                    }
                    
                    .assignment-card, .announcement-card {
                        padding: var(--spacing-md);
                    }
                }
                
                @media (max-width: 480px) {
                    .overview {
                        padding: var(--spacing-md);
                    }
                    
                    .overview h1 {
                        font-size: var(--font-size-xl);
                        flex-direction: column;
                        text-align: center;
                        gap: var(--spacing-sm);
                    }
                    
                    .overview-section h2 {
                        font-size: var(--font-size-lg);
                        flex-direction: column;
                        text-align: center;
                        gap: var(--spacing-xs);
                    }
                }
            `}</style>
        </div>
    );
} 