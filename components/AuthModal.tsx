'use client';

import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, getFriendlyErrorMessage } from '../lib/firebase';
import { UserRole } from '../lib/types';
import { X, Mail, Lock, User, Building2, UserCheck, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferredRole: UserRole;
  onAuthSuccess: (role: UserRole) => void;
}

export function AuthModal({ isOpen, onClose, preferredRole, onAuthSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>(preferredRole);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      if (isSignUp) {
        if (!email || !password) {
          throw new Error('Please provide both email and password.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (fullName) {
          await updateProfile(user, { displayName: fullName });
        }

        // Create user document
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: role,
          createdAt: new Date().toISOString()
        });

        // Initialize default profile based on role
        if (role === 'worker') {
          await setDoc(doc(db, 'workers', user.uid), {
            uid: user.uid,
            name: fullName || email.split('@')[0],
            age: 22,
            phone: '9800000000',
            location: 'Mumbai / Pan India',
            experience: '1-2 Years',
            skills: ['Buffet Serving', 'Table Service'],
            availability: 'Immediate',
            expectedWage: 800,
            profilePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            rating: 5.0,
            completedGigs: 0
          });
        } else {
          await setDoc(doc(db, 'companies', user.uid), {
            uid: user.uid,
            companyName: fullName || 'Premier Catering Events',
            contactPerson: fullName || 'Manager',
            phone: '9800000000',
            location: 'Mumbai / Delhi',
            address: 'Event Center, Suite 101',
            serviceType: 'Event Catering',
            experience: '5+ Years',
            description: 'Professional event and catering hospitality team.',
            logoUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=150&auto=format&fit=crop&q=80',
            verified: true
          });
        }

        onAuthSuccess(role);
        onClose();
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Fetch user role from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userRole = userDoc.exists() ? (userDoc.data().role as UserRole) : role;

        onAuthSuccess(userRole);
        onClose();
      }
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create user record
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          role: role,
          createdAt: new Date().toISOString()
        });

        if (role === 'worker') {
          await setDoc(doc(db, 'workers', user.uid), {
            uid: user.uid,
            name: user.displayName || 'Catering Specialist',
            age: 23,
            phone: '9876543210',
            location: 'Mumbai / Delhi',
            experience: '2 Years',
            skills: ['Buffet Serving', 'VIP Plating'],
            availability: 'Immediate',
            expectedWage: 850,
            profilePhotoUrl: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            rating: 5.0,
            completedGigs: 0
          });
        } else {
          await setDoc(doc(db, 'companies', user.uid), {
            uid: user.uid,
            companyName: user.displayName ? `${user.displayName}'s Catering` : 'Royal Banquets',
            contactPerson: user.displayName || 'Event Lead',
            phone: '9876543210',
            location: 'Bengaluru / Mumbai',
            address: 'City Center Banquet Hall',
            serviceType: 'Wedding & Corporate',
            experience: '4+ Years',
            description: 'Quality catering management service for high-volume banquets.',
            logoUrl: user.photoURL || 'https://images.unsplash.com/photo-1555244162-803834f70033?w=150&auto=format&fit=crop&q=80',
            verified: true
          });
        }
        onAuthSuccess(role);
      } else {
        const existingRole = userDoc.data().role as UserRole;
        onAuthSuccess(existingRole || role);
      }
      onClose();
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (demoRole: UserRole) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const demoEmail = demoRole === 'worker' ? 'demo.worker@catercrew.com' : 'demo.company@catercrew.com';
      const demoPass = 'cater1234';

      let user;
      try {
        const cred = await signInWithEmailAndPassword(auth, demoEmail, demoPass);
        user = cred.user;
      } catch {
        // Create if doesn't exist
        const cred = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
        user = cred.user;
        const name = demoRole === 'worker' ? 'Rahul (Demo Worker)' : 'Royal Catering (Demo)';
        await updateProfile(user, { displayName: name });
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: demoEmail,
          role: demoRole,
          createdAt: new Date().toISOString()
        });

        if (demoRole === 'worker') {
          await setDoc(doc(db, 'workers', user.uid), {
            uid: user.uid,
            name: 'Rahul Sharma',
            age: 23,
            phone: '9876543210',
            location: 'Mumbai, Maharashtra',
            height: "5'10\"",
            experience: '3 Years',
            skills: ['Buffet Serving', 'VIP Plating', 'Barista'],
            availability: 'Immediate',
            expectedWage: 900,
            profilePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            bio: 'Banquet steward with experience in luxury destination weddings.',
            rating: 4.9,
            completedGigs: 38
          });
        } else {
          await setDoc(doc(db, 'companies', user.uid), {
            uid: user.uid,
            companyName: 'Royal Flavours Banquet',
            contactPerson: 'Sanjay Kapoor',
            phone: '9820198201',
            location: 'Bandra, Mumbai',
            address: 'Taj Lands End Banquet Hall, Mumbai',
            serviceType: 'Luxury Weddings & Galas',
            experience: '10 Years',
            description: 'Premier event hospitality catering company.',
            logoUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=150&auto=format&fit=crop&q=80',
            verified: true
          });
        }
      }

      onAuthSuccess(demoRole);
      onClose();
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
        <button
          id="close-auth-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isSignUp ? 'Join CaterCrew to start posting or finding catering gigs' : 'Sign in to access your jobs, applications & profile'}
          </p>
        </div>

        {/* Role Selector during Sign Up */}
        {isSignUp && (
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-700 mb-1.5 text-center">
              I want to use CaterCrew as:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('worker')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                  role === 'worker'
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Worker / Individual</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('company')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                  role === 'company'
                    ? 'bg-[#00A651] text-white border-[#00A651] shadow-xs'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Company / Event Host</span>
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {role === 'worker' ? 'Full Name' : 'Company / Organizer Name'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="auth-name-input"
                  type="text"
                  required
                  placeholder={role === 'worker' ? 'e.g. Rahul Sharma' : 'e.g. Royal Flavours Banquets'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] focus:ring-2 focus:ring-[#00A651]/20 outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="auth-email-input"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] focus:ring-2 focus:ring-[#00A651]/20 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="auth-password-input"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#00A651] focus:ring-2 focus:ring-[#00A651]/20 outline-none transition"
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#00A651] hover:bg-[#008f45] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-[#00A651]/20 flex items-center justify-center gap-2 transition disabled:opacity-60"
          >
            {loading ? (
              <span className="animate-spin text-xs">● ● ●</span>
            ) : (
              <>
                <span>{isSignUp ? 'Create CaterCrew Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400 font-semibold">Or continue with</span>
          </div>
        </div>

        {/* Google Auth Button */}
        <button
          id="google-signin-btn"
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 active:bg-gray-100 font-semibold text-xs text-gray-700 flex items-center justify-center gap-2.5 transition shadow-2xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Quick Test / Demo Login */}
        <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
          <div className="text-[11px] font-bold text-gray-500 text-center mb-2 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Instant Demo Logins (One-Click)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="demo-login-worker"
              type="button"
              onClick={() => handleDemoSignIn('worker')}
              className="py-2 px-2 text-[11px] font-bold rounded-lg bg-gray-100 hover:bg-gray-200 text-[#1A1A1A] transition text-center"
            >
              Demo Worker Login
            </button>
            <button
              id="demo-login-company"
              type="button"
              onClick={() => handleDemoSignIn('company')}
              className="py-2 px-2 text-[11px] font-bold rounded-lg bg-[#00A651]/10 hover:bg-[#00A651]/20 text-[#00A651] transition text-center"
            >
              Demo Company Login
            </button>
          </div>
        </div>

        {/* Toggle sign in / sign up */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMessage(null);
            }}
            className="text-xs text-gray-600 hover:text-[#00A651] font-semibold underline"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
