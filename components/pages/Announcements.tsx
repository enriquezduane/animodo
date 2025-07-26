'use client';

import { CourseWithAnnouncements } from '../types';

interface AnnouncementsProps {
    coursesWithAnnouncements: CourseWithAnnouncements[];
    expandedCourses: Set<number>;
    showOldAnnouncements: boolean;
    onToggleCourse: (courseId: number) => void;
    onToggleOldAnnouncements: () => void;
}

export default function Announcements({ 
    coursesWithAnnouncements, 
    expandedCourses, 
    showOldAnnouncements,
    onToggleCourse, 
    onToggleOldAnnouncements
}: AnnouncementsProps) {
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

    return (
        <div className="announcements">
            <h1>📢 All Announcements</h1>
            
            <div className="filters">
                <button 
                    onClick={onToggleOldAnnouncements}
                    className={`filter-btn ${showOldAnnouncements ? 'active' : ''}`}
                >
                    {showOldAnnouncements ? '✓ Showing old announcements' : 'Show old announcements'}
                </button>
            </div>

            <div className="courses-list">
                {coursesWithAnnouncements.map(course => (
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
                            <span className="announcement-count">
                                {course.announcements.length} announcement{course.announcements.length !== 1 ? 's' : ''}
                            </span>
                        </button>
                        
                        {expandedCourses.has(course.id) && (
                            <div className="announcements-container">
                                {course.announcements.length > 0 ? (
                                    <div className="announcement-list">
                                        {course.announcements.map(announcement => (
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
                                                        Posted: {formatAnnouncementDate(announcement.posted_at)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="empty-state">No announcements found</p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
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

                .announcement-count {
                    font-size: 14px;
                    font-weight: normal;
                    color: #6c757d;
                }

                .announcements-container {
                    padding: 0;
                }

                .announcement-list {
                    display: flex;
                    flex-direction: column;
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