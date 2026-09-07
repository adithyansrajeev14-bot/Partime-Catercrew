'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  Flame,
  Sparkles,
  Building2,
  AlertCircle,
  RefreshCw,
  MapPin,
  Calendar,
  Briefcase,
  X,
  Compass,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
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
  onOpenMapsAgent?: (venue?: string, location?: string) => void;
}

export function JobFeed({
  jobs,
  appliedJobIds,
  onApply,
  isWorker,
  onRequireAuth,
  applyingJobId,
  loading,
  onOpenMapsAgent,
}: JobFeedProps) {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedJobRole, setSelectedJobRole] = useState<string>('all');
  const [dateRangePreset, setDateRangePreset] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Available cities extracted dynamically + popular defaults
  const availableCities = useMemo(() => {
    const defaultCities = ['Mumbai', 'Delhi NCR', 'Bangalore', 'Pune', 'Hyderabad', 'Goa', 'Kolkata'];
    const jobCities = jobs
      .map((j) => {
        // Extract city from location string (e.g. "Bandra West, Mumbai" -> "Mumbai")
        const parts = j.location.split(',');
        return parts.length > 1 ? parts[parts.length - 1].trim() : j.location.trim();
      })
      .filter(Boolean);
    const combined = Array.from(new Set([...defaultCities, ...jobCities]));
    return combined.sort();
  }, [jobs]);

  // Standard catering job roles
  const jobRoles = [
    { id: 'all', label: 'All Roles' },
    { id: 'waiter', label: 'Waiter / Steward' },
    { id: 'bartender', label: 'Bartender / Mixologist' },
    { id: 'runner', label: 'Food Runner' },
    { id: 'kitchen', label: 'Kitchen Helper / Cook' },
    { id: 'captain', label: 'Captain / Supervisor' },
    { id: 'host', label: 'Host / Hostess' },
  ];

  // Check if dates match filter
  const matchesDateFilter = useCallback((jobDateStr: string) => {
    if (dateRangePreset === 'all' && !startDate && !endDate) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const jobDate = new Date(jobDateStr);
    const hasValidJobDate = !isNaN(jobDate.getTime());

    if (dateRangePreset === 'today') {
      if (!hasValidJobDate) return true;
      return jobDate.toDateString() === today.toDateString();
    }

    if (dateRangePreset === 'tomorrow') {
      if (!hasValidJobDate) return true;
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return jobDate.toDateString() === tomorrow.toDateString();
    }

    if (dateRangePreset === 'weekend') {
      if (!hasValidJobDate) return true;
      const day = jobDate.getDay();
      return day === 5 || day === 6 || day === 0; // Fri, Sat, Sun
    }

    if (dateRangePreset === 'next7days') {
      if (!hasValidJobDate) return true;
      const maxDate = new Date(today);
      maxDate.setDate(today.getDate() + 7);
      return jobDate >= today && jobDate <= maxDate;
    }

    // Custom Start / End Date range
    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      if (hasValidJobDate && jobDate < s) return false;
    }

    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      if (hasValidJobDate && jobDate > e) return false;
    }

    return true;
  }, [dateRangePreset, startDate, endDate]);

  // Filtered and sorted jobs: URGENT ALWAYS PINNED TO TOP
  const processedJobs = useMemo(() => {
    let result = [...jobs];

    // Filter by category tab
    if (filterType === 'urgent') {
      result = result.filter((j) => j.isUrgent);
    } else if (filterType === 'wedding') {
      result = result.filter(
        (j) =>
          j.eventType.toLowerCase().includes('wedding') ||
          j.title.toLowerCase().includes('wedding') ||
          j.eventType.toLowerCase().includes('sangeet')
      );
    } else if (filterType === 'corporate') {
      result = result.filter(
        (j) =>
          j.eventType.toLowerCase().includes('corporate') ||
          j.title.toLowerCase().includes('corporate') ||
          j.eventType.toLowerCase().includes('gala')
      );
    } else if (filterType === 'high_wage') {
      result = result.filter((j) => j.totalWage >= 1000);
    }

    // Filter by City / Location
    if (selectedCity !== 'all') {
      const cityLower = selectedCity.toLowerCase();
      result = result.filter(
        (j) =>
          j.location.toLowerCase().includes(cityLower) ||
          j.venue.toLowerCase().includes(cityLower)
      );
    }

    // Filter by Job Role / Type
    if (selectedJobRole !== 'all') {
      const roleLower = selectedJobRole.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(roleLower) ||
          (j.jobRole && j.jobRole.toLowerCase().includes(roleLower)) ||
          (j.roleType && j.roleType.toLowerCase().includes(roleLower)) ||
          j.description.toLowerCase().includes(roleLower)
      );
    }

    // Filter by Date Range
    result = result.filter((j) => matchesDateFilter(j.date));

    // Filter by Keyword Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.companyName.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q) ||
          j.venue.toLowerCase().includes(q) ||
          j.eventType.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q) ||
          (j.dressCode && j.dressCode.toLowerCase().includes(q))
      );
    }

    // Sort: Urgent first, then newest
    return result.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [jobs, filterType, selectedCity, selectedJobRole, matchesDateFilter, searchQuery]);

  const urgentCount = useMemo(() => jobs.filter((j) => j.isUrgent).length, [jobs]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCity !== 'all') count++;
    if (selectedJobRole !== 'all') count++;
    if (dateRangePreset !== 'all' || startDate || endDate) count++;
    if (filterType !== 'all') count++;
    return count;
  }, [selectedCity, selectedJobRole, dateRangePreset, startDate, endDate, filterType]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setSelectedCity('all');
    setSelectedJobRole('all');
    setDateRangePreset('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-3.5">
      {/* Search Input Bar with Filter Trigger Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="job-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search banquet venue, keywords, dress code, role..."
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#00A651] focus:ring-2 focus:ring-[#00A651]/20 shadow-xs transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          type="button"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`py-2.5 px-3.5 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
            showAdvancedFilters || activeFiltersCount > 0
              ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#00A651] text-white text-[10px] font-black flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Live Maps Route Agent Button */}
        {onOpenMapsAgent && (
          <button
            type="button"
            onClick={() => onOpenMapsAgent()}
            className="py-2.5 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#00A651] font-bold text-xs flex items-center gap-1.5 transition shrink-0"
            title="Ask Google Maps Route & Transit Agent"
          >
            <Compass className="w-4 h-4 text-[#00A651]" />
            <span className="hidden sm:inline">Maps Agent</span>
          </button>
        )}
      </div>

      {/* Advanced Filter Panel: City, Date Range, Role Type */}
      {showAdvancedFilters && (
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#00A651]" />
              <span>Targeted Vacancy Filters</span>
            </span>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Location / City Filter */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#00A651]" />
                <span>City / Location</span>
              </label>
              <select
                id="filter-location-select"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#00A651] outline-none"
              >
                <option value="all">All Cities / Regions</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Job Type / Role Filter */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-[#00A651]" />
                <span>Job Type / Role</span>
              </label>
              <select
                id="filter-job-role-select"
                value={selectedJobRole}
                onChange={(e) => setSelectedJobRole(e.target.value)}
                className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#00A651] outline-none"
              >
                {jobRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Date Range Preset */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#00A651]" />
                <span>Date Range</span>
              </label>
              <select
                id="filter-date-range-select"
                value={dateRangePreset}
                onChange={(e) => {
                  setDateRangePreset(e.target.value);
                  if (e.target.value !== 'custom') {
                    setStartDate('');
                    setEndDate('');
                  }
                }}
                className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#00A651] outline-none"
              >
                <option value="all">Any Event Date</option>
                <option value="today">Today&apos;s Shifts</option>
                <option value="tomorrow">Tomorrow&apos;s Shifts</option>
                <option value="weekend">This Weekend (Fri - Sun)</option>
                <option value="next7days">Next 7 Days</option>
                <option value="custom">Custom Date Range...</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range Inputs (if custom selected) */}
          {dateRangePreset === 'custom' && (
            <div className="pt-1 flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
              <div className="flex-1">
                <span className="text-[10px] text-gray-500 font-bold block mb-0.5">From Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#00A651]"
                />
              </div>
              <span className="text-gray-400 font-bold text-xs mt-3">to</span>
              <div className="flex-1">
                <span className="text-[10px] text-gray-500 font-bold block mb-0.5">To Date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#00A651]"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs / Quick Chips */}
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

      {/* Active Filter Tags */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {selectedCity !== 'all' && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-[#00A651] border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
              <MapPin className="w-3 h-3" />
              <span>{selectedCity}</span>
              <button onClick={() => setSelectedCity('all')} className="hover:text-black">
                ×
              </button>
            </span>
          )}
          {selectedJobRole !== 'all' && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-[#00A651] border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
              <Briefcase className="w-3 h-3" />
              <span>{jobRoles.find((r) => r.id === selectedJobRole)?.label || selectedJobRole}</span>
              <button onClick={() => setSelectedJobRole('all')} className="hover:text-black">
                ×
              </button>
            </span>
          )}
          {dateRangePreset !== 'all' && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-[#00A651] border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
              <Calendar className="w-3 h-3" />
              <span>{dateRangePreset}</span>
              <button onClick={() => setDateRangePreset('all')} className="hover:text-black">
                ×
              </button>
            </span>
          )}
        </div>
      )}

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
            Try broadening your location, date range, or keywords to discover more event shifts.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="mt-2 text-xs font-bold text-[#00A651] hover:underline flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All Filters</span>
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
              onOpenMapsAgent={onOpenMapsAgent}
            />
          ))}
        </div>
      )}
    </div>
  );
}
