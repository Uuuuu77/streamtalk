import React from 'react';

// Loading skeleton components for better UX during code splitting
export const ComponentSkeletons = {
  Dashboard: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="h-6 bg-slate-600 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-600 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-slate-600 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),

  StreamerDashboard: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-8">
            <div className="h-8 bg-slate-700 rounded w-1/3"></div>
            <div className="h-10 bg-slate-700 rounded w-32"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="h-6 bg-slate-600 rounded w-1/4 mb-4"></div>
                <div className="h-32 bg-slate-600 rounded"></div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="h-6 bg-slate-600 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-4 bg-slate-600 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),

  ViewerPage: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="animate-pulse">
          <div className="text-center mb-8">
            <div className="h-10 bg-slate-700 rounded w-1/2 mx-auto mb-4"></div>
            <div className="h-6 bg-slate-600 rounded w-1/3 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="h-6 bg-slate-600 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-slate-600 rounded"></div>
                ))}
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="h-6 bg-slate-600 rounded w-1/2 mb-4"></div>
              <div className="h-20 bg-slate-600 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
};