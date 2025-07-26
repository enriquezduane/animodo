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
        if (days > 0) return `${days} days ago`;
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (hours > 0) return `${hours} hours ago`;
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        return `${minutes} minutes ago`;
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
                        {showOldAnnouncements ? '✓ Showing old announcements' : 'Show old announcements'}
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
                    padding: 20px;
                }
                
                .announcements h1 {
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

                .filter-row {
                    display: flex;
                    gap: 12px;
                    align-items: center;
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

                .course-filter {
                    position: relative;
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
                    width: 250px;
                    padding: 8px 0;
                    max-height: 300px;
                    overflow-y: auto;
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

                .announcements-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .announcement-card {
                    padding: 16px 20px;
                    border-top: 1px solid #e9ecef;
                    transition: background-color 0.2s ease;
                }

                .announcement-card:hover {
                    background: #f8f9fa;
                }

                .announcement-header {
                    margin-bottom: 8px;
                }

                .announcement-title {
                    color: #007bff;
                    text-decoration: none;
                    font-weight: 500;
                    line-height: 1.4;
                    display: block;
                }

                .announcement-title:hover {
                    text-decoration: underline;
                }

                .announcement-meta {
                    color: #6c757d;
                    font-size: 14px;
                }

                .posted-date {
                    display: flex;
                    align-items: center;
                    gap: 8px;
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