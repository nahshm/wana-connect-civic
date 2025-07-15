export interface Community {
  id: string;
  name: string;
  displayName: string;
  description: string;
  memberCount: number;
  category: 'governance' | 'civic-education' | 'accountability' | 'discussion';
  isFollowing?: boolean;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: User;
  community: Community;
  createdAt: Date;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  userVote?: 'up' | 'down' | null;
  tags: string[];
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  postId: string;
  parentId?: string;
  createdAt: Date;
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down' | null;
  replies?: Comment[];
  depth: number;
  isCollapsed: boolean;
  moderationStatus: 'pending' | 'approved' | 'removed';
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  isVerified?: boolean;
  role?: 'citizen' | 'official' | 'expert' | 'journalist';
}