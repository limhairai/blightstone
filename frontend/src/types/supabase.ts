export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ad_account_applications: {
        Row: {
          account_name: string
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          assigned_account_id: string | null
          business_id: string
          campaign_description: string | null
          created_at: string
          facebook_page_url: string | null
          id: string
          landing_page_url: string | null
          notes: string | null
          organization_id: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          spend_limit: number | null
          status: string
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_account_id?: string | null
          business_id: string
          campaign_description?: string | null
          created_at?: string
          facebook_page_url?: string | null
          id?: string
          landing_page_url?: string | null
          notes?: string | null
          organization_id: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          spend_limit?: number | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_account_id?: string | null
          business_id?: string
          campaign_description?: string | null
          created_at?: string
          facebook_page_url?: string | null
          id?: string
          landing_page_url?: string | null
          notes?: string | null
          organization_id?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          spend_limit?: number | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_account_applications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_account_applications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_accounts: {
        Row: {
          account_id: string
          balance: number | null
          business_id: string | null
          created_at: string | null
          id: string
          last_activity: string | null
          name: string
          platform: string
          spend_limit: number | null
          spent: number | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_id: string
          balance?: number | null
          business_id?: string | null
          created_at?: string | null
          id?: string
          last_activity?: string | null
          name: string
          platform?: string
          spend_limit?: number | null
          spent?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string
          balance?: number | null
          business_id?: string | null
          created_at?: string | null
          id?: string
          last_activity?: string | null
          name?: string
          platform?: string
          spend_limit?: number | null
          spent?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_accounts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      application_notifications: {
        Row: {
          application_id: string
          created_at: string
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_notifications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "ad_account_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          organization_id: string
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          organization_id: string
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          organization_id?: string
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_domains: {
        Row: {
          business_id: string
          created_at: string
          domain_name: string
          id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          domain_name: string
          id?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          domain_name?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_domains_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          business_id: string | null
          business_type: string | null
          country: string | null
          created_at: string
          id: string
          landing_page: string | null
          name: string
          organization_id: string
          status: string | null
          timezone: string | null
          updated_at: string
          verification: string | null
          website: string | null
          website_url: string | null
        }
        Insert: {
          business_id?: string | null
          business_type?: string | null
          country?: string | null
          created_at?: string
          id?: string
          landing_page?: string | null
          name: string
          organization_id: string
          status?: string | null
          timezone?: string | null
          updated_at?: string
          verification?: string | null
          website?: string | null
          website_url?: string | null
        }
        Update: {
          business_id?: string | null
          business_type?: string | null
          country?: string | null
          created_at?: string
          id?: string
          landing_page?: string | null
          name?: string
          organization_id?: string
          status?: string | null
          timezone?: string | null
          updated_at?: string
          verification?: string | null
          website?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          description: string | null
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          invoice_pdf_url: string | null
          organization_id: string
          paid_at: string | null
          status: string
          stripe_invoice_id: string | null
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          invoice_pdf_url?: string | null
          organization_id: string
          paid_at?: string | null
          status: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          invoice_pdf_url?: string | null
          organization_id?: string
          paid_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_business_managers: {
        Row: {
          business_manager_id: string
          business_manager_name: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          business_manager_id: string
          business_manager_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          business_manager_id?: string
          business_manager_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_business_managers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          joined_at: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          joined_at?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_telegram_groups: {
        Row: {
          added_by_user_id: string | null
          created_at: string | null
          group_name: string | null
          group_type: string | null
          id: string
          is_active: boolean | null
          organization_id: string
          telegram_group_id: number
          updated_at: string | null
        }
        Insert: {
          added_by_user_id?: string | null
          created_at?: string | null
          group_name?: string | null
          group_type?: string | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          telegram_group_id: number
          updated_at?: string | null
        }
        Update: {
          added_by_user_id?: string | null
          created_at?: string | null
          group_name?: string | null
          group_type?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          telegram_group_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_telegram_groups_added_by_user_id_fkey"
            columns: ["added_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_telegram_groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          ad_spend_monthly: string | null
          avatar_url: string | null
          balance: number
          created_at: string
          current_ad_accounts_count: number
          current_businesses_count: number
          current_monthly_spend_cents: number
          current_team_members_count: number
          id: string
          last_payment_at: string | null
          monthly_spent: number
          name: string
          owner_id: string
          plan_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_subscription_status: string | null
          support_channel_contact: string | null
          support_channel_type: string | null
          telegram_alert_thresholds: Json | null
          telegram_alerts_enabled: boolean | null
          total_spent: number
          updated_at: string
          verification_status: string
        }
        Insert: {
          ad_spend_monthly?: string | null
          avatar_url?: string | null
          balance?: number
          created_at?: string
          current_ad_accounts_count?: number
          current_businesses_count?: number
          current_monthly_spend_cents?: number
          current_team_members_count?: number
          id?: string
          last_payment_at?: string | null
          monthly_spent?: number
          name: string
          owner_id: string
          plan_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_subscription_status?: string | null
          support_channel_contact?: string | null
          support_channel_type?: string | null
          telegram_alert_thresholds?: Json | null
          telegram_alerts_enabled?: boolean | null
          total_spent?: number
          updated_at?: string
          verification_status?: string
        }
        Update: {
          ad_spend_monthly?: string | null
          avatar_url?: string | null
          balance?: number
          created_at?: string
          current_ad_accounts_count?: number
          current_businesses_count?: number
          current_monthly_spend_cents?: number
          current_team_members_count?: number
          id?: string
          last_payment_at?: string | null
          monthly_spent?: number
          name?: string
          owner_id?: string
          plan_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_subscription_status?: string | null
          support_channel_contact?: string | null
          support_channel_type?: string | null
          telegram_alert_thresholds?: Json | null
          telegram_alerts_enabled?: boolean | null
          total_spent?: number
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_organizations_plan_id"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          brand: string | null
          created_at: string
          expiry_month: number | null
          expiry_year: number | null
          id: string
          is_active: boolean
          is_default: boolean
          last4: string | null
          organization_id: string
          stripe_payment_method_id: string
          type: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          expiry_month?: number | null
          expiry_year?: number | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          last4?: string | null
          organization_id: string
          stripe_payment_method_id: string
          type: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          expiry_month?: number | null
          expiry_year?: number | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          last4?: string | null
          organization_id?: string
          stripe_payment_method_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          ad_account_pool_limit: number
          ad_spend_fee_percentage: number
          created_at: string
          features: Json
          id: string
          is_active: boolean
          max_ad_accounts: number
          max_businesses: number
          max_monthly_spend_cents: number
          max_team_members: number
          monthly_subscription_fee_cents: number
          name: string
          stripe_price_id: string | null
          trial_days: number
          unlimited_replacements: boolean
          updated_at: string
        }
        Insert: {
          ad_account_pool_limit?: number
          ad_spend_fee_percentage?: number
          created_at?: string
          features?: Json
          id: string
          is_active?: boolean
          max_ad_accounts?: number
          max_businesses?: number
          max_monthly_spend_cents?: number
          max_team_members?: number
          monthly_subscription_fee_cents?: number
          name: string
          stripe_price_id?: string | null
          trial_days?: number
          unlimited_replacements?: boolean
          updated_at?: string
        }
        Update: {
          ad_account_pool_limit?: number
          ad_spend_fee_percentage?: number
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          max_ad_accounts?: number
          max_businesses?: number
          max_monthly_spend_cents?: number
          max_team_members?: number
          monthly_subscription_fee_cents?: number
          name?: string
          stripe_price_id?: string | null
          trial_days?: number
          unlimited_replacements?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          is_superuser: boolean
          name: string | null
          role: string
          telegram_id: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          is_superuser?: boolean
          name?: string | null
          role?: string
          telegram_id?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_superuser?: boolean
          name?: string | null
          role?: string
          telegram_id?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          organization_id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: string
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          organization_id: string
          role?: string
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_notifications: {
        Row: {
          account_id: string | null
          acknowledged: boolean | null
          acknowledged_at: string | null
          alert_type: string
          created_at: string | null
          id: string
          message: string
          organization_id: string
          sent_to_telegram_ids: number[]
        }
        Insert: {
          account_id?: string | null
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          alert_type: string
          created_at?: string | null
          id?: string
          message: string
          organization_id: string
          sent_to_telegram_ids?: number[]
        }
        Update: {
          account_id?: string | null
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          alert_type?: string
          created_at?: string | null
          id?: string
          message?: string
          organization_id?: string
          sent_to_telegram_ids?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "telegram_notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_cents: number
          business_id: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          organization_id: string
          status: string
          transaction_date: string
          type: string
          updated_at: string
          wallet_id: string
        }
        Insert: {
          amount_cents: number
          business_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          status?: string
          transaction_date?: string
          type: string
          updated_at?: string
          wallet_id: string
        }
        Update: {
          amount_cents?: number
          business_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          status?: string
          transaction_date?: string
          type?: string
          updated_at?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          ad_accounts_count: number
          businesses_count: number
          created_at: string
          id: string
          monthly_spend_cents: number
          organization_id: string
          period_end: string
          period_start: string
          team_members_count: number
          updated_at: string
        }
        Insert: {
          ad_accounts_count?: number
          businesses_count?: number
          created_at?: string
          id?: string
          monthly_spend_cents?: number
          organization_id: string
          period_end: string
          period_start: string
          team_members_count?: number
          updated_at?: string
        }
        Update: {
          ad_accounts_count?: number
          businesses_count?: number
          created_at?: string
          id?: string
          monthly_spend_cents?: number
          organization_id?: string
          period_end?: string
          period_start?: string
          team_members_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance_cents: number
          created_at: string
          currency: string
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          balance_cents?: number
          created_at?: string
          currency?: string
          id?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          balance_cents?: number
          created_at?: string
          currency?: string
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      application_stats: {
        Row: {
          approval_rate: number | null
          approved_applications: number | null
          avg_processing_hours: number | null
          pending_applications: number | null
          rejected_applications: number | null
          total_applications: number | null
          under_review_applications: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_user_to_demo_org: {
        Args: { user_email: string }
        Returns: string
      }
      check_organization_limits: {
        Args: { org_id: string; resource_type: string }
        Returns: boolean
      }
      get_organization_financial_summary: {
        Args: { org_id: string }
        Returns: {
          balance: number
          total_spent: number
          monthly_spent: number
          total_accounts: number
          active_accounts: number
          total_account_balance: number
        }[]
      }
      seed_demo_data_for_current_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      setup_demo_for_user: {
        Args: { user_email: string }
        Returns: string
      }
      update_organization_balance: {
        Args: { org_id: string; amount: number; operation?: string }
        Returns: number
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
