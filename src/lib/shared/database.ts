export type Locale = "ar" | "fr";

export const ZINGO_SUPPORT_EMAIL = "Zingobuisness@gmail.com";

export type AppRole = "customer" | "professional" | "admin";
export type ProfessionalReviewStatus =
  "draft" | "submitted" | "approved" | "rejected";
export type CustomerGender = "MALE" | "FEMALE";
export type EstablishmentAudience = "MALE" | "FEMALE" | "MIXED";

/** Database types for the identity-only schema in the first Supabase migration. */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          display_name: string | null;
          preferred_locale: Locale;
          preferred_wilaya_code: number | null;
          preferred_commune_code: number | null;
          gender: CustomerGender | null;
          onboarding_completed_at: string | null;
          created_at: string;
        };
        Insert: never;
        Update: {
          display_name?: string | null;
          preferred_locale?: Locale;
          preferred_wilaya_code?: number | null;
          preferred_commune_code?: number | null;
          gender?: CustomerGender | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          user_id: string;
          role: AppRole;
          granted_at: string;
          granted_by: string | null;
          grant_source:
            | "legacy"
            | "customer_signup"
            | "professional_onboarding"
            | "trusted_operator";
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      customer_favorites: {
        Row: {
          customer_id: string;
          establishment_id: string;
          created_at: string;
        };
        Insert: {
          customer_id: string;
          establishment_id: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      professional_profiles: {
        Row: {
          user_id: string;
          professional_id: number;
          display_name: string | null;
          contact_phone: string | null;
          biography: string | null;
          profile_image_ref: string | null;
          review_status: ProfessionalReviewStatus;
          publication_status: "private" | "published" | "suspended";
          submitted_at: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_name?: string | null;
          contact_phone?: string | null;
          biography?: string | null;
          profile_image_ref?: string | null;
        };
        Update: {
          display_name?: string | null;
          contact_phone?: string | null;
          biography?: string | null;
          profile_image_ref?: string | null;
        };
        Relationships: [];
      };
      establishments: {
        Row: {
          id: string;
          professional_user_id: string;
          establishment_name: string | null;
          address: string | null;
          locality: string | null;
          wilaya: string | null;
          wilaya_code: number | null;
          commune_code: number | null;
          audience: EstablishmentAudience | null;
          public_phone: string | null;
          latitude: number | null;
          longitude: number | null;
          booking_reception_paused: boolean;
          booking_interval_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          professional_user_id: string;
          establishment_name?: string | null;
          address?: string | null;
          audience?: EstablishmentAudience | null;
          public_phone?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          booking_interval_minutes?: number;
          wilaya_code?: number | null;
          commune_code?: number | null;
        };
        Update: {
          establishment_name?: string | null;
          address?: string | null;
          audience?: EstablishmentAudience | null;
          public_phone?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          booking_interval_minutes?: number;
          wilaya_code?: number | null;
          commune_code?: number | null;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          establishment_id: string;
          service_name: string;
          description: string | null;
          price_dzd: number;
          duration_minutes: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          establishment_id: string;
          service_name: string;
          description?: string | null;
          price_dzd: number;
          duration_minutes: number;
          is_active?: boolean;
        };
        Update: {
          service_name?: string;
          description?: string | null;
          price_dzd?: number;
          duration_minutes?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      establishment_weekly_hours: {
        Row: {
          id: string;
          establishment_id: string;
          weekday: number;
          opens_at: string;
          closes_at: string;
          break_starts_at: string | null;
          break_ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          establishment_id: string;
          weekday: number;
          opens_at: string;
          closes_at: string;
          break_starts_at?: string | null;
          break_ends_at?: string | null;
        };
        Update: {
          weekday?: number;
          opens_at?: string;
          closes_at?: string;
          break_starts_at?: string | null;
          break_ends_at?: string | null;
        };
        Relationships: [];
      };
      establishment_days_off: {
        Row: {
          id: string;
          establishment_id: string;
          day_off: string;
          created_at: string;
        };
        Insert: { establishment_id: string; day_off: string };
        Update: never;
        Relationships: [];
      };
      establishment_published_times: {
        Row: {
          id: string;
          establishment_id: string;
          appointment_date: string;
          local_start_time: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      establishment_time_closures: {
        Row: {
          id: string;
          establishment_id: string;
          closure_date: string;
          starts_at: string;
          ends_at: string;
          created_at: string;
        };
        Insert: {
          establishment_id: string;
          closure_date: string;
          starts_at: string;
          ends_at: string;
        };
        Update: { closure_date?: string; starts_at?: string; ends_at?: string };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          customer_id: string;
          professional_user_id: string;
          establishment_id: string;
          establishment_name_snapshot: string | null;
          service_id: string;
          service_name_snapshot: string;
          price_dzd_snapshot: number;
          duration_minutes_snapshot: number;
          start_at: string;
          end_at: string;
          status: BookingStatus;
          decided_at: string | null;
          decided_by: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          cancellation_reason: string | null;
          rescheduled_from_booking_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      booking_events: {
        Row: {
          id: string;
          booking_id: string;
          actor_user_id: string | null;
          from_status: BookingStatus | null;
          to_status: BookingStatus;
          event_type:
            | "request_created"
            | "accepted"
            | "rejected"
            | "cancelled"
            | "completed";
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      booking_qr_tokens: {
        Row: {
          id: string;
          booking_id: string;
          token_value_ciphertext: string;
          token_hash: string;
          key_version: string;
          issued_at: string;
          expires_at: string;
          revoked_at: string | null;
          used_at: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      booking_check_ins: {
        Row: {
          id: string;
          booking_id: string;
          checked_in_at: string;
          checked_in_by: string;
          note: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          booking_id: string | null;
          booking_event_id: string | null;
          admin_message_id: string | null;
          kind:
            | "booking_request"
            | "booking_accepted"
            | "booking_rejected"
            | "booking_cancelled_by_customer"
            | "booking_cancelled_by_professional"
            | "booking_reception_paused"
            | "appointment_reminder_24h"
            | "appointment_reminder_1h"
            | "admin_operational"
            | "admin_announcement";
          data: Record<string, unknown>;
          created_at: string;
          read_at: string | null;
        };
        Insert: never;
        Update: { read_at?: string | null };
        Relationships: [];
      };
      booking_services: {
        Row: {
          booking_id: string;
          establishment_id: string;
          service_id: string;
          service_order: number;
          service_name_snapshot: string;
          price_dzd_snapshot: number;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      professional_subscriptions: {
        Row: {
          id: string;
          professional_user_id: string;
          plan_key: string;
          plan_name_snapshot: string;
          plan_duration_days_snapshot: number;
          plan_price_snapshot: number;
          plan_currency_code_snapshot: string;
          status: SubscriptionStatus;
          starts_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
          payment_method_key: ManualPaymentMethod | null;
          payment_method_snapshot: Record<string, unknown> | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      subscription_payment_proofs: {
        Row: {
          id: string;
          subscription_id: string;
          professional_user_id: string;
          method_key: ManualPaymentMethod;
          transaction_reference: string | null;
          object_path: string | null;
          review_status: "pending" | "approved" | "rejected";
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          submitted_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      subscription_audit_events: {
        Row: {
          id: string;
          actor_user_id: string | null;
          professional_user_id: string | null;
          subscription_id: string | null;
          activation_code_id: string | null;
          action: SubscriptionAuditAction;
          details: Record<string, unknown>;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      establishment_reviews: {
        Row: {
          id: string;
          booking_id: string;
          establishment_id: string;
          rating: number;
          comment: string | null;
          owner_reply: string | null;
          replied_at: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      account_deletion_requests: {
        Row: {
          id: string;
          user_id: string;
          status: "pending" | "completed" | "rejected";
          requested_at: string;
          completed_at: string | null;
          note: string | null;
          updated_at: string;
          last_error: string | null;
        };
        Insert: {
          user_id: string;
          status?: "pending" | "completed" | "rejected";
          requested_at?: string;
          completed_at?: string | null;
          note?: string | null;
          last_error?: string | null;
        };
        Update: {
          status?: "pending" | "completed" | "rejected";
          completed_at?: string | null;
          note?: string | null;
          last_error?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      public_professional_listings: {
        Row: {
          establishment_id: string;
          display_name: string | null;
          biography: string | null;
          profile_image_ref: string | null;
          establishment_name: string | null;
          address: string | null;
          locality: string | null;
          wilaya: string | null;
          audience: EstablishmentAudience | null;
          wilaya_code: number | null;
          commune_code: number | null;
          public_phone: string | null;
          latitude: number | null;
          longitude: number | null;
        };
        Relationships: [];
      };
      public_professional_services: {
        Row: {
          service_id: string;
          establishment_id: string;
          service_name: string;
          description: string | null;
          price_dzd: number;
          duration_minutes: number;
        };
        Relationships: [];
      };
      public_professional_weekly_hours: {
        Row: {
          establishment_id: string;
          weekday: number;
          opens_at: string;
          closes_at: string;
          break_starts_at: string | null;
          break_ends_at: string | null;
        };
        Relationships: [];
      };
      public_professional_days_off: {
        Row: { establishment_id: string; day_off: string };
        Relationships: [];
      };
      public_subscription_plans: {
        Row: {
          plan_key: string;
          display_name: string;
          description: string;
          duration_value: number;
          duration_unit: "days" | "months";
          duration_days: number;
          price_amount: number;
          currency_code: string;
          display_order: number;
          included_benefits: unknown[];
          badge_label: string | null;
        };
        Relationships: [];
      };
      public_manual_payment_methods: {
        Row: {
          method_key: ManualPaymentMethod;
          display_name: string;
          payment_instructions: string;
          instructions_fr: string | null;
          instructions_ar: string | null;
          details: Record<string, unknown>;
          display_order: number;
        };
        Relationships: [];
      };
      professional_subscription_overview: {
        Row: {
          id: string;
          professional_user_id: string;
          plan_key: string;
          plan_name_snapshot: string;
          plan_duration_days_snapshot: number;
          plan_price_snapshot: number;
          plan_currency_code_snapshot: string;
          payment_method_key: ManualPaymentMethod | null;
          payment_method_snapshot: Record<string, unknown> | null;
          effective_status: SubscriptionStatus | "expired" | "scheduled";
          starts_at: string | null;
          expires_at: string | null;
          created_at: string;
          profile_review_status: ProfessionalReviewStatus;
          profile_rejection_reason: string | null;
          payment_rejection_reason: string | null;
        };
        Relationships: [];
      };
      public_establishment_reviews: {
        Row: {
          id: string;
          establishment_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
          owner_reply: string | null;
          replied_at: string | null;
        };
        Relationships: [];
      };
      public_establishment_review_summaries: {
        Row: {
          establishment_id: string;
          average_rating: number;
          review_count: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      consume_route_guidance_limit: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      admin_search_customers: {
        Args: { target_query: string; target_page?: number };
        Returns: {
          user_id: string;
          display_name: string | null;
          email: string;
          phone: string | null;
          registered_at: string;
          wilaya_code: number | null;
          commune_code: number | null;
          has_next_page: boolean;
        }[];
      };
      admin_search_communication_recipients: {
        Args: {
          target_audience: string;
          target_query?: string | null;
          target_status?: string | null;
          target_wilaya?: number | null;
          target_page?: number;
        };
        Returns: {
          user_id: string;
          display_name: string;
          email: string | null;
          recipient_status: string;
          wilaya_code: number | null;
        }[];
      };
      admin_count_communication_recipients: {
        Args: {
          target_audience: string;
          target_status?: string | null;
          target_wilaya?: number | null;
          target_user_ids?: string[] | null;
        };
        Returns: number;
      };
      admin_send_communication: {
        Args: {
          target_request_key: string;
          target_message_type: string;
          target_audience: string;
          target_mode: string;
          target_status?: string | null;
          target_wilaya?: number | null;
          target_user_ids?: string[] | null;
          target_language: string;
          target_title: string;
          target_body: string;
          target_destination?: string | null;
          target_expected_count: number;
        };
        Returns: {
          message_id: string;
          intended_count: number;
          in_app_count: number;
          push_queued_count: number;
          already_sent: boolean;
        }[];
      };
      admin_list_communication_messages: {
        Args: { target_limit?: number; target_page?: number };
        Returns: {
          id: string;
          message_type: string;
          audience: string;
          language: string;
          title: string;
          intended_count: number;
          in_app_count: number;
          push_queued_count: number;
          push_accepted_count: number;
          push_delivered_count: number;
          push_failed_count: number;
          push_pending_count: number;
          push_no_device_count: number;
          push_ticket_rejected_count: number;
          push_dispatch_failed_count: number;
          push_not_queued_count: number;
          created_at: string;
          sent_at: string | null;
          has_next_page: boolean;
        }[];
      };
      admin_get_communication_message: {
        Args: { target_message_id: string };
        Returns: {
          id: string;
          message_type: string;
          audience: string;
          language: string;
          title: string;
          body: string;
          destination_key: string | null;
          targeting: Record<string, unknown>;
          intended_count: number;
          in_app_count: number;
          push_queued_count: number;
          push_accepted_count: number;
          push_delivered_count: number;
          push_failed_count: number;
          push_pending_count: number;
          push_no_device_count: number;
          push_ticket_rejected_count: number;
          push_dispatch_failed_count: number;
          push_not_queued_count: number;
          created_at: string;
          sent_at: string | null;
        }[];
      };
      admin_get_customer_details: {
        Args: { target_user_id: string };
        Returns: unknown;
      };
      admin_search_bookings: {
        Args: {
          target_query?: string | null;
          target_status?: string | null;
          target_from?: string | null;
          target_until?: string | null;
          target_page?: number;
        };
        Returns: {
          booking_id: string;
          status: string;
          customer_name: string | null;
          professional_name: string | null;
          establishment_name: string | null;
          start_at: string;
          end_at: string;
          service_names: string[];
          total_dzd: number;
          created_at: string;
          updated_at: string;
          has_next_page: boolean;
        }[];
      };
      admin_get_booking_details: {
        Args: { target_booking_id: string };
        Returns: unknown;
      };
      request_professional_access: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      submit_professional_profile: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      review_professional_profile: {
        Args: {
          target_user_id: string;
          decision: string;
          rejection_reason?: string | null;
        };
        Returns: string;
      };
      check_booking_availability: {
        Args: {
          target_service_id: string;
          appointment_date: string;
          local_start_time: string;
          ignored_booking_id?: string | null;
        };
        Returns: boolean;
      };
      check_multi_service_booking_availability: {
        Args: {
          target_service_ids: string[];
          appointment_date: string;
          local_start_time: string;
          ignored_booking_id?: string | null;
        };
        Returns: boolean;
      };
      get_available_booking_times: {
        Args: {
          target_service_ids: string[];
          target_appointment_date: string;
          ignored_booking_id?: string | null;
        };
        Returns: { local_start_time: string }[];
      };
      get_available_booking_dates: {
        Args: {
          target_service_ids: string[];
          range_start_date: string;
          range_end_date: string;
          ignored_booking_id?: string | null;
        };
        Returns: { appointment_date: string }[];
      };
      publish_professional_time: {
        Args: { target_date: string; target_time: string };
        Returns: string;
      };
      set_booking_reception_paused: {
        Args: { paused: boolean };
        Returns: boolean;
      };
      submit_booking_request: {
        Args: {
          target_service_ids: string[];
          appointment_date: string;
          local_start_time: string;
        };
        Returns: string;
      };
      accept_booking_request: {
        Args: { target_booking_id: string };
        Returns: string;
      };
      complete_booking: {
        Args: { target_booking_id: string };
        Returns: string;
      };
      register_push_device: {
        Args: {
          target_device_id: string;
          target_expo_push_token: string;
          target_locale: string;
        };
        Returns: boolean;
      };
      remove_push_device: {
        Args: { target_device_id: string };
        Returns: boolean;
      };
      mark_notification_read: {
        Args: { target_notification_id: string };
        Returns: boolean;
      };
      mark_all_notifications_read: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      claim_notification_push_batch: {
        Args: Record<PropertyKey, never>;
        Returns: {
          queue_id: string;
          notification_id: string;
          user_id: string;
          booking_id: string | null;
          kind: string;
          data: Record<string, unknown>;
          created_at: string;
        }[];
      };
      finish_notification_push: {
        Args: {
          target_queue_id: string;
          was_delivered: boolean;
          failure?: string | null;
        };
        Returns: boolean;
      };
      reject_booking_request: {
        Args: { target_booking_id: string };
        Returns: string;
      };
      cancel_booking: { Args: { target_booking_id: string }; Returns: string };
      cancel_professional_booking: {
        Args: { target_booking_id: string; cancellation_reason: string };
        Returns: string;
      };
      edge_issue_booking_qr_token: {
        Args: {
          target_booking_id: string;
          target_user_id: string;
          target_token_hash: string;
          target_ciphertext: string;
          target_key_version: string;
        };
        Returns: {
          token_value_ciphertext: string;
          key_version: string;
          expires_at: string;
        }[];
      };
      edge_verify_booking_qr_token: {
        Args: { target_token_hash: string; target_user_id: string };
        Returns: {
          booking_id: string;
          status: string;
          establishment_name: string | null;
          service_name: string | null;
          start_at: string | null;
          checked_in_at: string | null;
          already_checked_in: boolean;
        }[];
      };
      record_booking_checkin: {
        Args: { target_booking_id: string; target_note?: string | null };
        Returns: {
          booking_id: string;
          checked_in_at: string;
          already_checked_in: boolean;
        };
      };
      submit_establishment_review: {
        Args: {
          target_booking_id: string;
          target_rating: number;
          target_comment?: string | null;
        };
        Returns: string;
      };
      reply_to_establishment_review: {
        Args: { target_review_id: string; target_reply: string };
        Returns: string;
      };
      reschedule_booking_request: {
        Args: {
          target_booking_id: string;
          appointment_date: string;
          local_start_time: string;
        };
        Returns: string;
      };
      create_manual_subscription_attempt: {
        Args: { target_plan_key: string };
        Returns: string;
      };
      admin_list_subscription_plans: {
        Args: Record<PropertyKey, never>;
        Returns: {
          plan_key: string;
          display_name: string | null;
          description: string | null;
          duration_days: number | null;
          price_amount: number | null;
          currency_code: string;
          display_order: number;
          is_active: boolean;
          included_benefits: unknown[];
          created_at: string;
          updated_at: string;
        }[];
      };
      admin_list_subscription_plans_v2: {
        Args: Record<PropertyKey, never>;
        Returns: {
          plan_key: string;
          display_name: string | null;
          description: string | null;
          duration_value: number | null;
          duration_unit: "days" | "months" | null;
          duration_days: number | null;
          price_amount: number | null;
          currency_code: string;
          display_order: number;
          is_active: boolean;
          included_benefits: unknown[];
          badge_label: string | null;
          created_at: string;
          updated_at: string;
        }[];
      };
      admin_upsert_subscription_plan_v2: {
        Args: {
          target_plan_key: string;
          target_display_name: string;
          target_description: string;
          target_price_amount: number;
          target_currency_code: string;
          target_duration_value: number;
          target_duration_unit: "days" | "months";
          target_display_order: number;
          target_is_active: boolean;
          target_included_benefits?: unknown[];
          target_badge_label?: string | null;
        };
        Returns: string;
      };
      admin_archive_subscription_plan: {
        Args: { target_plan_key: string };
        Returns: string;
      };
      admin_upsert_subscription_plan: {
        Args: {
          target_plan_key: string;
          target_display_name: string;
          target_description: string;
          target_price_amount: number;
          target_currency_code: string;
          target_duration_days: number;
          target_display_order: number;
          target_is_active: boolean;
        };
        Returns: string;
      };
      admin_delete_subscription_plan: {
        Args: { target_plan_key: string };
        Returns: boolean;
      };
      admin_list_manual_payment_methods: {
        Args: Record<PropertyKey, never>;
        Returns: {
          method_key: string;
          display_name: string;
          payment_instructions: string | null;
          instructions_fr: string | null;
          instructions_ar: string | null;
          details: Record<string, unknown>;
          display_order: number;
          is_active: boolean;
          updated_at: string;
        }[];
      };
      admin_update_manual_payment_method: {
        Args: {
          target_method_key: string;
          target_display_name: string;
          target_payment_instructions: string;
          target_is_active: boolean;
        };
        Returns: boolean;
      };
      admin_update_manual_payment_method_v2: {
        Args: {
          target_method_key: string;
          target_display_name: string;
          target_instructions_fr: string | null;
          target_instructions_ar: string | null;
          target_details: Record<string, unknown>;
          target_is_active: boolean;
          target_display_order: number;
        };
        Returns: boolean;
      };
      select_manual_payment_method: {
        Args: { target_subscription_id: string; target_method_key: string };
        Returns: string;
      };
      confirm_cash_payment: {
        Args: { target_subscription_id: string; target_note?: string | null };
        Returns: string;
      };
      admin_list_cash_payment_requests: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          professional_user_id: string;
          professional_name: string | null;
          establishment_name: string | null;
          plan_name_snapshot: string;
          plan_duration_days_snapshot: number;
          plan_price_snapshot: number;
          plan_currency_code_snapshot: string;
          status: string;
          payment_method_snapshot: Record<string, unknown> | null;
          created_at: string;
        }[];
      };
      admin_set_subscription_period: {
        Args: {
          target_subscription_id: string;
          target_starts_at_local: string;
          target_expires_at_local: string;
          target_reason: string;
        };
        Returns: string;
      };
      submit_manual_payment_proof: {
        Args: {
          target_subscription_id: string;
          target_method_key: string;
          target_transaction_reference?: string | null;
          target_object_path?: string | null;
        };
        Returns: string;
      };
      review_manual_payment_proof: {
        Args: {
          target_proof_id: string;
          decision: string;
          rejection_reason?: string | null;
        };
        Returns: string;
      };
      redeem_activation_code: {
        Args: { input_code: string; target_plan_key?: string | null };
        Returns: string;
      };
      admin_issue_activation_code: {
        Args: {
          target_plan_key: string;
          target_valid_from?: string;
          target_valid_until?: string | null;
          target_usage_limit?: number;
        };
        Returns: { activation_code_id: string; plaintext_code: string }[];
      };
      admin_revoke_activation_code: {
        Args: { target_code_id: string };
        Returns: boolean;
      };
      admin_set_subscription_suspension: {
        Args: {
          target_subscription_id: string;
          suspend: boolean;
          reason: string;
        };
        Returns: string;
      };
      admin_list_activation_codes: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          plan_key: string;
          valid_from: string;
          valid_until: string | null;
          usage_limit: number;
          usage_count: number;
          status: "active" | "revoked" | "exhausted";
          issued_by: string;
          issued_at: string;
          revoked_by: string | null;
          revoked_at: string | null;
        }[];
      };
      admin_list_subscription_audit: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          actor_user_id: string | null;
          professional_user_id: string | null;
          subscription_id: string | null;
          activation_code_id: string | null;
          action: SubscriptionAuditAction;
          details: Record<string, unknown>;
          created_at: string;
        }[];
      };
      admin_list_subscription_payment_proofs: {
        Args: Record<PropertyKey, never>;
        Returns: {
          proof_id: string;
          subscription_id: string;
          professional_user_id: string;
          professional_name: string | null;
          establishment_name: string | null;
          plan_name_snapshot: string;
          plan_duration_days_snapshot: number;
          plan_price_snapshot: number;
          plan_currency_code_snapshot: string;
          subscription_status: SubscriptionStatus;
          method_key: ManualPaymentMethod;
          transaction_reference: string | null;
          object_path: string | null;
          review_status: "pending" | "approved" | "rejected";
          rejection_reason: string | null;
          submitted_at: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
        }[];
      };
      admin_professional_activation_state: {
        Args: { target_user_id: string };
        Returns: {
          publication_status: "private" | "published" | "suspended";
          has_valid_coordinates: boolean;
        }[];
      };
      admin_list_subscriptions: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          professional_user_id: string;
          professional_name: string | null;
          establishment_name: string | null;
          plan_key: string;
          plan_name_snapshot: string;
          plan_duration_days_snapshot: number;
          plan_price_snapshot: number;
          plan_currency_code_snapshot: string;
          effective_status: SubscriptionStatus | "expired" | "scheduled";
          starts_at: string | null;
          expires_at: string | null;
          profile_review_status: ProfessionalReviewStatus;
        }[];
      };
      request_account_deletion: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      finalize_account_deletion: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: { app_role: AppRole };
    CompositeTypes: { [_ in never]: never };
  };
};

export type BookingStatus =
  "pending" | "confirmed" | "rejected" | "cancelled" | "completed";
export type SubscriptionStatus =
  | "awaiting_payment"
  | "awaiting_cash_confirmation"
  | "pending_review"
  | "active"
  | "rejected"
  | "suspended"
  | "cancelled"
  | "revoked";
export type ManualPaymentMethod =
  "ccp" | "baridimob" | "bank_transfer" | "cash";
export type SubscriptionAuditAction =
  | "manual_attempt_created"
  | "payment_method_selected"
  | "payment_proof_submitted"
  | "payment_approved"
  | "payment_rejected"
  | "cash_payment_confirmed"
  | "activation_code_issued"
  | "activation_code_revoked"
  | "activation_code_redeemed"
  | "subscription_suspended"
  | "subscription_reactivated"
  | "subscription_period_adjusted"
  | "subscription_plan_created"
  | "subscription_plan_updated"
  | "subscription_plan_deleted"
  | "payment_method_updated";

export type TextDirection = "rtl" | "ltr";

export function directionForLocale(locale: Locale): TextDirection {
  return locale === "ar" ? "rtl" : "ltr";
}
