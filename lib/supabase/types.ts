// Hand-written to match supabase/migrations/0001_init.sql. Once the
// Supabase CLI is linked to the real project, this can be regenerated with
// `supabase gen types typescript` instead of maintained by hand.

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          title: string;
          description: string;
          cover_image: string | null;
          location: string;
          event_start: string;
          event_end: string;
          registration_start: string;
          registration_deadline: string;
          max_participants: number;
          requirements: string[];
          message_enabled: boolean;
          message_label: string;
          file_enabled: boolean;
          file_label: string;
          allowed_file_types: string[];
          max_file_size: number | null;
          published: boolean;
          registered_count: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["events"]["Row"]> & {
          title: string;
          event_start: string;
          event_end: string;
          registration_start: string;
          registration_deadline: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Row"]>;
        Relationships: [];
      };
      registrations: {
        Row: {
          id: string;
          registration_number: string;
          event_id: string;
          name: string;
          phone: string;
          email: string;
          origin: string;
          date_of_birth: string;
          message: string | null;
          file_url: string | null;
          file_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["registrations"]["Row"]> & {
          registration_number: string;
          event_id: string;
          name: string;
          phone: string;
          email: string;
          date_of_birth: string;
        };
        Update: Partial<Database["public"]["Tables"]["registrations"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      register_for_event: {
        Args: {
          p_event_id: string;
          p_registration_number: string;
          p_name: string;
          p_phone: string;
          p_email: string;
          p_origin: string;
          p_date_of_birth: string;
          p_message: string | null;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
