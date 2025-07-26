'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Course = {
    id: number;
    name: string;
};

type Assignment = {
    id: number;
    name: string;
    due_at: string | null;
    html_url: string;
    points_possible: number;
    assignment_group_id: number;
    has_submitted_submissions: boolean;
    submission?: {
        workflow_state: string;
        score: number | null;
    };
};

type Announcement = {
    id: number;
    title: string;
    posted_at: string;
    url: string;
    context_code: string;
};

type CourseWithAssignments = Course & {
    assignments: Assignment[];
};

type CourseWithAnnouncements = Course & {
    announcements: Announcement[];
};

export default function DashboardClient() {
    const [userName, setUserName] = useState<string | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [assignments, setAssignments] = useState<Record<number, Assignment[]>>({});
    const [announcements, setAnnouncements] = useState<Record<number, Announcement[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedAssignmentCourses, setExpandedAssignmentCourses] = useState<Set<number>>(new Set());
    const [expandedAnnouncementCourses, setExpandedAnnouncementCourses] = useState<Set<number>>(new Set());
    const [showOverdueAssignments, setShowOverdueAssignments] = useState(false);
    const [showOldAnnouncements, setShowOldAnnouncements] = useState(false);
    const [showNoDueDates, setShowNoDueDates] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function fetchData() {
            const token = localStorage.getItem('canvas_token');
            if (!token) {
                router.push('/');
                return;
            }

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Canvas-URL': 'https://dlsu.instructure.com'
            };

            try {
                // Fetch user name
                const userRes = await fetch('/api/user', { headers });
                if (!userRes.ok) {
                    if (userRes.status === 401) {
                        localStorage.removeItem('canvas_token');
                        router.push('/');
                        return;
                    }
                    throw new Error('Failed to fetch user data');
                }
                const userData = await userRes.json();
                setUserName(userData.name);

                // Fetch courses
                const coursesRes = await fetch('/api/courses', { headers });
                if (!coursesRes.ok) {
                    throw new Error('Failed to fetch courses');
                }
                const coursesData: Course[] = await coursesRes.json();
                setCourses(coursesData);

                // Fetch assignments and announcements
                const courseIds = coursesData.map(c => c.id);
                const assignmentsMap: Record<number, Assignment[]> = {};
                const announcementsMap: Record<number, Announcement[]> = {};

                // Fetch assignments for each course
                const assignmentPromises = coursesData.map(async (course) => {
                    const assignRes = await fetch(`/api/assignments?courseId=${course.id}`, { headers });
                    if (assignRes.ok) {
                        const assignData: Assignment[] = await assignRes.json();
                        assignmentsMap[course.id] = assignData;
                    }
                });

                await Promise.all(assignmentPromises);

                // Fetch all announcements
                const annParams = courseIds.map(id => `courseIds=${id}`).join('&');
                const annRes = await fetch(`/api/announcements?${annParams}`, { headers });
                if (annRes.ok) {
                    const annData: Announcement[] = await annRes.json();

                    // Group announcements by course using context_code
                    for (const ann of annData) {
                        const courseId = parseInt(ann.context_code.replace('course_', ''));
                        if (!announcementsMap[courseId]) announcementsMap[courseId] = [];
                        announcementsMap[courseId].push(ann);
                    }
                }

                setAssignments(assignmentsMap);
                setAnnouncements(announcementsMap);
            } catch (err) {
                setError('Failed to load dashboard data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('canvas_token');
        router.push('/');
    };

    const getCourseCode = (courseName: string) => {
        // Extract course code from course name (e.g., "CSMATH1 - Introduction to Math" -> "CSMATH1")
        const match = courseName.match(/^([A-Z]+\d+)/);
        return match ? match[1] : courseName.split(' ')[0];
    };

    const getSubmissionStatus = (assignment: Assignment) => {
        // If assignment has submitted submissions (e.g., group assignment where someone submitted)
        if (assignment.has_submitted_submissions && !assignment.submission) {
            return 'Group Submitted';
        }
        
        if (!assignment.submission) return 'Unsubmitted';
        
        const { workflow_state, score } = assignment.submission;
        
        if (workflow_state === 'graded' && score !== null) {
            return `Graded (${score}/${assignment.points_possible})`;
        }
        
        return workflow_state.charAt(0).toUpperCase() + workflow_state.slice(1).replace('_', ' ');
    };

    const getStatusPriority = (assignment: Assignment) => {
        const status = getSubmissionStatus(assignment);
        if (status === 'Unsubmitted') return 1;
        if (status.includes('Pending')) return 2;
        if (status.includes('Submitted')) return 3;
        if (status === 'Group Submitted') return 3; // Same priority as individual submissions
        if (status.includes('Graded')) return 4;
        return 5;
    };

    const isActionableStatus = (assignment: Assignment) => {
        const status = getSubmissionStatus(assignment);
        return !status.includes('Graded') && 
               status !== 'Group Submitted' && 
               !status.includes('Submitted') && 
               !status.includes('Pending');
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

    const getFormattedFirstName = (fullName: string) => {
        // Handle names in format "LASTNAME, FIRSTNAME MIDDLENAME"
        const parts = fullName.split(',');
        if (parts.length < 2) return fullName; // Fallback if format is unexpected
        
        // Get the part after the comma (first and middle names)
        const firstAndMiddleNames = parts[1].trim();
        
        // Split by spaces and take the first word (just the first name)
        const firstName = firstAndMiddleNames.split(' ')[0];
        
        // Convert to proper case (capitalize first letter, lowercase the rest)
        return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    };

    const formatAnnouncementDate = (postedDateString: string) => {
        const now = new Date();
        const postedDate = new Date(postedDateString);
        const daysAgo = (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // If announcement is more than 300 days old, show N/A
        if (daysAgo > 300) {
            return 'N/A';
        }
        
        return formatDate(postedDateString);
    };

    const getAnnouncementTimeAgo = (postedDateString: string) => {
        const now = new Date();
        const postedDate = new Date(postedDateString);
        const daysAgo = (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // If announcement is more than 300 days old, show N/A
        if (daysAgo > 300) {
            return 'N/A';
        }
        
        return getTimeAgo(postedDateString);
    };

    const getUrgentAssignments = () => {
        const allAssignments: (Assignment & { courseId: number })[] = [];
        
        // Collect all assignments with course info
        Object.entries(assignments).forEach(([courseId, courseAssignments]) => {
            courseAssignments.forEach(assignment => {
                allAssignments.push({ ...assignment, courseId: parseInt(courseId) });
            });
        });

        const now = new Date();
        const maxDaysOut = 100;
        const maxDaysOverdue = 10; // Only show assignments up to 10 days overdue
        
        return allAssignments
            .filter(assignment => {
                // Must be actionable
                if (!isActionableStatus(assignment)) return false;
                
                // Must have a due date
                if (!assignment.due_at) return false;
                
                const dueDate = new Date(assignment.due_at);
                const daysFromNow = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                
                // Filter out assignments more than 10 days overdue
                if (daysFromNow < -maxDaysOverdue) return false;
                
                // Must not be too far in the future
                return daysFromNow <= maxDaysOut;
            })
            .sort((a, b) => {
                const dateA = new Date(a.due_at!).getTime();
                const dateB = new Date(b.due_at!).getTime();
                return dateA - dateB;
            })
            .slice(0, 5);
    };

    const getRecentAnnouncements = () => {
        const allAnnouncements: (Announcement & { courseId: number })[] = [];
        
        // Collect all announcements with course info
        Object.entries(announcements).forEach(([courseId, courseAnnouncements]) => {
            courseAnnouncements.forEach(announcement => {
                allAnnouncements.push({ ...announcement, courseId: parseInt(courseId) });
            });
        });

        const now = new Date();
        const maxDaysBack = 30;
        
        return allAnnouncements
            .filter(announcement => {
                const postedDate = new Date(announcement.posted_at);
                const daysAgo = (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24);
                return daysAgo <= maxDaysBack;
            })
            .sort((a, b) => {
                const dateA = new Date(a.posted_at).getTime();
                const dateB = new Date(b.posted_at).getTime();
                return dateB - dateA;
            })
            .slice(0, 5); // Changed from 3 to 5
    };

    const getCoursesWithAssignments = (): CourseWithAssignments[] => {
        const now = new Date();
        const maxDaysOverdue = 10;
        
        return courses.map(course => ({
            ...course,
            assignments: assignments[course.id] || []
        })).map(course => ({
            ...course,
            assignments: course.assignments
                .filter(assignment => {
                    // If showOverdueAssignments is false, filter out assignments more than 10 days overdue
                    if (!showOverdueAssignments && assignment.due_at) {
                        const dueDate = new Date(assignment.due_at);
                        const daysFromNow = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                        if (daysFromNow < -maxDaysOverdue) return false;
                    }
                    
                    // If showNoDueDates is false, filter out assignments with no due date
                    if (!showNoDueDates && !assignment.due_at) return false;
                    
                    return true;
                })
                .sort((a, b) => {
                    // Primary sort: by due date (ascending, no due date goes last)
                    if (!a.due_at && !b.due_at) return 0;
                    if (!a.due_at) return 1;
                    if (!b.due_at) return -1;
                    
                    const dateComparison = new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
                    if (dateComparison !== 0) return dateComparison;
                    
                    // Secondary sort: by status priority
                    return getStatusPriority(a) - getStatusPriority(b);
                })
        }));
    };

    const getCoursesWithAnnouncements = (): CourseWithAnnouncements[] => {
        const now = new Date();
        
        return courses.map(course => ({
            ...course,
            announcements: announcements[course.id] || []
        })).map(course => ({
            ...course,
            announcements: course.announcements
                .filter(announcement => {
                    if (showOldAnnouncements) {
                        // When toggle is enabled, show all announcements regardless of age
                        return true;
                    } else {
                        // When toggle is disabled, only show announcements up to 20 days old
                        const postedDate = new Date(announcement.posted_at);
                        const daysAgo = (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24);
                        return daysAgo <= 20;
                    }
                })
                .sort((a, b) => {
                    // Sort by posted date (descending - newest first)
                    return new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime();
                })
        }));
    };

    const toggleAssignmentCourse = (courseId: number) => {
        const newExpanded = new Set(expandedAssignmentCourses);
        if (newExpanded.has(courseId)) {
            newExpanded.delete(courseId);
        } else {
            newExpanded.add(courseId);
        }
        setExpandedAssignmentCourses(newExpanded);
    };

    const toggleAnnouncementCourse = (courseId: number) => {
        const newExpanded = new Set(expandedAnnouncementCourses);
        if (newExpanded.has(courseId)) {
            newExpanded.delete(courseId);
        } else {
            newExpanded.add(courseId);
        }
        setExpandedAnnouncementCourses(newExpanded);
    };

    const scrollToSection = (sectionId: string) => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    const urgentAssignments = getUrgentAssignments();
    const recentAnnouncements = getRecentAnnouncements();
    const coursesWithAssignments = getCoursesWithAssignments();
    const coursesWithAnnouncements = getCoursesWithAnnouncements();

    return (
        <div>
            <div>
                <h1>Welcome, {userName ? getFormattedFirstName(userName) : 'User'}!</h1>
                <button onClick={handleLogout}>Logout</button>
            </div>

            {/* Section 1: Overview */}
            <div id="overview">
                <h2>Overview</h2>
                
                <div>
                    <h3>Urgent Assignments</h3>
                    {urgentAssignments.length > 0 ? (
                        <ul>
                            {urgentAssignments.map(assignment => {
                                const course = courses.find(c => c.id === assignment.courseId);
                                const courseCode = course ? getCourseCode(course.name) : '';
                                return (
                                    <li key={assignment.id}>
                                        <a href={assignment.html_url} target="_blank" rel="noreferrer">
                                            [{courseCode}] - {assignment.name}
                                        </a>
                                        <div>Due: {formatDate(assignment.due_at)} - {getTimeRemaining(assignment.due_at)}</div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p>No urgent assignments</p>
                    )}
                </div>

                <div>
                    <h3>Recent Announcements</h3>
                    {recentAnnouncements.length > 0 ? (
                        <ul>
                            {recentAnnouncements.map(announcement => {
                                const course = courses.find(c => c.id === announcement.courseId);
                                const courseCode = course ? getCourseCode(course.name) : '';
                                const now = new Date();
                                const postedDate = new Date(announcement.posted_at);
                                const daysAgo = (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24);
                                const isVeryOld = daysAgo > 300;
                                
                                return (
                                    <li key={announcement.id}>
                                        <a href={announcement.url} target="_blank" rel="noreferrer">
                                            [{courseCode}] - {announcement.title}
                                        </a>
                                        <div>Posted: {isVeryOld ? 'Not Indicated' : `${formatDate(announcement.posted_at)} - ${getTimeAgo(announcement.posted_at)}`}</div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p>No recent announcements</p>
                    )}
                </div>

                <div>
                    <button onClick={() => scrollToSection('all-assignments')}>Jump to All Assignments</button>
                    <button onClick={() => scrollToSection('all-announcements')}>Jump to All Announcements</button>
                </div>
            </div>

            {/* Section 2: All Assignments */}
            <div id="all-assignments">
                <h2>All Assignments</h2>
                <div>
                    <button onClick={() => setShowOverdueAssignments(!showOverdueAssignments)}>
                        {showOverdueAssignments ? '✓ Showing > 10 days overdue' : 'Show > 10 days overdue'}
                    </button>
                    <button onClick={() => setShowNoDueDates(!showNoDueDates)}>
                        {showNoDueDates ? '✓ Showing no due dates' : 'Show no due dates'}
                    </button>
                </div>
                {coursesWithAssignments.map(course => (
                    <div key={course.id}>
                        <h3 onClick={() => toggleAssignmentCourse(course.id)} style={{ cursor: 'pointer' }}>
                            {expandedAssignmentCourses.has(course.id) ? '▼' : '▶'} [{getCourseCode(course.name)}] - {course.name}
                        </h3>
                        
                        {expandedAssignmentCourses.has(course.id) && (
                            <div>
                                {course.assignments.length > 0 ? (
                                    <ul>
                                        {course.assignments.map(assignment => (
                                            <li key={assignment.id}>
                                                <a href={assignment.html_url} target="_blank" rel="noreferrer">
                                                    {assignment.name}
                                                </a>
                                                <div>
                                                    Due: {formatDate(assignment.due_at)} {assignment.due_at ? `(${getTimeRemaining(assignment.due_at)})` : ''}
                                                </div>
                                                <div>Status: {getSubmissionStatus(assignment)}</div>
                                                <div>Points: {assignment.points_possible}</div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>No assignments found</p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Section 3: All Announcements */}
            <div id="all-announcements">
                <h2>All Announcements</h2>
                <div>
                    <button onClick={() => setShowOldAnnouncements(!showOldAnnouncements)}>
                        {showOldAnnouncements ? '✓ Showing old announcements' : 'Show old announcements'}
                    </button>
                </div>
                {coursesWithAnnouncements.map(course => (
                    <div key={course.id}>
                        <h3 onClick={() => toggleAnnouncementCourse(course.id)} style={{ cursor: 'pointer' }}>
                            {expandedAnnouncementCourses.has(course.id) ? '▼' : '▶'} [{getCourseCode(course.name)}] - {course.name}
                        </h3>
                        
                        {expandedAnnouncementCourses.has(course.id) && (
                            <div>
                                {course.announcements.length > 0 ? (
                                    <ul>
                                        {course.announcements.map(announcement => (
                                            <li key={announcement.id}>
                                                <a href={announcement.url} target="_blank" rel="noreferrer">
                                                    {announcement.title}
                                                </a>
                                                {(() => {
                                                    const now = new Date();
                                                    const postedDate = new Date(announcement.posted_at);
                                                    const daysAgo = (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24);
                                                    const isVeryOld = daysAgo > 300;
                                                    
                                                    return (
                                                        <div>Posted: {isVeryOld ? 'Not Indicated' : `${formatDate(announcement.posted_at)} (${getTimeAgo(announcement.posted_at)})`}</div>
                                                    );
                                                })()}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>No announcements found</p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
