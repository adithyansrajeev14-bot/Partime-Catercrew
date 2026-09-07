'use client';

import React, { useState } from 'react';
import { Star, X, Sparkles, CheckCircle2, MessageSquare, Award } from 'lucide-react';
import { doc, setDoc, updateDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Review } from '../lib/types';

interface RatingReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRole: 'worker' | 'company';
  targetUserId: string;
  targetUserName: string;
  targetUserRole: 'worker' | 'company';
  onSuccess?: () => void;
}

export function RatingReviewModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  fromUserId,
  fromUserName,
  fromUserRole,
  targetUserId,
  targetUserName,
  targetUserRole,
  onSuccess,
}: RatingReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [review, setReview] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workerTags = [
    'Punctual & On Time',
    'Proper Black & White Uniform',
    'Great Table Etiquette',
    'Fast & Efficient',
    'Polite & Courteous',
    'Excellent Bartender',
    'Highly Recommended',
  ];

  const companyTags = [
    'Prompt Daily Cash/UPI Payout',
    'Respectful Event Managers',
    'Provided Staff Meals',
    'Clear Event Briefing',
    'Safe & Professional Environment',
    'Would Love to Work Again',
  ];

  const tagsList = targetUserRole === 'worker' ? workerTags : companyTags;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setError('Please select a star rating (1 to 5 stars)');
      return;
    }
    if (!review.trim()) {
      setError('Please write a short review or feedback');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const reviewId = 'rev_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const newReview: Review = {
        reviewId,
        jobId,
        jobTitle: jobTitle || 'Catering Shift',
        fromUserId,
        fromUserName: fromUserName || 'CaterCrew Member',
        fromUserRole,
        targetUserId,
        targetUserRole,
        rating,
        review: review.trim(),
        tags: selectedTags,
        createdAt: new Date().toISOString(),
      };

      // 1. Save review document
      await setDoc(doc(db, 'reviews', reviewId), newReview);

      // 2. Compute updated average rating for target profile
      try {
        const qReviews = query(collection(db, 'reviews'), where('targetUserId', '==', targetUserId));
        const revSnap = await getDocs(qReviews);
        let total = rating;
        let count = 1;
        revSnap.forEach((d) => {
          const r = d.data() as Review;
          if (r.reviewId !== reviewId && r.rating) {
            total += r.rating;
            count += 1;
          }
        });
        const avg = Math.round((total / count) * 10) / 10;

        const targetCollection = targetUserRole === 'worker' ? 'workers' : 'companies';
        await updateDoc(doc(db, targetCollection, targetUserId), {
          rating: avg,
          reviewsCount: count,
        });
      } catch (err) {
        console.warn('Could not update average rating aggregate:', err);
      }

      // Notify target in notifications collection
      try {
        const notifId = 'notif_' + Date.now().toString(36);
        await setDoc(doc(db, 'notifications', notifId), {
          notificationId: notifId,
          type: 'review_received',
          title: `⭐ New ${rating}-Star Review from ${fromUserName}!`,
          body: `"${review.trim().substring(0, 80)}${review.length > 80 ? '...' : ''}" for ${jobTitle}`,
          targetUserId,
          targetRole: targetUserRole,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      } catch {}

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      console.error('Error submitting review:', err);
      const msg = err instanceof Error ? err.message : 'Failed to submit review';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-black flex items-center justify-center shadow-xs">
              <Star className="w-4 h-4 fill-black" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">
                Rate & Review {targetUserRole === 'worker' ? 'Worker' : 'Company'}
              </h3>
              <p className="text-[11px] text-gray-300">
                Shift: {jobTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
              {error}
            </div>
          )}

          {/* Target Profile Info */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-200/80">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                {targetUserRole === 'worker' ? 'Catering Steward / Staff' : 'Event Company'}
              </span>
              <span className="text-sm font-black text-gray-900">{targetUserName}</span>
            </div>
            <span className="text-xs font-semibold text-[#00A651] bg-[#00A651]/10 px-2 py-0.5 rounded-full">
              Job Completed
            </span>
          </div>

          {/* Star Rating Selector */}
          <div className="text-center py-2">
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Overall Experience Rating
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-2xl transition hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        isActive
                          ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-bold text-amber-700 mt-1 block">
              {rating === 5
                ? '⭐⭐⭐⭐⭐ Exceptional (5/5)'
                : rating === 4
                ? '⭐⭐⭐⭐ Very Good (4/5)'
                : rating === 3
                ? '⭐⭐⭐ Average (3/5)'
                : rating === 2
                ? '⭐⭐ Needs Improvement (2/5)'
                : '⭐ Unsatisfactory (1/5)'}
            </span>
          </div>

          {/* Quick Highlight Tags */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Highlight Tags (Optional)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {tagsList.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all border ${
                      isSelected
                        ? 'bg-[#00A651] text-white border-[#00A651] shadow-2xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Short Review & Feedback
            </label>
            <textarea
              required
              rows={3}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder={
                targetUserRole === 'worker'
                  ? 'e.g. Highly punctual, excellent beverage serving etiquette at wedding reception, worked smoothly with captains.'
                  : 'e.g. Prompt cash payout right after buffet ended, clear briefing, great team atmosphere.'
              }
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#00A651]"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#00A651] hover:bg-[#008f45] text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Submit Rating</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
