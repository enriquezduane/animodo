'use client';

import { useState } from 'react';
import { useCanvas, dashboardUtils } from '@/lib/use-canvas';
import { DashboardData } from '@/types/canvas';

// Helper function to format dates with remaining time
function formatDateWithRemaining(dateString: string): string {
  const targetDate = new Date(dateString);
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  
  // Format the date part
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[targetDate.getMonth()];
  const day = targetDate.getDate();
  
  // Calculate remaining time
  if (diffMs < 0) {
    // Past date
    const pastDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    const pastHours = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${month} ${day} (${pastDays} Days ${pastHours} Hours Overdue)`;
  } else {
    // Future date
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${month} ${day} (${days} Days ${hours} Hours Remaining)`;
  }
}

// Helper function to format dates showing time ago
function formatDateAgo(dateString: string): string {
  const targetDate = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();
  
  // Format the date part
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[targetDate.getMonth()];
  const day = targetDate.getDate();
  
  // Calculate time ago
  if (diffMs < 0) {
    // Future date (shouldn't happen for announcements, but just in case)
    const futureDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    const futureHours = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${month} ${day} (${futureDays} Days ${futureHours} Hours From Now)`;
  } else {
    // Past date
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${month} ${day} (${days} Days ${hours} Hours Ago)`;
  }
}

interface DashboardProps {
  accessToken: string;
}

export function Dashboard({ accessToken }: DashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'assignments' | 'announcements'>('overview');
  
  const canvas = useCanvas({
    accessToken,
    canvasUrl: 'https://dlsu.instructure.com',
  });

  // Remove auto-refresh on component mount

  const refreshData = async () => {
    const data = await canvas.getDashboardData();
    if (data) {
      setDashboardData(data);
    }
  };



  if (canvas.error) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Error Loading Data</h2>
        <p style={{ color: 'red' }}>{canvas.error}</p>
        <button onClick={refreshData}>
          Try Again
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Welcome to Your Canvas Dashboard</h2>
        <p>Click the button below to load your courses, assignments, and announcements from Canvas.</p>
        <button 
          onClick={refreshData}
          disabled={canvas.loading}
          style={{
            padding: '15px 30px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {canvas.loading ? 'Loading Canvas Data...' : 'Load My Dashboard'}
        </button>
      </div>
    );
  }

  const upcomingAssignments = dashboardUtils.getUpcomingAssignments(dashboardData);
  const unsubmittedAssignments = dashboardUtils.getUnsubmittedAssignments(dashboardData);
  const allCourses = dashboardUtils.getAllCourses(dashboardData);
  const assignmentCounts = dashboardUtils.getAssignmentCounts(dashboardData);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={refreshData} 
          disabled={canvas.loading}
          style={{ 
            marginRight: '10px', 
            padding: '8px 16px',
            backgroundColor: canvas.loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: canvas.loading ? 'not-allowed' : 'pointer'
          }}
        >
          {canvas.loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <span style={{ fontSize: '14px', color: '#666' }}>
          Last updated: {new Date(dashboardData.report_generated_on).toLocaleString()}
        </span>
      </div>

      {/* Tab Navigation */}
      <div style={{ borderBottom: '1px solid #ccc', marginBottom: '20px' }}>
        {(['overview', 'courses', 'assignments', 'announcements'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              border: 'none',
              backgroundColor: activeTab === tab ? '#f0f0f0' : 'transparent',
              borderBottom: activeTab === tab ? '2px solid #007bff' : 'none',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          <h2>Dashboard Overview</h2>
          
          <div style={{ marginBottom: '30px' }}>
            <h3>Quick Stats</h3>
            <ul>
              <li>{allCourses.length} Favorite Courses</li>
              <li>{upcomingAssignments.length} Upcoming Assignments</li>
              <li>{unsubmittedAssignments.length} Unsubmitted Assignments</li>
              <li>{Object.keys(dashboardData.entities.assignments).length} Total Assignments</li>
              <li>{Object.keys(dashboardData.entities.announcements).length} Recent Announcements</li>
            </ul>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3>Urgent: Upcoming Assignments</h3>
            {upcomingAssignments.length > 0 ? (
              <ul>
                {upcomingAssignments.slice(0, 5).map((assignment) => {
                  const course = dashboardUtils.getCourse(dashboardData, assignment.course_id);
                  return (
                    <li key={assignment.id} style={{ marginBottom: '10px' }}>
                                             <strong>{assignment.name}</strong><br />
                       Course: {course?.name}<br />
                       Due: {formatDateWithRemaining(assignment.due_at!)}<br />
                       Status: {assignment.submission_status}<br />
                       {assignment.locked_for_user && <span style={{ color: 'orange' }}>🔒 Locked</span>}<br />
                       {assignment.lock_info?.unlock_at && <span style={{ color: 'blue' }}>Unlocks: {formatDateWithRemaining(assignment.lock_info.unlock_at)}</span>}<br />
                       <a href={assignment.html_url} target="_blank" rel="noopener noreferrer">
                         View Assignment
                       </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>No upcoming assignments! 🎉</p>
            )}
          </div>

          <div>
            <h3>Needs Attention: Unsubmitted Assignments</h3>
            {unsubmittedAssignments.length > 0 ? (
              <ul>
                {unsubmittedAssignments.slice(0, 5).map((assignment) => {
                  const course = dashboardUtils.getCourse(dashboardData, assignment.course_id);
                  return (
                    <li key={assignment.id} style={{ marginBottom: '10px' }}>
                                             <strong style={{ color: 'red' }}>{assignment.name}</strong><br />
                       Course: {course?.name}<br />
                       Was Due: {formatDateWithRemaining(assignment.due_at!)}<br />
                       {assignment.locked_for_user && <span style={{ color: 'orange' }}>🔒 Locked</span>}<br />
                       {assignment.lock_info?.unlock_at && <span style={{ color: 'blue' }}>Unlocks: {formatDateWithRemaining(assignment.lock_info.unlock_at)}</span>}<br />
                       <a href={assignment.html_url} target="_blank" rel="noopener noreferrer">
                         Submit Assignment
                       </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>All assignments submitted! ✅</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div>
          <h2>Your Courses</h2>
          {allCourses.map((course) => {
            const counts = assignmentCounts[course.id];
            const announcements = dashboardUtils.getCourseAnnouncements(dashboardData, course.id);
            
            return (
              <div key={course.id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px' }}>
                <h3>{course.name}</h3>
                <p><strong>Assignment Summary:</strong></p>
                <ul>
                  <li>Total: {counts.total}</li>
                  <li>Upcoming: {counts.upcoming}</li>
                  <li>Unsubmitted: {counts.unsubmitted}</li>
                </ul>
                <p><strong>Recent Announcements:</strong> {announcements.length}</p>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'assignments' && (
        <div>
          <h2>All Assignments</h2>
          
          <div style={{ marginBottom: '30px' }}>
            <h3>Upcoming ({upcomingAssignments.length})</h3>
            {upcomingAssignments.length > 0 ? (
              <div>
                {upcomingAssignments.map((assignment) => {
                  const course = dashboardUtils.getCourse(dashboardData, assignment.course_id);
                  return (
                    <div key={assignment.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                                             <h4>{assignment.name} {assignment.locked_for_user && <span style={{ color: 'orange' }}>🔒</span>}</h4>
                       <p>Course: {course?.name}</p>
                       <p>Due: {formatDateWithRemaining(assignment.due_at!)}</p>
                       <p>Points: {assignment.points_possible || 'N/A'}</p>
                       <p>Status: {assignment.submission_status}</p>
                       <p>Submission Types: {assignment.submission_types.join(', ')}</p>
                       {assignment.locked_for_user && <p style={{ color: 'orange' }}>This assignment is locked for you</p>}
                       {assignment.lock_info?.unlock_at && (
                         <p style={{ color: 'blue' }}>
                           Unlocks: {formatDateWithRemaining(assignment.lock_info.unlock_at)}
                         </p>
                       )}
                       {assignment.lock_info?.lock_at && (
                         <p style={{ color: 'orange' }}>
                           Locks: {formatDateWithRemaining(assignment.lock_info.lock_at)}
                         </p>
                       )}
                       <a href={assignment.html_url} target="_blank" rel="noopener noreferrer">
                         View Assignment →
                       </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No upcoming assignments</p>
            )}
          </div>

          <div>
            <h3>Unsubmitted ({unsubmittedAssignments.length})</h3>
            {unsubmittedAssignments.length > 0 ? (
              <div>
                {unsubmittedAssignments.map((assignment) => {
                  const course = dashboardUtils.getCourse(dashboardData, assignment.course_id);
                  return (
                    <div key={assignment.id} style={{ border: '1px solid #red', padding: '10px', marginBottom: '10px', backgroundColor: '#ffe6e6' }}>
                                             <h4>{assignment.name} {assignment.locked_for_user && <span style={{ color: 'orange' }}>🔒</span>}</h4>
                       <p>Course: {course?.name}</p>
                       <p>Was Due: {formatDateWithRemaining(assignment.due_at!)}</p>
                       <p>Points: {assignment.points_possible || 'N/A'}</p>
                       <p>Submission Types: {assignment.submission_types.join(', ')}</p>
                       {assignment.locked_for_user && <p style={{ color: 'orange' }}>This assignment is locked for you</p>}
                       {assignment.lock_info?.unlock_at && (
                         <p style={{ color: 'blue' }}>
                           Unlocks: {formatDateWithRemaining(assignment.lock_info.unlock_at)}
                         </p>
                       )}
                       {assignment.lock_info?.lock_at && (
                         <p style={{ color: 'orange' }}>
                           Locks: {formatDateWithRemaining(assignment.lock_info.lock_at)}
                         </p>
                       )}
                       <a href={assignment.html_url} target="_blank" rel="noopener noreferrer">
                         {assignment.locked_for_user ? 'View Assignment →' : 'Submit Assignment →'}
                       </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>All assignments are submitted! 🎉</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'announcements' && (
        <div>
          <h2>Recent Announcements</h2>
          <div>
            {Object.values(dashboardData.entities.announcements)
              .sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime())
              .map((announcement) => {
                const course = dashboardUtils.getCourse(dashboardData, announcement.course_id);
                return (
                  <div key={announcement.id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px' }}>
                    <h3>{announcement.title}</h3>
                                         <p><strong>Course:</strong> {course?.name}</p>
                     <p><strong>Posted:</strong> {formatDateAgo(announcement.posted_at)}</p>
                    <a href={announcement.url} target="_blank" rel="noopener noreferrer">
                      Read Full Announcement →
                    </a>
                  </div>
                );
              })}
            {Object.keys(dashboardData.entities.announcements).length === 0 && (
              <p>No recent announcements</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 