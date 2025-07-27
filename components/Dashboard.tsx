'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Overview from './pages/Overview';
import Assignments from './pages/Assignments';
import Announcements from './pages/Announcements';
import { Course, Assignment, Announcement, CourseWithAssignments, CourseWithAnnouncements } from './types';

export default function DashboardClient() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [assignments, setAssignments] = useState<{ [courseId: number]: Assignment[] }>({});
    const [announcements, setAnnouncements] = useState<{ [courseId: number]: Announcement[] }>({});
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [currentSection, setCurrentSection] = useState('overview');
    const [expandedAssignmentCourses, setExpandedAssignmentCourses] = useState<Set<number>>(new Set());
    const [expandedAnnouncementCourses, setExpandedAnnouncementCourses] = useState<Set<number>>(new Set());
    const [showOverdueAssignments, setShowOverdueAssignments] = useState(false);
    const [showNoDueDates, setShowNoDueDates] = useState(false);
    const [showOldAnnouncements, setShowOldAnnouncements] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, [router]);

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
            // Fetch user info
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

            const courseIds = coursesData.map(course => course.id);
            const assignmentsMap: { [courseId: number]: Assignment[] } = {};
            const announcementsMap: { [courseId: number]: Announcement[] } = {};

            // Fetch assignments for each course
            const assignmentPromises = courseIds.map(async (courseId) => {
                const res = await fetch(`/api/assignments?courseId=${courseId}`, { headers });
                if (res.ok) {
                    const data: Assignment[] = await res.json();
                    assignmentsMap[courseId] = data;
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
            setIsRefreshing(false);
        }
    }

    const handleRefresh = async () => {
        setIsRefreshing(true);
        setError(null);
        await fetchData();
    };

    const handleLogout = () => {
        localStorage.removeItem('canvas_token');
        router.push('/');
    };

    const isActionableStatus = (assignment: Assignment) => {
        const status = getSubmissionStatus(assignment);
        return !status.includes('Graded') && 
               status !== 'Group Submitted' && 
               !status.includes('Submitted') && 
               !status.includes('Pending');
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

    const getStatusPriority = (assignment: Assignment) => {
        const status = getSubmissionStatus(assignment);
        if (status === 'Unsubmitted') return 1;
        if (status.includes('Pending')) return 2;
        if (status.includes('Submitted')) return 3;
        if (status === 'Group Submitted') return 3;
        if (status.includes('Graded')) return 4;
        return 5;
    };

    const getUrgentAssignments = () => {
        const allAssignments: (Assignment & { courseId: number })[] = [];
        
        Object.entries(assignments).forEach(([courseId, courseAssignments]) => {
            courseAssignments.forEach(assignment => {
                allAssignments.push({ ...assignment, courseId: parseInt(courseId) });
            });
        });

        const now = new Date();
        const maxDaysOut = 100;
        const maxDaysOverdue = 10;
        
        return allAssignments
            .filter(assignment => {
                if (!isActionableStatus(assignment)) return false;
                if (!assignment.due_at) return false;
                
                const dueDate = new Date(assignment.due_at);
                const daysFromNow = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                
                if (daysFromNow < -maxDaysOverdue) return false;
                return daysFromNow <= maxDaysOut;
            })
            .sort((a, b) => {
                const dateA = new Date(a.due_at!).getTime();
                const dateB = new Date(b.due_at!).getTime();
                return dateA - dateB;
            })
            .slice(0, 15); // Get more assignments so Overview can filter ignored ones and still show 5
    };

    const getRecentAnnouncements = () => {
        const allAnnouncements: (Announcement & { courseId: number })[] = [];
        
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
            .slice(0, 5);
    };

    const getCoursesWithAssignments = (): CourseWithAssignments[] => {
        return courses.map(course => ({
            ...course,
            assignments: (assignments[course.id] || []).sort((a, b) => {
                if (!a.due_at && !b.due_at) return 0;
                if (!a.due_at) return 1;
                if (!b.due_at) return -1;
                
                const dateComparison = new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
                if (dateComparison !== 0) return dateComparison;
                
                return getStatusPriority(a) - getStatusPriority(b);
            })
        }));
    };

    const getCoursesWithAnnouncements = (): CourseWithAnnouncements[] => {
        return courses.map(course => ({
            ...course,
            announcements: announcements[course.id] || []
        })).map(course => ({
            ...course,
            announcements: course.announcements
                .filter(announcement => {
                    if (showOldAnnouncements) {
                        return true;
                    } else {
                        const postedDate = new Date(announcement.posted_at);
                        const daysAgo = (new Date().getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24);
                        return daysAgo <= 20;
                    }
                })
                .sort((a, b) => {
                    return new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime();
                })
        }));
    };

    if (loading) return (
        <div className="loading">
            <div className="loading-content">
                <div className="spinner"></div>
                <div className="loading-text">Loading data...</div>
                <div className="loading-subtext">This might take a few seconds</div>
            </div>
            <style jsx>{`
                .loading {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background: var(--background-primary);
                    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .loading-content {
                    text-align: center;
                    color: var(--text-primary);
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid var(--border-color);
                    border-top: 4px solid var(--accent-color);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .loading-text {
                    font-size: 18px;
                    font-weight: 500;
                    margin-bottom: 8px;
                    color: var(--text-primary);
                }

                .loading-subtext {
                    font-size: 14px;
                    color: var(--text-secondary);
                    opacity: 0.7;
                }
            `}</style>
        </div>
    );
    
    if (error) return (
        <div className="error">
            <div>Error: {error}</div>
            <style jsx>{`
                .error {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    font-size: 20px;
                    color: #dc3545;
                }
            `}</style>
        </div>
    );

    const urgentAssignments = getUrgentAssignments();
    const recentAnnouncements = getRecentAnnouncements();
    const coursesWithAssignments = getCoursesWithAssignments();
    const coursesWithAnnouncements = getCoursesWithAnnouncements();

    const renderCurrentSection = () => {
        switch (currentSection) {
            case 'overview':
                return (
                    <Overview
                        courses={courses}
                        urgentAssignments={urgentAssignments}
                        recentAnnouncements={recentAnnouncements}
                        isRefreshing={isRefreshing}
                        onRefresh={handleRefresh}
                    />
                );
            case 'assignments':
                return (
                    <Assignments
                        coursesWithAssignments={coursesWithAssignments}
                        courses={courses}
                        expandedCourses={expandedAssignmentCourses}
                        showOverdueAssignments={showOverdueAssignments}
                        showNoDueDates={showNoDueDates}
                        onToggleCourse={(courseId) => {
                            const newExpanded = new Set(expandedAssignmentCourses);
                            if (newExpanded.has(courseId)) {
                                newExpanded.delete(courseId);
                            } else {
                                newExpanded.add(courseId);
                            }
                            setExpandedAssignmentCourses(newExpanded);
                        }}
                        onToggleOverdue={() => setShowOverdueAssignments(!showOverdueAssignments)}
                        onToggleNoDueDates={() => setShowNoDueDates(!showNoDueDates)}
                    />
                );
            case 'announcements':
                return (
                    <Announcements
                        coursesWithAnnouncements={coursesWithAnnouncements}
                        courses={courses}
                        expandedCourses={expandedAnnouncementCourses}
                        showOldAnnouncements={showOldAnnouncements}
                        onToggleCourse={(courseId) => {
                            const newExpanded = new Set(expandedAnnouncementCourses);
                            if (newExpanded.has(courseId)) {
                                newExpanded.delete(courseId);
                            } else {
                                newExpanded.add(courseId);
                            }
                            setExpandedAnnouncementCourses(newExpanded);
                        }}
                        onToggleOldAnnouncements={() => setShowOldAnnouncements(!showOldAnnouncements)}
                    />
                );
            default:
                return <div>Section not found</div>;
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar
                userName={userName}
                onLogout={handleLogout}
                onSectionChange={setCurrentSection}
                currentSection={currentSection}
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
