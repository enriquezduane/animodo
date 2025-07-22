'use client';

import { useState, useEffect } from 'react';
import { useCanvas, dashboardUtils } from '@/lib/use-canvas';
import { DashboardData } from '@/types/canvas';

// Example component showing how to use the Canvas API
export function CanvasExample() {
  const [accessToken, setAccessToken] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  
  const canvas = useCanvas({
    accessToken,
    canvasUrl: 'https://dlsu.instructure.com',
  });

  const fetchDashboard = async () => {
    const data = await canvas.getDashboardData();
    if (data) {
      setDashboardData(data);
    }
  };

  if (!accessToken) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Canvas Integration</h2>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Enter your Canvas access token"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded-md w-full max-w-md"
          />
        </div>
        <p className="text-gray-600">
          Enter your Canvas access token to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Canvas Dashboard</h2>
      
      <div className="mb-4">
        <button
          onClick={fetchDashboard}
          disabled={canvas.loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {canvas.loading ? 'Loading...' : 'Fetch Dashboard Data'}
        </button>
      </div>

      {canvas.error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          Error: {canvas.error}
        </div>
      )}

      {dashboardData && (
        <div className="space-y-6">
          {/* Courses */}
          <section>
            <h3 className="text-xl font-semibold mb-3">Your Courses</h3>
            <div className="grid gap-3">
              {dashboardUtils.getAllCourses(dashboardData).map((course) => {
                const counts = dashboardUtils.getAssignmentCounts(dashboardData)[course.id];
                return (
                  <div key={course.id} className="border border-gray-200 p-4 rounded-md">
                    <h4 className="font-medium">{course.name}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      {counts.total} assignments ({counts.upcoming} upcoming, {counts.unsubmitted} unsubmitted)
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Upcoming Assignments */}
          <section>
            <h3 className="text-xl font-semibold mb-3">Upcoming Assignments</h3>
            <div className="space-y-3">
              {dashboardUtils.getUpcomingAssignments(dashboardData).map((assignment) => {
                const course = dashboardUtils.getCourse(dashboardData, assignment.course_id);
                return (
                  <div key={assignment.id} className="border border-gray-200 p-4 rounded-md">
                    <h4 className="font-medium">{assignment.name}</h4>
                    <p className="text-sm text-gray-600">
                      Course: {course?.name} | Due: {new Date(assignment.due_at!).toLocaleDateString()}
                    </p>
                    <p className="text-sm">
                      Status: {assignment.submission_status} | Points: {assignment.points_possible || 'N/A'}
                    </p>
                  </div>
                );
              })}
              {dashboardUtils.getUpcomingAssignments(dashboardData).length === 0 && (
                <p className="text-gray-500">No upcoming assignments</p>
              )}
            </div>
          </section>

          {/* Recent Announcements */}
          <section>
            <h3 className="text-xl font-semibold mb-3">Recent Announcements</h3>
            <div className="space-y-3">
              {Object.values(dashboardData.entities.announcements)
                .sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime())
                .slice(0, 5)
                .map((announcement) => {
                  const course = dashboardUtils.getCourse(dashboardData, announcement.course_id);
                  return (
                    <div key={announcement.id} className="border border-gray-200 p-4 rounded-md">
                      <h4 className="font-medium">{announcement.title}</h4>
                      <p className="text-sm text-gray-600">
                        {course?.name} | {new Date(announcement.posted_at).toLocaleDateString()}
                      </p>
                      <a 
                        href={announcement.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 text-sm hover:underline"
                      >
                        View Announcement →
                      </a>
                    </div>
                  );
                })
              }
            </div>
          </section>
        </div>
      )}
    </div>
  );
} 