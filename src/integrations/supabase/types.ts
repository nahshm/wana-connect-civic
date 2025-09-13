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
      officials: {
        Row: {
          constituency: string | null
          contact_info: Json | null
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
          contact_info?: Json | null
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
          contact_info?: Json | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_verified: boolean | null
          role: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          is_verified?: boolean | null
          role?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_verified?: boolean | null
          role?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
