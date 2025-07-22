'use client';

import { useState, useMemo } from 'react';
import { useCanvas, dashboardUtils } from '@/lib/use-canvas';
import { DashboardData, ProcessedAssignment, ProcessedAnnouncement } from '@/types/canvas';

// Helper function to format dates with remaining time
function formatDateWithRemaining(dateString: string): string {
  const targetDate = new Date(dateString);
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[targetDate.getMonth()];
  const day = targetDate.getDate();
  
  if (diffMs < 0) {
    const pastDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    const pastHours = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${month} ${day} (${pastDays}d ${pastHours}h overdue)`;
  } else {
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${month} ${day} (${days}d ${hours}h left)`;
  }
}

function formatDateAgo(dateString: string | null | undefined): string {
  if (!dateString) return 'Date Unknown';
  
  const targetDate = new Date(dateString);
  if (isNaN(targetDate.getTime())) return 'Invalid Date';
  
  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 14) return `${Math.floor(days / 7)}w ago`;
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[targetDate.getMonth()]} ${targetDate.getDate()}`;
}

function getUrgencyLevel(assignment: ProcessedAssignment): 'critical' | 'warning' | 'normal' {
  if (!assignment.due_at) return 'normal';
  
  const now = new Date();
  const dueDate = new Date(assignment.due_at);
  const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (diffHours < 0) return 'critical'; // Overdue
  if (diffHours < 24) return 'critical'; // Due within 24 hours
  if (diffHours < 168) return 'warning'; // Due within a week
  return 'normal';
}

interface DashboardProps {
  accessToken: string;
}

type FilterPeriod = 'today' | 'week' | 'month' | 'all';
type FilterStatus = 'unsubmitted' | 'submitted' | 'all';
type ActiveView = 'overview' | 'assignments' | 'announcements';
type AssignmentView = 'upcoming' | 'overdue';

export function Dashboard({ accessToken }: DashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [assignmentView, setAssignmentView] = useState<AssignmentView>('upcoming');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Filters
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [hide20DaysOverdue, setHide20DaysOverdue] = useState(true);
  const [showSubmitted, setShowSubmitted] = useState(false);
  const [showOver15Days, setShowOver15Days] = useState(false);
  
  const canvas = useCanvas({
    accessToken,
    canvasUrl: 'https://dlsu.instructure.com',
  });

  const refreshData = async () => {
    const data = await canvas.getDashboardData();
    if (data) {
      setDashboardData(data);
    }
  };

  // Filtered and processed data
  const processedData = useMemo(() => {
    if (!dashboardData) return null;

    const now = new Date();
    let assignments = Object.values(dashboardData.entities.assignments);
    let announcements = Object.values(dashboardData.entities.announcements);

    // Apply filters on assignments page and overview page
    const shouldApplyFilters = activeView === 'assignments' || activeView === 'overview';

    if (shouldApplyFilters) {
      // For assignments page only - filter by view type
      if (activeView === 'assignments') {
        // For upcoming view, only show future assignments
        if (assignmentView === 'upcoming') {
          assignments = assignments.filter(a => {
            if (!a.due_at) return true; // Keep assignments without due dates
            return new Date(a.due_at).getTime() > now.getTime();
          });
        }

        // For overdue view, only show overdue assignments
        if (assignmentView === 'overdue') {
          assignments = assignments.filter(a => {
            if (!a.due_at) return false; // Exclude assignments without due dates
            return new Date(a.due_at).getTime() < now.getTime();
          });
        }
      }

      // Filter by submitted status (default: hide submitted)
      if (!showSubmitted) {
        assignments = assignments.filter(a => 
          a.submission_status === 'Not Submitted' || 
          a.submission_status === 'Pending Review'
        );
      }

      // Filter by 15-day threshold (default: hide assignments > 15 days overdue or due > 15 days)
      if (!showOver15Days) {
        assignments = assignments.filter(a => {
          if (!a.due_at) return true; // Keep assignments without due dates
          const dueDate = new Date(a.due_at);
          const timeDiff = dueDate.getTime() - now.getTime();
          const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
          
          // Keep assignments that are:
          // - Due within 15 days in the future (daysDiff > 0 && daysDiff <= 15)
          // - Overdue by 15 days or less (daysDiff < 0 && daysDiff >= -15)
          return daysDiff >= -15 && daysDiff <= 15;
        });
      }

      // Filter by selected courses
      if (selectedCourses.length > 0) {
        assignments = assignments.filter(a => selectedCourses.includes(a.course_id.toString()));
        announcements = announcements.filter(a => selectedCourses.includes(a.course_id.toString()));
      }
    }

    // Filter out assignments more than 20 days overdue for non-assignment views only
    if (activeView !== 'assignments' && hide20DaysOverdue) {
      assignments = assignments.filter(a => {
        if (!a.due_at) return true;
        const dueDate = new Date(a.due_at);
        const daysSinceOverdue = (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceOverdue <= 20; // Keep assignments that are <= 20 days overdue
      });
    }

    // Sort assignments by urgency/due date
    assignments.sort((a, b) => {
      if (!a.due_at && !b.due_at) return 0;
      if (!a.due_at) return 1;
      if (!b.due_at) return -1;
      return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
    });

    // Sort announcements by date
    announcements.sort((a, b) => {
      if (!a.posted_at && !b.posted_at) return 0;
      if (!a.posted_at) return 1;
      if (!b.posted_at) return -1;
      return new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime();
    });

         // Calculate full counts for stats
     const upcomingAll = assignments.filter(a => {
       if (!a.due_at) return false;
       const dueDate = new Date(a.due_at);
       return dueDate.getTime() > now.getTime();
     });
     
     const overdueAll = assignments.filter(a => {
       if (!a.due_at) return false;
       const dueDate = new Date(a.due_at);
       return dueDate.getTime() < now.getTime();
     });

     const dueToday = assignments.filter(a => {
       if (!a.due_at) return false;
       const dueDate = new Date(a.due_at);
       const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
       const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
       return dueDate >= todayStart && dueDate < todayEnd;
     });

     const dueThisWeek = assignments.filter(a => {
       if (!a.due_at) return false;
       const dueDate = new Date(a.due_at);
       const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
       return dueDate >= now && dueDate <= weekFromNow;
     });

     const unlockingSoon = assignments.filter(a => {
       if (!a.lock_info?.unlock_at) return false;
       const unlockDate = new Date(a.lock_info.unlock_at);
       const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
       return unlockDate >= now && unlockDate <= threeDaysFromNow;
     });

     return {
       assignments,
       announcements,
       upcomingAssignments: upcomingAll.slice(0, 5),
       overdueAssignments: overdueAll.slice(0, 5),
       recentAnnouncements: announcements.slice(0, 3),
       courses: Object.values(dashboardData.entities.courses),
       // Stats
       stats: {
         upcomingCount: upcomingAll.length,
         overdueCount: overdueAll.length,
         dueTodayCount: dueToday.length,
         dueThisWeekCount: dueThisWeek.length,
         unlockingSoonCount: unlockingSoon.length,
         totalAssignments: assignments.length,
         totalAnnouncements: announcements.length,
       },
     };
     }, [dashboardData, selectedCourses, activeView, assignmentView, hide20DaysOverdue, showSubmitted, showOver15Days]);

  if (canvas.error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Connection Error</h2>
          <p className="text-red-600 mb-4">{canvas.error}</p>
          <button 
            onClick={refreshData}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
                     <div className="mb-4">
             <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <span className="text-2xl font-bold text-blue-600">A</span>
             </div>
             <h2 className="text-xl font-semibold text-gray-800 mb-2">Ready to Load Your Dashboard</h2>
            <p className="text-gray-600">Connect to Canvas to see your courses, assignments, and announcements.</p>
          </div>
          <button 
            onClick={refreshData}
            disabled={canvas.loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {canvas.loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : 'Load My Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  // Assignment Card Component
  const AssignmentCard = ({ assignment, compact = false }: { assignment: ProcessedAssignment; compact?: boolean }) => {
    const course = dashboardUtils.getCourse(dashboardData, assignment.course_id);
    const urgency = getUrgencyLevel(assignment);
    
    const urgencyColors = {
      critical: 'border-red-500 bg-red-50',
      warning: 'border-yellow-500 bg-yellow-50',
      normal: 'border-gray-200 bg-white'
    };

    const statusColors = {
      submitted: 'bg-green-100 text-green-800',
      graded: 'bg-blue-100 text-blue-800',
      unsubmitted: 'bg-red-100 text-red-800',
      pending_review: 'bg-yellow-100 text-yellow-800'
    };

    const getStatusDisplay = (status: string) => {
      switch (status) {
        case 'submitted': return 'Submitted';
        case 'graded': return 'Graded';
        case 'unsubmitted': return 'Not Submitted';
        case 'pending_review': return 'Pending Review';
        default: return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    };

    return (
      <div className={`border-l-4 rounded-lg p-4 mb-3 ${urgencyColors[urgency]} shadow-sm`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Title and Lock Status */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 text-base">{assignment.name}</h3>
              {assignment.locked_for_user && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                  LOCKED
                </span>
              )}
            </div>
            
            {/* Course */}
            <p className="text-sm text-gray-600 mb-2 font-medium">{course?.name}</p>
            
            {/* Due Date */}
            {assignment.due_at && (
              <div className="mb-2">
                <p className={`text-sm font-medium ${urgency === 'critical' ? 'text-red-700' : urgency === 'warning' ? 'text-yellow-700' : 'text-gray-700'}`}>
                  <span className="font-semibold">Due:</span> {formatDateWithRemaining(assignment.due_at)}
                </p>
              </div>
            )}
            
            {/* Status */}
            <div className="mb-2">
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[assignment.submission_status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                {getStatusDisplay(assignment.submission_status)}
              </span>
            </div>
            
            {/* Lock/Unlock Information */}
            {assignment.locked_for_user && assignment.lock_info?.unlock_at && (
              <div className="mb-2">
                <p className="text-sm text-blue-600">
                  <span className="font-semibold">Unlocks:</span> {formatDateWithRemaining(assignment.lock_info.unlock_at)}
                </p>
              </div>
            )}
            
            {/* Additional info for non-compact view */}
            {!compact && (
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                <span>{assignment.points_possible ? `${assignment.points_possible} pts` : 'No points'}</span>
                {assignment.submission_types && (
                  <span>Type: {assignment.submission_types.join(', ')}</span>
                )}
              </div>
            )}
          </div>
          
          {/* View Assignment Button */}
          <a 
            href={assignment.html_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex-shrink-0 font-medium"
          >
            View Assignment
          </a>
        </div>
      </div>
    );
  };

  // Announcement Card Component
  const AnnouncementCard = ({ announcement }: { announcement: ProcessedAnnouncement }) => {
    const course = dashboardUtils.getCourse(dashboardData, announcement.course_id);
    
    return (
      <div className="bg-white border rounded-lg p-4 mb-3 shadow-sm">
                 <div className="flex items-start justify-between">
           <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-1">
               <h3 className="font-medium text-gray-900 truncate">{announcement.title}</h3>
             </div>
            <p className="text-sm text-gray-600 mb-2">{course?.name}</p>
            <p className="text-xs text-gray-500">{formatDateAgo(announcement.posted_at)}</p>
          </div>
          <a 
            href={announcement.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-4 bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            Read
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">Animodo</h1>
        </div>
        
        <nav className="p-4">
          <div className="space-y-2">
            {(['overview', 'assignments', 'announcements'] as const).map((view) => (
              <button
                key={view}
                onClick={() => {
                  setActiveView(view);
                  setSidebarOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeView === view 
                    ? 'bg-blue-100 text-blue-800 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="capitalize">{view}</span>
              </button>
            ))}
            
            {/* Refresh Button */}
            <button 
              onClick={refreshData}
              disabled={canvas.loading}
              className="w-full text-left px-3 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border-t pt-4 mt-4"
            >
              <span className="flex items-center gap-2">
                {canvas.loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Data
                  </>
                )}
              </span>
            </button>
          </div>
        </nav>

                 {/* Quick Stats - Only show on overview */}
         {processedData && activeView === 'overview' && (
           <div className="p-4 border-t mt-4">
             <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Stats</h3>
             <div className="space-y-1 text-sm">
               <div className="flex justify-between">
                 <span className="text-gray-600">Due Today</span>
                 <span className={`font-medium ${processedData.stats.dueTodayCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                   {processedData.stats.dueTodayCount}
                 </span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-600">Due This Week</span>
                 <span className={`font-medium ${processedData.stats.dueThisWeekCount > 0 ? 'text-yellow-600' : 'text-gray-500'}`}>
                   {processedData.stats.dueThisWeekCount}
                 </span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-600">Upcoming</span>
                 <span className="font-medium text-blue-600">{processedData.stats.upcomingCount}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-600">Overdue</span>
                 <span className="font-medium text-red-600">{processedData.stats.overdueCount}</span>
               </div>
             </div>
           </div>
         )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b p-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-800 capitalize">{activeView}</h2>
                {activeView === 'assignments' && (
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {(['upcoming', 'overdue'] as const).map((view) => (
                      <button
                        key={view}
                        onClick={() => setAssignmentView(view)}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                          assignmentView === view
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {view.charAt(0).toUpperCase() + view.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {(activeView === 'assignments' || activeView === 'overview') && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-2 text-gray-500 hover:text-gray-700 lg:hidden"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 2v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

                                {/* Filters - Show on assignments and overview tabs */}
           {(activeView === 'assignments' || activeView === 'overview') && (
             <div className={`mt-4 space-y-3 lg:space-y-0 lg:flex lg:items-center lg:gap-6 ${showFilters ? 'block' : 'hidden lg:flex'}`}>
               {/* Course Filter */}
               {processedData && processedData.courses.length > 0 && (
                 <select
                   value={selectedCourses.length === 1 ? selectedCourses[0] : ''}
                   onChange={(e) => setSelectedCourses(e.target.value ? [e.target.value] : [])}
                   className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                 >
                   <option value="">All Courses</option>
                   {processedData.courses.map((course) => (
                     <option key={course.id} value={course.id.toString()}>
                       {course.name}
                     </option>
                   ))}
                 </select>
               )}

               {/* Show Submitted Filter */}
               <div className="flex items-center gap-2">
                 <input
                   type="checkbox"
                   id="showSubmitted"
                   checked={showSubmitted}
                   onChange={(e) => setShowSubmitted(e.target.checked)}
                   className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                 />
                 <label htmlFor="showSubmitted" className="text-sm text-gray-600">
                   Show submitted
                 </label>
               </div>

               {/* Show Over 15 Days Filter */}
               <div className="flex items-center gap-2">
                 <input
                   type="checkbox"
                   id="showOver15Days"
                   checked={showOver15Days}
                   onChange={(e) => setShowOver15Days(e.target.checked)}
                   className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                 />
                 <label htmlFor="showOver15Days" className="text-sm text-gray-600">
                   Show overdue/due &gt; 15 days
                 </label>
               </div>
             </div>
           )}
         </header>

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {processedData && (
            <>
                             {activeView === 'overview' && (
                 <div className="space-y-6">
                   {/* Upcoming Assignments */}
                   <section>
                     <h3 className="text-lg font-semibold text-gray-800 mb-4">
                       Upcoming Assignments (Top 5)
                     </h3>
                     {processedData.upcomingAssignments.length > 0 ? (
                       <div>
                         {processedData.upcomingAssignments.map((assignment: ProcessedAssignment) => (
                           <AssignmentCard key={assignment.id} assignment={assignment} compact />
                         ))}
                       </div>
                     ) : (
                       <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                         <p className="text-green-800 font-medium">No upcoming assignments!</p>
                         <p className="text-green-600 text-sm">You're all caught up.</p>
                       </div>
                     )}
                   </section>

                   {/* Overdue Assignments */}
                   <section>
                     <h3 className="text-lg font-semibold text-gray-800 mb-4">
                       Overdue Assignments (Top 5)
                     </h3>
                     {processedData.overdueAssignments.length > 0 ? (
                       <div>
                         {processedData.overdueAssignments.map((assignment: ProcessedAssignment) => (
                           <AssignmentCard key={assignment.id} assignment={assignment} compact />
                         ))}
                       </div>
                     ) : (
                       <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                         <p className="text-gray-600">No overdue assignments!</p>
                         <p className="text-gray-500 text-sm">Great job staying on track.</p>
                       </div>
                     )}
                   </section>

                                     {/* Recent Announcements */}
                   <section>
                     <h3 className="text-lg font-semibold text-gray-800 mb-4">
                       Recent Announcements (Top 3)
                     </h3>
                    {processedData.recentAnnouncements.length > 0 ? (
                      <div>
                        {processedData.recentAnnouncements.map((announcement) => (
                          <AnnouncementCard key={announcement.id} announcement={announcement} />
                        ))}
                      </div>
                    ) : (
                                             <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                         <p className="text-gray-600">No recent announcements</p>
                       </div>
                    )}
                  </section>
                </div>
              )}

              {activeView === 'assignments' && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {assignmentView === 'upcoming' ? 'Upcoming Assignments' : 'Overdue Assignments'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {assignmentView === 'upcoming' 
                        ? `Showing ${processedData.assignments.length} upcoming assignments`
                        : `Showing ${processedData.assignments.length} overdue assignments`
                      }
                    </p>
                  </div>
                  {processedData.assignments.length > 0 ? (
                    <div>
                      {processedData.assignments.map((assignment) => (
                        <AssignmentCard key={assignment.id} assignment={assignment} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                      <p className="text-gray-600 text-lg">
                        {assignmentView === 'upcoming' ? 'No upcoming assignments found' : 'No overdue assignments found'}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {assignmentView === 'upcoming' 
                          ? 'All caught up! 🎉'
                          : 'Great job staying on track!'
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeView === 'announcements' && (
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      Showing {processedData.announcements.length} announcements
                    </p>
                  </div>
                  {processedData.announcements.length > 0 ? (
                    <div>
                      {processedData.announcements.map((announcement) => (
                        <AnnouncementCard key={announcement.id} announcement={announcement} />
                      ))}
                    </div>
                  ) : (
                                         <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                       <p className="text-gray-600 text-lg">No announcements found</p>
                       <p className="text-gray-500 text-sm">Try adjusting your filters</p>
                     </div>
                  )}
                </div>
              )}

              
            </>
          )}
        </main>

        {/* Last Updated Footer */}
        {dashboardData && (
          <footer className="bg-white border-t p-4 text-center">
            <p className="text-xs text-gray-500">
              Last updated: {new Date(dashboardData.report_generated_on).toLocaleString()}
            </p>
          </footer>
        )}
      </div>
    </div>
  );
} 