export enum PostType {
  CIVIC_CLIP = 'CIVIC_CLIP',
  DISCUSSION = 'DISCUSSION',
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  PROMISE_TRACK = 'PROMISE_TRACK'
}

export interface User {
  id: string;
  username: string;
  isVerified: boolean; // u/ vs w/
  isOfficial: boolean; // g/
  karma: number;
  avatarUrl: string;
  title?: string;
  badges?: string[];
  bio?: string;
  joinDate?: string;
  location?: string;
}

export interface Community {
  id: string;
  name: string; // e.g. "NairobiCounty"
  prefix: string; // "c/"
  members: number;
}

export type VerificationStatus = 'VERIFIED' | 'DISPUTED' | 'DEBUNKED' | 'PENDING';

export interface Verification {
  status: VerificationStatus;
  truthScore: number; // 0 to 100
  totalVotes: number;
  breakdown: {
    true: number;
    misleading: number;
    outdated: number;
  };
}

export interface Sentiment {
  positive: number;
  neutral: number;
  negative: number;
}

export interface Post {
  id: string;
  type: PostType;
  title: string;
  content: string; // Text content or description
  mediaUrl?: string; // Video or Image URL
  author: User;
  community: Community;
  upvotes: number;
  comments: number;
  timestamp: string;
  tags: string[];
  reference?: string; // e.g., p/ThikaSuperhighway or pr/Promise123
  verification?: Verification;
  sentiment?: Sentiment;
}

export interface Comment {
  id: string;
  postId: string;
  postTitle: string;
  author: User;
  content: string;
  timestamp: string;
  upvotes: number;
}

export interface UserAction {
  id: string;
  type: 'JOIN_COMMUNITY' | 'VERIFY_POST' | 'VOTE_POLL' | 'SUBMIT_REPORT' | 'ATTEND_EVENT';
  description: string;
  targetId?: string; // ID of the community, post, etc.
  targetName?: string;
  timestamp: string;
  user: User;
}

export interface CivicAction {
  id: string;
  title: string;
  description: string;
  type: 'WARD' | 'CONSTITUENCY' | 'COUNTY' | 'NATIONAL';
  icon: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  deadline?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// --- New Community/Discord Features ---

export type HierarchyType = 'COUNTY' | 'CONSTITUENCY' | 'WARD';

export interface Leader {
  id: string;
  name: string;
  role: string;
  party: string;
  avatarUrl: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  approvalRating?: number;
}

export interface Channel {
  id: string;
  name: string;
  type: 'TEXT' | 'VOICE' | 'LEADERS' | 'PROJECTS' | 'PROMISES';
  categoryId: 'INFO' | 'MONITORING' | 'ENGAGEMENT';
  description?: string;
}

export interface CommunityLevel {
  id: string;
  type: HierarchyType;
  name: string;
  icon: string; // Emoji or URL
  leaders: Leader[];
  channels: Channel[];
}

export interface CommunityMessage {
  id: string;
  author: User;
  content: string;
  timestamp: string;
  upvotes: number;
}

// --- UGC Specific Types ---

export interface CivicProject {
  id: string;
  title: string;
  description: string;
  status: 'PROPOSED' | 'STALLED' | 'ACTIVE' | 'COMPLETED';
  budget: string;
  location: string;
  imageUrl?: string;
  submittedBy: User;
  verification: Verification;
  sentiment: Sentiment;
  lastUpdated: string;
}

export interface CampaignPromise {
  id: string;
  title: string;
  description: string;
  politicianId: string; // ID of the leader
  politicianName?: string; // Denormalized for display
  status: 'KEPT' | 'BROKEN' | 'IN_PROGRESS' | 'COMPROMISED';
  submittedBy: User;
  verification: Verification;
  sentiment: Sentiment;
  dueDate?: string;
  timestamp: string; // Created date
}