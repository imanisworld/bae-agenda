/**
 * DATABASE TYPES — Canonical schema definition
 *
 * This file is the source of truth until the Supabase project is live.
 * Once the database is set up and migrations are run, REPLACE this file with:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
 *
 * ⚠️  Keep this file in sync with supabase/migrations/
 */

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

      // ── events ──────────────────────────────────────────────────
      events: {
        Row: {
          id:          string
          booking_id:  string | null // internal FK → bookings.id; never expose on public event reads
          title:       string
          slug:        string        // used for /events/[slug] routing
          event_date:  string        // ISO timestamptz — determines upcoming vs past
          event_timezone: string | null // IANA zone; null means legacy/unreviewed
          venue:       string | null
          city:        string | null
          description: string | null
          public:      boolean       // false = admin-only draft, hidden from public site
          featured:    boolean       // true = shown on homepage events section
          show_description: boolean
          created_at:  string
          updated_at:  string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'],
          'id' | 'created_at' | 'updated_at'
        > & { id?: string }
        Update: Partial<Database['public']['Tables']['events']['Insert']>
      }

      // ── event_media ─────────────────────────────────────────────
      event_media: {
        Row: {
          id:         string
          event_id:   string
          media_type: 'image' | 'video'
          media_url:  string
          storage_path: string | null
          poster_url: string | null
          caption:    string | null
          sort_order: number
          public:     boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['event_media']['Row'],
          'id' | 'created_at' | 'updated_at'
        > & { id?: string }
        Update: Partial<Database['public']['Tables']['event_media']['Insert']>
      }

      // ── clients ─────────────────────────────────────────────────
      clients: {
        Row: {
          id:         string
          first_name: string
          last_name:  string | null
          email:      string
          phone:      string | null
          notes:      string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'],
          'id' | 'created_at' | 'updated_at'
        > & { id?: string }
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }

      // ── bookings ────────────────────────────────────────────────
      bookings: {
        Row: {
          id:             string
          client_id:      string | null  // FK → clients.id (nullable: can log booking before creating client)
          event_name:     string         // name of the event being booked for
          event_type:     string | null  // 'Birthday', 'Wedding', 'Corporate', etc.
          event_date:     string
          event_timezone: string
          end_time:       string | null
          event_end_time: string | null
          venue:          string | null
          city:           string | null
          package:        string | null  // package name (e.g. 'The Agenda')
          hours:          number | null
          quote:          number | null  // quoted price in USD
          deposit_amount: number | null
          deposit_status: 'unpaid' | 'pending' | 'paid'
          deposit_paid_at: string | null
          deposit_confirmed_via: 'stripe' | 'manual' | null
          deposit_checkout_session_id: string | null
          lifecycle_status: 'new' | 'contacted' | 'negotiating' | 'confirmed' | 'completed' | 'lost'
          inquiry_receipt_sent_at: string | null
          confirmation_email_sent_at: string | null
          last_balance_reminder_sent_at: string | null
          last_event_reminder_sent_at: string | null
          deposit_received_email_sent_at: string | null
          fully_paid_email_sent_at: string | null
          post_event_follow_up_sent_at: string | null
          review_request_sent_at: string | null
          submission_key: string | null
          balance_paid_at: string | null
          payment_method: 'cash' | 'venmo' | 'zelle' | 'cash_app' | 'stripe' | 'check' | 'ach' | 'other' | null
          payment_status: 'unpaid' | 'deposit_requested' | 'deposit_paid' | 'balance_requested' | 'paid'
          status:         'inquiry' | 'confirmed' | 'completed' | 'cancelled'
          notes:          string | null
          created_at:     string
          updated_at:     string
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'],
          'id' | 'created_at' | 'updated_at' | 'submission_key'
        > & { id?: string; submission_key?: string | null }
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
      }

      // ── payments ────────────────────────────────────────────────
      payments: {
        Row: {
          id:         string
          booking_id: string             // FK → bookings.id (required)
          amount:     number
          type:       'deposit' | 'balance' | 'full' | 'refund'
          method:     'cash' | 'venmo' | 'zelle' | 'cash_app' | 'stripe' | 'check' | 'ach' | 'other' | null
          status:     'pending' | 'received' | 'refunded'
          paid_at:    string | null      // when payment was received
          external_reference: string | null
          notes:      string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'],
          'id' | 'created_at' | 'updated_at'
        > & { id?: string }
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }

      client_portal_codes: {
        Row: {
          id: string
          client_id: string
          phone: string
          code_hash: string
          expires_at: string
          consumed_at: string | null
          request_ip: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['client_portal_codes']['Row'],
          'id' | 'created_at'
        > & { id?: string }
        Update: Partial<Database['public']['Tables']['client_portal_codes']['Insert']>
      }

      client_portal_sessions: {
        Row: {
          id: string
          client_id: string
          token_hash: string
          expires_at: string
          revoked_at: string | null
          last_seen_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['client_portal_sessions']['Row'],
          'id' | 'created_at'
        > & { id?: string }
        Update: Partial<Database['public']['Tables']['client_portal_sessions']['Insert']>
      }

      booking_portal_requests: {
        Row: {
          id: string
          booking_id: string
          client_id: string
          type: 'update' | 'cancellation'
          message: string
          preferred_contact: 'phone' | 'email' | null
          status: 'new' | 'reviewed' | 'resolved'
          resolved_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['booking_portal_requests']['Row'],
          'id' | 'created_at'
        > & { id?: string }
        Update: Partial<Database['public']['Tables']['booking_portal_requests']['Insert']>
      }

      // ── invoices ────────────────────────────────────────────────
      invoices: {
        Row: {
          id: string
          booking_id: string
          status: 'draft' | 'sent' | 'paid' | 'void'
          invoice_number: string
          pdf_filename: string
          event_name: string | null
          client_name: string | null
          client_email: string | null
          total_amount: number
          deposit_amount: number
          balance_due: number
          due_date: string | null
          payment_terms: string
          line_items: Json
          sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['invoices']['Row'],
          'id' | 'created_at' | 'updated_at'
        > & { id?: string }
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }

      // ── mixes ───────────────────────────────────────────────────
      mixes: {
        Row: {
          id:           string
          title:        string
          description:  string | null
          genre:        string | null
          duration:     number | null    // duration in seconds
          embed_url:    string | null    // SoundCloud / YouTube embed URL
          cover_url:    string | null
          is_featured:  boolean
          sort_order:   number
          published_at: string | null
          created_at:   string
          updated_at:   string
        }
        Insert: Omit<Database['public']['Tables']['mixes']['Row'],
          'id' | 'created_at' | 'updated_at'
        > & { id?: string }
        Update: Partial<Database['public']['Tables']['mixes']['Insert']>
      }

      // ── site_content ────────────────────────────────────────────
      // Key/value store for editable public site copy.
      // V1: plain text values only. Add richer types if needed later.
      site_content: {
        Row: {
          id:         string
          key:        string        // unique identifier, e.g. 'bio', 'tagline'
          value:      string | null
          label:      string | null // human-readable label for the admin UI
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['site_content']['Row'],
          'id' | 'updated_at'
        > & { id?: string }
        Update: Partial<Database['public']['Tables']['site_content']['Insert']>
      }

      // ── notes ───────────────────────────────────────────────────
      // Internal admin notes tied to a booking or client (or both).
      notes: {
        Row: {
          id:         string
          booking_id: string | null  // FK → bookings.id
          client_id:  string | null  // FK → clients.id
          body:       string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notes']['Row'],
          'id' | 'created_at'
        > & { id?: string }
        Update: Partial<Database['public']['Tables']['notes']['Insert']>
      }

    }
    Views:     Record<string, never>
    Functions: Record<string, never>
    Enums:     Record<string, never>
  }
}
