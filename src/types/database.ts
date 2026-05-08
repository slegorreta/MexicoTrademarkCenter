export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'super_admin' | 'admin' | 'docketing_staff' | 'filing_staff' | 'read_only' | 'client';
          preferred_language: 'en' | 'zh' | 'es';
          phone: string;
          wechat: string;
          whatsapp: string;
          avatar_url: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; email: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      clients: {
        Row: {
          id: string;
          user_id: string | null;
          applicant_type: 'individual' | 'company';
          legal_name: string;
          country: string;
          address: string;
          city: string;
          state_province: string;
          postal_code: string;
          email: string;
          phone: string;
          wechat: string;
          whatsapp: string;
          tax_id: string;
          contact_person: string;
          preferred_language: 'en' | 'zh' | 'es';
          notes: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['clients']['Row']>;
      };
      applications: {
        Row: {
          id: string;
          case_number: string;
          client_id: string;
          user_id: string | null;
          assigned_staff_id: string | null;
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
          filing_status: string;
          total_classes: number;
          service_fee_usd: number;
          government_fee_usd: number;
          total_amount_usd: number;
          priority_claimed: boolean;
          priority_country: string;
          priority_app_number: string;
          priority_filing_date: string | null;
          impi_application_number: string;
          impi_filing_date: string | null;
          impi_publication_date: string | null;
          impi_registration_number: string;
          impi_registration_date: string | null;
          impi_renewal_deadline: string | null;
          internal_notes: string;
          admin_language: string;
          source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['applications']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['applications']['Row']>;
      };
      trademarks: {
        Row: {
          id: string;
          application_id: string;
          mark_name: string;
          mark_type: 'word' | 'design' | 'combined' | 'three_dimensional' | 'trade_name' | 'slogan';
          contains_non_spanish: boolean;
          mark_language: string;
          meaning_spanish: string;
          transliteration: string;
          mark_description: string;
          claims_color: boolean;
          color_description: string;
          logo_file_path: string;
          logo_preview_url: string;
          spanish_translation_status: 'pending' | 'auto' | 'reviewed' | 'approved';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trademarks']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['trademarks']['Row']>;
      };
      trademark_classes: {
        Row: {
          id: string;
          application_id: string;
          class_number: number;
          class_title_en: string;
          class_title_zh: string;
          goods_services_en: string;
          goods_services_es: string;
          goods_services_zh: string;
          translation_status: 'pending' | 'reviewed' | 'approved';
          classification_source: 'suggested' | 'user_selected' | 'admin_override';
          confidence_score: number;
          status: 'pending' | 'approved' | 'filed' | 'withdrawn';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trademark_classes']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['trademark_classes']['Row']>;
      };
      goods_services: {
        Row: {
          id: string;
          application_id: string;
          description_original: string;
          original_language: string;
          description_spanish: string;
          translation_status: 'pending' | 'auto' | 'reviewed' | 'approved';
          business_industry: string;
          sales_channels: string[];
          countries_sold: string[];
          mexico_launch_status: 'selling' | 'planning' | 'manufacturing' | 'defensive';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['goods_services']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['goods_services']['Row']>;
      };
      uploaded_files: {
        Row: {
          id: string;
          application_id: string;
          uploaded_by: string | null;
          file_name: string;
          file_path: string;
          mime_type: string;
          file_size_bytes: number;
          category: 'logo' | 'priority_doc' | 'filing_receipt' | 'registration_cert' | 'office_action' | 'other';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['uploaded_files']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['uploaded_files']['Row']>;
      };
      payments: {
        Row: {
          id: string;
          application_id: string;
          client_id: string;
          stripe_session_id: string;
          stripe_payment_intent_id: string;
          amount_usd: number;
          currency: string;
          status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
          refund_amount_usd: number;
          refund_reason: string;
          invoice_url: string;
          receipt_url: string;
          paid_at: string | null;
          refunded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['payments']['Row']>;
      };
      docket_deadlines: {
        Row: {
          id: string;
          application_id: string;
          assigned_to: string | null;
          deadline_type: string;
          title: string;
          description: string;
          due_date: string;
          priority: 'low' | 'normal' | 'high' | 'critical';
          status: 'open' | 'upcoming' | 'due_soon' | 'overdue' | 'completed' | 'cancelled';
          reminder_30_sent: boolean;
          reminder_15_sent: boolean;
          reminder_7_sent: boolean;
          reminder_3_sent: boolean;
          reminder_1_sent: boolean;
          completed_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['docket_deadlines']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['docket_deadlines']['Row']>;
      };
      admin_notes: {
        Row: {
          id: string;
          application_id: string;
          author_id: string;
          content: string;
          is_internal: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['admin_notes']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['admin_notes']['Row']>;
      };
      client_messages: {
        Row: {
          id: string;
          application_id: string;
          sender_id: string;
          sender_role: string;
          content: string;
          content_zh: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['client_messages']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['client_messages']['Row']>;
      };
      email_templates: {
        Row: {
          id: string;
          template_key: string;
          name_en: string;
          subject_en: string;
          body_en: string;
          subject_zh: string;
          body_zh: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['email_templates']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['email_templates']['Row']>;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          entity_type: string;
          entity_id: string | null;
          action: string;
          old_values: Json | null;
          new_values: Json | null;
          ip_address: string;
          user_agent: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['audit_logs']['Row']>;
      };
      settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: string;
          setting_type: 'string' | 'number' | 'boolean' | 'json';
          description: string;
          is_public: boolean;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['settings']['Row'], 'id' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['settings']['Row']>;
      };
      nice_classes: {
        Row: {
          id: number;
          class_number: number;
          category: 'goods' | 'services';
          title_en: string;
          title_zh: string;
          description_en: string;
          description_zh: string;
          keywords: string[];
          industries: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['nice_classes']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['nice_classes']['Row']>;
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type Application = Database['public']['Tables']['applications']['Row'];
export type Trademark = Database['public']['Tables']['trademarks']['Row'];
export type TrademarkClass = Database['public']['Tables']['trademark_classes']['Row'];
export type GoodsServices = Database['public']['Tables']['goods_services']['Row'];
export type UploadedFile = Database['public']['Tables']['uploaded_files']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type DocketDeadline = Database['public']['Tables']['docket_deadlines']['Row'];
export type AdminNote = Database['public']['Tables']['admin_notes']['Row'];
export type ClientMessage = Database['public']['Tables']['client_messages']['Row'];
export type EmailTemplate = Database['public']['Tables']['email_templates']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type Setting = Database['public']['Tables']['settings']['Row'];
export type NiceClass = Database['public']['Tables']['nice_classes']['Row'];
