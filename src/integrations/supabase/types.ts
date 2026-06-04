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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abuse_reports: {
        Row: {
          category: Database["public"]["Enums"]["abuse_category"]
          created_at: string
          description: string
          evidence_url: string | null
          id: string
          reported_generation_id: string | null
          reported_user_id: string | null
          reporter_email: string
          reporter_name: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["abuse_status"]
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["abuse_category"]
          created_at?: string
          description: string
          evidence_url?: string | null
          id?: string
          reported_generation_id?: string | null
          reported_user_id?: string | null
          reporter_email: string
          reporter_name?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["abuse_status"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["abuse_category"]
          created_at?: string
          description?: string
          evidence_url?: string | null
          id?: string
          reported_generation_id?: string | null
          reported_user_id?: string | null
          reporter_email?: string
          reporter_name?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["abuse_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "abuse_reports_reported_generation_id_fkey"
            columns: ["reported_generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          consent_type: Database["public"]["Enums"]["consent_type"]
          created_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          consent_type: Database["public"]["Enums"]["consent_type"]
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
          version: string
        }
        Update: {
          consent_type?: Database["public"]["Enums"]["consent_type"]
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      credit_ledger: {
        Row: {
          created_at: string
          delta: number
          generation_id: string | null
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          generation_id?: string | null
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          generation_id?: string | null
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
        ]
      }
      generations: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          input_asset_paths: string[] | null
          model: string | null
          moderation_result: Json | null
          output_asset_path: string | null
          output_url: string | null
          pinned: boolean
          prompt: string
          status: Database["public"]["Enums"]["generation_status"]
          tool: Database["public"]["Enums"]["generation_tool"]
          updated_at: string
          user_id: string
          watermark_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          input_asset_paths?: string[] | null
          model?: string | null
          moderation_result?: Json | null
          output_asset_path?: string | null
          output_url?: string | null
          pinned?: boolean
          prompt: string
          status?: Database["public"]["Enums"]["generation_status"]
          tool: Database["public"]["Enums"]["generation_tool"]
          updated_at?: string
          user_id: string
          watermark_id?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          input_asset_paths?: string[] | null
          model?: string | null
          moderation_result?: Json | null
          output_asset_path?: string | null
          output_url?: string | null
          pinned?: boolean
          prompt?: string
          status?: Database["public"]["Enums"]["generation_status"]
          tool?: Database["public"]["Enums"]["generation_tool"]
          updated_at?: string
          user_id?: string
          watermark_id?: string
        }
        Relationships: []
      }
      moderation_logs: {
        Row: {
          categories: string[] | null
          created_at: string
          generation_id: string | null
          id: string
          prompt: string | null
          raw_response: Json | null
          reason: string | null
          reviewer_id: string | null
          user_id: string
          verdict: string
        }
        Insert: {
          categories?: string[] | null
          created_at?: string
          generation_id?: string | null
          id?: string
          prompt?: string | null
          raw_response?: Json | null
          reason?: string | null
          reviewer_id?: string | null
          user_id: string
          verdict: string
        }
        Update: {
          categories?: string[] | null
          created_at?: string
          generation_id?: string | null
          id?: string
          prompt?: string | null
          raw_response?: Json | null
          reason?: string | null
          reviewer_id?: string | null
          user_id?: string
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_logs_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits: number
          daily_free_reset_at: string
          daily_free_used: number
          display_name: string | null
          id: string
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
          verification_level: Database["public"]["Enums"]["verification_level"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          daily_free_reset_at?: string
          daily_free_used?: number
          display_name?: string | null
          id?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
          verification_level?: Database["public"]["Enums"]["verification_level"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          daily_free_reset_at?: string
          daily_free_used?: number
          display_name?: string | null
          id?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
          verification_level?: Database["public"]["Enums"]["verification_level"]
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          external_customer_id: string | null
          external_subscription_id: string | null
          id: string
          provider: string | null
          status: string
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          external_customer_id?: string | null
          external_subscription_id?: string | null
          id?: string
          provider?: string | null
          status?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          external_customer_id?: string | null
          external_subscription_id?: string | null
          id?: string
          provider?: string | null
          status?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      abuse_category:
        | "deepfake"
        | "copyright"
        | "identity_theft"
        | "harassment"
        | "csam"
        | "other"
      abuse_status: "new" | "reviewing" | "actioned" | "rejected"
      app_role: "user" | "moderator" | "admin"
      consent_type:
        | "tos"
        | "privacy"
        | "face_swap_subject_permission"
        | "training_ownership"
        | "ai_disclosure"
      generation_status:
        | "pending"
        | "moderating"
        | "processing"
        | "completed"
        | "failed"
        | "blocked"
      generation_tool:
        | "text_to_image"
        | "image_edit"
        | "face_swap_image"
        | "face_swap_video"
        | "body_swap"
        | "text_to_video"
        | "video_edit"
        | "model_training"
      subscription_tier: "free" | "pro" | "premium"
      verification_level: "none" | "email" | "phone" | "id"
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
      abuse_category: [
        "deepfake",
        "copyright",
        "identity_theft",
        "harassment",
        "csam",
        "other",
      ],
      abuse_status: ["new", "reviewing", "actioned", "rejected"],
      app_role: ["user", "moderator", "admin"],
      consent_type: [
        "tos",
        "privacy",
        "face_swap_subject_permission",
        "training_ownership",
        "ai_disclosure",
      ],
      generation_status: [
        "pending",
        "moderating",
        "processing",
        "completed",
        "failed",
        "blocked",
      ],
      generation_tool: [
        "text_to_image",
        "image_edit",
        "face_swap_image",
        "face_swap_video",
        "body_swap",
        "text_to_video",
        "video_edit",
        "model_training",
      ],
      subscription_tier: ["free", "pro", "premium"],
      verification_level: ["none", "email", "phone", "id"],
    },
  },
} as const
