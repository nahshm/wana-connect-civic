export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          read_by: string[] | null
          recipient_role: string
          severity: string | null
          title: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          read_by?: string[] | null
          recipient_role: string
          severity?: string | null
          title: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_by?: string[] | null
          recipient_role?: string
          severity?: string | null
          title?: string
        }
        Relationships: []
      }
      anonymous_reports: {
        Row: {
          assigned_to: string | null
          category: string
          constituency_id: string | null
          county_id: string | null
          created_at: string | null
          encrypted_content: string
          escalated_at: string | null
          escalated_to: string[] | null
          evidence_count: number | null
          id: string
          is_identity_protected: boolean | null
          location_text: string | null
          report_id: string
          risk_score: number | null
          severity: string
          status: string
          title: string | null
          updated_at: string | null
          ward_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category: string
          constituency_id?: string | null
          county_id?: string | null
          created_at?: string | null
          encrypted_content: string
          escalated_at?: string | null
          escalated_to?: string[] | null
          evidence_count?: number | null
          id?: string
          is_identity_protected?: boolean | null
          location_text?: string | null
          report_id: string
          risk_score?: number | null
          severity?: string
          status?: string
          title?: string | null
          updated_at?: string | null
          ward_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          constituency_id?: string | null
          county_id?: string | null
          created_at?: string | null
          encrypted_content?: string
          escalated_at?: string | null
          escalated_to?: string[] | null
          evidence_count?: number | null
          id?: string
          is_identity_protected?: boolean | null
          location_text?: string | null
          report_id?: string
          risk_score?: number | null
          severity?: string
          status?: string
          title?: string | null
          updated_at?: string | null
          ward_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_reports_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anonymous_reports_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anonymous_reports_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          points_reward: number | null
          requirements: Json
          tier: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points_reward?: number | null
          requirements: Json
          tier?: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_reward?: number | null
          requirements?: Json
          tier?: string
        }
        Relationships: []
      }
      campaign_promises: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          politician_id: string
          politician_name: string | null
          sentiment_id: string | null
          status: string
          submitted_by: string
          title: string
          updated_at: string | null
          verification_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          politician_id: string
          politician_name?: string | null
          sentiment_id?: string | null
          status?: string
          submitted_by: string
          title: string
          updated_at?: string | null
          verification_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          politician_id?: string
          politician_name?: string | null
          sentiment_id?: string | null
          status?: string
          submitted_by?: string
          title?: string
          updated_at?: string | null
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_promises_politician_id_fkey"
            columns: ["politician_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_promises_sentiment_id_fkey"
            columns: ["sentiment_id"]
            isOneToOne: false
            referencedRelation: "sentiment_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_promises_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_submissions: {
        Row: {
          challenge_id: string
          id: string
          rank: number | null
          status: string | null
          submission: Json
          submitted_at: string | null
          user_id: string
          votes: number | null
        }
        Insert: {
          challenge_id: string
          id?: string
          rank?: number | null
          status?: string | null
          submission: Json
          submitted_at?: string | null
          user_id: string
          votes?: number | null
        }
        Update: {
          challenge_id?: string
          id?: string
          rank?: number | null
          status?: string | null
          submission?: Json
          submitted_at?: string | null
          user_id?: string
          votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_votes: {
        Row: {
          id: string
          submission_id: string
          user_id: string
          voted_at: string | null
        }
        Insert: {
          id?: string
          submission_id: string
          user_id: string
          voted_at?: string | null
        }
        Update: {
          id?: string
          submission_id?: string
          user_id?: string
          voted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_votes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "challenge_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          banner_url: string | null
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          reward_description: string | null
          reward_points: number | null
          rules: Json | null
          start_date: string
          status: string | null
          title: string
          voting_end_date: string | null
        }
        Insert: {
          banner_url?: string | null
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          reward_description?: string | null
          reward_points?: number | null
          rules?: Json | null
          start_date: string
          status?: string | null
          title: string
          voting_end_date?: string | null
        }
        Update: {
          banner_url?: string | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          reward_description?: string | null
          reward_points?: number | null
          rules?: Json | null
          start_date?: string
          status?: string | null
          title?: string
          voting_end_date?: string | null
        }
        Relationships: []
      }
      channels: {
        Row: {
          category: string | null
          community_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_private: boolean | null
          name: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          community_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          name: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          community_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          name?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channels_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel_id: string | null
          content: string
          created_at: string | null
          id: string
          room_id: string | null
          sender_id: string | null
          updated_at: string | null
        }
        Insert: {
          channel_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          room_id?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Update: {
          channel_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          room_id?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          joined_at: string | null
          last_read_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string | null
          last_read_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          joined_at?: string | null
          last_read_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      civic_action_supporters: {
        Row: {
          action_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_action_supporters_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "civic_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_action_supporters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_action_updates: {
        Row: {
          action_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          new_status: string | null
          previous_status: string | null
          user_id: string | null
        }
        Insert: {
          action_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          new_status?: string | null
          previous_status?: string | null
          user_id?: string | null
        }
        Update: {
          action_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          new_status?: string | null
          previous_status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_action_updates_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "civic_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_action_updates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_actions: {
        Row: {
          action_level: string
          action_type: string
          assigned_to: string | null
          case_number: string | null
          category: string
          constituency_id: string | null
          county_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          latitude: number | null
          location_text: string | null
          longitude: number | null
          media_urls: string[] | null
          status: string | null
          support_count: number | null
          title: string
          updated_at: string | null
          upvotes: number | null
          urgency: string | null
          user_id: string | null
          ward_id: string | null
        }
        Insert: {
          action_level?: string
          action_type?: string
          assigned_to?: string | null
          case_number?: string | null
          category: string
          constituency_id?: string | null
          county_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          latitude?: number | null
          location_text?: string | null
          longitude?: number | null
          media_urls?: string[] | null
          status?: string | null
          support_count?: number | null
          title: string
          updated_at?: string | null
          upvotes?: number | null
          urgency?: string | null
          user_id?: string | null
          ward_id?: string | null
        }
        Update: {
          action_level?: string
          action_type?: string
          assigned_to?: string | null
          case_number?: string | null
          category?: string
          constituency_id?: string | null
          county_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          latitude?: number | null
          location_text?: string | null
          longitude?: number | null
          media_urls?: string[] | null
          status?: string | null
          support_count?: number | null
          title?: string
          updated_at?: string | null
          upvotes?: number | null
          urgency?: string | null
          user_id?: string | null
          ward_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_actions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_actions_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_actions_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_actions_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_clip_variants: {
        Row: {
          bitrate: number | null
          clip_id: string | null
          created_at: string | null
          file_size: number | null
          id: string
          quality: string
          video_url: string
        }
        Insert: {
          bitrate?: number | null
          clip_id?: string | null
          created_at?: string | null
          file_size?: number | null
          id?: string
          quality: string
          video_url: string
        }
        Update: {
          bitrate?: number | null
          clip_id?: string | null
          created_at?: string | null
          file_size?: number | null
          id?: string
          quality?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "civic_clip_variants_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "civic_clips"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_clip_views: {
        Row: {
          clip_id: string | null
          completed: boolean | null
          device_type: string | null
          id: string
          user_id: string | null
          viewed_at: string | null
          watch_duration: number
          watch_percentage: number | null
        }
        Insert: {
          clip_id?: string | null
          completed?: boolean | null
          device_type?: string | null
          id?: string
          user_id?: string | null
          viewed_at?: string | null
          watch_duration: number
          watch_percentage?: number | null
        }
        Update: {
          clip_id?: string | null
          completed?: boolean | null
          device_type?: string | null
          id?: string
          user_id?: string | null
          viewed_at?: string | null
          watch_duration?: number
          watch_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_clip_views_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "civic_clips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_clip_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_clips: {
        Row: {
          aspect_ratio: string | null
          average_watch_percentage: number | null
          captions_url: string | null
          category: string | null
          civic_reference_id: string | null
          civic_type: string | null
          created_at: string | null
          duration: number | null
          featured_at: string | null
          featured_by: string | null
          file_size: number | null
          format: string | null
          hashtags: string[] | null
          height: number | null
          id: string
          is_featured: boolean | null
          post_id: string | null
          processing_error: string | null
          processing_status: string | null
          quality: string | null
          thumbnail_url: string | null
          transcript: string | null
          updated_at: string | null
          video_url: string
          views_count: number | null
          watch_time_total: number | null
          width: number | null
        }
        Insert: {
          aspect_ratio?: string | null
          average_watch_percentage?: number | null
          captions_url?: string | null
          category?: string | null
          civic_reference_id?: string | null
          civic_type?: string | null
          created_at?: string | null
          duration?: number | null
          featured_at?: string | null
          featured_by?: string | null
          file_size?: number | null
          format?: string | null
          hashtags?: string[] | null
          height?: number | null
          id?: string
          is_featured?: boolean | null
          post_id?: string | null
          processing_error?: string | null
          processing_status?: string | null
          quality?: string | null
          thumbnail_url?: string | null
          transcript?: string | null
          updated_at?: string | null
          video_url: string
          views_count?: number | null
          watch_time_total?: number | null
          width?: number | null
        }
        Update: {
          aspect_ratio?: string | null
          average_watch_percentage?: number | null
          captions_url?: string | null
          category?: string | null
          civic_reference_id?: string | null
          civic_type?: string | null
          created_at?: string | null
          duration?: number | null
          featured_at?: string | null
          featured_by?: string | null
          file_size?: number | null
          format?: string | null
          hashtags?: string[] | null
          height?: number | null
          id?: string
          is_featured?: boolean | null
          post_id?: string | null
          processing_error?: string | null
          processing_status?: string | null
          quality?: string | null
          thumbnail_url?: string | null
          transcript?: string | null
          updated_at?: string | null
          video_url?: string
          views_count?: number | null
          watch_time_total?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_clips_featured_by_fkey"
            columns: ["featured_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_clips_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_interests: {
        Row: {
          category: string | null
          created_at: string | null
          display_name: string
          icon: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          display_name: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      comment_award_assignments: {
        Row: {
          award_id: string
          awarded_at: string
          awarded_by: string
          comment_id: string
          id: string
        }
        Insert: {
          award_id: string
          awarded_at?: string
          awarded_by: string
          comment_id: string
          id?: string
        }
        Update: {
          award_id?: string
          awarded_at?: string
          awarded_by?: string
          comment_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_award_assignments_award_id_fkey"
            columns: ["award_id"]
            isOneToOne: false
            referencedRelation: "comment_awards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_award_assignments_awarded_by_fkey"
            columns: ["awarded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_award_assignments_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_awards: {
        Row: {
          background_color: string
          category: string
          color: string
          created_at: string
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_enabled: boolean | null
          name: string
          points: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          background_color?: string
          category: string
          color?: string
          created_at?: string
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_enabled?: boolean | null
          name: string
          points?: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          background_color?: string
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          points?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      comment_flairs: {
        Row: {
          background_color: string
          category: string
          color: string
          created_at: string
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_enabled: boolean | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          background_color?: string
          category: string
          color?: string
          created_at?: string
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_enabled?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          background_color?: string
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      comment_media: {
        Row: {
          alt_text: string | null
          caption: string | null
          comment_id: string
          content_moderation_score: number | null
          created_at: string
          duration: number | null
          file_height: number | null
          file_path: string
          file_size: number
          file_type: string
          file_width: number | null
          filename: string
          id: string
          is_nsfw: boolean | null
          mime_type: string
          original_filename: string
          processing_error: string | null
          processing_status: string | null
          sort_order: number | null
          thumbnail_path: string | null
          updated_at: string
          upload_source: string | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          comment_id: string
          content_moderation_score?: number | null
          created_at?: string
          duration?: number | null
          file_height?: number | null
          file_path: string
          file_size: number
          file_type: string
          file_width?: number | null
          filename: string
          id?: string
          is_nsfw?: boolean | null
          mime_type: string
          original_filename: string
          processing_error?: string | null
          processing_status?: string | null
          sort_order?: number | null
          thumbnail_path?: string | null
          updated_at?: string
          upload_source?: string | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          comment_id?: string
          content_moderation_score?: number | null
          created_at?: string
          duration?: number | null
          file_height?: number | null
          file_path?: string
          file_size?: number
          file_type?: string
          file_width?: number | null
          filename?: string
          id?: string
          is_nsfw?: boolean | null
          mime_type?: string
          original_filename?: string
          processing_error?: string | null
          processing_status?: string | null
          sort_order?: number | null
          thumbnail_path?: string | null
          updated_at?: string
          upload_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_media_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_media_processing_log: {
        Row: {
          action: string
          created_at: string
          id: string
          media_id: string
          message: string | null
          metadata: Json | null
          status: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          media_id: string
          message?: string | null
          metadata?: Json | null
          status: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          media_id?: string
          message?: string | null
          metadata?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_media_processing_log_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "comment_media"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_moderation_log: {
        Row: {
          action: string
          comment_id: string
          created_at: string
          id: string
          metadata: Json | null
          moderator_id: string
          new_status: string | null
          previous_status: string | null
          reason: string | null
          toxicity_score: number | null
        }
        Insert: {
          action: string
          comment_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          moderator_id: string
          new_status?: string | null
          previous_status?: string | null
          reason?: string | null
          toxicity_score?: number | null
        }
        Update: {
          action?: string
          comment_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          moderator_id?: string
          new_status?: string | null
          previous_status?: string | null
          reason?: string | null
          toxicity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_moderation_log_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_moderation_log_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_notifications: {
        Row: {
          action_url: string | null
          comment_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          recipient_id: string
          title: string
        }
        Insert: {
          action_url?: string | null
          comment_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
          recipient_id: string
          title: string
        }
        Update: {
          action_url?: string | null
          comment_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          recipient_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_references: {
        Row: {
          comment_id: string
          context: string | null
          created_at: string
          id: string
          reference_id: string
          reference_title: string | null
          reference_type: string
          reference_url: string | null
        }
        Insert: {
          comment_id: string
          context?: string | null
          created_at?: string
          id?: string
          reference_id: string
          reference_title?: string | null
          reference_type: string
          reference_url?: string | null
        }
        Update: {
          comment_id?: string
          context?: string | null
          created_at?: string
          id?: string
          reference_id?: string
          reference_title?: string | null
          reference_type?: string
          reference_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_references_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          appeal_status: string | null
          author_id: string
          civic_tags: string[] | null
          content: string
          content_warnings: string[] | null
          created_at: string
          depth: number | null
          discussion_type: string | null
          downvotes: number | null
          fact_check_notes: string | null
          fact_check_status: string | null
          fact_check_timestamp: string | null
          fact_checker_id: string | null
          flair_id: string | null
          hidden_reason: string | null
          id: string
          is_collapsed: boolean | null
          is_hidden: boolean | null
          is_official_response: boolean | null
          moderation_reason: string | null
          moderation_status: string | null
          moderation_timestamp: string | null
          moderator_id: string | null
          official_verification_id: string | null
          parent_id: string | null
          post_id: string | null
          priority_level: string | null
          referenced_project_id: string | null
          referenced_promise_id: string | null
          search_vector: unknown
          sentiment_id: string | null
          toxicity_score: number | null
          updated_at: string
          upvotes: number | null
          verification_id: string | null
        }
        Insert: {
          appeal_status?: string | null
          author_id: string
          civic_tags?: string[] | null
          content: string
          content_warnings?: string[] | null
          created_at?: string
          depth?: number | null
          discussion_type?: string | null
          downvotes?: number | null
          fact_check_notes?: string | null
          fact_check_status?: string | null
          fact_check_timestamp?: string | null
          fact_checker_id?: string | null
          flair_id?: string | null
          hidden_reason?: string | null
          id?: string
          is_collapsed?: boolean | null
          is_hidden?: boolean | null
          is_official_response?: boolean | null
          moderation_reason?: string | null
          moderation_status?: string | null
          moderation_timestamp?: string | null
          moderator_id?: string | null
          official_verification_id?: string | null
          parent_id?: string | null
          post_id?: string | null
          priority_level?: string | null
          referenced_project_id?: string | null
          referenced_promise_id?: string | null
          search_vector?: unknown
          sentiment_id?: string | null
          toxicity_score?: number | null
          updated_at?: string
          upvotes?: number | null
          verification_id?: string | null
        }
        Update: {
          appeal_status?: string | null
          author_id?: string
          civic_tags?: string[] | null
          content?: string
          content_warnings?: string[] | null
          created_at?: string
          depth?: number | null
          discussion_type?: string | null
          downvotes?: number | null
          fact_check_notes?: string | null
          fact_check_status?: string | null
          fact_check_timestamp?: string | null
          fact_checker_id?: string | null
          flair_id?: string | null
          hidden_reason?: string | null
          id?: string
          is_collapsed?: boolean | null
          is_hidden?: boolean | null
          is_official_response?: boolean | null
          moderation_reason?: string | null
          moderation_status?: string | null
          moderation_timestamp?: string | null
          moderator_id?: string | null
          official_verification_id?: string | null
          parent_id?: string | null
          post_id?: string | null
          priority_level?: string | null
          referenced_project_id?: string | null
          referenced_promise_id?: string | null
          search_vector?: unknown
          sentiment_id?: string | null
          toxicity_score?: number | null
          updated_at?: string
          upvotes?: number | null
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_fact_checker_id_fkey"
            columns: ["fact_checker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_flair_id_fkey"
            columns: ["flair_id"]
            isOneToOne: false
            referencedRelation: "comment_flairs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_official_verification_id_fkey"
            columns: ["official_verification_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_referenced_project_id_fkey"
            columns: ["referenced_project_id"]
            isOneToOne: false
            referencedRelation: "government_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_referenced_promise_id_fkey"
            columns: ["referenced_promise_id"]
            isOneToOne: false
            referencedRelation: "development_promises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_sentiment_id_fkey"
            columns: ["sentiment_id"]
            isOneToOne: false
            referencedRelation: "sentiment_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          allow_post_flairs: boolean | null
          allow_user_flairs: boolean | null
          auto_moderate: boolean | null
          avatar_url: string | null
          banner_url: string | null
          category: string
          country: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_html: string | null
          display_name: string
          id: string
          is_mature: boolean | null
          is_nsfw: boolean | null
          is_verified: boolean | null
          location_type: string | null
          location_value: string | null
          member_count: number | null
          minimum_karma_to_post: number | null
          name: string
          region_type: string | null
          search_vector: unknown
          sensitivity_level: string | null
          sidebar_content: string | null
          submission_rules: string | null
          theme_color: string | null
          type: string | null
          updated_at: string
          visibility_type: string | null
        }
        Insert: {
          allow_post_flairs?: boolean | null
          allow_user_flairs?: boolean | null
          auto_moderate?: boolean | null
          avatar_url?: string | null
          banner_url?: string | null
          category: string
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_html?: string | null
          display_name: string
          id?: string
          is_mature?: boolean | null
          is_nsfw?: boolean | null
          is_verified?: boolean | null
          location_type?: string | null
          location_value?: string | null
          member_count?: number | null
          minimum_karma_to_post?: number | null
          name: string
          region_type?: string | null
          search_vector?: unknown
          sensitivity_level?: string | null
          sidebar_content?: string | null
          submission_rules?: string | null
          theme_color?: string | null
          type?: string | null
          updated_at?: string
          visibility_type?: string | null
        }
        Update: {
          allow_post_flairs?: boolean | null
          allow_user_flairs?: boolean | null
          auto_moderate?: boolean | null
          avatar_url?: string | null
          banner_url?: string | null
          category?: string
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_html?: string | null
          display_name?: string
          id?: string
          is_mature?: boolean | null
          is_nsfw?: boolean | null
          is_verified?: boolean | null
          location_type?: string | null
          location_value?: string | null
          member_count?: number | null
          minimum_karma_to_post?: number | null
          name?: string
          region_type?: string | null
          search_vector?: unknown
          sensitivity_level?: string | null
          sidebar_content?: string | null
          submission_rules?: string | null
          theme_color?: string | null
          type?: string | null
          updated_at?: string
          visibility_type?: string | null
        }
        Relationships: []
      }
      community_active_members: {
        Row: {
          community_id: string
          last_seen_at: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          last_seen_at?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          last_seen_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_active_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_active_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      community_bookmarks: {
        Row: {
          community_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          title: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          community_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          title: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          community_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          title?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_bookmarks_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_bookmarks_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      community_events: {
        Row: {
          community_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string | null
          id: string
          location_data: Json | null
          location_type: string | null
          start_time: string
          title: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          location_data?: Json | null
          location_type?: string | null
          start_time: string
          title: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          location_data?: Json | null
          location_type?: string | null
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_flairs: {
        Row: {
          background_color: string | null
          community_id: string
          created_at: string | null
          created_by: string | null
          flair_type: string | null
          id: string
          is_enabled: boolean | null
          name: string
          text_color: string | null
        }
        Insert: {
          background_color?: string | null
          community_id: string
          created_at?: string | null
          created_by?: string | null
          flair_type?: string | null
          id?: string
          is_enabled?: boolean | null
          name: string
          text_color?: string | null
        }
        Update: {
          background_color?: string | null
          community_id?: string
          created_at?: string | null
          created_by?: string | null
          flair_type?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          text_color?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_flairs_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_flairs_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_flairs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string | null
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          community_id?: string | null
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          community_id?: string | null
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_moderators: {
        Row: {
          added_at: string | null
          added_by: string | null
          community_id: string
          id: string
          is_temporary: boolean | null
          permissions: Json | null
          role: string | null
          term_expires_at: string | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          community_id: string
          id?: string
          is_temporary?: boolean | null
          permissions?: Json | null
          role?: string | null
          term_expires_at?: string | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          community_id?: string
          id?: string
          is_temporary?: boolean | null
          permissions?: Json | null
          role?: string | null
          term_expires_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_moderators_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_moderators_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_moderators_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_moderators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "community_polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_polls: {
        Row: {
          community_id: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          options: Json
          question: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          options: Json
          question: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_polls_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_polls_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_polls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_rules: {
        Row: {
          community_id: string
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          priority: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          community_id: string
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          priority?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          community_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          priority?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_rules_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_rules_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      constituencies: {
        Row: {
          county_id: string | null
          created_at: string | null
          id: string
          mp_id: string | null
          name: string
          population: number | null
        }
        Insert: {
          county_id?: string | null
          created_at?: string | null
          id?: string
          mp_id?: string | null
          name: string
          population?: number | null
        }
        Update: {
          county_id?: string | null
          created_at?: string | null
          id?: string
          mp_id?: string | null
          name?: string
          population?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "constituencies_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "constituencies_mp_id_fkey"
            columns: ["mp_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_ratings: {
        Row: {
          communication_rating: number | null
          contractor_id: string
          created_at: string | null
          id: string
          overall_rating: number
          professionalism_rating: number | null
          project_id: string | null
          quality_rating: number | null
          rater_id: string | null
          rater_name: string | null
          recommend: boolean | null
          review_text: string | null
          timeliness_rating: number | null
          updated_at: string | null
        }
        Insert: {
          communication_rating?: number | null
          contractor_id: string
          created_at?: string | null
          id?: string
          overall_rating: number
          professionalism_rating?: number | null
          project_id?: string | null
          quality_rating?: number | null
          rater_id?: string | null
          rater_name?: string | null
          recommend?: boolean | null
          review_text?: string | null
          timeliness_rating?: number | null
          updated_at?: string | null
        }
        Update: {
          communication_rating?: number | null
          contractor_id?: string
          created_at?: string | null
          id?: string
          overall_rating?: number
          professionalism_rating?: number | null
          project_id?: string | null
          quality_rating?: number | null
          rater_id?: string | null
          rater_name?: string | null
          recommend?: boolean | null
          review_text?: string | null
          timeliness_rating?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_ratings_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_ratings_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_ratings_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "public_contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_ratings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          average_rating: number | null
          blacklist_reason: string | null
          blacklisted: boolean | null
          company_type: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          is_verified: boolean | null
          name: string
          phone: string | null
          registration_number: string | null
          specialization: string[] | null
          total_projects_completed: number | null
          total_ratings: number | null
          updated_at: string | null
          verification_date: string | null
          website: string | null
          years_experience: number | null
        }
        Insert: {
          average_rating?: number | null
          blacklist_reason?: string | null
          blacklisted?: boolean | null
          company_type?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean | null
          name: string
          phone?: string | null
          registration_number?: string | null
          specialization?: string[] | null
          total_projects_completed?: number | null
          total_ratings?: number | null
          updated_at?: string | null
          verification_date?: string | null
          website?: string | null
          years_experience?: number | null
        }
        Update: {
          average_rating?: number | null
          blacklist_reason?: string | null
          blacklisted?: boolean | null
          company_type?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean | null
          name?: string
          phone?: string | null
          registration_number?: string | null
          specialization?: string[] | null
          total_projects_completed?: number | null
          total_ratings?: number | null
          updated_at?: string | null
          verification_date?: string | null
          website?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      counties: {
        Row: {
          country: string | null
          created_at: string | null
          id: string
          name: string
          population: number | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          id?: string
          name: string
          population?: number | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          id?: string
          name?: string
          population?: number | null
        }
        Relationships: []
      }
      country_governance_templates: {
        Row: {
          country_code: string
          country_name: string
          created_at: string | null
          flag_emoji: string | null
          governance_system: Json
          id: string
          is_verified: boolean | null
          submitted_by: string | null
          updated_at: string | null
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string | null
          flag_emoji?: string | null
          governance_system: Json
          id?: string
          is_verified?: boolean | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string | null
          flag_emoji?: string | null
          governance_system?: Json
          id?: string
          is_verified?: boolean | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "country_governance_templates_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crisis_reports: {
        Row: {
          anonymous_report_id: string | null
          created_at: string | null
          crisis_type: string
          description: string | null
          escalated_to_ngo: string[] | null
          evidence_urls: string[] | null
          id: string
          latitude: number | null
          location_text: string | null
          longitude: number | null
          report_id: string
          resolved_at: string | null
          resolved_by: string | null
          response_actions: Json | null
          severity: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          anonymous_report_id?: string | null
          created_at?: string | null
          crisis_type: string
          description?: string | null
          escalated_to_ngo?: string[] | null
          evidence_urls?: string[] | null
          id?: string
          latitude?: number | null
          location_text?: string | null
          longitude?: number | null
          report_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          response_actions?: Json | null
          severity?: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          anonymous_report_id?: string | null
          created_at?: string | null
          crisis_type?: string
          description?: string | null
          escalated_to_ngo?: string[] | null
          evidence_urls?: string[] | null
          id?: string
          latitude?: number | null
          location_text?: string | null
          longitude?: number | null
          report_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          response_actions?: Json | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crisis_reports_anonymous_report_id_fkey"
            columns: ["anonymous_report_id"]
            isOneToOne: false
            referencedRelation: "anonymous_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      development_promises: {
        Row: {
          actual_completion_date: string | null
          beneficiaries_count: number | null
          budget_allocated: number | null
          budget_used: number | null
          category: string | null
          contractor: string | null
          created_at: string
          description: string | null
          expected_completion_date: string | null
          funding_source: string | null
          id: string
          location: string | null
          official_id: string
          progress_percentage: number | null
          search_vector: unknown
          start_date: string | null
          status: Database["public"]["Enums"]["promise_status"]
          title: string
          updated_at: string
        }
        Insert: {
          actual_completion_date?: string | null
          beneficiaries_count?: number | null
          budget_allocated?: number | null
          budget_used?: number | null
          category?: string | null
          contractor?: string | null
          created_at?: string
          description?: string | null
          expected_completion_date?: string | null
          funding_source?: string | null
          id?: string
          location?: string | null
          official_id: string
          progress_percentage?: number | null
          search_vector?: unknown
          start_date?: string | null
          status?: Database["public"]["Enums"]["promise_status"]
          title: string
          updated_at?: string
        }
        Update: {
          actual_completion_date?: string | null
          beneficiaries_count?: number | null
          budget_allocated?: number | null
          budget_used?: number | null
          category?: string | null
          contractor?: string | null
          created_at?: string
          description?: string | null
          expected_completion_date?: string | null
          funding_source?: string | null
          id?: string
          location?: string | null
          official_id?: string
          progress_percentage?: number | null
          search_vector?: unknown
          start_date?: string | null
          status?: Database["public"]["Enums"]["promise_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "development_promises_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
      election_cycles: {
        Row: {
          created_at: string | null
          declared_candidates: Json | null
          election_date: string
          election_type: string | null
          id: string
          position_id: string | null
          results_certified: boolean | null
          winner_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          declared_candidates?: Json | null
          election_date: string
          election_type?: string | null
          id?: string
          position_id?: string | null
          results_certified?: boolean | null
          winner_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          declared_candidates?: Json | null
          election_date?: string
          election_type?: string | null
          id?: string
          position_id?: string | null
          results_certified?: boolean | null
          winner_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "election_cycles_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "government_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "election_cycles_winner_user_id_fkey"
            columns: ["winner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      governance_hierarchies: {
        Row: {
          country: string
          created_at: string | null
          id: string
          level_1_name: string | null
          level_2_name: string | null
          level_3_name: string | null
        }
        Insert: {
          country: string
          created_at?: string | null
          id?: string
          level_1_name?: string | null
          level_2_name?: string | null
          level_3_name?: string | null
        }
        Update: {
          country?: string
          created_at?: string | null
          id?: string
          level_1_name?: string | null
          level_2_name?: string | null
          level_3_name?: string | null
        }
        Relationships: []
      }
      government_positions: {
        Row: {
          authority_level: number | null
          country_code: string
          created_at: string | null
          description: string | null
          election_type: string | null
          governance_level: string
          id: string
          is_elected: boolean | null
          jurisdiction_code: string | null
          jurisdiction_name: string
          next_election_date: string | null
          position_code: string
          responsibilities: string | null
          term_limit: number | null
          term_years: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          authority_level?: number | null
          country_code: string
          created_at?: string | null
          description?: string | null
          election_type?: string | null
          governance_level: string
          id?: string
          is_elected?: boolean | null
          jurisdiction_code?: string | null
          jurisdiction_name: string
          next_election_date?: string | null
          position_code: string
          responsibilities?: string | null
          term_limit?: number | null
          term_years?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          authority_level?: number | null
          country_code?: string
          created_at?: string | null
          description?: string | null
          election_type?: string | null
          governance_level?: string
          id?: string
          is_elected?: boolean | null
          jurisdiction_code?: string | null
          jurisdiction_name?: string
          next_election_date?: string | null
          position_code?: string
          responsibilities?: string | null
          term_limit?: number | null
          term_years?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      government_projects: {
        Row: {
          actual_completion_date: string | null
          actual_start_date: string | null
          budget_allocated: number | null
          budget_used: number | null
          category: string | null
          community_confidence: number | null
          completion_notes: string | null
          constituency: string | null
          county: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          documents_urls: string[] | null
          funding_source: string | null
          funding_type: string | null
          id: string
          is_verified: boolean | null
          last_updated_by: string | null
          latitude: number | null
          lead_contractor_id: string | null
          location: string | null
          longitude: number | null
          media_urls: string[] | null
          official_id: string | null
          planned_completion_date: string | null
          planned_start_date: string | null
          priority: string | null
          progress_percentage: number | null
          search_vector: unknown
          sentiment_id: string | null
          status: string | null
          title: string
          updated_at: string | null
          verification_id: string | null
          ward: string | null
        }
        Insert: {
          actual_completion_date?: string | null
          actual_start_date?: string | null
          budget_allocated?: number | null
          budget_used?: number | null
          category?: string | null
          community_confidence?: number | null
          completion_notes?: string | null
          constituency?: string | null
          county?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          documents_urls?: string[] | null
          funding_source?: string | null
          funding_type?: string | null
          id?: string
          is_verified?: boolean | null
          last_updated_by?: string | null
          latitude?: number | null
          lead_contractor_id?: string | null
          location?: string | null
          longitude?: number | null
          media_urls?: string[] | null
          official_id?: string | null
          planned_completion_date?: string | null
          planned_start_date?: string | null
          priority?: string | null
          progress_percentage?: number | null
          search_vector?: unknown
          sentiment_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          verification_id?: string | null
          ward?: string | null
        }
        Update: {
          actual_completion_date?: string | null
          actual_start_date?: string | null
          budget_allocated?: number | null
          budget_used?: number | null
          category?: string | null
          community_confidence?: number | null
          completion_notes?: string | null
          constituency?: string | null
          county?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          documents_urls?: string[] | null
          funding_source?: string | null
          funding_type?: string | null
          id?: string
          is_verified?: boolean | null
          last_updated_by?: string | null
          latitude?: number | null
          lead_contractor_id?: string | null
          location?: string | null
          longitude?: number | null
          media_urls?: string[] | null
          official_id?: string | null
          planned_completion_date?: string | null
          planned_start_date?: string | null
          priority?: string | null
          progress_percentage?: number | null
          search_vector?: unknown
          sentiment_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          verification_id?: string | null
          ward?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lead_contractor"
            columns: ["lead_contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lead_contractor"
            columns: ["lead_contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lead_contractor"
            columns: ["lead_contractor_id"]
            isOneToOne: false
            referencedRelation: "public_contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "government_projects_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "government_projects_sentiment_id_fkey"
            columns: ["sentiment_id"]
            isOneToOne: false
            referencedRelation: "sentiment_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "government_projects_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      hidden_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hidden_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_scores: {
        Row: {
          computed_at: string | null
          id: string
          location_type: string | null
          location_value: string | null
          period: string
          rank: number | null
          total_points: number | null
          user_id: string
        }
        Insert: {
          computed_at?: string | null
          id?: string
          location_type?: string | null
          location_value?: string | null
          period: string
          rank?: number | null
          total_points?: number | null
          user_id: string
        }
        Update: {
          computed_at?: string | null
          id?: string
          location_type?: string | null
          location_value?: string | null
          period?: string
          rank?: number | null
          total_points?: number | null
          user_id?: string
        }
        Relationships: []
      }
      mod_mail_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          sender_id: string
          thread_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          sender_id: string
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mod_mail_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "mod_mail_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      mod_mail_threads: {
        Row: {
          community_id: string
          created_at: string | null
          id: string
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          id?: string
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          id?: string
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mod_mail_threads_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mod_mail_threads_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      ngo_partners: {
        Row: {
          avg_response_hours: number | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          hotline: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          reports_received: number | null
          sla_hours: number | null
          type: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          avg_response_hours?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          hotline?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          reports_received?: number | null
          sla_hours?: number | null
          type: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          avg_response_hours?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          hotline?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          reports_received?: number | null
          sla_hours?: number | null
          type?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      office_holders: {
        Row: {
          claimed_at: string | null
          id: string
          is_active: boolean | null
          is_historical: boolean | null
          position_id: string | null
          proof_documents: Json | null
          rejection_notes: string | null
          term_end: string
          term_start: string
          user_id: string | null
          verification_method: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          claimed_at?: string | null
          id?: string
          is_active?: boolean | null
          is_historical?: boolean | null
          position_id?: string | null
          proof_documents?: Json | null
          rejection_notes?: string | null
          term_end: string
          term_start: string
          user_id?: string | null
          verification_method?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          claimed_at?: string | null
          id?: string
          is_active?: boolean | null
          is_historical?: boolean | null
          position_id?: string | null
          proof_documents?: Json | null
          rejection_notes?: string | null
          term_end?: string
          term_start?: string
          user_id?: string | null
          verification_method?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "office_holders_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "government_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_holders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_holders_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      official_contacts: {
        Row: {
          contact_type: string
          contact_value: string
          created_at: string
          id: string
          is_public: boolean
          official_id: string
          updated_at: string
        }
        Insert: {
          contact_type: string
          contact_value: string
          created_at?: string
          id?: string
          is_public?: boolean
          official_id: string
          updated_at?: string
        }
        Update: {
          contact_type?: string
          contact_value?: string
          created_at?: string
          id?: string
          is_public?: boolean
          official_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "official_contacts_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
      official_responses: {
        Row: {
          action_id: string | null
          created_at: string | null
          evidence_urls: string[] | null
          id: string
          new_status: string | null
          official_id: string | null
          response_text: string | null
        }
        Insert: {
          action_id?: string | null
          created_at?: string | null
          evidence_urls?: string[] | null
          id?: string
          new_status?: string | null
          official_id?: string | null
          response_text?: string | null
        }
        Update: {
          action_id?: string | null
          created_at?: string | null
          evidence_urls?: string[] | null
          id?: string
          new_status?: string | null
          official_id?: string | null
          response_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "official_responses_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "civic_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_responses_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
      officials: {
        Row: {
          bio: string | null
          committees: Json | null
          constituency: string | null
          constituency_id: string | null
          county: string | null
          county_id: string | null
          created_at: string
          education: Json | null
          experience: Json | null
          id: string
          level: Database["public"]["Enums"]["official_level"]
          manifesto_url: string | null
          name: string
          party: string | null
          photo_url: string | null
          position: string
          search_vector: unknown
          updated_at: string
          ward: string | null
          ward_id: string | null
        }
        Insert: {
          bio?: string | null
          committees?: Json | null
          constituency?: string | null
          constituency_id?: string | null
          county?: string | null
          county_id?: string | null
          created_at?: string
          education?: Json | null
          experience?: Json | null
          id?: string
          level: Database["public"]["Enums"]["official_level"]
          manifesto_url?: string | null
          name: string
          party?: string | null
          photo_url?: string | null
          position: string
          search_vector?: unknown
          updated_at?: string
          ward?: string | null
          ward_id?: string | null
        }
        Update: {
          bio?: string | null
          committees?: Json | null
          constituency?: string | null
          constituency_id?: string | null
          county?: string | null
          county_id?: string | null
          created_at?: string
          education?: Json | null
          experience?: Json | null
          id?: string
          level?: Database["public"]["Enums"]["official_level"]
          manifesto_url?: string | null
          name?: string
          party?: string | null
          photo_url?: string | null
          position?: string
          search_vector?: unknown
          updated_at?: string
          ward?: string | null
          ward_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "officials_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "officials_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "officials_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          communities_joined: number | null
          completed_at: string | null
          created_at: string | null
          first_comment: boolean | null
          first_post: boolean | null
          id: string
          interests_set: boolean | null
          location_set: boolean | null
          persona_set: boolean | null
          step_completed: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          communities_joined?: number | null
          completed_at?: string | null
          created_at?: string | null
          first_comment?: boolean | null
          first_post?: boolean | null
          id?: string
          interests_set?: boolean | null
          location_set?: boolean | null
          persona_set?: boolean | null
          step_completed?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          communities_joined?: number | null
          completed_at?: string | null
          created_at?: string | null
          first_comment?: boolean | null
          first_post?: boolean | null
          id?: string
          interests_set?: boolean | null
          location_set?: boolean | null
          persona_set?: boolean | null
          step_completed?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      position_communities: {
        Row: {
          access_level: string | null
          auto_moderation: boolean | null
          community_id: string | null
          id: string
          position_id: string | null
        }
        Insert: {
          access_level?: string | null
          auto_moderation?: boolean | null
          community_id?: string | null
          id?: string
          position_id?: string | null
        }
        Update: {
          access_level?: string | null
          auto_moderation?: boolean | null
          community_id?: string | null
          id?: string
          position_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "position_communities_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_communities_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_communities_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: true
            referencedRelation: "government_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      post_media: {
        Row: {
          file_path: string
          file_size: number | null
          file_type: string
          filename: string
          id: string
          post_id: string
          uploaded_at: string
        }
        Insert: {
          file_path: string
          file_size?: number | null
          file_type: string
          filename: string
          id?: string
          post_id: string
          uploaded_at?: string
        }
        Update: {
          file_path?: string
          file_size?: number | null
          file_type?: string
          filename?: string
          id?: string
          post_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          comment_count: number | null
          community_id: string | null
          content: string
          content_sensitivity: string | null
          content_type: Database["public"]["Enums"]["content_type"] | null
          created_at: string
          downvotes: number | null
          id: string
          is_ngo_verified: boolean | null
          official_id: string | null
          search_vector: unknown
          sentiment_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          upvotes: number | null
          verification_id: string | null
          video_data: Json | null
        }
        Insert: {
          author_id: string
          comment_count?: number | null
          community_id?: string | null
          content: string
          content_sensitivity?: string | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          created_at?: string
          downvotes?: number | null
          id?: string
          is_ngo_verified?: boolean | null
          official_id?: string | null
          search_vector?: unknown
          sentiment_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          upvotes?: number | null
          verification_id?: string | null
          video_data?: Json | null
        }
        Update: {
          author_id?: string
          comment_count?: number | null
          community_id?: string | null
          content?: string
          content_sensitivity?: string | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          created_at?: string
          downvotes?: number | null
          id?: string
          is_ngo_verified?: boolean | null
          official_id?: string | null
          search_vector?: unknown
          sentiment_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          upvotes?: number | null
          verification_id?: string | null
          video_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_sentiment_id_fkey"
            columns: ["sentiment_id"]
            isOneToOne: false
            referencedRelation: "sentiment_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_stats: Json | null
          avatar_url: string | null
          badges: string[] | null
          banner_url: string | null
          bio: string | null
          comment_karma: number | null
          constituency: string | null
          constituency_id: string | null
          county: string | null
          county_id: string | null
          created_at: string
          display_name: string | null
          expertise: string[] | null
          id: string
          is_platform_admin: boolean | null
          is_private: boolean | null
          is_verified: boolean | null
          join_date: string | null
          karma: number | null
          last_activity: string | null
          location: string | null
          onboarding_completed: boolean | null
          persona: Database["public"]["Enums"]["user_persona"] | null
          post_karma: number | null
          privacy_settings: Json | null
          role: string | null
          search_vector: unknown
          social_links: Json | null
          title: string | null
          updated_at: string
          user_flair: string | null
          username: string | null
          ward: string | null
          ward_id: string | null
          website: string | null
        }
        Insert: {
          activity_stats?: Json | null
          avatar_url?: string | null
          badges?: string[] | null
          banner_url?: string | null
          bio?: string | null
          comment_karma?: number | null
          constituency?: string | null
          constituency_id?: string | null
          county?: string | null
          county_id?: string | null
          created_at?: string
          display_name?: string | null
          expertise?: string[] | null
          id: string
          is_platform_admin?: boolean | null
          is_private?: boolean | null
          is_verified?: boolean | null
          join_date?: string | null
          karma?: number | null
          last_activity?: string | null
          location?: string | null
          onboarding_completed?: boolean | null
          persona?: Database["public"]["Enums"]["user_persona"] | null
          post_karma?: number | null
          privacy_settings?: Json | null
          role?: string | null
          search_vector?: unknown
          social_links?: Json | null
          title?: string | null
          updated_at?: string
          user_flair?: string | null
          username?: string | null
          ward?: string | null
          ward_id?: string | null
          website?: string | null
        }
        Update: {
          activity_stats?: Json | null
          avatar_url?: string | null
          badges?: string[] | null
          banner_url?: string | null
          bio?: string | null
          comment_karma?: number | null
          constituency?: string | null
          constituency_id?: string | null
          county?: string | null
          county_id?: string | null
          created_at?: string
          display_name?: string | null
          expertise?: string[] | null
          id?: string
          is_platform_admin?: boolean | null
          is_private?: boolean | null
          is_verified?: boolean | null
          join_date?: string | null
          karma?: number | null
          last_activity?: string | null
          location?: string | null
          onboarding_completed?: boolean | null
          persona?: Database["public"]["Enums"]["user_persona"] | null
          post_karma?: number | null
          privacy_settings?: Json | null
          role?: string | null
          search_vector?: unknown
          social_links?: Json | null
          title?: string | null
          updated_at?: string
          user_flair?: string | null
          username?: string | null
          ward?: string | null
          ward_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      project_contractors: {
        Row: {
          contract_end_date: string | null
          contract_start_date: string | null
          contract_value: number | null
          contractor_id: string
          created_at: string | null
          id: string
          notes: string | null
          performance_rating: number | null
          project_id: string
          role: string | null
        }
        Insert: {
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_value?: number | null
          contractor_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          performance_rating?: number | null
          project_id: string
          role?: string | null
        }
        Update: {
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_value?: number | null
          contractor_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          performance_rating?: number | null
          project_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_contractors_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_contractors_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_contractors_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "public_contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_contractors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          community_verified: boolean | null
          created_at: string | null
          description: string
          documents: string[] | null
          downvotes: number | null
          fact_check_notes: string | null
          fact_check_status: string | null
          fact_checker_id: string | null
          id: string
          is_fact_check: boolean | null
          latitude: number | null
          location_description: string | null
          longitude: number | null
          photos: string[] | null
          project_id: string
          reporter_contact: string | null
          reporter_id: string | null
          reporter_name: string | null
          status: string | null
          title: string
          update_type: string
          updated_at: string | null
          upvotes: number | null
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
          videos: string[] | null
        }
        Insert: {
          community_verified?: boolean | null
          created_at?: string | null
          description: string
          documents?: string[] | null
          downvotes?: number | null
          fact_check_notes?: string | null
          fact_check_status?: string | null
          fact_checker_id?: string | null
          id?: string
          is_fact_check?: boolean | null
          latitude?: number | null
          location_description?: string | null
          longitude?: number | null
          photos?: string[] | null
          project_id: string
          reporter_contact?: string | null
          reporter_id?: string | null
          reporter_name?: string | null
          status?: string | null
          title: string
          update_type: string
          updated_at?: string | null
          upvotes?: number | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          videos?: string[] | null
        }
        Update: {
          community_verified?: boolean | null
          created_at?: string | null
          description?: string
          documents?: string[] | null
          downvotes?: number | null
          fact_check_notes?: string | null
          fact_check_status?: string | null
          fact_checker_id?: string | null
          id?: string
          is_fact_check?: boolean | null
          latitude?: number | null
          location_description?: string | null
          longitude?: number | null
          photos?: string[] | null
          project_id?: string
          reporter_contact?: string | null
          reporter_id?: string | null
          reporter_name?: string | null
          status?: string | null
          title?: string
          update_type?: string
          updated_at?: string | null
          upvotes?: number | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          videos?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      promise_updates: {
        Row: {
          amount_spent: number | null
          created_at: string
          created_by: string | null
          description: string | null
          documents: Json | null
          id: string
          photos: Json | null
          progress_percentage: number | null
          promise_id: string
          title: string
          update_date: string
        }
        Insert: {
          amount_spent?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          documents?: Json | null
          id?: string
          photos?: Json | null
          progress_percentage?: number | null
          promise_id: string
          title: string
          update_date?: string
        }
        Update: {
          amount_spent?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          documents?: Json | null
          id?: string
          photos?: Json | null
          progress_percentage?: number | null
          promise_id?: string
          title?: string
          update_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "promise_updates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promise_updates_promise_id_fkey"
            columns: ["promise_id"]
            isOneToOne: false
            referencedRelation: "development_promises"
            referencedColumns: ["id"]
          },
        ]
      }
      promise_verifications: {
        Row: {
          actual_progress: number | null
          claimed_progress: number | null
          community_confidence: number | null
          created_at: string | null
          description: string
          documents: string[] | null
          downvotes: number | null
          id: string
          issues_identified: string | null
          photos: string[] | null
          promise_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          title: string
          updated_at: string | null
          upvotes: number | null
          verification_type: string
          verifier_id: string | null
          verifier_name: string | null
          videos: string[] | null
        }
        Insert: {
          actual_progress?: number | null
          claimed_progress?: number | null
          community_confidence?: number | null
          created_at?: string | null
          description: string
          documents?: string[] | null
          downvotes?: number | null
          id?: string
          issues_identified?: string | null
          photos?: string[] | null
          promise_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          upvotes?: number | null
          verification_type: string
          verifier_id?: string | null
          verifier_name?: string | null
          videos?: string[] | null
        }
        Update: {
          actual_progress?: number | null
          claimed_progress?: number | null
          community_confidence?: number | null
          created_at?: string | null
          description?: string
          documents?: string[] | null
          downvotes?: number | null
          id?: string
          issues_identified?: string | null
          photos?: string[] | null
          promise_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          upvotes?: number | null
          verification_type?: string
          verifier_id?: string | null
          verifier_name?: string | null
          videos?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "promise_verifications_promise_id_fkey"
            columns: ["promise_id"]
            isOneToOne: false
            referencedRelation: "development_promises"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          category: string
          created_at: string | null
          description: string
          difficulty: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          points: number
          requirements: Json | null
          title: string
          updated_at: string | null
          verification_type: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          difficulty?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          points?: number
          requirements?: Json | null
          title: string
          updated_at?: string | null
          verification_type: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          difficulty?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          points?: number
          requirements?: Json | null
          title?: string
          updated_at?: string | null
          verification_type?: string
        }
        Relationships: []
      }
      saved_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sentiment_scores: {
        Row: {
          content_id: string
          content_type: string
          id: string
          negative_count: number | null
          neutral_count: number | null
          positive_count: number | null
          total_count: number | null
          updated_at: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          id?: string
          negative_count?: number | null
          neutral_count?: number | null
          positive_count?: number | null
          total_count?: number | null
          updated_at?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          id?: string
          negative_count?: number | null
          neutral_count?: number | null
          positive_count?: number | null
          total_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sentiment_votes: {
        Row: {
          created_at: string | null
          id: string
          sentiment_id: string
          sentiment_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          sentiment_id: string
          sentiment_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          sentiment_id?: string
          sentiment_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sentiment_votes_sentiment_id_fkey"
            columns: ["sentiment_id"]
            isOneToOne: false
            referencedRelation: "sentiment_scores"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_endorsements: {
        Row: {
          endorsed_at: string | null
          endorsed_by: string
          endorsement_note: string | null
          id: string
          user_skill_id: string
          weight: number | null
        }
        Insert: {
          endorsed_at?: string | null
          endorsed_by: string
          endorsement_note?: string | null
          id?: string
          user_skill_id: string
          weight?: number | null
        }
        Update: {
          endorsed_at?: string | null
          endorsed_by?: string
          endorsement_note?: string | null
          id?: string
          user_skill_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_endorsements_user_skill_id_fkey"
            columns: ["user_skill_id"]
            isOneToOne: false
            referencedRelation: "user_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      system_audit_log: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_description: string | null
          achievement_name: string | null
          achievement_type: string
          earned_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          achievement_description?: string | null
          achievement_name?: string | null
          achievement_type: string
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          achievement_description?: string | null
          achievement_name?: string | null
          achievement_type?: string
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_actions: {
        Row: {
          action_type: string
          action_value: number | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action_type: string
          action_value?: number | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action_type?: string
          action_value?: number | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          activity_type: string
          created_at: string
          entity_id: string
          entity_title: string | null
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          entity_id: string
          entity_title?: string | null
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          entity_id?: string
          entity_title?: string | null
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_log: {
        Row: {
          activity_type: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string | null
          badge_id: string
          id: string
          progress: number | null
          user_id: string
        }
        Insert: {
          awarded_at?: string | null
          badge_id: string
          id?: string
          progress?: number | null
          user_id: string
        }
        Update: {
          awarded_at?: string | null
          badge_id?: string
          id?: string
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          id: string
          interest_id: string | null
          selected_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          interest_id?: string | null
          selected_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          interest_id?: string | null
          selected_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "civic_interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_privacy_settings: {
        Row: {
          activity_visibility: string | null
          allow_messages: string | null
          contact_visibility: string | null
          created_at: string | null
          data_sharing: boolean | null
          id: string
          profile_visibility: string | null
          show_online_status: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_visibility?: string | null
          allow_messages?: string | null
          contact_visibility?: string | null
          created_at?: string | null
          data_sharing?: boolean | null
          id?: string
          profile_visibility?: string | null
          show_online_status?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_visibility?: string | null
          allow_messages?: string | null
          contact_visibility?: string | null
          created_at?: string | null
          data_sharing?: boolean | null
          id?: string
          profile_visibility?: string | null
          show_online_status?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_privacy_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quests: {
        Row: {
          completed_at: string | null
          evidence: Json | null
          id: string
          progress: number | null
          quest_id: string
          rejection_reason: string | null
          started_at: string | null
          status: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          completed_at?: string | null
          evidence?: Json | null
          id?: string
          progress?: number | null
          quest_id: string
          rejection_reason?: string | null
          started_at?: string | null
          status?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          completed_at?: string | null
          evidence?: Json | null
          id?: string
          progress?: number | null
          quest_id?: string
          rejection_reason?: string | null
          started_at?: string | null
          status?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_skills: {
        Row: {
          claimed_at: string | null
          credibility_score: number | null
          endorsement_count: number | null
          id: string
          skill_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          credibility_score?: number | null
          endorsement_count?: number | null
          id?: string
          skill_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          credibility_score?: number | null
          endorsement_count?: number | null
          id?: string
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_votes: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          verification_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          verification_id: string
          vote_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          verification_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_votes_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          status: string
          total_votes: number | null
          truth_score: number | null
          updated_at: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          status?: string
          total_votes?: number | null
          truth_score?: number | null
          updated_at?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          status?: string
          total_votes?: number | null
          truth_score?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      votes: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          user_id: string
          vote_type: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id: string
          vote_type: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wards: {
        Row: {
          constituency_id: string | null
          created_at: string | null
          id: string
          mca_id: string | null
          name: string
          population: number | null
        }
        Insert: {
          constituency_id?: string | null
          created_at?: string | null
          id?: string
          mca_id?: string | null
          name: string
          population?: number | null
        }
        Update: {
          constituency_id?: string | null
          created_at?: string | null
          id?: string
          mca_id?: string | null
          name?: string
          population?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wards_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wards_mca_id_fkey"
            columns: ["mca_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      civic_action_analytics: {
        Row: {
          avg_days_to_resolve: number | null
          category: string | null
          constituency_id: string | null
          county_id: string | null
          issue_count: number | null
          status: string | null
          ward_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_actions_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_actions_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_actions_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      communities_with_stats: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          description_html: string | null
          display_name: string | null
          id: string | null
          is_mature: boolean | null
          is_verified: boolean | null
          member_count: number | null
          name: string | null
          online_count: number | null
          updated_at: string | null
          visibility_type: string | null
        }
        Relationships: []
      }
      contractor_contacts: {
        Row: {
          company_type: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string | null
          name: string | null
          phone: string | null
          registration_number: string | null
          specialization: string[] | null
          website: string | null
        }
        Insert: {
          company_type?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          name?: string | null
          phone?: string | null
          registration_number?: string | null
          specialization?: string[] | null
          website?: string | null
        }
        Update: {
          company_type?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          name?: string | null
          phone?: string | null
          registration_number?: string | null
          specialization?: string[] | null
          website?: string | null
        }
        Relationships: []
      }
      public_community_moderators: {
        Row: {
          added_at: string | null
          avatar_url: string | null
          community_id: string | null
          display_name: string | null
          id: string | null
          role: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_moderators_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_moderators_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_moderators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_contractors: {
        Row: {
          average_rating: number | null
          blacklist_reason: string | null
          blacklisted: boolean | null
          company_type: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string | null
          is_verified: boolean | null
          name: string | null
          phone: string | null
          registration_number: string | null
          specialization: string[] | null
          total_projects_completed: number | null
          total_ratings: number | null
          updated_at: string | null
          verification_date: string | null
          website: string | null
          years_experience: number | null
        }
        Insert: {
          average_rating?: number | null
          blacklist_reason?: string | null
          blacklisted?: boolean | null
          company_type?: string | null
          contact_person?: never
          created_at?: string | null
          email?: never
          id?: string | null
          is_verified?: boolean | null
          name?: string | null
          phone?: never
          registration_number?: never
          specialization?: string[] | null
          total_projects_completed?: number | null
          total_ratings?: number | null
          updated_at?: string | null
          verification_date?: string | null
          website?: never
          years_experience?: number | null
        }
        Update: {
          average_rating?: number | null
          blacklist_reason?: string | null
          blacklisted?: boolean | null
          company_type?: string | null
          contact_person?: never
          created_at?: string | null
          email?: never
          id?: string | null
          is_verified?: boolean | null
          name?: string | null
          phone?: never
          registration_number?: never
          specialization?: string[] | null
          total_projects_completed?: number | null
          total_ratings?: number | null
          updated_at?: string | null
          verification_date?: string | null
          website?: never
          years_experience?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_comment_karma: { Args: { user_uuid: string }; Returns: number }
      calculate_post_karma: { Args: { user_uuid: string }; Returns: number }
      calculate_user_karma: { Args: { user_uuid: string }; Returns: number }
      cleanup_stale_active_members: { Args: never; Returns: number }
      compute_leaderboard_scores: { Args: never; Returns: undefined }
      get_current_user_role: { Args: never; Returns: string }
      get_online_member_count: {
        Args: { community_uuid: string }
        Returns: number
      }
      get_profile_with_privacy: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          bio: string
          created_at: string
          display_name: string
          id: string
          is_verified: boolean
          privacy_settings: Json
          role: string
          updated_at: string
          username: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      update_all_karma: { Args: never; Returns: undefined }
      update_community_active_status: {
        Args: { p_community_id: string; p_user_id: string }
        Returns: undefined
      }
      user_is_room_participant: {
        Args: { room_uuid: string; user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "official"
        | "expert"
        | "journalist"
        | "citizen"
        | "super_admin"
      content_type: "text" | "video" | "image" | "poll" | "live"
      official_level:
        | "executive"
        | "governor"
        | "senator"
        | "mp"
        | "women_rep"
        | "mca"
      promise_status: "completed" | "ongoing" | "not_started" | "cancelled"
      user_persona:
        | "active_citizen"
        | "community_organizer"
        | "civic_learner"
        | "government_watcher"
        | "professional"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "moderator",
        "official",
        "expert",
        "journalist",
        "citizen",
        "super_admin",
      ],
      content_type: ["text", "video", "image", "poll", "live"],
      official_level: [
        "executive",
        "governor",
        "senator",
        "mp",
        "women_rep",
        "mca",
      ],
      promise_status: ["completed", "ongoing", "not_started", "cancelled"],
      user_persona: [
        "active_citizen",
        "community_organizer",
        "civic_learner",
        "government_watcher",
        "professional",
      ],
    },
  },
} as const
