import { useState, useEffect } from 'react';
import { Community, Post } from '@/types';

// Mock data for MVP
const mockCommunities: Community[] = [
  {
    id: 'kenya-parliament',
    name: 'kenya-parliament',
    displayName: 'Kenya Parliament',
    description: 'Discussions about parliamentary proceedings, bills, and legislative accountability',
    memberCount: 12500,
    category: 'governance',
    isFollowing: true
  },
  {
    id: 'county-governors',
    name: 'county-governors',
    displayName: 'County Governors',
    description: 'Track county-level governance and development projects',
    memberCount: 8900,
    category: 'accountability',
    isFollowing: false
  },
  {
    id: 'civic-education',
    name: 'civic-education',
    displayName: 'Civic Education',
    description: 'Learn about your rights, responsibilities, and how government works',
    memberCount: 15200,
    category: 'civic-education',
    isFollowing: true
  },
  {
    id: 'budget-transparency',
    name: 'budget-transparency',
    displayName: 'Budget Transparency',
    description: 'Analyzing government spending and budget allocation',
    memberCount: 6700,
    category: 'accountability',
    isFollowing: false
  }
];

const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Analysis: New Education Budget Allocation for 2024',
    content: 'The recently passed education budget shows a 15% increase in funding for primary schools. Here\'s what this means for rural communities...',
    author: {
      id: 'user1',
      username: 'education_analyst',
      displayName: 'Education Analyst Kenya',
      isVerified: true,
      role: 'expert'
    },
    community: mockCommunities[0],
    createdAt: new Date('2024-01-10T10:30:00'),
    upvotes: 245,
    downvotes: 12,
    commentCount: 34,
    userVote: null,
    tags: ['education', 'budget', 'analysis']
  },
  {
    id: '2',
    title: 'Question: How do I track my county\'s development projects?',
    content: 'I want to monitor the road construction project promised in my area. What tools or processes can I use to get updates?',
    author: {
      id: 'user2',
      username: 'concerned_citizen',
      displayName: 'Concerned Citizen',
      role: 'citizen'
    },
    community: mockCommunities[1],
    createdAt: new Date('2024-01-09T14:15:00'),
    upvotes: 89,
    downvotes: 3,
    commentCount: 18,
    userVote: 'up',
    tags: ['county', 'development', 'tracking']
  }
];

export const useCommunityData = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCommunities(mockCommunities);
      setPosts(mockPosts);
      setLoading(false);
    };

    loadData();
  }, []);

  const toggleCommunityFollow = (communityId: string) => {
    setCommunities(prev => 
      prev.map(community => 
        community.id === communityId 
          ? { ...community, isFollowing: !community.isFollowing }
          : community
      )
    );
  };

  const voteOnPost = (postId: string, vote: 'up' | 'down') => {
    setPosts(prev => 
      prev.map(post => {
        if (post.id === postId) {
          const currentVote = post.userVote;
          let upvotes = post.upvotes;
          let downvotes = post.downvotes;
          let newVote: 'up' | 'down' | null = vote;

          // Remove previous vote
          if (currentVote === 'up') upvotes--;
          if (currentVote === 'down') downvotes--;

          // If clicking same vote, remove it
          if (currentVote === vote) {
            newVote = null;
          } else {
            // Add new vote
            if (vote === 'up') upvotes++;
            if (vote === 'down') downvotes++;
          }

          return { ...post, upvotes, downvotes, userVote: newVote };
        }
        return post;
      })
    );
  };

  return {
    communities,
    posts,
    loading,
    toggleCommunityFollow,
    voteOnPost
  };
};