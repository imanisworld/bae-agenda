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
          title:       string
          slug:        string        // used for /events/[slug] routing
          event_date:  string        // ISO timestamptz — determines upcoming vs past
          venue:       string | null
          city:        string | null
          description: string | null
          public:      boolean       // false = admin-only draft, hidden from public site
          featured:    boolean       // true = shown on homepage events section
          created_at:  string
          updated_at:  string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'],
          'id' | 'created_at' | 'updated_at'
        > & { id?: string }
        Update: Partial<Database['public']['Tables']['events']['Insert']>
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
          end_time:       string | null
          venue:          string | null
          city:           string | null
          package:        string | null  // package name (e.g. 'The Agenda')
          hours:          number | null
          quote:          number | null  // quoted price in USD
          deposit_amount: number | null
          status:         'inquiry' | 'confirmed' | 'completed' | 'cancelled'
          notes:          string | null
          created_at:     string
          updated_at:     string
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'],
          'id' | 'created_at' | 'updated_at'
        > & { id?: string }
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
      }

      // ── payments ────────────────────────────────────────────────
      payments: {
        Row: {
          id:         string
          booking_id: string             // FK → bookings.id (required)
          amount:     number
          type:       'deposit' | 'balance' | 'full' | 'refund'
          method:     'cash' | 'venmo' | 'zelle' | 'stripe' | 'other' | null
          status:     'pending' | 'received' | 'refunded'
          paid_at:    string | null      // when payment was received
          notes:      string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'],
          'id' | 'created_at' | 'updated_at'
        > & { id?: string }
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
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
