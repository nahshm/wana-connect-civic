/**
 * @fileoverview Unified Feed Item Component
 * @module components/feed
 * 
 * Master component that renders the appropriate card type based on feed item type.
 * This is the core of the "National Town Hall" experience - showing all types
 * of civic activities in a single, unified feed.
 */

import React from 'react';
import { PostCard } from '@/components/posts/PostCard';
import { ProjectFeedCard } from '@/components/feed/ProjectFeedCard';
import { PromiseFeedCard } from '@/components/feed/PromiseFeedCard';
import { ClipPreviewCard } from '@/components/feed/ClipPreviewCard';
import { ActivityNoticeCard } from '@/components/feed/ActivityNoticeCard';
// import { AchievementCard } from '@/components/feed/AchievementCard';

// ============================================================================
// TYPES
// ============================================================================

export type FeedItemType =
  | 'post'
  | 'project'
  | 'promise'
  | 'clip'
  | 'post_created'
  | 'project_submitted'
  | 'project_verified'
  | 'promise_tracked'
  | 'community_joined'
  | 'community_created'
  | 'clip_uploaded'
  | 'issue_reported'
  | 'official_claimed'
  | 'achievement_earned'
  | 'quest_completed';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  user_id: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
  data: any;
}

interface UnifiedFeedItemProps {
  item: FeedItem;
  onInteraction?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * UnifiedFeedItem - Routes feed items to the appropriate card component
 * 
 * This is the "switcher" that makes the unified feed work. It examines the
 * item type and renders the correct card component with proper styling.
 * 
 * Card Types:
 * - PostCard: Standard posts (text, link, media, poll)
 * - ProjectFeedCard: Project submissions
 * - PromiseFeedCard: Promise tracking updates
 * - ClipPreviewCard: Civic Clips (video content)
 * - ActivityNoticeCard: User actions (joins, verifications)
 * - AchievementCard: Quest completions, achievements
 */
export function UnifiedFeedItem({ item, onInteraction }: UnifiedFeedItemProps) {
  // Silently filter out hidden activity types (logged for analytics, not shown in feed)
  const hiddenTypes = ['post_created', 'comment_created', 'vote_cast', 'community_joined', 'issue_reported', 'clip_uploaded', 'promise_tracked', 'project_submitted'];
  if (hiddenTypes.includes(item.type)) return null;

  // Standard post content
  if (item.type === 'post') {
    // Map RPC data to Post interface
    const postData = {
      ...item.data,
      author: {
        id: item.user_id,
        username: item.username,
        displayName: item.username, // Fallback since RPC doesn't separate them yet
        avatar: item.avatar_url,
        isVerified: false, // Defaulting for now
        officialPosition: null
      },
      community: item.data.community_id ? {
        id: item.data.community_id,
        name: item.data.community_name,
        avatarUrl: item.data.community_icon || item.data.avatar_url,
        displayName: item.data.community_name,
        memberCount: 0 // Placeholder
      } : undefined,
      createdAt: item.created_at,
      upvotes: item.data.upvote_count || 0,
      downvotes: item.data.downvote_count || 0,
      commentCount: item.data.comment_count || 0,
      tags: [], // Default empty
      media: item.data.media || [], // Map media from RPC
      link_url: item.data.link_url || null,
      link_title: item.data.link_title || null,
      link_description: item.data.link_description || null,
      link_image: item.data.link_image || null,
    };

    return (
      <PostCard 
        post={postData} 
        onVote={onInteraction}
      />
    );
  }

  // Project submission
  if (item.type === 'project' || item.type === 'project_submitted') {
    return (
      <ProjectFeedCard 
        project={item.data}
        onClick={onInteraction}
      />
    );
  }

  // Promise tracking/updates
  if (item.type === 'promise' || item.type === 'promise_tracked') {
    return (
      <PromiseFeedCard 
        promise={item.data}
        onClick={onInteraction}
      />
    );
  }

  // Civic Clip video content
  if (item.type === 'clip' || item.type === 'clip_uploaded') {
    return (
      <ClipPreviewCard 
        clip={item.data}
        onClick={onInteraction}
      />
    );
  }

  // Quest completions and achievements
  /*
  if (item.type === 'achievement_earned' || item.type === 'quest_completed') {
    return (
      <AchievementCard 
        achievement={item.data}
        onClick={onInteraction}
      />
    );
  }
  */

  // High-value activity notices only (per Feed Strategy doc)
  // Low-value activities (community_joined, issue_reported) are logged for analytics but hidden from feed
  const activityTypes: FeedItemType[] = [
    // 'post_created', // Redundant - posts appear as PostCards
    'project_verified',   // Accountability milestone
    // 'community_joined', // Low value - too noisy
    'community_created',  // Rare, high-impact event
    // 'issue_reported', // Internal tracking only
    'official_claimed'    // High-impact civic event
  ];

  if (activityTypes.includes(item.type)) {
    return (
      <ActivityNoticeCard 
        activity={{
          ...item.data,
          activity_type: item.type,
          username: item.username,
          avatar_url: item.avatar_url
        }}
        onClick={onInteraction}
      />
    );
  }

  // Fallback for unknown types (shouldn't happen in production)
  console.warn('[UnifiedFeedItem] Unknown feed item type:', item.type);
  return null;
}

/**
 * Feed item skeleton loader
 */
export function UnifiedFeedItemSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 bg-muted rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-muted rounded w-32 mb-2" />
          <div className="h-3 bg-muted rounded w-24" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-3/4" />
      </div>
    </div>
  );
}

/**
 * Empty feed state
 */
export function EmptyFeedState() {
  return (
    <div className="text-center py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🏛️</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
        <p className="text-muted-foreground text-sm mb-6">
          Be the first to contribute to your community! Post an update, report an issue,
          or submit a project to get started.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/create"
            className="inline-flex items-center justify-center px-4 py-2 bg-civic-green text-white rounded-md hover:bg-civic-green/90 transition-colors"
          >
            Create Post
          </a>
          <a
            href="/report-issue"
            className="inline-flex items-center justify-center px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
          >
            Report Issue
          </a>
        </div>
      </div>
    </div>
  );
}
