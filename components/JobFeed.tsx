'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Flame, Sparkles, Building2, AlertCircle, RefreshCw } from 'lucide-react';
import { CateringJob } from '../lib/types';
import { JobCard } from './JobCard';

interface JobFeedProps {
  jobs: CateringJob[];
  appliedJobIds: Set<string>;
  onApply: (job: CateringJob) => void;
  isWorker: boolean;
  onRequireAuth: () => void;
  applyingJobId: string | null;
  loading: boolean;
}

export function JobFeed({
  jobs,
  appliedJobIds,
  onApply,
  isWorker,
  onRequireAuth,
  applyingJobId,
  loading,
}: JobFeedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Filtered and sorted jobs: URGENT ALWAYS PINNED TO TOP
  const processedJobs = useMemo(() => {
    let result = [...jobs];

    // Filter by category
    if (filterType === 'urgent') {
      result = result.filter((j) => j.isUrgent);
    } else if (filterType === 'wedding') {
      result = result.filter((j) =>
        j.eventType.toLowerCase().includes('wedding') ||
        j.title.toLowerCase().includes('wedding') ||
        j.eventType.toLowerCase().includes('sangeet')
      );
    } else if (filterType === 'corporate') {
      result = result.filter((j) =>
        j.eventType.toLowerCase().includes('corporate') ||
        j.title.toLowerCase().includes('corporate') ||
        j.eventType.toLowerCase().includes('gala')
      );
    } else if (filterType === 'high_wage') {
      result = result.filter((j) => j.totalWage >= 1000);
    }

    // Filter by text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.companyName.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q) ||
          j.venue.toLowerCase().includes(q) ||
          j.eventType.toLowerCase().includes(q)
      );
    }

    // Sort: Urgent first, then newest
    return result.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [jobs, filterType, searchQuery]);

  const urgentCount = useMemo(() => jobs.filter((j) => j.isUrgent).length, [jobs]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          id="job-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by banquet venue, city, or event type..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#00A651] focus:ring-2 focus:ring-[#00A651]/20 shadow-xs transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
            filterType === 'all'
              ? 'bg-[#1A1A1A] text-white shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          All Gigs ({jobs.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterType('urgent')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
            filterType === 'urgent'
              ? 'bg-[#FF3B30] text-white shadow-xs'
              : 'bg-red-50 text-[#FF3B30] border border-red-200 hover:bg-red-100'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Urgent ({urgentCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType('wedding')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
            filterType === 'wedding'
              ? 'bg-[#00A651] text-white shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Weddings & Galas
        </button>

        <button
          type="button"
          onClick={() => setFilterType('corporate')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
            filterType === 'corporate'
              ? 'bg-[#00A651] text-white shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Corporate
        </button>

        <button
          type="button"
          onClick={() => setFilterType('high_wage')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
            filterType === 'high_wage'
              ? 'bg-[#00A651] text-white shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          ₹1,000+/Day
        </button>
      </div>

      {/* Realtime Job Stream Status */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1 font-medium">
        <span>
          Showing <strong className="text-gray-900">{processedJobs.length}</strong> active catering shifts
        </span>
        {urgentCount > 0 && (
          <span className="text-[#FF3B30] font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#FF3B30] animate-ping" />
            {urgentCount} urgent bonus spots
          </span>
        )}
      </div>

      {/* Job Cards List */}
      {loading && jobs.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 text-[#00A651] animate-spin" />
          <p className="text-xs font-semibold text-gray-500">
            Syncing live catering vacancies from Partime network...
          </p>
        </div>
      ) : processedJobs.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-dashed border-gray-300 text-center flex flex-col items-center justify-center gap-2">
          <AlertCircle className="w-8 h-8 text-gray-400" />
          <h4 className="text-sm font-bold text-gray-800">No catering vacancies match your filter</h4>
          <p className="text-xs text-gray-500 max-w-xs">
            Try resetting the search keywords or check back in a few minutes for new event postings.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterType('all');
              setSearchQuery('');
            }}
            className="mt-2 text-xs font-bold text-[#00A651] hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {processedJobs.map((job) => (
            <JobCard
              key={job.jobId}
              job={job}
              hasApplied={appliedJobIds.has(job.jobId)}
              onApply={onApply}
              isWorker={isWorker}
              onRequireAuth={onRequireAuth}
              isApplying={applyingJobId === job.jobId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
