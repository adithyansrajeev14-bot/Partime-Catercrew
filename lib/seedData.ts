import { collection, getDocs, setDoc, doc, limit, query } from 'firebase/firestore';
import { db } from './firebase';
import { CateringJob, WorkerProfile, CompanyProfile } from './types';

export const INITIAL_COMPANIES: CompanyProfile[] = [
  {
    uid: 'comp_royal_flavours',
    companyName: 'Royal Flavours Banquet & Events',
    contactPerson: 'Sanjay Kapoor',
    phone: '9820198201',
    location: 'Mumbai, Maharashtra',
    address: 'Bandra Kurla Complex, Hall 4, Mumbai',
    serviceType: 'Luxury Weddings & Galas',
    experience: '12+ Years',
    description: 'Premier event hospitality specializing in grand 1,000+ guest royal wedding buffets and corporate banquets.',
    logoUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=150&auto=format&fit=crop&q=80',
    verified: true,
  },
  {
    uid: 'comp_silver_spoon',
    companyName: 'Silver Spoon Corporate Buffets',
    contactPerson: 'Pooja Nair',
    phone: '9845098450',
    location: 'Bengaluru, Karnataka',
    address: 'Indiranagar 100ft Road, Bengaluru',
    serviceType: 'Corporate Buffets & Cocktails',
    experience: '8 Years',
    description: 'High-energy, tech-park corporate cocktail parties, product launches, and five-star VIP table service.',
    logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150&auto=format&fit=crop&q=80',
    verified: true,
  },
  {
    uid: 'comp_spice_craft',
    companyName: 'SpiceCraft Outdoor Caterers',
    contactPerson: 'Arun Verma',
    phone: '9811298112',
    location: 'New Delhi / NCR',
    address: 'Chattarpur Farms, Mehrauli Road, New Delhi',
    serviceType: 'Outdoor Farmhouse Gatherings',
    experience: '10 Years',
    description: 'Destination wedding caterers managing live counters, tandoor stations, mocktail bars, and steward staff.',
    logoUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=150&auto=format&fit=crop&q=80',
    verified: true,
  }
];

export const INITIAL_WORKERS: WorkerProfile[] = [
  {
    uid: 'worker_rahul_sharma',
    name: 'Rahul Sharma',
    age: 23,
    phone: '9876543210',
    location: 'Mumbai, Maharashtra',
    height: "5'10\"",
    experience: '3 Years',
    skills: ['Buffet Serving', 'VIP Plating', 'Barista', 'Beverage Service'],
    availability: 'Immediate / Weekends',
    expectedWage: 900,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Experienced banquet steward. Handled 50+ luxury destination weddings. Always in crisp formal uniform.',
    rating: 4.9,
    completedGigs: 42,
  },
  {
    uid: 'worker_priya_patel',
    name: 'Priya Patel',
    age: 21,
    phone: '9898989898',
    location: 'Bengaluru, Karnataka',
    height: "5'5\"",
    experience: '2 Years',
    skills: ['Live Counters', 'Welcome Drinks', 'Guest Hostess', 'Cashiering'],
    availability: 'Evenings & Weekends',
    expectedWage: 1000,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'Warm hospitality professional with expertise in guest greeting, canapé service, and corporate dinner coordination.',
    rating: 4.8,
    completedGigs: 28,
  },
  {
    uid: 'worker_amit_kumar',
    name: 'Amit Kumar',
    age: 25,
    phone: '9812345678',
    location: 'New Delhi, NCR',
    height: "5'11\"",
    experience: '4 Years',
    skills: ['Kitchen Steward', 'Bartending Assistant', 'Buffet Serving', 'Silver Service'],
    availability: 'Full Time',
    expectedWage: 850,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Dedicated captain & head server. Quick on feet, punctual, and trained in five-star hotel hygiene protocols.',
    rating: 5.0,
    completedGigs: 64,
  }
];

export const INITIAL_JOBS: CateringJob[] = [
  {
    jobId: 'job_urgent_sangeet',
    companyId: 'comp_royal_flavours',
    companyName: 'Royal Flavours Banquet',
    companyPhone: '9820198201',
    title: 'Urgent: Grand Sangeet Night Banquet Stewards',
    eventType: 'Wedding Sangeet',
    date: 'Tomorrow, 7:00 PM - 1:00 AM',
    time: '6 Hours',
    location: 'Bandra West, Mumbai',
    venue: 'Taj Lands End Ballroom',
    workersNeeded: 12,
    isUrgent: true,
    normalWage: 800,
    bonusWage: 300,
    totalWage: 1100,
    dressCode: 'All Black: Black formal trousers, black collared button shirt, polished black shoes. Clean shaven.',
    description: 'Urgent emergency requirement for high-profile celebrity Sangeet buffet. Tasks include circulating mocktails, clearing plates, and live pasta counter attendance. Spot cash payment at end of shift + hot dinner provided.',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    applicationsCount: 4,
  },
  {
    jobId: 'job_urgent_corporate_cocktail',
    companyId: 'comp_silver_spoon',
    companyName: 'Silver Spoon Buffets',
    companyPhone: '9845098450',
    title: 'Urgent: Tech Summit Networking Cocktail Servers',
    eventType: 'Corporate Gala',
    date: 'This Saturday, 5:30 PM - 11:30 PM',
    time: '6 Hours',
    location: 'Whitefield, Bengaluru',
    venue: 'Sheraton Grand Convention Center',
    workersNeeded: 8,
    isUrgent: true,
    normalWage: 900,
    bonusWage: 250,
    totalWage: 1150,
    dressCode: 'White crisp formal long-sleeve shirt, black trousers, black tie, formal black dress shoes.',
    description: 'Serving appetizers on silver trays to multinational tech delegates. High-standard grooming required. Instant UPI payment post-event with overtime allowance if event extends.',
    status: 'open',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    applicationsCount: 5,
  },
  {
    jobId: 'job_standard_destination_wedding',
    companyId: 'comp_spice_craft',
    companyName: 'SpiceCraft Outdoor',
    companyPhone: '9811298112',
    title: 'Royal Destination Wedding Buffet & Live Chaat Stewards',
    eventType: 'Royal Wedding Reception',
    date: 'Upcoming Sunday, 6:00 PM - 12:00 AM',
    time: '6 Hours',
    location: 'Chattarpur Farms, New Delhi',
    venue: 'The Umrao Farmhouse',
    workersNeeded: 18,
    isUrgent: false,
    normalWage: 950,
    bonusWage: 0,
    totalWage: 950,
    dressCode: 'Black trousers, black shoes. Company will provide customized ethnic waistcoat & name tag at venue.',
    description: 'Looking for pleasant, energetic catering staff for lawn dinner buffet. Roles include food refill monitoring, guest water replenishment, and dessert counter assistance. Cab drop provided to nearest metro.',
    status: 'open',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    applicationsCount: 7,
  },
  {
    jobId: 'job_standard_anniversary_dinner',
    companyId: 'comp_royal_flavours',
    companyName: 'Royal Flavours Banquet',
    companyPhone: '9820198201',
    title: 'VIP 25th Silver Jubilee Sit-Down Dinner Service',
    eventType: 'Private Jubilee',
    date: 'Next Friday, 7:00 PM - 11:30 PM',
    time: '4.5 Hours',
    location: 'Juhu Beach, Mumbai',
    venue: 'Sea Princess Heritage Lawn',
    workersNeeded: 6,
    isUrgent: false,
    normalWage: 850,
    bonusWage: 0,
    totalWage: 850,
    dressCode: 'Formal black trousers, black shirt, formal footwear.',
    description: 'Exquisite sit-down 4-course French-style table service for 80 elite guests. Courteous manners and basic tray balance experience required.',
    status: 'open',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    applicationsCount: 2,
  }
];

export async function seedInitialDataIfNeeded(): Promise<void> {
  try {
    const jobsRef = collection(db, 'jobs');
    const existing = await getDocs(query(jobsRef, limit(1)));
    if (existing.empty) {
      // Seed jobs
      for (const job of INITIAL_JOBS) {
        await setDoc(doc(db, 'jobs', job.jobId), job);
      }
      // Seed companies
      for (const comp of INITIAL_COMPANIES) {
        await setDoc(doc(db, 'companies', comp.uid), comp);
      }
      // Seed workers
      for (const worker of INITIAL_WORKERS) {
        await setDoc(doc(db, 'workers', worker.uid), worker);
      }
      // Seed settings
      await setDoc(doc(db, 'settings', 'general'), {
        logoUrl: '',
        faviconUrl: '',
        announcement: 'Welcome to CaterCrew - The Fast Job Marketplace for Catering Staff & Event Companies'
      });
    }
  } catch (err) {
    console.warn('Seed initial data non-blocking check:', err);
  }
}
