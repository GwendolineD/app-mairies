WARN: config section [inbucket] is deprecated. Please use [local_smtp] instead.
Connecting to db 5432
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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
      analytics_events: {
        Row: {
          commune_id: string | null
          created_at: string
          event_name: string
          id: string
          properties: Json
          user_id: string | null
        }
        Insert: {
          commune_id?: string | null
          created_at?: string
          event_name: string
          id?: string
          properties?: Json
          user_id?: string | null
        }
        Update: {
          commune_id?: string | null
          created_at?: string
          event_name?: string
          id?: string
          properties?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_categories: {
        Row: {
          color_hex: string
          default_image_url: string | null
          icon_name: string | null
          label: string
          map_pin_url: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          color_hex?: string
          default_image_url?: string | null
          icon_name?: string | null
          label: string
          map_pin_url?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          color_hex?: string
          default_image_url?: string | null
          icon_name?: string | null
          label?: string
          map_pin_url?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      announcements: {
        Row: {
          address_city: string | null
          address_citycode: string | null
          address_lat: number | null
          address_lng: number | null
          address_postcode: string | null
          address_street: string | null
          archived_at: string | null
          author_membership_id: string
          category_slug: string
          commune_id: string
          created_at: string
          description: string | null
          expired_notified_at: string | null
          expiring_soon_sent_at: string | null
          id: string
          photo_url: string | null
          stale_nudge_sent_at: string | null
          status: Database["public"]["Enums"]["announcement_status"]
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          target_date: string | null
          title: string
          type: Database["public"]["Enums"]["announcement_type"]
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_citycode?: string | null
          address_lat?: number | null
          address_lng?: number | null
          address_postcode?: string | null
          address_street?: string | null
          archived_at?: string | null
          author_membership_id: string
          category_slug: string
          commune_id: string
          created_at?: string
          description?: string | null
          expired_notified_at?: string | null
          expiring_soon_sent_at?: string | null
          id?: string
          photo_url?: string | null
          stale_nudge_sent_at?: string | null
          status?: Database["public"]["Enums"]["announcement_status"]
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          target_date?: string | null
          title: string
          type: Database["public"]["Enums"]["announcement_type"]
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_citycode?: string | null
          address_lat?: number | null
          address_lng?: number | null
          address_postcode?: string | null
          address_street?: string | null
          archived_at?: string | null
          author_membership_id?: string
          category_slug?: string
          commune_id?: string
          created_at?: string
          description?: string | null
          expired_notified_at?: string | null
          expiring_soon_sent_at?: string | null
          id?: string
          photo_url?: string | null
          stale_nudge_sent_at?: string | null
          status?: Database["public"]["Enums"]["announcement_status"]
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          target_date?: string | null
          title?: string
          type?: Database["public"]["Enums"]["announcement_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_membership_id_fkey"
            columns: ["author_membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "announcement_categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "announcements_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
        ]
      }
      banned_emails: {
        Row: {
          banned_at: string
          banned_by: string | null
          email: string
          reason: string | null
        }
        Insert: {
          banned_at?: string
          banned_by?: string | null
          email: string
          reason?: string | null
        }
        Update: {
          banned_at?: string
          banned_by?: string | null
          email?: string
          reason?: string | null
        }
        Relationships: []
      }
      cancellation_requests: {
        Row: {
          comment: string
          commune_id: string
          created_at: string
          id: string
          requested_by_user_id: string
          subscription_id: string | null
        }
        Insert: {
          comment: string
          commune_id: string
          created_at?: string
          id?: string
          requested_by_user_id: string
          subscription_id?: string | null
        }
        Update: {
          comment?: string
          commune_id?: string
          created_at?: string
          id?: string
          requested_by_user_id?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_requests_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellation_requests_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: true
            referencedRelation: "commune_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      commune_email_templates: {
        Row: {
          body_markdown: string
          commune_id: string
          created_at: string
          cta_label: string
          id: string
          preheader: string | null
          subject: string
          template_key: string
          updated_at: string
        }
        Insert: {
          body_markdown: string
          commune_id: string
          created_at?: string
          cta_label?: string
          id?: string
          preheader?: string | null
          subject: string
          template_key: string
          updated_at?: string
        }
        Update: {
          body_markdown?: string
          commune_id?: string
          created_at?: string
          cta_label?: string
          id?: string
          preheader?: string | null
          subject?: string
          template_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commune_email_templates_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
        ]
      }
      commune_interest_leads: {
        Row: {
          commune_id: string | null
          created_at: string
          email: string
          id: string
          insee_code: string | null
          message: string | null
          metadata: Json
        }
        Insert: {
          commune_id?: string | null
          created_at?: string
          email: string
          id?: string
          insee_code?: string | null
          message?: string | null
          metadata?: Json
        }
        Update: {
          commune_id?: string | null
          created_at?: string
          email?: string
          id?: string
          insee_code?: string | null
          message?: string | null
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "commune_interest_leads_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
        ]
      }
      commune_payments: {
        Row: {
          amount_cents: number
          commune_id: string
          created_at: string
          currency: string
          id: string
          note: string | null
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount_cents: number
          commune_id: string
          created_at?: string
          currency?: string
          id?: string
          note?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount_cents?: number
          commune_id?: string
          created_at?: string
          currency?: string
          id?: string
          note?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "commune_payments_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
        ]
      }
      commune_subscriptions: {
        Row: {
          amount_cents: number
          auto_renew: boolean
          commune_id: string
          created_at: string
          ends_at: string
          id: string
          paid_at: string | null
          payment_method: string | null
          payment_status: string
          starts_at: string
        }
        Insert: {
          amount_cents: number
          auto_renew?: boolean
          commune_id: string
          created_at?: string
          ends_at: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          starts_at: string
        }
        Update: {
          amount_cents?: number
          auto_renew?: boolean
          commune_id?: string
          created_at?: string
          ends_at?: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commune_subscriptions_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
        ]
      }
      communes: {
        Row: {
          access_status: Database["public"]["Enums"]["access_status"]
          billing_email: string | null
          centroid_lat: number | null
          centroid_lng: number | null
          created_at: string
          department: string | null
          id: string
          insee_code: string
          mairie_address_city: string | null
          mairie_address_lat: number | null
          mairie_address_lng: number | null
          mairie_address_postcode: string | null
          mairie_address_street: string | null
          monthly_amount_cents: number
          name: string
          plan: Database["public"]["Enums"]["commune_plan"]
          postcode: string | null
          settings: Json
          subscribed_since: string | null
          subscription_ends_at: string | null
          subscription_paid: boolean
          subscription_started_at: string | null
          suspended_at: string | null
          suspension_reason: string | null
          trial_access_code: string | null
          trial_max_members: number
          updated_at: string
        }
        Insert: {
          access_status?: Database["public"]["Enums"]["access_status"]
          billing_email?: string | null
          centroid_lat?: number | null
          centroid_lng?: number | null
          created_at?: string
          department?: string | null
          id?: string
          insee_code: string
          mairie_address_city?: string | null
          mairie_address_lat?: number | null
          mairie_address_lng?: number | null
          mairie_address_postcode?: string | null
          mairie_address_street?: string | null
          monthly_amount_cents?: number
          name: string
          plan?: Database["public"]["Enums"]["commune_plan"]
          postcode?: string | null
          settings?: Json
          subscribed_since?: string | null
          subscription_ends_at?: string | null
          subscription_paid?: boolean
          subscription_started_at?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          trial_access_code?: string | null
          trial_max_members?: number
          updated_at?: string
        }
        Update: {
          access_status?: Database["public"]["Enums"]["access_status"]
          billing_email?: string | null
          centroid_lat?: number | null
          centroid_lng?: number | null
          created_at?: string
          department?: string | null
          id?: string
          insee_code?: string
          mairie_address_city?: string | null
          mairie_address_lat?: number | null
          mairie_address_lng?: number | null
          mairie_address_postcode?: string | null
          mairie_address_street?: string | null
          monthly_amount_cents?: number
          name?: string
          plan?: Database["public"]["Enums"]["commune_plan"]
          postcode?: string | null
          settings?: Json
          subscribed_since?: string | null
          subscription_ends_at?: string | null
          subscription_paid?: boolean
          subscription_started_at?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          trial_access_code?: string | null
          trial_max_members?: number
          updated_at?: string
        }
        Relationships: []
      }
      content_categories: {
        Row: {
          icon_url: string | null
          label: string
          map_pin_url: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          icon_url?: string | null
          label: string
          map_pin_url?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          icon_url?: string | null
          label?: string
          map_pin_url?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          archived_at: string | null
          conversation_id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          conversation_id: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          archived_at?: string | null
          conversation_id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          commune_id: string
          context_id: string | null
          context_type: Database["public"]["Enums"]["context_type"] | null
          created_at: string
          created_by_user_id: string
          id: string
          last_message_at: string | null
          last_message_id: string | null
          last_message_preview: string | null
          last_message_sender_id: string | null
          participant_a: string | null
          participant_b: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          commune_id: string
          context_id?: string | null
          context_type?: Database["public"]["Enums"]["context_type"] | null
          created_at?: string
          created_by_user_id: string
          id?: string
          last_message_at?: string | null
          last_message_id?: string | null
          last_message_preview?: string | null
          last_message_sender_id?: string | null
          participant_a?: string | null
          participant_b?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          commune_id?: string
          context_id?: string | null
          context_type?: Database["public"]["Enums"]["context_type"] | null
          created_at?: string
          created_by_user_id?: string
          id?: string
          last_message_at?: string | null
          last_message_id?: string | null
          last_message_preview?: string | null
          last_message_sender_id?: string | null
          participant_a?: string | null
          participant_b?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string
          description: string | null
          slug: string
          subject: string
          updated_at: string
        }
        Insert: {
          body_html: string
          description?: string | null
          slug: string
          subject: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          description?: string | null
          slug?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_participants: {
        Row: {
          created_at: string
          event_id: string
          id: string
          membership_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          membership_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          membership_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      event_volunteers: {
        Row: {
          created_at: string
          event_id: string
          id: string
          membership_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          membership_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          membership_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_volunteers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_volunteers_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address_label: string | null
          address_lat: number | null
          address_lng: number | null
          author_membership_id: string
          category_slug: string | null
          commune_id: string
          created_at: string
          description: string | null
          ends_at: string
          id: string
          is_official: boolean
          photo_url: string | null
          source_initiative_id: string | null
          starts_at: string
          status: Database["public"]["Enums"]["content_status"]
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          title: string
          updated_at: string
          volunteers_needed: number | null
        }
        Insert: {
          address_label?: string | null
          address_lat?: number | null
          address_lng?: number | null
          author_membership_id: string
          category_slug?: string | null
          commune_id: string
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          is_official?: boolean
          photo_url?: string | null
          source_initiative_id?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["content_status"]
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          title: string
          updated_at?: string
          volunteers_needed?: number | null
        }
        Update: {
          address_label?: string | null
          address_lat?: number | null
          address_lng?: number | null
          author_membership_id?: string
          category_slug?: string | null
          commune_id?: string
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          is_official?: boolean
          photo_url?: string | null
          source_initiative_id?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["content_status"]
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          title?: string
          updated_at?: string
          volunteers_needed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_author_membership_id_fkey"
            columns: ["author_membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "initiative_event_categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "events_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_source_initiative_id_fkey"
            columns: ["source_initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      initiative_event_categories: {
        Row: {
          color_hex: string
          default_image_url: string | null
          icon_name: string | null
          label: string
          map_pin_url: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          color_hex?: string
          default_image_url?: string | null
          icon_name?: string | null
          label: string
          map_pin_url?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          color_hex?: string
          default_image_url?: string | null
          icon_name?: string | null
          label?: string
          map_pin_url?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      initiative_responses: {
        Row: {
          created_at: string
          id: string
          initiative_id: string
          membership_id: string
          note: string | null
          response_type: Database["public"]["Enums"]["initiative_response_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          initiative_id: string
          membership_id: string
          note?: string | null
          response_type: Database["public"]["Enums"]["initiative_response_type"]
        }
        Update: {
          created_at?: string
          id?: string
          initiative_id?: string
          membership_id?: string
          note?: string | null
          response_type?: Database["public"]["Enums"]["initiative_response_type"]
        }
        Relationships: [
          {
            foreignKeyName: "initiative_responses_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiative_responses_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      initiatives: {
        Row: {
          address_label: string | null
          address_lat: number | null
          address_lng: number | null
          author_membership_id: string
          category_slug: string
          commune_id: string
          created_at: string
          date_mode: Database["public"]["Enums"]["initiative_date_mode"]
          description: string | null
          id: string
          location_label: string | null
          photo_url: string | null
          recurrence_rule: Json | null
          single_ends_at: string | null
          single_starts_at: string | null
          status: Database["public"]["Enums"]["content_status"]
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          title: string
          updated_at: string
        }
        Insert: {
          address_label?: string | null
          address_lat?: number | null
          address_lng?: number | null
          author_membership_id: string
          category_slug?: string
          commune_id: string
          created_at?: string
          date_mode?: Database["public"]["Enums"]["initiative_date_mode"]
          description?: string | null
          id?: string
          location_label?: string | null
          photo_url?: string | null
          recurrence_rule?: Json | null
          single_ends_at?: string | null
          single_starts_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          address_label?: string | null
          address_lat?: number | null
          address_lng?: number | null
          author_membership_id?: string
          category_slug?: string
          commune_id?: string
          created_at?: string
          date_mode?: Database["public"]["Enums"]["initiative_date_mode"]
          description?: string | null
          id?: string
          location_label?: string | null
          photo_url?: string | null
          recurrence_rule?: Json | null
          single_ends_at?: string | null
          single_starts_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "initiatives_author_membership_id_fkey"
            columns: ["author_membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiatives_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "initiative_event_categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "initiatives_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          content_html: string
          content_json: Json
          published_at: string | null
          slug: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          content_html?: string
          content_json?: Json
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          content_html?: string
          content_json?: Json
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      memberships: {
        Row: {
          address_city: string | null
          address_citycode: string | null
          address_lat: number | null
          address_lieu_dit: string | null
          address_lng: number | null
          address_postcode: string | null
          address_street: string | null
          commune_id: string
          created_at: string
          id: string
          is_primary: boolean
          role: Database["public"]["Enums"]["membership_role"]
          status: Database["public"]["Enums"]["membership_status"]
          suspended_at: string | null
          suspension_reason: string | null
          total_announcements_published: number
          total_events_published: number
          total_initiatives_published: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address_city?: string | null
          address_citycode?: string | null
          address_lat?: number | null
          address_lieu_dit?: string | null
          address_lng?: number | null
          address_postcode?: string | null
          address_street?: string | null
          commune_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
          role?: Database["public"]["Enums"]["membership_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          suspended_at?: string | null
          suspension_reason?: string | null
          total_announcements_published?: number
          total_events_published?: number
          total_initiatives_published?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address_city?: string | null
          address_citycode?: string | null
          address_lat?: number | null
          address_lieu_dit?: string | null
          address_lng?: number | null
          address_postcode?: string | null
          address_street?: string | null
          commune_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          role?: Database["public"]["Enums"]["membership_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          suspended_at?: string | null
          suspension_reason?: string | null
          total_announcements_published?: number
          total_events_published?: number
          total_initiatives_published?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          edited_at: string | null
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action: Database["public"]["Enums"]["moderation_action_type"]
          actor_user_id: string
          commune_id: string | null
          created_at: string
          id: string
          reason: string | null
          related_report_id: string | null
          target_id: string
          target_type: Database["public"]["Enums"]["moderation_target_type"]
        }
        Insert: {
          action: Database["public"]["Enums"]["moderation_action_type"]
          actor_user_id: string
          commune_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          related_report_id?: string | null
          target_id: string
          target_type: Database["public"]["Enums"]["moderation_target_type"]
        }
        Update: {
          action?: Database["public"]["Enums"]["moderation_action_type"]
          actor_user_id?: string
          commune_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          related_report_id?: string | null
          target_id?: string
          target_type?: Database["public"]["Enums"]["moderation_target_type"]
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_related_report_id_fkey"
            columns: ["related_report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_appeals: {
        Row: {
          appellant_user_id: string
          body: string
          created_at: string
          id: string
          report_id: string
          reviewed_at: string | null
          reviewer_user_id: string | null
          status: Database["public"]["Enums"]["appeal_status"]
        }
        Insert: {
          appellant_user_id: string
          body: string
          created_at?: string
          id?: string
          report_id: string
          reviewed_at?: string | null
          reviewer_user_id?: string | null
          status?: Database["public"]["Enums"]["appeal_status"]
        }
        Update: {
          appellant_user_id?: string
          body?: string
          created_at?: string
          id?: string
          report_id?: string
          reviewed_at?: string | null
          reviewer_user_id?: string | null
          status?: Database["public"]["Enums"]["appeal_status"]
        }
        Relationships: [
          {
            foreignKeyName: "moderation_appeals_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      neighbor_invites: {
        Row: {
          accepted_at: string | null
          commune_id: string
          created_at: string
          email: string
          expires_at: string | null
          id: string
          inviter_membership_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          commune_id: string
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          inviter_membership_id: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          commune_id?: string
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          inviter_membership_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "neighbor_invites_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neighbor_invites_inviter_membership_id_fkey"
            columns: ["inviter_membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          payload: Json
          read_at: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: number
          support_email: string
          updated_at: string
        }
        Insert: {
          id?: number
          support_email?: string
          updated_at?: string
        }
        Update: {
          id?: number
          support_email?: string
          updated_at?: string
        }
        Relationships: []
      }
      profile_notification_preferences: {
        Row: {
          announcement_notifications_enabled: boolean
          initiative_notifications_enabled: boolean
          message_notifications_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          announcement_notifications_enabled?: boolean
          initiative_notifications_enabled?: boolean
          message_notifications_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          announcement_notifications_enabled?: boolean
          initiative_notifications_enabled?: boolean
          message_notifications_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_commune_id: string | null
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          banned_by: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          has_seen_onboarding: boolean
          is_platform_admin: boolean
          last_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_commune_id?: string | null
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          has_seen_onboarding?: boolean
          is_platform_admin?: boolean
          last_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_commune_id?: string | null
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          has_seen_onboarding?: boolean
          is_platform_admin?: boolean
          last_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_commune_id_fkey"
            columns: ["active_commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          commune_id: string
          context_id: string
          context_type: Database["public"]["Enums"]["context_type"]
          created_at: string
          id: string
          reason: string
          reporter_membership_id: string
          resolution: Database["public"]["Enums"]["report_resolution"] | null
          restored_at: string | null
          restored_by_user_id: string | null
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          commune_id: string
          context_id: string
          context_type: Database["public"]["Enums"]["context_type"]
          created_at?: string
          id?: string
          reason: string
          reporter_membership_id: string
          resolution?: Database["public"]["Enums"]["report_resolution"] | null
          restored_at?: string | null
          restored_by_user_id?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          commune_id?: string
          context_id?: string
          context_type?: Database["public"]["Enums"]["context_type"]
          created_at?: string
          id?: string
          reason?: string
          reporter_membership_id?: string
          resolution?: Database["public"]["Enums"]["report_resolution"] | null
          restored_at?: string | null
          restored_by_user_id?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_membership_id_fkey"
            columns: ["reporter_membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      support_requests: {
        Row: {
          admin_comment: string | null
          commune_id: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          membership_id: string | null
          message: string
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          status: Database["public"]["Enums"]["support_request_status"]
          subject: string
          user_email: string
          user_id: string
        }
        Insert: {
          admin_comment?: string | null
          commune_id?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          membership_id?: string | null
          message: string
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          status?: Database["public"]["Enums"]["support_request_status"]
          subject: string
          user_email: string
          user_id: string
        }
        Update: {
          admin_comment?: string | null
          commune_id?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          membership_id?: string | null
          message?: string
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          status?: Database["public"]["Enums"]["support_request_status"]
          subject?: string
          user_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_requests_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_requests_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_preferences: {
        Row: {
          created_at: string
          notify_message_announcement: boolean
          notify_message_event: boolean
          notify_message_initiative: boolean
          notify_new_announcement: boolean
          notify_new_event: boolean
          notify_new_initiative: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          notify_message_announcement?: boolean
          notify_message_event?: boolean
          notify_message_initiative?: boolean
          notify_new_announcement?: boolean
          notify_new_event?: boolean
          notify_new_initiative?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          notify_message_announcement?: boolean
          notify_message_event?: boolean
          notify_message_initiative?: boolean
          notify_new_announcement?: boolean
          notify_new_event?: boolean
          notify_new_initiative?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_commune_overview: {
        Args: never
        Returns: {
          announcement_count: number
          billing_email: string
          created_at: string
          department: string
          event_count: number
          id: string
          initiative_count: number
          insee_code: string
          last_payment_at: string
          monthly_amount_cents: number
          name: string
          paid_revenue_cents: number
          pending_revenue_cents: number
          plan: Database["public"]["Enums"]["commune_plan"]
          postcode: string
          resident_count: number
          subscription_status: Database["public"]["Enums"]["access_status"]
          suspended_at: string
        }[]
      }
      admin_commune_users: {
        Args: { p_commune_id: string }
        Returns: {
          address_label: string
          announcement_count: number
          display_name: string
          email: string
          first_name: string
          is_banned: boolean
          joined_at: string
          last_name: string
          membership_id: string
          membership_status: Database["public"]["Enums"]["membership_status"]
          role: Database["public"]["Enums"]["membership_role"]
          user_id: string
        }[]
      }
      admin_platform_stats: { Args: never; Returns: Json }
      can_access_commune_content: {
        Args: { p_commune_id: string }
        Returns: boolean
      }
      can_add_conversation_participant: {
        Args: { p_conversation_id: string }
        Returns: boolean
      }
      commune_dashboard_monthly: {
        Args: { p_commune_id: string }
        Returns: {
          demandes: number
          events: number
          initiatives: number
          month: string
          new_members: number
          offres: number
        }[]
      }
      get_conversation_inbox: {
        Args: { p_commune_id: string }
        Returns: {
          context_id: string
          context_type: Database["public"]["Enums"]["context_type"]
          conversation_id: string
          last_message_body: string
          last_message_created_at: string
          last_message_sender_id: string
          other_avatar_url: string
          other_display_name: string
          other_first_name: string
          other_last_name: string
          other_user_id: string
          title: string
          unread_count: number
          updated_at: string
        }[]
      }
      get_or_create_context_conversation: {
        Args: {
          p_context_id: string
          p_context_type: Database["public"]["Enums"]["context_type"]
        }
        Returns: string
      }
      get_unread_message_count: {
        Args: { p_commune_id: string }
        Returns: number
      }
      has_active_membership: {
        Args: { p_commune_id: string }
        Returns: boolean
      }
      increment_membership_counter: {
        Args: { p_column_name: string; p_membership_id: string }
        Returns: undefined
      }
      is_conversation_participant: {
        Args: { p_conversation_id: string }
        Returns: boolean
      }
      is_municipality_staff_for_commune: {
        Args: { p_commune_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      list_my_conversations: {
        Args: { p_archived?: boolean; p_commune_id: string }
        Returns: {
          archived_at: string
          context_available: boolean
          context_id: string
          context_photo_url: string
          context_type: Database["public"]["Enums"]["context_type"]
          conversation_id: string
          last_message_at: string
          last_message_preview: string
          last_message_sender_id: string
          last_read_at: string
          other_avatar_url: string
          other_display_name: string
          other_user_id: string
          title: string
          unread_count: number
          updated_at: string
        }[]
      }
      owns_active_membership: {
        Args: { p_membership_id: string }
        Returns: boolean
      }
      share_active_commune_with: {
        Args: { p_other_user_id: string }
        Returns: boolean
      }
      uuid_generate_v4: { Args: never; Returns: string }
      validate_trial_access_code: {
        Args: { p_code: string; p_commune_id: string }
        Returns: boolean
      }
    }
    Enums: {
      access_status: "inactive" | "trial" | "active" | "suspended"
      announcement_status: "ouverte" | "pourvue" | "archivee" | "expiree"
      announcement_type: "demande" | "offre"
      appeal_status: "pending" | "reviewed"
      commune_plan: "free" | "standard" | "premium"
      content_status: "active" | "archived"
      context_type: "announcement" | "initiative" | "event" | "user"
      initiative_date_mode: "none" | "once" | "recurring"
      initiative_response_type: "support" | "volunteer"
      membership_role: "member" | "staff" | "mayor"
      membership_status: "active" | "suspended" | "left"
      moderation_action_type: "suspend" | "reactivate" | "ban" | "unban"
      moderation_target_type:
        | "announcement"
        | "initiative"
        | "event"
        | "membership"
        | "user"
      payment_status: "paid" | "pending" | "failed" | "refunded"
      report_resolution: "content_suspended" | "user_suspended" | "dismissed"
      report_status: "pending" | "reviewed" | "dismissed"
      support_request_status: "new" | "in_progress" | "resolved" | "dismissed"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      access_status: ["inactive", "trial", "active", "suspended"],
      announcement_status: ["ouverte", "pourvue", "archivee", "expiree"],
      announcement_type: ["demande", "offre"],
      appeal_status: ["pending", "reviewed"],
      commune_plan: ["free", "standard", "premium"],
      content_status: ["active", "archived"],
      context_type: ["announcement", "initiative", "event", "user"],
      initiative_date_mode: ["none", "once", "recurring"],
      initiative_response_type: ["support", "volunteer"],
      membership_role: ["member", "staff", "mayor"],
      membership_status: ["active", "suspended", "left"],
      moderation_action_type: ["suspend", "reactivate", "ban", "unban"],
      moderation_target_type: [
        "announcement",
        "initiative",
        "event",
        "membership",
        "user",
      ],
      payment_status: ["paid", "pending", "failed", "refunded"],
      report_resolution: ["content_suspended", "user_suspended", "dismissed"],
      report_status: ["pending", "reviewed", "dismissed"],
      support_request_status: ["new", "in_progress", "resolved", "dismissed"],
    },
  },
} as const

