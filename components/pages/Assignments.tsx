'use client';

import { useState, useEffect } from 'react';
import { Assignment, CourseWithAssignments, Course } from '../types';

interface AssignmentsProps {
    coursesWithAssignments: CourseWithAssignments[];
    courses: Course[];
    expandedCourses: Set<number>;
    showOverdueAssignments: boolean;
    showNoDueDates: boolean;
    onToggleCourse: (courseId: number) => void;
    onToggleOverdue: () => void;
    onToggleNoDueDates: () => void;
}

type StatusFilter = 'unsubmitted' | 'submitted' | 'graded' | 'pending_review' | 'group_submitted';

export default function Assignments({ 
    coursesWithAssignments,
    courses,
    expandedCourses, 
    showOverdueAssignments, 
    showNoDueDates,
    onToggleCourse, 
    onToggleOverdue,
    onToggleNoDueDates
}: AssignmentsProps) {
    const [selectedStatuses, setSelectedStatuses] = useState<Set<StatusFilter>>(new Set(['unsubmitted']));
    const [ignoredAssignments, setIgnoredAssignments] = useState<Set<number>>(new Set());
    const [selectedCourses, setSelectedCourses] = useState<Set<number>>(new Set());
    const [selectAllCourses, setSelectAllCourses] = useState(true);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showCourseDropdown, setShowCourseDropdown] = useState(false);
    const [showIgnored, setShowIgnored] = useState(false);

    // Initialize with all courses selected
    useEffect(() => {
        if (selectAllCourses) {
            setSelectedCourses(new Set(courses.map(c => c.id)));
        }
    }, [courses, selectAllCourses]);

    // Load preferences from localStorage
    useEffect(() => {
        const savedStatuses = localStorage.getItem('assignment_status_filters');
        const savedIgnored = localStorage.getItem('ignored_assignments');
        const savedCourses = localStorage.getItem('selected_courses');
        const savedSelectAll = localStorage.getItem('select_all_courses');
        
        if (savedStatuses) {
            setSelectedStatuses(new Set(JSON.parse(savedStatuses)));
        }
        if (savedIgnored) {
            setIgnoredAssignments(new Set(JSON.parse(savedIgnored)));
        }
        if (savedCourses && savedSelectAll === 'false') {
            setSelectedCourses(new Set(JSON.parse(savedCourses)));
            setSelectAllCourses(false);
        }
    }, []);

    // Save preferences to localStorage
    useEffect(() => {
        localStorage.setItem('assignment_status_filters', JSON.stringify([...selectedStatuses]));
    }, [selectedStatuses]);

    useEffect(() => {
        localStorage.setItem('ignored_assignments', JSON.stringify([...ignoredAssignments]));
    }, [ignoredAssignments]);

    useEffect(() => {
        localStorage.setItem('selected_courses', JSON.stringify([...selectedCourses]));
        localStorage.setItem('select_all_courses', selectAllCourses.toString());
    }, [selectedCourses, selectAllCourses]);

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

    const getSubmissionStatus = (assignment: Assignment): StatusFilter => {
        if (assignment.has_submitted_submissions && !assignment.submission) {
            return 'group_submitted';
        }
        
        if (!assignment.submission) return 'unsubmitted';
        
        const { workflow_state, score } = assignment.submission;
        
        if (workflow_state === 'graded' && score !== null) {
            return 'graded';
        }
        
        if (workflow_state === 'submitted' || workflow_state === 'pending_review') {
            return workflow_state === 'submitted' ? 'submitted' : 'pending_review';
        }
        
        return 'unsubmitted';
    };

    const getStatusColor = (assignment: Assignment) => {
        const status = getSubmissionStatus(assignment);
        
        if (status === 'unsubmitted') {
            if (!assignment.due_at) return '#6c757d';
            
            const now = new Date();
            const dueDate = new Date(assignment.due_at);
            const timeDiff = dueDate.getTime() - now.getTime();
            const hoursLeft = timeDiff / (1000 * 60 * 60);
            
            if (timeDiff < 0) return '#dc3545';
            if (hoursLeft < 24) return '#fd7e14';
            return '#ffc107';
        }
        
        if (status === 'submitted') return '#28a745';
        if (status === 'pending_review') return '#17a2b8';
        if (status === 'graded') return '#6f42c1';
        if (status === 'group_submitted') return '#20c997';
        
        return '#6c757d';
    };

    const getStatusLabel = (assignment: Assignment) => {
        const status = getSubmissionStatus(assignment);
        
        if (status === 'unsubmitted') {
            if (!assignment.due_at) return 'Low Priority';
            
            const now = new Date();
            const dueDate = new Date(assignment.due_at);
            const timeDiff = dueDate.getTime() - now.getTime();
            const hoursLeft = timeDiff / (1000 * 60 * 60);
            
            if (timeDiff < 0) return 'Overdue!';
            if (hoursLeft < 24) return 'Almost Due';
            return 'Due Soon';
        }
        
        const statusLabels = {
            'submitted': 'Submitted',
            'pending_review': 'Pending Review',
            'graded': 'Graded',
            'group_submitted': 'Group Submitted'
        };
        
        return statusLabels[status] || status;
    };



    const toggleStatusFilter = (status: StatusFilter) => {
        const newStatuses = new Set(selectedStatuses);
        if (newStatuses.has(status)) {
            newStatuses.delete(status);
        } else {
            newStatuses.add(status);
        }
        setSelectedStatuses(newStatuses);
    };

    const toggleCourseFilter = (courseId: number) => {
        const newCourses = new Set(selectedCourses);
        if (newCourses.has(courseId)) {
            newCourses.delete(courseId);
        } else {
            newCourses.add(courseId);
        }
        setSelectedCourses(newCourses);
        setSelectAllCourses(false);
    };

    const handleSelectAllCourses = () => {
        if (selectAllCourses) {
            // Already selected all, do nothing
            return;
        }
        setSelectAllCourses(true);
        setSelectedCourses(new Set(courses.map(c => c.id)));
    };

    const toggleIgnoreAssignment = (assignmentId: number) => {
        const newIgnored = new Set(ignoredAssignments);
        if (newIgnored.has(assignmentId)) {
            newIgnored.delete(assignmentId);
        } else {
            newIgnored.add(assignmentId);
        }
        setIgnoredAssignments(newIgnored);
    };

    const statusOptions: { value: StatusFilter; label: string; color: string }[] = [
        { value: 'unsubmitted', label: 'Unsubmitted', color: '#ffc107' },
        { value: 'submitted', label: 'Submitted', color: '#28a745' },
        { value: 'pending_review', label: 'Pending Review', color: '#17a2b8' },
        { value: 'graded', label: 'Graded', color: '#6f42c1' },
        { value: 'group_submitted', label: 'Group Submitted', color: '#20c997' }
    ];

    // Create flat list of all assignments with course info
    const allAssignments: (Assignment & { courseId: number; courseName: string })[] = [];
    
    coursesWithAssignments.forEach(course => {
        course.assignments.forEach(assignment => {
            allAssignments.push({
                ...assignment,
                courseId: course.id,
                courseName: course.name
            });
        });
    });

    // Filter and sort assignments
    const filteredAssignments = allAssignments
        .filter(assignment => {
            // Check for exclusive filters first
            const now = new Date();
            const maxDaysOverdue = 10;
            
            // If "Show ignored" is active, show ONLY ignored assignments
            if (showIgnored) {
                return ignoredAssignments.has(assignment.id);
            }
            
            // If "Show no due dates" is active, show ONLY assignments with no due dates
            if (showNoDueDates) {
                return !assignment.due_at;
            }
            
            // If "Show > 10 days overdue" is active, show ONLY assignments > 10 days overdue
            if (showOverdueAssignments) {
                if (!assignment.due_at) return false;
                const dueDate = new Date(assignment.due_at);
                const daysFromNow = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                return daysFromNow < -maxDaysOverdue;
            }
            
            // Normal filtering when no exclusive filters are active
            // Apply status filter
            const status = getSubmissionStatus(assignment);
            if (!selectedStatuses.has(status)) return false;
            
            // Apply course filter
            if (!selectedCourses.has(assignment.courseId)) return false;
            
            // Exclude ignored assignments (unless showing ignored)
            if (ignoredAssignments.has(assignment.id)) return false;
            
            // Exclude assignments with no due dates (unless showing them)
            if (!assignment.due_at) return false;
            
            // Exclude assignments > 10 days overdue (unless showing them)
            if (assignment.due_at) {
                const dueDate = new Date(assignment.due_at);
                const daysFromNow = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                if (daysFromNow < -maxDaysOverdue) return false;
            }
            
            return true;
        })
        .sort((a, b) => {
            // Sort by due date (earliest first)
            if (!a.due_at && !b.due_at) return 0;
            if (!a.due_at) return 1;
            if (!b.due_at) return -1;
            return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
        });

    return (
        <div className="assignments">
            <h1>📝 All Assignments</h1>
            
            <div className="filters">
                <div className="filter-row">
                    <div className="status-filter">
                        <button 
                            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                            className="status-dropdown-btn"
                        >
                            Status ({selectedStatuses.size} selected) ▼
                        </button>
                        {showStatusDropdown && (
                            <div className="status-dropdown">
                                {statusOptions.map(option => (
                                    <label key={option.value} className="status-option">
                                        <input
                                            type="checkbox"
                                            checked={selectedStatuses.has(option.value)}
                                            onChange={() => toggleStatusFilter(option.value)}
                                        />
                                        <span 
                                            className="status-color-dot" 
                                            style={{ backgroundColor: option.color }}
                                        ></span>
                                        {option.label}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="course-filter">
                        <button 
                            onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                            className="course-dropdown-btn"
                        >
                            Courses ({selectedCourses.size} selected) ▼
                        </button>
                        {showCourseDropdown && (
                            <div className="course-dropdown">
                                <label className="select-all-course-label">
                                    <input
                                        type="checkbox"
                                        checked={selectAllCourses}
                                        onChange={handleSelectAllCourses}
                                    />
                                    Select All
                                </label>
                                {courses.map(course => (
                                    <label key={course.id} className="course-option">
                                        <input
                                            type="checkbox"
                                            checked={selectedCourses.has(course.id)}
                                            onChange={() => toggleCourseFilter(course.id)}
                                        />
                                        {course.name}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="filter-row">
                    <button 
                        onClick={onToggleOverdue}
                        className={`filter-btn ${showOverdueAssignments ? 'active' : ''}`}
                    >
                        {showOverdueAssignments ? '✓ Only > 10 days overdue' : 'Only > 10 days overdue'}
                    </button>
                    <button 
                        onClick={onToggleNoDueDates}
                        className={`filter-btn ${showNoDueDates ? 'active' : ''}`}
                    >
                        {showNoDueDates ? '✓ Only no due dates' : 'Only no due dates'}
                    </button>
                    <button 
                        onClick={() => setShowIgnored(!showIgnored)}
                        className={`filter-btn ${showIgnored ? 'active' : ''}`}
                    >
                        {showIgnored ? '✓ Only ignored' : 'Only ignored'}
                    </button>
                </div>
            </div>

            <div className="assignments-list">
                {filteredAssignments.length > 0 ? (
                    filteredAssignments.map(assignment => {
                        const statusLabel = getStatusLabel(assignment);
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
                                <div className="assignment-meta">
                                    <div className="due-date">
                                        [{getCourseCode(assignment.courseName)}] Due: {formatDate(assignment.due_at)}
                                    </div>
                                    <button
                                        onClick={() => toggleIgnoreAssignment(assignment.id)}
                                        className={`ignore-btn ${ignoredAssignments.has(assignment.id) ? 'ignored' : ''}`}
                                        title={ignoredAssignments.has(assignment.id) ? 'Unignore assignment' : 'Ignore assignment'}
                                    >
                                        {ignoredAssignments.has(assignment.id) ? '👁️ Unignore' : '🙈 Ignore'}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="empty-state">No assignments found matching your filters</div>
                )}
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
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 30px;
                    flex-wrap: wrap;
                }

                .filter-row {
                    display: flex;
                    gap: 12px;
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

                .status-filter {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .status-dropdown-btn {
                    padding: 8px 16px;
                    border: 2px solid #dee2e6;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    color: #495057;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .status-dropdown-btn:hover {
                    border-color: #007bff;
                    color: #007bff;
                }

                .status-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    background: white;
                    border: 1px solid #e9ecef;
                    border-radius: 6px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                    width: 200px;
                    padding: 8px 0;
                }

                .status-option {
                    display: flex;
                    align-items: center;
                    padding: 8px 12px;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }

                .status-option:hover {
                    background-color: #f8f9fa;
                }

                .status-option input {
                    margin-right: 10px;
                    transform: scale(0.8);
                }

                .status-color-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    margin-right: 10px;
                }

                .course-filter {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .course-dropdown-btn {
                    padding: 8px 16px;
                    border: 2px solid #dee2e6;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    color: #495057;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .course-dropdown-btn:hover {
                    border-color: #007bff;
                    color: #007bff;
                }

                .course-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    background: white;
                    border: 1px solid #e9ecef;
                    border-radius: 6px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                    width: 250px; /* Adjust width as needed */
                    padding: 8px 0;
                }

                .course-option {
                    display: flex;
                    align-items: center;
                    padding: 8px 12px;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }

                .course-option:hover {
                    background-color: #f8f9fa;
                }

                .course-option input {
                    margin-right: 10px;
                    transform: scale(0.8);
                }

                .select-all-course-label {
                    display: flex;
                    align-items: center;
                    padding: 8px 12px;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                    font-weight: bold;
                    color: #495057;
                }

                .select-all-course-label:hover {
                    background-color: #f8f9fa;
                }

                .select-all-course-label input {
                    margin-right: 10px;
                    transform: scale(0.8);
                }

                .assignments-list {
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

                .status-container {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .course-name {
                    font-size: 14px;
                    font-weight: 500;
                    color: #495057;
                    flex-shrink: 0;
                }

                .days-countdown {
                    font-weight: 500;
                    color: #6c757d;
                    font-size: 14px;
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
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .due-date {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }



                .days-left {
                    font-size: 12px;
                    font-weight: 500;
                    color: #6c757d;
                }

                .ignore-btn {
                    padding: 4px 8px;
                    border: 1px solid #dee2e6;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    color: #495057;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .ignore-btn:hover {
                    border-color: #007bff;
                    color: #007bff;
                }

                .ignore-btn.ignored {
                    border-color: #dc3545;
                    color: #dc3545;
                    background: #f8d7da;
                }

                .ignore-btn.ignored:hover {
                    border-color: #c82333;
                    color: #c82333;
                    background: #f5c6cb;
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