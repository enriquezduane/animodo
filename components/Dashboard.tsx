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
type ActiveView = 'overview' | 'assignments' | 'announcements' | 'courses';

export function Dashboard({ accessToken }: DashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Filters
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('week');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showFilters, setShowFilters] = useState(false);
  
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

    // Filter by period
    if (filterPeriod !== 'all') {
      const periodMs = {
        today: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
      }[filterPeriod];

      assignments = assignments.filter(a => {
        if (!a.due_at) return true;
        return new Date(a.due_at).getTime() - now.getTime() <= periodMs;
      });

      announcements = announcements.filter(a => {
        if (!a.posted_at) return true;
        return now.getTime() - new Date(a.posted_at).getTime() <= periodMs * 2; // Show older announcements
      });
    }

    // Filter by status
    if (filterStatus !== 'all') {
      assignments = assignments.filter(a => {
        return filterStatus === 'unsubmitted' 
          ? a.submission_status === 'unsubmitted'
          : a.submission_status !== 'unsubmitted';
      });
    }

    // Filter by selected courses
    if (selectedCourses.length > 0) {
      assignments = assignments.filter(a => selectedCourses.includes(a.course_id.toString()));
      announcements = announcements.filter(a => selectedCourses.includes(a.course_id.toString()));
    }

    // Filter out assignments more than 20 days overdue (keeps UI clean)
    assignments = assignments.filter(a => {
      if (!a.due_at) return true;
      const dueDate = new Date(a.due_at);
      const daysSinceOverdue = (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceOverdue <= 20; // Keep assignments that are <= 20 days overdue
    });

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

         return {
       assignments,
       announcements,
       upcomingAssignments: assignments.filter(a => {
         if (!a.due_at) return false;
         const dueDate = new Date(a.due_at);
         return dueDate.getTime() > now.getTime(); // Future assignments
       }).slice(0, 5),
       overdueAssignments: assignments.filter(a => {
         if (!a.due_at) return false;
         const dueDate = new Date(a.due_at);
         return dueDate.getTime() < now.getTime(); // Past assignments
       }).slice(0, 5),
       recentAnnouncements: announcements.slice(0, 3),
       courses: Object.values(dashboardData.entities.courses),
     };
  }, [dashboardData, selectedCourses, filterPeriod, filterStatus]);

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

         const urgencyIcons = {
       critical: '⚠',
       warning: '•',
       normal: '•'
     };

    return (
      <div className={`border-l-4 rounded-lg p-4 mb-3 ${urgencyColors[urgency]} shadow-sm`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{urgencyIcons[urgency]}</span>
              <h3 className="font-medium text-gray-900 truncate">{assignment.name}</h3>
              {assignment.locked_for_user && <span className="text-gray-500">🔒</span>}
            </div>
            <p className="text-sm text-gray-600 mb-2">{course?.name}</p>
            {assignment.due_at && (
              <p className={`text-sm font-medium ${urgency === 'critical' ? 'text-red-700' : urgency === 'warning' ? 'text-yellow-700' : 'text-gray-700'}`}>
                {formatDateWithRemaining(assignment.due_at)}
              </p>
            )}
            {!compact && (
              <>
                <p className="text-xs text-gray-500 mt-1">
                  {assignment.points_possible ? `${assignment.points_possible} pts` : 'No points'} • 
                  {assignment.submission_status}
                </p>
                {assignment.lock_info?.unlock_at && (
                  <p className="text-xs text-blue-600 mt-1">
                    Unlocks: {formatDateWithRemaining(assignment.lock_info.unlock_at)}
                  </p>
                )}
              </>
            )}
          </div>
          <a 
            href={assignment.html_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-4 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            {assignment.submission_status === 'unsubmitted' ? 'Submit' : 'View'}
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
            {(['overview', 'assignments', 'announcements', 'courses'] as const).map((view) => (
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
          </div>
        </nav>

        {/* Quick Stats */}
        {processedData && (
          <div className="p-4 border-t mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Stats</h3>
            <div className="space-y-1 text-sm">
                             <div className="flex justify-between">
                 <span className="text-gray-600">Overdue</span>
                 <span className="font-medium text-red-600">{processedData.overdueAssignments.length}</span>
               </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Assignments</span>
                <span className="font-medium">{processedData.assignments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Announcements</span>
                <span className="font-medium">{processedData.announcements.length}</span>
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
              <h2 className="text-lg font-semibold text-gray-800 capitalize">{activeView}</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 text-gray-500 hover:text-gray-700 lg:hidden"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 2v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
              <button 
                onClick={refreshData}
                disabled={canvas.loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {canvas.loading ? '↻' : '↻ Refresh'}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className={`mt-4 space-y-3 lg:space-y-0 lg:flex lg:items-center lg:gap-4 ${showFilters ? 'block' : 'hidden lg:flex'}`}>
            {/* Period Filter */}
            <div className="flex gap-2">
              {(['today', 'week', 'month', 'all'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setFilterPeriod(period)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filterPeriod === period
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {(['all', 'unsubmitted', 'submitted'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filterStatus === status
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {status === 'all' ? 'All Status' : status === 'unsubmitted' ? 'Unsubmitted' : 'Submitted'}
                </button>
              ))}
            </div>

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
          </div>
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
                    <p className="text-sm text-gray-600">
                      Showing {processedData.assignments.length} assignments
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
                       <p className="text-gray-600 text-lg">No assignments found</p>
                       <p className="text-gray-500 text-sm">Try adjusting your filters</p>
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

              {activeView === 'courses' && (
                <div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {processedData.courses.map((course) => {
                      const courseAssignments = processedData.assignments.filter(a => a.course_id === course.id);
                      const courseAnnouncements = processedData.announcements.filter(a => a.course_id === course.id);
                      const urgentCount = courseAssignments.filter(a => getUrgencyLevel(a) === 'critical').length;
                      
                      return (
                        <div key={course.id} className="bg-white border rounded-lg p-4 shadow-sm">
                          <h3 className="font-semibold text-gray-900 mb-2">{course.name}</h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Assignments</p>
                              <p className="font-medium">{courseAssignments.length}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Urgent</p>
                              <p className={`font-medium ${urgentCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {urgentCount}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Announcements</p>
                              <p className="font-medium">{courseAnnouncements.length}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Course</p>
                              <a 
                                href={`https://dlsu.instructure.com/courses/${course.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                View →
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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