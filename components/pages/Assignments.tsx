'use client';

import { Assignment, CourseWithAssignments } from '../types';

interface AssignmentsProps {
    coursesWithAssignments: CourseWithAssignments[];
    expandedCourses: Set<number>;
    showOverdueAssignments: boolean;
    showNoDueDates: boolean;
    onToggleCourse: (courseId: number) => void;
    onToggleOverdue: () => void;
    onToggleNoDueDates: () => void;
}

export default function Assignments({ 
    coursesWithAssignments, 
    expandedCourses, 
    showOverdueAssignments, 
    showNoDueDates,
    onToggleCourse, 
    onToggleOverdue,
    onToggleNoDueDates
}: AssignmentsProps) {
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
        <div className="assignments">
            <h1>📝 All Assignments</h1>
            
            <div className="filters">
                <button 
                    onClick={onToggleOverdue}
                    className={`filter-btn ${showOverdueAssignments ? 'active' : ''}`}
                >
                    {showOverdueAssignments ? '✓ Showing > 10 days overdue' : 'Show > 10 days overdue'}
                </button>
                <button 
                    onClick={onToggleNoDueDates}
                    className={`filter-btn ${showNoDueDates ? 'active' : ''}`}
                >
                    {showNoDueDates ? '✓ Showing no due dates' : 'Show no due dates'}
                </button>
            </div>

            <div className="courses-list">
                {coursesWithAssignments.map(course => (
                    <div key={course.id} className="course-section">
                        <button 
                            onClick={() => onToggleCourse(course.id)} 
                            className="course-header"
                        >
                            <span className="expand-icon">
                                {expandedCourses.has(course.id) ? '▼' : '▶'}
                            </span>
                            <span className="course-title">
                                [{getCourseCode(course.name)}] {course.name}
                            </span>
                            <span className="assignment-count">
                                {course.assignments.length} assignment{course.assignments.length !== 1 ? 's' : ''}
                            </span>
                        </button>
                        
                        {expandedCourses.has(course.id) && (
                            <div className="assignments-container">
                                {course.assignments.length > 0 ? (
                                    <div className="assignment-list">
                                        {course.assignments.map(assignment => {
                                            const status = getSubmissionStatus(assignment);
                                            const statusColor = getStatusColor(assignment);
                                            
                                            return (
                                                <div key={assignment.id} className="assignment-card">
                                                    <div className="assignment-header">
                                                        <a 
                                                            href={assignment.html_url} 
                                                            target="_blank" 
                                                            rel="noreferrer" 
                                                            className="assignment-title"
                                                        >
                                                            {assignment.name}
                                                        </a>
                                                        <span 
                                                            className="status-badge"
                                                            style={{ backgroundColor: statusColor }}
                                                        >
                                                            {status}
                                                        </span>
                                                    </div>
                                                    <div className="assignment-meta">
                                                        <div className="due-date">
                                                            Due: {formatDate(assignment.due_at)}
                                                            {assignment.due_at && (
                                                                <span className="time-remaining">
                                                                    ({getTimeRemaining(assignment.due_at)})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="empty-state">No assignments found</p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <style jsx>{`
                .assignments {
                    padding: 20px;
                }
                
                .assignments h1 {
                    margin: 0 0 30px 0;
                    color: #212529;
                    font-size: 28px;
                }

                .filters {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 30px;
                    flex-wrap: wrap;
                }

                .filter-btn {
                    padding: 8px 16px;
                    border: 2px solid #dee2e6;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    color: #495057;
                    transition: all 0.2s ease;
                }

                .filter-btn:hover {
                    border-color: #007bff;
                    color: #007bff;
                }

                .filter-btn.active {
                    background: #007bff;
                    border-color: #007bff;
                    color: white;
                }

                .courses-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .course-section {
                    background: white;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .course-header {
                    width: 100%;
                    padding: 16px 20px;
                    border: none;
                    background: #f8f9fa;
                    text-align: left;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 16px;
                    font-weight: 500;
                    color: #495057;
                    transition: background-color 0.2s ease;
                }

                .course-header:hover {
                    background: #e9ecef;
                }

                .expand-icon {
                    font-size: 14px;
                    width: 16px;
                }

                .course-title {
                    flex: 1;
                }

                .assignment-count {
                    font-size: 14px;
                    font-weight: normal;
                    color: #6c757d;
                }

                .assignments-container {
                    padding: 0;
                }

                .assignment-list {
                    display: flex;
                    flex-direction: column;
                }

                .assignment-card {
                    padding: 16px 20px;
                    border-top: 1px solid #e9ecef;
                    transition: background-color 0.2s ease;
                }

                .assignment-card:hover {
                    background: #f8f9fa;
                }

                .assignment-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 12px;
                    margin-bottom: 8px;
                }

                .assignment-title {
                    color: #007bff;
                    text-decoration: none;
                    font-weight: 500;
                    flex: 1;
                    line-height: 1.4;
                }

                .assignment-title:hover {
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

                .assignment-meta {
                    color: #6c757d;
                    font-size: 14px;
                }

                .due-date {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .time-remaining {
                    font-weight: 500;
                }

                .empty-state {
                    color: #6c757d;
                    font-style: italic;
                    text-align: center;
                    padding: 40px 20px;
                    background: #f8f9fa;
                }
            `}</style>
        </div>
    );
} 