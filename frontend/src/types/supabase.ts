export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ad_accounts: {
        Row: {
          business_manager: string
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          business_manager: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          business_manager?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_accounts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          ad_library_link: string | null
          created_at: string | null
          created_by: string | null
          id: string
          level: string | null
          market: string | null
          name: string
          notes: string | null
          offer_url: string | null
          project_id: string | null
          traffic_volume: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          ad_library_link?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          level?: string | null
          market?: string | null
          name: string
          notes?: string | null
          offer_url?: string | null
          project_id?: string | null
          traffic_volume?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          ad_library_link?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          level?: string | null
          market?: string | null
          name?: string
          notes?: string | null
          offer_url?: string | null
          project_id?: string | null
          traffic_volume?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_intelligence: {
        Row: {
          angle: string | null
          call_to_action: string | null
          concept: string | null
          created_at: string | null
          created_by: string
          creative_category: string | null
          creative_type: string | null
          headline: string | null
          hook: string | null
          hook_pattern: string | null
          id: string
          image_url: string | null
          is_template: boolean | null
          performance_notes: string | null
          platform: string | null
          primary_copy: string | null
          project_id: string
          psychology_trigger: string | null
          remix_potential: string | null
          scalability_notes: string | null
          status: string | null
          tags: string[] | null
          target_emotion: string | null
          template_variables: string | null
          title: string
          updated_at: string | null
          video_url: string | null
          visual_style: string | null
        }
        Insert: {
          angle?: string | null
          call_to_action?: string | null
          concept?: string | null
          created_at?: string | null
          created_by: string
          creative_category?: string | null
          creative_type?: string | null
          headline?: string | null
          hook?: string | null
          hook_pattern?: string | null
          id?: string
          image_url?: string | null
          is_template?: boolean | null
          performance_notes?: string | null
          platform?: string | null
          primary_copy?: string | null
          project_id: string
          psychology_trigger?: string | null
          remix_potential?: string | null
          scalability_notes?: string | null
          status?: string | null
          tags?: string[] | null
          target_emotion?: string | null
          template_variables?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
          visual_style?: string | null
        }
        Update: {
          angle?: string | null
          call_to_action?: string | null
          concept?: string | null
          created_at?: string | null
          created_by?: string
          creative_category?: string | null
          creative_type?: string | null
          headline?: string | null
          hook?: string | null
          hook_pattern?: string | null
          id?: string
          image_url?: string | null
          is_template?: boolean | null
          performance_notes?: string | null
          platform?: string | null
          primary_copy?: string | null
          project_id?: string
          psychology_trigger?: string | null
          remix_potential?: string | null
          scalability_notes?: string | null
          status?: string | null
          tags?: string[] | null
          target_emotion?: string | null
          template_variables?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
          visual_style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creative_intelligence_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      creatives: {
        Row: {
          ad_account_id: string | null
          ad_type: string | null
          ad_variable: string | null
          batch: string
          batch_number: number | null
          benefit: string | null
          brief_link: string | null
          campaign_concept: string | null
          campaign_id: string | null
          created_at: string | null
          created_by: string | null
          desire: string | null
          drive_link: string | null
          hook_pattern: string | null
          id: string
          launch_date: string | null
          notes: string | null
          objections: string | null
          offer_id: string | null
          persona: string | null
          project_id: string | null
          results: string | null
          status: string | null
          test_hypothesis: string | null
          updated_at: string | null
          winning_ad_link: string | null
        }
        Insert: {
          ad_account_id?: string | null
          ad_type?: string | null
          ad_variable?: string | null
          batch: string
          batch_number?: number | null
          benefit?: string | null
          brief_link?: string | null
          campaign_concept?: string | null
          campaign_id?: string | null
          created_at?: string | null
          created_by?: string | null
          desire?: string | null
          drive_link?: string | null
          hook_pattern?: string | null
          id?: string
          launch_date?: string | null
          notes?: string | null
          objections?: string | null
          offer_id?: string | null
          persona?: string | null
          project_id?: string | null
          results?: string | null
          status?: string | null
          test_hypothesis?: string | null
          updated_at?: string | null
          winning_ad_link?: string | null
        }
        Update: {
          ad_account_id?: string | null
          ad_type?: string | null
          ad_variable?: string | null
          batch?: string
          batch_number?: number | null
          benefit?: string | null
          brief_link?: string | null
          campaign_concept?: string | null
          campaign_id?: string | null
          created_at?: string | null
          created_by?: string | null
          desire?: string | null
          drive_link?: string | null
          hook_pattern?: string | null
          id?: string
          launch_date?: string | null
          notes?: string | null
          objections?: string | null
          offer_id?: string | null
          persona?: string | null
          project_id?: string | null
          results?: string | null
          status?: string | null
          test_hypothesis?: string | null
          updated_at?: string | null
          winning_ad_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creatives_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creatives_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creatives_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          ad_account_id: string | null
          category: string | null
          created_at: string | null
          created_by: string
          description: string | null
          file_path: string
          file_size: number
          folder_id: string | null
          id: string
          mime_type: string
          name: string
          offer_id: string | null
          original_name: string
          project_id: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          ad_account_id?: string | null
          category?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          file_path: string
          file_size: number
          folder_id?: string | null
          id?: string
          mime_type: string
          name: string
          offer_id?: string | null
          original_name: string
          project_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          ad_account_id?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          file_path?: string
          file_size?: number
          folder_id?: string | null
          id?: string
          mime_type?: string
          name?: string
          offer_id?: string | null
          original_name?: string
          project_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          name: string
          parent_folder_id: string | null
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          name: string
          parent_folder_id?: string | null
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          name?: string
          parent_folder_id?: string | null
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          price: string
          project_id: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          price: string
          project_id?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          price?: string
          project_id?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          age_gender_location: string | null
          angle: string | null
          beliefs_to_overcome: string | null
          created_at: string | null
          created_by: string | null
          daily_struggles: string | null
          deeper_pain_points: string | null
          desired_characteristics: string | null
          desired_social_status: string | null
          domino_statement: string | null
          failed_solutions: string | null
          hidden_specific_desires: string | null
          id: string
          insecurities: string | null
          market_awareness: string | null
          market_sophistication: string | null
          mindset: string | null
          name: string
          notes: string | null
          objections: string | null
          product_help_achieve_status: string | null
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          age_gender_location?: string | null
          angle?: string | null
          beliefs_to_overcome?: string | null
          created_at?: string | null
          created_by?: string | null
          daily_struggles?: string | null
          deeper_pain_points?: string | null
          desired_characteristics?: string | null
          desired_social_status?: string | null
          domino_statement?: string | null
          failed_solutions?: string | null
          hidden_specific_desires?: string | null
          id?: string
          insecurities?: string | null
          market_awareness?: string | null
          market_sophistication?: string | null
          mindset?: string | null
          name: string
          notes?: string | null
          objections?: string | null
          product_help_achieve_status?: string | null
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          age_gender_location?: string | null
          angle?: string | null
          beliefs_to_overcome?: string | null
          created_at?: string | null
          created_by?: string | null
          daily_struggles?: string | null
          deeper_pain_points?: string | null
          desired_characteristics?: string | null
          desired_social_status?: string | null
          domino_statement?: string | null
          failed_solutions?: string | null
          hidden_specific_desires?: string | null
          id?: string
          insecurities?: string | null
          market_awareness?: string | null
          market_sophistication?: string | null
          mindset?: string | null
          name?: string
          notes?: string | null
          objections?: string | null
          product_help_achieve_status?: string | null
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          is_superuser: boolean | null
          last_active: string | null
          name: string | null
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          is_superuser?: boolean | null
          last_active?: string | null
          name?: string | null
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          is_superuser?: boolean | null
          last_active?: string | null
          name?: string | null
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      task_attachments: {
        Row: {
          file_path: string
          file_size: number | null
          file_type: string | null
          file_url: string
          filename: string
          id: string
          task_id: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          file_path: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          filename: string
          id?: string
          task_id: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          filename?: string
          id?: string
          task_id?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee: string | null
          attachments: Json | null
          category: string | null
          child_count: number | null
          completed_child_count: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          links: Json | null
          notes: string | null
          parent_task_id: string | null
          priority: string | null
          project_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee?: string | null
          attachments?: Json | null
          category?: string | null
          child_count?: number | null
          completed_child_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          links?: Json | null
          notes?: string | null
          parent_task_id?: string | null
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee?: string | null
          attachments?: Json | null
          category?: string | null
          child_count?: number | null
          completed_child_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          links?: Json | null
          notes?: string | null
          parent_task_id?: string | null
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      creative_library: {
        Row: {
          angle: string | null
          call_to_action: string | null
          concept: string | null
          created_at: string | null
          created_by: string | null
          creative_category: string | null
          creative_type: string | null
          headline: string | null
          hook: string | null
          hook_pattern: string | null
          id: string | null
          image_url: string | null
          is_template: boolean | null
          performance_notes: string | null
          platform: string | null
          primary_copy: string | null
          project_id: string | null
          project_name: string | null
          psychology_trigger: string | null
          remix_potential: string | null
          scalability_notes: string | null
          status: string | null
          tags: string[] | null
          target_emotion: string | null
          template_variables: string | null
          title: string | null
          updated_at: string | null
          video_url: string | null
          visual_style: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creative_intelligence_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      update_user_last_active: {
        Args: { user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

