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
          toxicity_score: number | null
          updated_at: string
          upvotes: number | null
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
          toxicity_score?: number | null
          updated_at?: string
          upvotes?: number | null
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
          toxicity_score?: number | null
          updated_at?: string
          upvotes?: number | null
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
        ]
      }
      communities: {
        Row: {
          allow_post_flairs: boolean | null
          allow_user_flairs: boolean | null
          auto_moderate: boolean | null
          banner_url: string | null
          category: string
          created_at: string
          description: string | null
          description_html: string | null
          display_name: string
          id: string
          is_nsfw: boolean | null
          member_count: number | null
          minimum_karma_to_post: number | null
          name: string
          sensitivity_level: string | null
          sidebar_content: string | null
          submission_rules: string | null
          theme_color: string | null
          updated_at: string
        }
        Insert: {
          allow_post_flairs?: boolean | null
          allow_user_flairs?: boolean | null
          auto_moderate?: boolean | null
          banner_url?: string | null
          category: string
          created_at?: string
          description?: string | null
          description_html?: string | null
          display_name: string
          id?: string
          is_nsfw?: boolean | null
          member_count?: number | null
          minimum_karma_to_post?: number | null
          name: string
          sensitivity_level?: string | null
          sidebar_content?: string | null
          submission_rules?: string | null
          theme_color?: string | null
          updated_at?: string
        }
        Update: {
          allow_post_flairs?: boolean | null
          allow_user_flairs?: boolean | null
          auto_moderate?: boolean | null
          banner_url?: string | null
          category?: string
          created_at?: string
          description?: string | null
          description_html?: string | null
          display_name?: string
          id?: string
          is_nsfw?: boolean | null
          member_count?: number | null
          minimum_karma_to_post?: number | null
          name?: string
          sensitivity_level?: string | null
          sidebar_content?: string | null
          submission_rules?: string | null
          theme_color?: string | null
          updated_at?: string
        }
        Relationships: []
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
          permissions: Json | null
          role: string | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          community_id: string
          id?: string
          permissions?: Json | null
          role?: string | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          community_id?: string
          id?: string
          permissions?: Json | null
          role?: string | null
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
            foreignKeyName: "community_moderators_user_id_fkey"
            columns: ["user_id"]
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
            foreignKeyName: "community_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      government_projects: {
        Row: {
          actual_completion_date: string | null
          actual_start_date: string | null
          budget_allocated: number | null
          budget_used: number | null
          category: string | null
          completion_notes: string | null
          constituency: string | null
          county: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          funding_source: string | null
          funding_type: string | null
          id: string
          last_updated_by: string | null
          latitude: number | null
          lead_contractor_id: string | null
          location: string | null
          longitude: number | null
          official_id: string | null
          planned_completion_date: string | null
          planned_start_date: string | null
          priority: string | null
          progress_percentage: number | null
          status: string | null
          title: string
          updated_at: string | null
          ward: string | null
        }
        Insert: {
          actual_completion_date?: string | null
          actual_start_date?: string | null
          budget_allocated?: number | null
          budget_used?: number | null
          category?: string | null
          completion_notes?: string | null
          constituency?: string | null
          county?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          funding_source?: string | null
          funding_type?: string | null
          id?: string
          last_updated_by?: string | null
          latitude?: number | null
          lead_contractor_id?: string | null
          location?: string | null
          longitude?: number | null
          official_id?: string | null
          planned_completion_date?: string | null
          planned_start_date?: string | null
          priority?: string | null
          progress_percentage?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
          ward?: string | null
        }
        Update: {
          actual_completion_date?: string | null
          actual_start_date?: string | null
          budget_allocated?: number | null
          budget_used?: number | null
          category?: string | null
          completion_notes?: string | null
          constituency?: string | null
          county?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          funding_source?: string | null
          funding_type?: string | null
          id?: string
          last_updated_by?: string | null
          latitude?: number | null
          lead_contractor_id?: string | null
          location?: string | null
          longitude?: number | null
          official_id?: string | null
          planned_completion_date?: string | null
          planned_start_date?: string | null
          priority?: string | null
          progress_percentage?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
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
      officials: {
        Row: {
          constituency: string | null
          county: string | null
          created_at: string
          id: string
          level: Database["public"]["Enums"]["official_level"]
          manifesto_url: string | null
          name: string
          party: string | null
          photo_url: string | null
          position: string
          updated_at: string
        }
        Insert: {
          constituency?: string | null
          county?: string | null
          created_at?: string
          id?: string
          level: Database["public"]["Enums"]["official_level"]
          manifesto_url?: string | null
          name: string
          party?: string | null
          photo_url?: string | null
          position: string
          updated_at?: string
        }
        Update: {
          constituency?: string | null
          county?: string | null
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["official_level"]
          manifesto_url?: string | null
          name?: string
          party?: string | null
          photo_url?: string | null
          position?: string
          updated_at?: string
        }
        Relationships: []
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
          created_at: string
          downvotes: number | null
          id: string
          is_ngo_verified: boolean | null
          official_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          upvotes: number | null
        }
        Insert: {
          author_id: string
          comment_count?: number | null
          community_id?: string | null
          content: string
          content_sensitivity?: string | null
          created_at?: string
          downvotes?: number | null
          id?: string
          is_ngo_verified?: boolean | null
          official_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          upvotes?: number | null
        }
        Update: {
          author_id?: string
          comment_count?: number | null
          community_id?: string | null
          content?: string
          content_sensitivity?: string | null
          created_at?: string
          downvotes?: number | null
          id?: string
          is_ngo_verified?: boolean | null
          official_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          upvotes?: number | null
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
            foreignKeyName: "posts_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_stats: Json | null
          avatar_url: string | null
          badges: string[] | null
          bio: string | null
          comment_karma: number | null
          created_at: string
          display_name: string | null
          expertise: string[] | null
          id: string
          is_private: boolean | null
          is_verified: boolean | null
          karma: number | null
          last_activity: string | null
          location: string | null
          post_karma: number | null
          privacy_settings: Json | null
          role: string | null
          social_links: Json | null
          updated_at: string
          username: string | null
          website: string | null
        }
        Insert: {
          activity_stats?: Json | null
          avatar_url?: string | null
          badges?: string[] | null
          bio?: string | null
          comment_karma?: number | null
          created_at?: string
          display_name?: string | null
          expertise?: string[] | null
          id: string
          is_private?: boolean | null
          is_verified?: boolean | null
          karma?: number | null
          last_activity?: string | null
          location?: string | null
          post_karma?: number | null
          privacy_settings?: Json | null
          role?: string | null
          social_links?: Json | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Update: {
          activity_stats?: Json | null
          avatar_url?: string | null
          badges?: string[] | null
          bio?: string | null
          comment_karma?: number | null
          created_at?: string
          display_name?: string | null
          expertise?: string[] | null
          id?: string
          is_private?: boolean | null
          is_verified?: boolean | null
          karma?: number | null
          last_activity?: string | null
          location?: string | null
          post_karma?: number | null
          privacy_settings?: Json | null
          role?: string | null
          social_links?: Json | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
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
          id: string
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
          id?: string
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
          id?: string
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
    }
    Views: {
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
      get_current_user_role: { Args: never; Returns: string }
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
      update_all_karma: { Args: never; Returns: undefined }
    }
    Enums: {
      official_level:
        | "executive"
        | "governor"
        | "senator"
        | "mp"
        | "women_rep"
        | "mca"
      promise_status: "completed" | "ongoing" | "not_started" | "cancelled"
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
      official_level: [
        "executive",
        "governor",
        "senator",
        "mp",
        "women_rep",
        "mca",
      ],
      promise_status: ["completed", "ongoing", "not_started", "cancelled"],
    },
  },
} as const
