'use client';

import { useState, useEffect, useRef } from 'react';
import { Assignment, AssignmentsProps } from '../types';
import { getCourseCode } from '../utils';
import { storageService } from '../services/storage.service';
import { LuClipboardList, LuEyeOff, LuEye } from 'react-icons/lu';

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

    // Refs for click outside detection
    const statusDropdownRef = useRef<HTMLDivElement>(null);
    const courseDropdownRef = useRef<HTMLDivElement>(null);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
                setShowStatusDropdown(false);
            }
            if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target as Node)) {
                setShowCourseDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Initialize with all courses selected
    useEffect(() => {
        if (selectAllCourses && courses.length > 0) {
            setSelectedCourses(new Set(courses.map(c => c.id)));
        }
    }, [courses, selectAllCourses]);

    // Load preferences from storage
    useEffect(() => {
        const savedStatuses = storageService.getAssignmentStatusFilters();
        const savedIgnored = storageService.getIgnoredAssignments();
        const savedCourses = storageService.getSelectedCourses();
        const savedSelectAll = storageService.getSelectAllCourses();

        if (savedStatuses.size > 0) {
            setSelectedStatuses(new Set(Array.from(savedStatuses) as StatusFilter[]));
        }
        setIgnoredAssignments(savedIgnored);
        if (!savedSelectAll) {
            setSelectedCourses(savedCourses);
            setSelectAllCourses(false);
        }
    }, []);

    // Save preferences to storage (debounced)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            storageService.setAssignmentStatusFilters(new Set(Array.from(selectedStatuses)));
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [selectedStatuses]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            storageService.setIgnoredAssignments(ignoredAssignments);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [ignoredAssignments]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            storageService.setSelectedCourses(selectedCourses);
            storageService.setSelectAllCourses(selectAllCourses);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [selectedCourses, selectAllCourses]);



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

    const getCombinedStatusLabel = (assignment: Assignment) => {
        const status = getSubmissionStatus(assignment);

        if (status === 'unsubmitted') {
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

        const statusLabels = {
            'submitted': 'Submitted',
            'pending_review': 'Pending Review',
            'graded': 'Graded',
            'group_submitted': 'Group Submitted'
        };

        return statusLabels[status] || status;
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
        setSelectedStatuses(prevStatuses => {
            const newStatuses = new Set(prevStatuses);
            if (newStatuses.has(status)) {
                newStatuses.delete(status);
            } else {
                newStatuses.add(status);
            }
            return newStatuses;
        });
    };

    const toggleCourseFilter = (courseId: number) => {
        setSelectedCourses(prevCourses => {
            const newCourses = new Set(prevCourses);
            if (newCourses.has(courseId)) {
                newCourses.delete(courseId);
            } else {
                newCourses.add(courseId);
            }
            return newCourses;
        });
        setSelectAllCourses(false);
    };

    const handleSelectAllCourses = () => {
        if (selectAllCourses) {
            // Deselect all
            setSelectAllCourses(false);
            setSelectedCourses(new Set());
        } else {
            // Select all
            setSelectAllCourses(true);
            setSelectedCourses(new Set(courses.map(c => c.id)));
        }
    };

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
            // Always apply status filter first
            const status = getSubmissionStatus(assignment);
            if (!selectedStatuses.has(status)) return false;

            // Always apply course filter
            if (!selectedCourses.has(assignment.courseId)) return false;

            // Now apply exclusive filters
            const now = new Date();
            const maxDaysOverdue = 10;

            // If "Show ignored" is active, show ONLY ignored assignments (but still respecting status/course filters)
            if (showIgnored) {
                return ignoredAssignments.has(assignment.id);
            }

            // If "Show no due dates" is active, show ONLY assignments with no due dates (but still respecting status/course filters)
            if (showNoDueDates) {
                return !assignment.due_at;
            }

            // If "Show > 10 days overdue" is active, show ONLY assignments > 10 days overdue (but still respecting status/course filters)
            if (showOverdueAssignments) {
                if (!assignment.due_at) return false;
                const dueDate = new Date(assignment.due_at);
                const daysFromNow = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                return daysFromNow < -maxDaysOverdue;
            }

            // Normal filtering when no exclusive filters are active
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
            <h1><LuClipboardList size={24} /> All Assignments</h1>

            <div className="filters">
                <div className="filter-row">
                    <div className="status-filter" ref={statusDropdownRef}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowStatusDropdown(!showStatusDropdown);
                                setShowCourseDropdown(false); // Close other dropdown
                            }}
                            className="status-dropdown-btn"
                        >
                            Status ({selectedStatuses.size} selected) ▼
                        </button>
                        {showStatusDropdown && (
                            <div className="status-dropdown">
                                {statusOptions.map(option => (
                                    <label
                                        key={option.value}
                                        className="status-option"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedStatuses.has(option.value)}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                toggleStatusFilter(option.value);
                                            }}
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

                    <div className="course-filter" ref={courseDropdownRef}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowCourseDropdown(!showCourseDropdown);
                                setShowStatusDropdown(false); // Close other dropdown
                            }}
                            className="course-dropdown-btn"
                        >
                            Courses ({selectedCourses.size} selected) ▼
                        </button>
                        {showCourseDropdown && (
                            <div className="course-dropdown">
                                <label
                                    className="select-all-course-label"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectAllCourses}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            handleSelectAllCourses();
                                        }}
                                    />
                                    Select All
                                </label>
                                {courses.map(course => (
                                    <label
                                        key={course.id}
                                        className="course-option"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedCourses.has(course.id)}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                toggleCourseFilter(course.id);
                                            }}
                                        />
                                        {getCourseCode(course.name)}
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
                        {showIgnored ? `✓ Only ignored (${ignoredAssignments.size})` : `Only ignored (${ignoredAssignments.size})`}
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
                                    <div className="assignment-title-container">
                                        <span className="course-badge">{getCourseCode(assignment.courseName)}</span>
                                        <a
                                            href={assignment.html_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="assignment-title"
                                        >
                                            {assignment.name}
                                        </a>
                                    </div>
                                    <div className="status-container">
                                        <span
                                            className="status-badge"
                                            style={{ backgroundColor: statusColor }}
                                        >
                                            {getCombinedStatusLabel(assignment)}
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
                                <div className="assignment-meta">
                                    <div className="due-date">
                                        Due: {formatDate(assignment.due_at)}
                                    </div>
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
                    padding: var(--spacing-lg);
                    background: var(--background-primary);
                }
                
                .assignments h1 {
                    margin: 0 0 var(--spacing-lg) 0;
                    color: var(--primary-color);
                    font-size: var(--font-size-2xl);
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                }

                .filters {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-sm);
                    margin-bottom: var(--spacing-lg);
                    flex-wrap: wrap;
                    background: var(--background-secondary);
                    padding: var(--spacing-lg);
                    border-radius: 0;
                    box-shadow: var(--shadow-md);
                    border: 1px solid var(--border-color);
                }

                .filter-row {
                    display: flex;
                    gap: var(--spacing-sm);
                    flex-wrap: wrap;
                }

                .filter-btn {
                    padding: var(--spacing-sm) var(--spacing-lg);
                    border: 2px solid var(--border-color);
                    background: var(--background-primary);
                    border-radius: 0;
                    cursor: pointer;
                    font-size: var(--font-size-sm);
                    color: var(--text-primary);
                    transition: all 0.2s ease;
                    font-weight: 500;
                    box-shadow: var(--shadow-sm);
                }

                .filter-btn:hover {
                    border-color: var(--accent-color);
                    color: var(--primary-color);
                    transform: translateY(-1px);
                    box-shadow: var(--shadow-md);
                }

                .filter-btn.active {
                    background: linear-gradient(135deg, var(--accent-color), #8FB61F);
                    border-color: var(--accent-color);
                    color: var(--dark-gray);
                    font-weight: 600;
                }

                .status-filter {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                }

                .status-dropdown-btn {
                    padding: var(--spacing-sm) var(--spacing-lg);
                    border: 2px solid var(--border-color);
                    background: var(--background-primary);
                    border-radius: 0;
                    cursor: pointer;
                    font-size: var(--font-size-sm);
                    color: var(--text-primary);
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                    font-weight: 500;
                    box-shadow: var(--shadow-sm);
                }

                .status-dropdown-btn:hover {
                    border-color: var(--accent-color);
                    color: var(--primary-color);
                    transform: translateY(-1px);
                    box-shadow: var(--shadow-md);
                }

                .status-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    background: var(--background-secondary);
                    border: 2px solid var(--border-color);
                    border-radius: 0;
                    box-shadow: var(--shadow-lg);
                    z-index: 1000;
                    width: 220px;
                    padding: var(--spacing-sm) 0;
                    margin-top: var(--spacing-xs);
                }

                .status-option {
                    display: flex;
                    align-items: center;
                    padding: var(--spacing-sm) var(--spacing-md);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: var(--font-size-sm);
                    color: var(--text-primary);
                }

                .status-option:hover {
                    background-color: var(--background-primary);
                    color: var(--primary-color);
                }

                .status-option input {
                    margin-right: var(--spacing-sm);
                    transform: scale(0.9);
                    accent-color: var(--accent-color);
                }

                .status-color-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    margin-right: var(--spacing-sm);
                    border: 1px solid var(--border-color);
                }

                .course-filter {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                }

                .course-dropdown-btn {
                    padding: var(--spacing-sm) var(--spacing-lg);
                    border: 2px solid var(--border-color);
                    background: var(--background-primary);
                    border-radius: 0;
                    cursor: pointer;
                    font-size: var(--font-size-sm);
                    color: var(--text-primary);
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                    font-weight: 500;
                    box-shadow: var(--shadow-sm);
                }

                .course-dropdown-btn:hover {
                    border-color: var(--accent-color);
                    color: var(--primary-color);
                    transform: translateY(-1px);
                    box-shadow: var(--shadow-md);
                }

                .course-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    background: var(--background-secondary);
                    border: 2px solid var(--border-color);
                    border-radius: 0;
                    box-shadow: var(--shadow-lg);
                    z-index: 1000;
                    width: 280px;
                    padding: var(--spacing-sm) 0;
                    margin-top: var(--spacing-xs);
                    max-height: 300px;
                    overflow-y: auto;
                }

                .course-option {
                    display: flex;
                    align-items: center;
                    padding: var(--spacing-sm) var(--spacing-md);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: var(--font-size-sm);
                    color: var(--text-primary);
                }

                .course-option:hover {
                    background-color: var(--background-primary);
                    color: var(--primary-color);
                }

                .course-option input {
                    margin-right: var(--spacing-sm);
                    transform: scale(0.9);
                    accent-color: var(--accent-color);
                }

                .select-all-course-label {
                    display: flex;
                    align-items: center;
                    padding: var(--spacing-sm) var(--spacing-md);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-weight: 600;
                    color: var(--primary-color);
                    border-bottom: 1px solid var(--border-color);
                    margin-bottom: var(--spacing-xs);
                }

                .select-all-course-label:hover {
                    background-color: var(--background-primary);
                }

                .select-all-course-label input {
                    margin-right: var(--spacing-sm);
                    transform: scale(0.9);
                    accent-color: var(--accent-color);
                }

                .assignments-list {
                    display: flex;
                    flex-direction: column;
                    background: var(--background-secondary);
                    border-radius: 0;
                    box-shadow: var(--shadow-md);
                    border: 1px solid var(--border-color);
                    overflow: hidden;
                }

                .assignment-card {
                    padding: var(--spacing-md) var(--spacing-lg);
                    border-top: 1px solid var(--border-color);
                    transition: all 0.2s ease;
                    background: var(--background-secondary);
                }

                .assignment-card:first-child {
                    border-top: none;
                }

                .assignment-card:hover {
                    background: var(--background-primary);
                    transform: translateX(4px);
                    box-shadow: inset 4px 0 0 var(--accent-color);
                }

                .assignment-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: var(--spacing-sm);
                    margin-bottom: var(--spacing-xs);
                }

                .assignment-title {
                    color: var(--primary-color);
                    text-decoration: none;
                    font-weight: 600;
                    flex: 1;
                    line-height: 1.4;
                    font-size: var(--font-size-base);
                    transition: color 0.2s ease;
                }

                .assignment-title:hover {
                    color: var(--accent-color);
                    text-decoration: underline;
                }

                .status-container {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                    flex-shrink: 0;
                }

                .course-name {
                    font-size: var(--font-size-sm);
                    font-weight: 600;
                    color: var(--primary-color);
                    flex-shrink: 0;
                    background: var(--background-primary);
                    padding: var(--spacing-xs) var(--spacing-sm);
                    border-radius: 0;
                    border: 1px solid var(--border-color);
                }

                .course-badge {
                    background: var(--accent-color);
                    color: var(--dark-gray);
                    padding: var(--spacing-xs) var(--spacing-sm);
                    border-radius: 0;
                    font-size: var(--font-size-xs);
                    font-weight: 600;
                    white-space: nowrap;
                    box-shadow: var(--shadow-sm);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-right: var(--spacing-sm);
                    flex-shrink: 0;
                }

                .assignment-title-container {
                    display: flex;
                    align-items: center;
                    flex: 1;
                }

                .status-badge {
                    color: white;
                    padding: var(--spacing-xs) var(--spacing-sm);
                    border-radius: 12px;
                    font-size: var(--font-size-xs);
                    font-weight: 600;
                    white-space: nowrap;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    box-shadow: var(--shadow-sm);
                    flex-shrink: 0;
                }

                .assignment-meta {
                    color: var(--text-secondary);
                    font-size: var(--font-size-sm);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: 500;
                    margin-top: var(--spacing-xs);
                }

                .due-date {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                }

                .days-left {
                    font-size: var(--font-size-xs);
                    font-weight: 600;
                    color: var(--text-secondary);
                    background: var(--background-primary);
                    padding: var(--spacing-xs);
                    border-radius: var(--radius-sm);
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
                    .assignments {
                        padding: var(--spacing-lg);
                    }
                    
                    .assignments h1 {
                        font-size: var(--font-size-2xl);
                        margin-bottom: var(--spacing-xl);
                        flex-direction: column;
                        text-align: center;
                        gap: var(--spacing-sm);
                    }
                    
                    .filters {
                        padding: var(--spacing-lg);
                        margin-bottom: var(--spacing-xl);
                    }
                    
                    .filter-row {
                        gap: var(--spacing-sm);
                    }
                    
                    .assignment-card {
                        padding: var(--spacing-md);
                    }
                    
                    .assignment-header {
                        flex-direction: column;
                        align-items: stretch;
                        gap: var(--spacing-sm);
                    }
                    
                    .status-container {
                        justify-content: flex-start;
                        flex-wrap: wrap;
                    }
                }
                
                @media (max-width: 480px) {
                    .assignments {
                        padding: var(--spacing-md);
                    }
                    
                    .filter-row {
                        flex-direction: column;
                    }
                    
                    .filter-btn,
                    .status-dropdown-btn,
                    .course-dropdown-btn {
                        width: 100%;
                        justify-content: center;
                    }
                    
                    .status-dropdown,
                    .course-dropdown {
                        width: 100%;
                        max-width: none;
                    }
                }
            `}</style>
        </div>
    );
} 
