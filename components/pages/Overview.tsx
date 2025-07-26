'use client';

import { Assignment, Announcement, Course } from '../types';

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
        
        if (timeDiff < 0) {
            const pastDiff = Math.abs(timeDiff);
            const pastDays = Math.floor(pastDiff / (1000 * 60 * 60 * 24));
            if (pastDays > 0) return `${pastDays} days overdue`;
            const pastHours = Math.floor((pastDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            if (pastHours > 0) return `${pastHours} hours overdue`;
            const pastMinutes = Math.floor((pastDiff % (1000 * 60 * 60)) / (1000 * 60));
            return `${pastMinutes} minutes overdue`;
        }
        
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        if (days > 0) return `${days} days left`;
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (hours > 0) return `${hours} hours left`;
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        return `${minutes} minutes left`;
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
            if (hoursLeft < 24) return '#fd7e14'; // Orange for due soon
            if (hoursLeft < 72) return '#ffc107'; // Yellow for due in 3 days
            return '#28a745'; // Green for plenty of time
        }
        
        if (status.includes('Submitted') || status.includes('Pending')) return '#17a2b8'; // Teal for submitted
        if (status.includes('Graded')) return '#6f42c1'; // Purple for graded
        if (status === 'Group Submitted') return '#20c997'; // Teal-green for group
        
        return '#6c757d'; // Default gray
    };

    return (
        <div className="overview">
            <h1>Overview</h1>
            
            <div className="overview-section">
                <h2>🚨 Urgent Assignments</h2>
                {urgentAssignments.length > 0 ? (
                    <div className="assignment-list">
                        {urgentAssignments.map(assignment => {
                            const course = courses.find(c => c.id === assignment.courseId);
                            const courseCode = course ? getCourseCode(course.name) : '';
                            const status = getSubmissionStatus(assignment);
                            const statusColor = getStatusColor(assignment);
                            
                            return (
                                <div key={assignment.id} className="assignment-card">
                                    <div className="assignment-header">
                                        <a href={assignment.html_url} target="_blank" rel="noreferrer" className="assignment-title">
                                            [{courseCode}] {assignment.name}
                                        </a>
                                        <span 
                                            className="status-badge" 
                                            style={{ backgroundColor: statusColor }}
                                        >
                                            {status}
                                        </span>
                                    </div>
                                    <div className="assignment-due">
                                        Due: {formatDate(assignment.due_at)} {assignment.due_at ? `(${getTimeRemaining(assignment.due_at)})` : ''}
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
                <h2>📢 Recent Announcements</h2>
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
                    padding: 20px;
                }
                
                .overview h1 {
                    margin: 0 0 30px 0;
                    color: #212529;
                    font-size: 28px;
                }

                .overview-section {
                    margin-bottom: 40px;
                }

                .overview-section h2 {
                    margin: 0 0 20px 0;
                    color: #495057;
                    font-size: 20px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .assignment-list, .announcement-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .assignment-card, .announcement-card {
                    background: white;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    padding: 16px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    transition: box-shadow 0.2s ease;
                }

                .assignment-card:hover, .announcement-card:hover {
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                }

                .assignment-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 12px;
                    margin-bottom: 8px;
                }

                .assignment-title, .announcement-title {
                    color: #007bff;
                    text-decoration: none;
                    font-weight: 500;
                    flex: 1;
                }

                .assignment-title:hover, .announcement-title:hover {
                    text-decoration: underline;
                }

                .status-badge {
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                    white-space: nowrap;
                }

                .assignment-due, .announcement-meta {
                    color: #6c757d;
                    font-size: 14px;
                }

                .empty-state {
                    color: #6c757d;
                    font-style: italic;
                    text-align: center;
                    padding: 40px 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
            `}</style>
        </div>
    );
} 