'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin,
  Navigation,
  ExternalLink,
  Search,
  Sparkles,
  X,
  Compass,
  Car,
  Train,
  Clock,
  Building,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MapsAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialVenue?: string;
  initialLocation?: string;
}

interface PlaceLink {
  title: string;
  uri: string;
}

export function MapsAgentModal({
  isOpen,
  onClose,
  initialVenue = '',
  initialLocation = ''
}: MapsAgentModalProps) {
  const [query, setQuery] = useState('');
  const [venue, setVenue] = useState(initialVenue);
  const [location, setLocation] = useState(initialLocation);
  const [loading, setLoading] = useState(false);
  const [responseContent, setResponseContent] = useState<string | null>(null);
  const [places, setPlaces] = useState<PlaceLink[]>([]);
  const [directMapsUrl, setDirectMapsUrl] = useState<string>('');
  const [directionsUrl, setDirectionsUrl] = useState<string>('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const searchedKeyRef = useRef<string>('');

  const handleSearch = useCallback(
    async (customQuery?: string, customVenue?: string, customLocation?: string) => {
      const activeVenue = customVenue !== undefined ? customVenue : venue;
      const activeLoc = customLocation !== undefined ? customLocation : location;
      const q = customQuery !== undefined ? customQuery : query;
      if (!q && !activeVenue && !activeLoc) return;

      setLoading(true);
      setResponseContent(null);
      setPlaces([]);

      try {
        const res = await fetch('/api/maps-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: q,
            venue: activeVenue,
            location: activeLoc,
            userLocation: userCoords,
          }),
        });

        const data = await res.json();
        if (data.content) {
          setResponseContent(data.content);
          setPlaces(data.places || []);
          setDirectMapsUrl(data.googleMapsDirectUrl || '');
          setDirectionsUrl(data.directionsUrl || '');
        } else {
          setResponseContent(
            'Could not retrieve maps information for this location. Please try again.'
          );
        }
      } catch (err) {
        console.error('Maps agent fetch error:', err);
        setResponseContent(
          'Failed to connect to Google Maps Agent. Please check your internet connection.'
        );
      } finally {
        setLoading(false);
      }
    },
    [location, query, userCoords, venue]
  );

  // Sync initial props and trigger search on open
  useEffect(() => {
    if (!isOpen) return;
    const currentKey = `${initialVenue}___${initialLocation}`;
    if (initialVenue || initialLocation) {
      if (searchedKeyRef.current !== currentKey) {
        searchedKeyRef.current = currentKey;
        setVenue(initialVenue);
        setLocation(initialLocation);
        handleSearch(initialVenue || initialLocation, initialVenue, initialLocation);
      }
    }
  }, [isOpen, initialVenue, initialLocation, handleSearch]);

  // Try retrieving user geolocation
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // Geolocation optional, default Mumbai coords
          setUserCoords({ lat: 19.076, lng: 72.8777 });
        },
        { timeout: 5000 }
      );
    }
  }, []);

  const quickPrompts = [
    'How do I reach here by Metro / Local Train?',
    'Show live driving directions and traffic estimate',
    'Where is the staff / vendor entry gate?',
    'Find catering supplies and ice vendors nearby',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00A651] flex items-center justify-center text-white shadow-xs">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black tracking-tight">Venue & Route Agent</h3>
                <span className="bg-white/20 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider">
                  Live Maps
                </span>
              </div>
              <p className="text-[11px] text-gray-300">
                Real-time directions, transit routes & venue logistics for catering crews
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Location Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/70 space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#00A651]" />
              <input
                type="text"
                placeholder="Event Venue (e.g. Taj Palace, Grand Hyatt)"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#00A651]"
              />
            </div>
            <div className="relative sm:w-44">
              <input
                type="text"
                placeholder="City / Area (e.g. Mumbai)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#00A651]"
              />
            </div>
          </div>

          {/* Ask Agent Question */}
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Ask route, transit, directions, parking, or supply query..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#00A651] shadow-2xs"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="py-2.5 px-4 rounded-xl bg-[#00A651] hover:bg-[#008f45] text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loading ? 'Searching...' : 'Explore'}</span>
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(p);
                  handleSearch(p);
                }}
                className="text-[11px] font-medium bg-white hover:bg-gray-100 text-gray-700 border border-gray-200/80 px-2.5 py-1 rounded-lg whitespace-nowrap transition"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {loading ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-3 border-[#00A651] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-gray-700">Connecting to real-time Google Maps data...</p>
              <p className="text-[11px] text-gray-400 max-w-xs">
                Analyzing routes, transit options, and venue entrance logistics
              </p>
            </div>
          ) : responseContent ? (
            <div className="space-y-4">
              {/* Grounded Markdown Response */}
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4 text-xs sm:text-sm text-gray-800 leading-relaxed space-y-2">
                <ReactMarkdown>{responseContent}</ReactMarkdown>
              </div>

              {/* Direct Maps Quick Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {directionsUrl && (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3.5 rounded-xl bg-[#00A651] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#008f45] transition shadow-xs"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Open Live Directions in Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {directMapsUrl && (
                  <a
                    href={directMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <MapPin className="w-4 h-4 text-[#00A651]" />
                    <span>Explore Venue on Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                  </a>
                )}
              </div>

              {/* Places extracted from grounding */}
              {places.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-3.5 shadow-2xs">
                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#00A651]" />
                    <span>Google Maps Verified Places ({places.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {places.map((place, idx) => (
                      <a
                        key={idx}
                        href={place.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-gray-50 hover:bg-emerald-50 border border-gray-200/80 hover:border-emerald-200 text-xs font-semibold text-gray-800 hover:text-[#00A651] flex items-center justify-between transition group"
                      >
                        <span className="truncate">{place.title}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#00A651] shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 text-center flex flex-col items-center justify-center gap-3 text-gray-400">
              <Compass className="w-12 h-12 text-gray-300" />
              <div>
                <h4 className="text-sm font-bold text-gray-800">CaterCrew Real-Time Maps Agent</h4>
                <p className="text-xs text-gray-500 max-w-sm mt-1">
                  Type any catering venue name or select a quick question above to pull live directions, public transit, and arrival guidelines.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500">
          <span>Powered by Google Maps Real-time Grounding</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
