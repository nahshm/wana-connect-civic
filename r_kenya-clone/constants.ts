import { Post, PostType, User, Community, CivicAction, CommunityLevel, Channel, CommunityMessage, CivicProject, CampaignPromise, Comment, UserAction } from './types';

export const CURRENT_USER: User = {
  id: 'u1',
  username: 'Juma_Civic',
  isVerified: true,
  isOfficial: false,
  karma: 1250,
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100&h=100',
  title: 'Community Reporter',
  bio: 'Passionate about civic tech and open data. Trying to make Nairobi better one report at a time.',
  joinDate: 'March 2023',
  badges: ['Verified Citizen', 'Top Reporter', 'Promise Keeper', 'Early Adopter'],
  location: 'Nairobi, Embakasi'
};

export const MOCK_COMMUNITIES: Community[] = [
  { id: 'c1', name: 'NairobiCounty', prefix: 'c/', members: 45000 },
  { id: 'c2', name: 'KenyanPolitics', prefix: 'c/', members: 120000 },
  { id: 'c3', name: 'BudgetWatch', prefix: 'c/', members: 15000 },
  { id: 'c4', name: 'YouthVoices', prefix: 'c/', members: 32000 },
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    type: PostType.CIVIC_CLIP,
    title: 'Understanding the new Housing Levy 🏠',
    content: 'Here is a 30 second breakdown of where the funds are actually going according to the new bill.',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-on-video-call-on-smartphone-40348-large.mp4', 
    author: {
      id: 'w1',
      username: 'PolicyAnalyst_KE',
      isVerified: true,
      isOfficial: false,
      karma: 5000,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100',
      title: 'Verified Analyst'
    },
    community: MOCK_COMMUNITIES[1],
    upvotes: 1240,
    comments: 342,
    timestamp: '2h ago',
    tags: ['Housing', 'Tax', 'Explainer'],
    verification: {
      status: 'VERIFIED',
      truthScore: 92,
      totalVotes: 150,
      breakdown: { true: 140, misleading: 5, outdated: 5 }
    },
    sentiment: { positive: 45, neutral: 30, negative: 25 }
  },
  {
    id: 'p2',
    type: PostType.PROMISE_TRACK,
    title: 'Promise Update: Wi-Fi Hotspots in Market Centers',
    content: 'The promise to install 25,000 hotspots is currently 15% complete. See the map below for new installations in Nyeri.',
    mediaUrl: 'https://images.unsplash.com/photo-1517430816045-df4b7de8db2b?auto=format&fit=crop&q=80&w=600&h=400',
    author: {
      id: 'g1',
      username: 'ICTMinistry',
      isVerified: true,
      isOfficial: true,
      karma: 8000,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100',
      title: 'Ministry Official'
    },
    community: MOCK_COMMUNITIES[0],
    upvotes: 890,
    comments: 156,
    timestamp: '4h ago',
    tags: ['Digital', 'Infrastructure'],
    reference: 'pr/PromiseID2022-55',
    verification: {
      status: 'DISPUTED',
      truthScore: 65,
      totalVotes: 230,
      breakdown: { true: 100, misleading: 120, outdated: 10 }
    },
    sentiment: { positive: 20, neutral: 20, negative: 60 }
  },
  {
    id: 'p3',
    type: PostType.DISCUSSION,
    title: 'Nairobi Drainage System - Why are we still flooding?',
    content: 'We need to discuss the allocation of the emergency funds from the last fiscal year. I walked through CBD today and it is impassable. Where is the accountability for the contractors listed in p/NairobiExpressway drainage integration?',
    author: {
      id: 'u2',
      username: 'CityWalker',
      isVerified: false,
      isOfficial: false,
      karma: 120,
      avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100&h=100'
    },
    community: MOCK_COMMUNITIES[0],
    upvotes: 2100,
    comments: 560,
    timestamp: '5h ago',
    tags: ['Infrastructure', 'Nairobi', 'Floods'],
    verification: {
      status: 'PENDING',
      truthScore: 50,
      totalVotes: 12,
      breakdown: { true: 6, misleading: 0, outdated: 6 }
    },
    sentiment: { positive: 5, neutral: 10, negative: 85 }
  },
  {
    id: 'p4',
    type: PostType.DISCUSSION,
    title: 'Garbage Collection Schedule in Utawala',
    content: 'Does anyone have the updated garbage collection schedule for Utawala Ward? The truck hasn’t come for two weeks and I want to organize a community cleanup if the county doesn\'t respond.',
    author: CURRENT_USER,
    community: MOCK_COMMUNITIES[0],
    upvotes: 45,
    comments: 12,
    timestamp: '1d ago',
    tags: ['Sanitation', 'Utawala', 'CommunityAction'],
    verification: {
      status: 'VERIFIED',
      truthScore: 98,
      totalVotes: 20,
      breakdown: { true: 20, misleading: 0, outdated: 0 }
    },
    sentiment: { positive: 10, neutral: 20, negative: 70 }
  }
];

export const CIVIC_ACTIONS: CivicAction[] = [
  {
    id: 'a1',
    title: 'Report Pothole',
    description: 'Geo-tagged report sent directly to County Roads Dept.',
    type: 'WARD',
    icon: 'road',
    status: 'OPEN'
  },
  {
    id: 'a2',
    title: 'Bursary Application',
    description: 'Apply for NG-CDF bursary for next term.',
    type: 'CONSTITUENCY',
    icon: 'graduation-cap',
    status: 'OPEN',
    deadline: 'Oct 30'
  },
  {
    id: 'a3',
    title: 'Budget Simulator',
    description: 'Submit your proposal for County Fiscal Strategy Paper.',
    type: 'COUNTY',
    icon: 'pie-chart',
    status: 'IN_PROGRESS'
  },
  {
    id: 'a4',
    title: 'Bill Tracker',
    description: 'Voice your view on the Finance Bill 2025.',
    type: 'NATIONAL',
    icon: 'scroll',
    status: 'OPEN'
  }
];

// --- New Community/Discord Data ---

const COMMON_CHANNELS: Channel[] = [
  { id: 'ch_announcements', name: 'announcements', type: 'TEXT', categoryId: 'INFO' },
  { id: 'ch_guidelines', name: 'guidelines', type: 'TEXT', categoryId: 'INFO' },
  { id: 'ch_leaders', name: 'our-leaders', type: 'LEADERS', categoryId: 'MONITORING', description: 'Track your elected officials' },
  { id: 'ch_promises', name: 'promises-watch', type: 'PROMISES', categoryId: 'MONITORING', description: 'UGC Promise Tracker' },
  { id: 'ch_projects', name: 'projects-watch', type: 'PROJECTS', categoryId: 'MONITORING', description: 'UGC Project Monitor' },
  { id: 'ch_budget', name: 'budget-watch', type: 'TEXT', categoryId: 'MONITORING' },
  { id: 'ch_general', name: 'general-chat', type: 'TEXT', categoryId: 'ENGAGEMENT' },
  { id: 'ch_events', name: 'community-events', type: 'TEXT', categoryId: 'ENGAGEMENT' },
  { id: 'ch_issues', name: 'report-issue', type: 'TEXT', categoryId: 'ENGAGEMENT' },
  { id: 'ch_voice_townhall', name: 'Town Hall', type: 'VOICE', categoryId: 'ENGAGEMENT' },
];

export const MOCK_HIERARCHY: CommunityLevel[] = [
  {
    id: 'lvl_county',
    type: 'COUNTY',
    name: 'Nairobi County',
    icon: '🏢',
    leaders: [
      { id: 'l1', name: 'Johnson Sakaja', role: 'Governor', party: 'UDA', avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=100&h=100', status: 'ONLINE', approvalRating: 65 },
      { id: 'l2', name: 'Edwin Sifuna', role: 'Senator', party: 'ODM', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=100&h=100', status: 'BUSY', approvalRating: 72 },
      { id: 'l3', name: 'Esther Passaris', role: 'Woman Rep', party: 'ODM', avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100&h=100', status: 'OFFLINE', approvalRating: 58 },
    ],
    channels: COMMON_CHANNELS
  },
  {
    id: 'lvl_constituency',
    type: 'CONSTITUENCY',
    name: 'Embakasi East',
    icon: '🗳️',
    leaders: [
      { id: 'l4', name: 'Babu Owino', role: 'Member of Parliament', party: 'ODM', avatarUrl: 'https://images.unsplash.com/photo-1618077360395-f3068be8e001?auto=format&fit=crop&q=80&w=100&h=100', status: 'ONLINE', approvalRating: 78 }
    ],
    channels: COMMON_CHANNELS
  },
  {
    id: 'lvl_ward',
    type: 'WARD',
    name: 'Utawala Ward',
    icon: '🏘️',
    leaders: [
      { id: 'l5', name: 'Patrick Karani', role: 'MCA', party: 'UDA', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100', status: 'ONLINE', approvalRating: 60 }
    ],
    channels: COMMON_CHANNELS
  }
];

export const MOCK_MESSAGES: CommunityMessage[] = [
  { id: 'm1', author: CURRENT_USER, content: 'Has anyone seen the new schedule for garbage collection?', timestamp: 'Today at 10:42 AM', upvotes: 2 },
  { id: 'm2', author: { ...CURRENT_USER, username: 'MamaBoga_1', id: 'u3', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100&h=100' }, content: 'Yes, it was posted in #announcements yesterday. They moved it to Tuesdays.', timestamp: 'Today at 10:45 AM', upvotes: 5 },
  { id: 'm3', author: { ...CURRENT_USER, username: 'YouthLeader_KE', id: 'u4', isVerified: true, avatarUrl: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&q=80&w=100&h=100' }, content: 'Don\'t forget the Town Hall meeting this Friday regarding the new road project!', timestamp: 'Today at 11:00 AM', upvotes: 12 },
];

// --- UGC Mock Data ---

export const MOCK_PROJECTS: CivicProject[] = [
  {
    id: 'proj1',
    title: 'Utawala Ring Road Expansion',
    description: 'Expansion of the eastern bypass ring road to dual carriage way. Currently stalled at section B.',
    status: 'STALLED',
    budget: 'KES 500M',
    location: 'Embakasi East - Utawala',
    imageUrl: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ce2ac6?auto=format&fit=crop&q=80&w=600&h=400',
    submittedBy: CURRENT_USER,
    verification: {
      status: 'VERIFIED',
      truthScore: 88,
      totalVotes: 342,
      breakdown: { true: 300, misleading: 20, outdated: 22 }
    },
    sentiment: { positive: 10, neutral: 20, negative: 70 },
    lastUpdated: '2 days ago'
  },
  {
    id: 'proj2',
    title: 'Community Water Dispenser',
    description: 'Installation of automated water dispensers at the market entrance.',
    status: 'COMPLETED',
    budget: 'KES 2M',
    location: 'Utawala Market',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600&h=400',
    submittedBy: { ...CURRENT_USER, username: 'WaterWatch', id: 'u5' },
    verification: {
      status: 'VERIFIED',
      truthScore: 98,
      totalVotes: 89,
      breakdown: { true: 89, misleading: 0, outdated: 0 }
    },
    sentiment: { positive: 95, neutral: 5, negative: 0 },
    lastUpdated: '1 week ago'
  }
];

export const MOCK_PROMISES: CampaignPromise[] = [
  {
    id: 'prom1',
    title: 'School Feeding Program',
    description: 'Ensure every public primary school child gets a hot meal at lunch.',
    politicianId: 'l1',
    politicianName: 'Johnson Sakaja',
    status: 'IN_PROGRESS',
    submittedBy: { ...CURRENT_USER, username: 'EduMonitor', id: 'u6' },
    dueDate: 'Dec 2025',
    timestamp: '2 weeks ago',
    verification: {
      status: 'DISPUTED',
      truthScore: 60,
      totalVotes: 500,
      breakdown: { true: 250, misleading: 200, outdated: 50 }
    },
    sentiment: { positive: 60, neutral: 10, negative: 30 }
  },
  {
    id: 'prom2',
    title: 'Reduce Business Permit Fees',
    description: 'Slash single business permit fees by 30% for SMEs.',
    politicianId: 'l1',
    politicianName: 'Johnson Sakaja',
    status: 'BROKEN',
    submittedBy: CURRENT_USER,
    dueDate: 'Jan 2024',
    timestamp: '3 days ago',
    verification: {
      status: 'VERIFIED',
      truthScore: 95,
      totalVotes: 1200,
      breakdown: { true: 1150, misleading: 30, outdated: 20 }
    },
    sentiment: { positive: 5, neutral: 5, negative: 90 }
  }
];

export const MOCK_COMMENTS: Comment[] = [
  {
    id: 'com1',
    postId: 'p1',
    postTitle: 'Understanding the new Housing Levy 🏠',
    author: CURRENT_USER,
    content: 'Thanks for this breakdown! Is there a link to the official gazette notice?',
    timestamp: '1h ago',
    upvotes: 15
  },
  {
    id: 'com2',
    postId: 'p3',
    postTitle: 'Nairobi Drainage System',
    author: CURRENT_USER,
    content: 'I agree. We need to audit the funds allocated to the maintenance department.',
    timestamp: '4h ago',
    upvotes: 8
  }
];

export const MOCK_USER_ACTIONS: UserAction[] = [
  {
    id: 'act1',
    type: 'VERIFY_POST',
    description: 'Verified accuracy of "Housing Levy Explainer"',
    targetId: 'p1',
    targetName: 'Housing Levy Explainer',
    timestamp: '2h ago',
    user: CURRENT_USER
  },
  {
    id: 'act2',
    type: 'JOIN_COMMUNITY',
    description: 'Joined c/BudgetWatch',
    targetId: 'c3',
    targetName: 'c/BudgetWatch',
    timestamp: '5 days ago',
    user: CURRENT_USER
  },
  {
    id: 'act3',
    type: 'SUBMIT_REPORT',
    description: 'Reported issue "Blocked Drainage" in Utawala Ward',
    targetId: 'issue_123',
    targetName: 'Blocked Drainage',
    timestamp: '1 week ago',
    user: CURRENT_USER
  }
];