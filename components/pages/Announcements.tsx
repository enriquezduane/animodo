'use client';

import { useState, useEffect, useRef } from 'react';
import { CourseWithAnnouncements, Course } from '../types';
import { LuMegaphone } from 'react-icons/lu';

interface AnnouncementsProps {
    coursesWithAnnouncements: CourseWithAnnouncements[];
    courses: Course[];
    expandedCourses: Set<number>;
    showOldAnnouncements: boolean;
    onToggleCourse: (courseId: number) => void;
    onToggleOldAnnouncements: () => void;
}

export default function Announcements({ 
    coursesWithAnnouncements,
    courses,
    expandedCourses, 
    showOldAnnouncements,
    onToggleCourse, 
    onToggleOldAnnouncements
}: AnnouncementsProps) {
    const [selectedCourses, setSelectedCourses] = useState<Set<number>>(new Set());
    const [selectAllCourses, setSelectAllCourses] = useState(true);
    const [showCourseDropdown, setShowCourseDropdown] = useState(false);

    // Ref for click outside detection
    const courseDropdownRef = useRef<HTMLDivElement>(null);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
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

    // Load preferences from localStorage
    useEffect(() => {
        const savedCourses = localStorage.getItem('announcement_selected_courses');
        const savedSelectAll = localStorage.getItem('announcement_select_all_courses');
        
        if (savedCourses && savedSelectAll === 'false') {
            try {
                setSelectedCourses(new Set(JSON.parse(savedCourses)));
                setSelectAllCourses(false);
            } catch (e) {
                console.warn('Failed to parse saved announcement course selections');
            }
        }
    }, []);

    // Save preferences to localStorage (debounced)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            localStorage.setItem('announcement_selected_courses', JSON.stringify([...selectedCourses]));
            localStorage.setItem('announcement_select_all_courses', selectAllCourses.toString());
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [selectedCourses, selectAllCourses]);

    const getCourseCode = (courseName: string) => {
        const match = courseName.match(/^([A-Z]+\d+)/);
        return match ? match[1] : courseName.split(' ')[0];
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'No date';
        return new Date(dateString).toLocaleDateString();
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

    const formatAnnouncementDate = (postedDateString: string) => {
        const now = new Date();
        const postedDate = new Date(postedDateString);
        const daysAgo = (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysAgo > 300) {
            return 'Not Indicated';
        }
        
        const formattedDate = formatDate(postedDateString);
        const timeAgo = getTimeAgo(postedDateString);
        
        return `${formattedDate} (${timeAgo})`;
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

    // Create flat list of all announcements with course info
    const allAnnouncements: (typeof coursesWithAnnouncements[0]['announcements'][0] & { courseId: number; courseName: string })[] = [];
    
    coursesWithAnnouncements.forEach(course => {
        course.announcements.forEach(announcement => {
            allAnnouncements.push({
                ...announcement,
                courseId: course.id,
                courseName: course.name
            });
        });
    });

    // Filter and sort announcements
    const filteredAnnouncements = allAnnouncements
        .filter(announcement => {
            // Apply course filter
            if (!selectedCourses.has(announcement.courseId)) return false;
            
            return true;
        })
        .sort((a, b) => {
            // Sort by recent (newest first)
            return new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime();
        });

    return (
        <div className="announcements">
            <h1><LuMegaphone size={24} /> All Announcements</h1>
            
            <div className="filters">
                <div className="filter-row">
                    <button 
                        onClick={onToggleOldAnnouncements}
                        className={`filter-btn ${showOldAnnouncements ? 'active' : ''}`}
                    >
                        {showOldAnnouncements ? '✓ Showing old' : 'Show old (>20 days)'}
                    </button>
                    
                    <div className="course-filter" ref={courseDropdownRef}>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowCourseDropdown(!showCourseDropdown);
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
                                        {course.name}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="announcements-list">
                {filteredAnnouncements.length > 0 ? (
                    filteredAnnouncements.map(announcement => (
                        <div key={announcement.id} className="announcement-card">
                            <div className="announcement-header">
                                <a 
                                    href={announcement.url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="announcement-title"
                                >
                                    {announcement.title}
                                </a>
                            </div>
                            <div className="announcement-meta">
                                <div className="posted-date">
                                    [{getCourseCode(announcement.courseName)}] Posted: {formatAnnouncementDate(announcement.posted_at)}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">No announcements found matching your filters</div>
                )}
            </div>

            <style jsx>{`
                .announcements {
                    padding: var(--spacing-xl);
                    background: var(--background-primary);
                    min-height: 100vh;
                }
                
                .announcements h1 {
                    margin: 0 0 var(--spacing-2xl) 0;
                    color: var(--primary-color);
                    font-size: var(--font-size-3xl);
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-md);
                }

                .filters {
                    display: flex;
                    gap: var(--spacing-md);
                    margin-bottom: var(--spacing-2xl);
                    flex-wrap: wrap;
                    background: var(--background-secondary);
                    padding: var(--spacing-xl);
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-md);
                    border: 1px solid var(--border-color);
                }

                .filter-row {
                    display: flex;
                    gap: var(--spacing-md);
                    align-items: center;
                    flex-wrap: wrap;
                }

                .filter-btn {
                    padding: var(--spacing-sm) var(--spacing-lg);
                    border: 2px solid var(--border-color);
                    background: var(--background-primary);
                    border-radius: var(--radius-md);
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

                .course-filter {
                    position: relative;
                }

                .course-dropdown-btn {
                    padding: var(--spacing-sm) var(--spacing-lg);
                    border: 2px solid var(--border-color);
                    background: var(--background-primary);
                    border-radius: var(--radius-md);
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
                    border-radius: var(--radius-md);
                    box-shadow: var(--shadow-lg);
                    z-index: 1000;
                    width: 280px;
                    padding: var(--spacing-sm) 0;
                    max-height: 300px;
                    overflow-y: auto;
                    margin-top: var(--spacing-xs);
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

                .announcements-list {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-md);
                    background: var(--background-secondary);
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-md);
                    border: 1px solid var(--border-color);
                    overflow: hidden;
                }

                .announcement-card {
                    padding: var(--spacing-lg) var(--spacing-xl);
                    border-top: 1px solid var(--border-color);
                    transition: all 0.2s ease;
                    background: var(--background-secondary);
                }

                .announcement-card:first-child {
                    border-top: none;
                }

                .announcement-card:hover {
                    background: var(--background-primary);
                    transform: translateX(4px);
                    box-shadow: inset 4px 0 0 var(--accent-color);
                }

                .announcement-header {
                    margin-bottom: var(--spacing-sm);
                }

                .announcement-title {
                    color: var(--primary-color);
                    text-decoration: none;
                    font-weight: 600;
                    line-height: 1.4;
                    display: block;
                    font-size: var(--font-size-base);
                    transition: color 0.2s ease;
                }

                .announcement-title:hover {
                    color: var(--accent-color);
                    text-decoration: underline;
                }

                .announcement-meta {
                    color: var(--text-secondary);
                    font-size: var(--font-size-sm);
                    font-weight: 500;
                }

                .posted-date {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
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
                    .announcements {
                        padding: var(--spacing-lg);
                    }
                    
                    .announcements h1 {
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
                    
                    .announcement-card {
                        padding: var(--spacing-md);
                    }
                }
                
                @media (max-width: 480px) {
                    .announcements {
                        padding: var(--spacing-md);
                    }
                    
                    .filter-row {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .filter-btn,
                    .course-dropdown-btn {
                        width: 100%;
                        justify-content: center;
                    }
                    
                    .course-dropdown {
                        width: 100%;
                        max-width: none;
                    }
                }
            `}</style>
        </div>
    );
} 