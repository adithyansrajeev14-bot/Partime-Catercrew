export type UserRole = 'worker' | 'company' | 'admin';

export interface UserAccount {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface WorkerProfile {
  uid: string;
  name: string;
  age: number;
  phone: string;
  location: string;
  height?: string;
  experience: string;
  skills: string[];
  availability: string;
  expectedWage: number;
  profilePhotoUrl?: string;
  bio?: string;
  rating?: number;
  completedGigs?: number;
}

export interface CompanyProfile {
  uid: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  location: string;
  address: string;
  serviceType: string;
  experience: string;
  description: string;
  logoUrl?: string;
  verified?: boolean;
}

export interface CateringJob {
  jobId: string;
  companyId: string;
  companyName: string;
  companyPhone: string;
  title: string;
  eventType: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  workersNeeded: number;
  isUrgent: boolean;
  normalWage: number;
  bonusWage: number;
  totalWage: number;
  dressCode: string;
  description: string;
  status: 'open' | 'filled' | 'cancelled';
  createdAt: string;
  applicationsCount?: number;
}

export interface JobApplication {
  applicationId: string;
  jobId: string;
  workerId: string;
  workerName: string;
  workerPhone: string;
  workerPhoto?: string;
  workerExperience?: string;
  workerWage?: number;
  companyId: string;
  jobTitle?: string;
  jobDate?: string;
  totalWage?: number;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
}

export interface WebsiteSettings {
  logoUrl: string;
  faviconUrl: string;
  announcement?: string;
}
