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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          role: string | null
          score: number | null
          shift_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          role?: string | null
          score?: number | null
          shift_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          role?: string | null
          score?: number | null
          shift_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          action_description: string | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_email: string | null
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          action: string
          action_description?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_email?: string | null
          user_id: string
          user_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          action?: string
          action_description?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_email?: string | null
          user_id?: string
          user_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
      employee_availabilities: {
        Row: {
          availability_type:
            | Database["public"]["Enums"]["availability_type"]
            | null
          created_at: string
          date: string
          employee_id: string
          end_time: string | null
          id: string
          notes: string | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          availability_type?:
            | Database["public"]["Enums"]["availability_type"]
            | null
          created_at?: string
          date: string
          employee_id: string
          end_time?: string | null
          id?: string
          notes?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          availability_type?:
            | Database["public"]["Enums"]["availability_type"]
            | null
          created_at?: string
          date?: string
          employee_id?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_availabilities_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_leaves: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          days_count: number
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days_count: number
          employee_id: string
          end_date: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days_count?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_relationships: {
        Row: {
          created_at: string
          created_by: string
          employee_1_id: string
          employee_2_id: string
          id: string
          notes: string | null
          relationship_type: Database["public"]["Enums"]["employee_relationship_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          employee_1_id: string
          employee_2_id: string
          id?: string
          notes?: string | null
          relationship_type: Database["public"]["Enums"]["employee_relationship_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          employee_1_id?: string
          employee_2_id?: string
          id?: string
          notes?: string | null
          relationship_type?: Database["public"]["Enums"]["employee_relationship_type"]
          updated_at?: string
        }
        Relationships: []
      }
      employee_sick_leaves: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_id: string
          end_date: string
          id: string
          medical_certificate_url: string | null
          reason: string | null
          start_date: string
          status: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          medical_certificate_url?: string | null
          reason?: string | null
          start_date: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          medical_certificate_url?: string | null
          reason?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_sick_leaves_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_sites: {
        Row: {
          assigned_at: string
          assigned_by: string
          created_at: string
          employee_id: string
          id: string
          is_active: boolean
          site_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          created_at?: string
          employee_id: string
          id?: string
          is_active?: boolean
          site_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          created_at?: string
          employee_id?: string
          id?: string
          is_active?: boolean
          site_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_statuses: {
        Row: {
          code: string
          color: string
          created_at: string
          hours_limits: Json
          id: string
          is_student: boolean
          label: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          code: string
          color?: string
          created_at?: string
          hours_limits?: Json
          id?: string
          is_student?: boolean
          label: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          code?: string
          color?: string
          created_at?: string
          hours_limits?: Json
          id?: string
          is_student?: boolean
          label?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      employee_work_preferences: {
        Row: {
          created_at: string
          day_of_week: number
          employee_id: string
          id: string
          max_hours_per_day: number | null
          notes: string | null
          preference: Database["public"]["Enums"]["work_day_preference"]
          preferred_end_time: string | null
          preferred_start_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          employee_id: string
          id?: string
          max_hours_per_day?: number | null
          notes?: string | null
          preference?: Database["public"]["Enums"]["work_day_preference"]
          preferred_end_time?: string | null
          preferred_start_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          employee_id?: string
          id?: string
          max_hours_per_day?: number | null
          notes?: string | null
          preference?: Database["public"]["Enums"]["work_day_preference"]
          preferred_end_time?: string | null
          preferred_start_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          active: boolean
          annual_leave_days: number
          archived: boolean
          archived_at: string | null
          archived_by: string | null
          birth_date: string
          color: string
          contract_type: string
          created_at: string
          current_year: number
          email: string
          employee_number: string
          experience_level:
            | Database["public"]["Enums"]["employee_experience_level"]
            | null
          first_name: string
          hire_date: string | null
          hourly_rate: number
          id: string
          language: string
          last_name: string
          phone: string | null
          photo_url: string | null
          remaining_leave_days: number | null
          sick_leave_days: number
          status_id: string
          updated_at: string
          user_id: string | null
          weekly_hours: number
        }
        Insert: {
          active?: boolean
          annual_leave_days?: number
          archived?: boolean
          archived_at?: string | null
          archived_by?: string | null
          birth_date: string
          color?: string
          contract_type: string
          created_at?: string
          current_year?: number
          email: string
          employee_number: string
          experience_level?:
            | Database["public"]["Enums"]["employee_experience_level"]
            | null
          first_name: string
          hire_date?: string | null
          hourly_rate?: number
          id?: string
          language?: string
          last_name: string
          phone?: string | null
          photo_url?: string | null
          remaining_leave_days?: number | null
          sick_leave_days?: number
          status_id: string
          updated_at?: string
          user_id?: string | null
          weekly_hours?: number
        }
        Update: {
          active?: boolean
          annual_leave_days?: number
          archived?: boolean
          archived_at?: string | null
          archived_by?: string | null
          birth_date?: string
          color?: string
          contract_type?: string
          created_at?: string
          current_year?: number
          email?: string
          employee_number?: string
          experience_level?:
            | Database["public"]["Enums"]["employee_experience_level"]
            | null
          first_name?: string
          hire_date?: string | null
          hourly_rate?: number
          id?: string
          language?: string
          last_name?: string
          phone?: string | null
          photo_url?: string | null
          remaining_leave_days?: number | null
          sick_leave_days?: number
          status_id?: string
          updated_at?: string
          user_id?: string | null
          weekly_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "employees_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "employee_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_periods: {
        Row: {
          created_at: string
          description: string | null
          employee_id: string
          end_date: string
          id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          employee_id: string
          end_date: string
          id?: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          employee_id?: string
          end_date?: string
          id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_periods_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          employee_data: Json | null
          first_name: string | null
          id: string
          invitation_expires_at: string
          invitation_token: string
          invited_by: string
          is_used: boolean | null
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          used_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          employee_data?: Json | null
          first_name?: string | null
          id?: string
          invitation_expires_at: string
          invitation_token: string
          invited_by: string
          is_used?: boolean | null
          last_name?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          employee_data?: Json | null
          first_name?: string | null
          id?: string
          invitation_expires_at?: string
          invitation_token?: string
          invited_by?: string
          is_used?: boolean | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          used_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          invitation_expires_at: string | null
          invitation_token: string | null
          invited_by: string | null
          is_active: boolean | null
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          invitation_expires_at?: string | null
          invitation_token?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          invitation_expires_at?: string | null
          invitation_token?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      schedule_generation_requests: {
        Row: {
          created_at: string
          end_date: string
          generated_by: string
          generation_parameters: Json | null
          id: string
          site_id: string
          start_date: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          generated_by: string
          generation_parameters?: Json | null
          id?: string
          site_id: string
          start_date: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          generated_by?: string
          generation_parameters?: Json | null
          id?: string
          site_id?: string
          start_date?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shifts: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          requirements: Json
          site_id: string
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time: string
          id?: string
          requirements?: Json
          site_id: string
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          requirements?: Json
          site_id?: string
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_opening_hours: {
        Row: {
          closing_time: string
          created_at: string
          day_of_week: number
          id: string
          is_closed: boolean | null
          opening_time: string
          site_id: string
          updated_at: string
        }
        Insert: {
          closing_time: string
          created_at?: string
          day_of_week: number
          id?: string
          is_closed?: boolean | null
          opening_time: string
          site_id: string
          updated_at?: string
        }
        Update: {
          closing_time?: string
          created_at?: string
          day_of_week?: number
          id?: string
          is_closed?: boolean | null
          opening_time?: string
          site_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sites: {
        Row: {
          active: boolean
          address: string
          capacity: number
          code: string
          contact_info: Json
          created_at: string
          id: string
          manager_id: string | null
          name: string
          opening_hours: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          address: string
          capacity?: number
          code: string
          contact_info?: Json
          created_at?: string
          id?: string
          manager_id?: string | null
          name: string
          opening_hours?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          address?: string
          capacity?: number
          code?: string
          contact_info?: Json
          created_at?: string
          id?: string
          manager_id?: string | null
          name?: string
          opening_hours?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_employee: {
        Args: { employee_id: string }
        Returns: undefined
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      restore_employee: {
        Args: { employee_id: string }
        Returns: undefined
      }
    }
    Enums: {
      availability_type: "AVAILABLE" | "UNAVAILABLE" | "PREFERRED"
      employee_experience_level: "NOUVEAU" | "VETERANE" | "MANAGER"
      employee_relationship_type: "CONFLICT" | "PREFERENCE" | "MENTOR_MENTEE"
      extended_leave_type:
        | "VACATION"
        | "SICK"
        | "MATERNITY"
        | "PATERNITY"
        | "PERSONAL"
        | "EXAM_PERIOD"
      user_role: "ADMIN" | "SUPER_MANAGER" | "EMPLOYEE" | "MANAGER"
      work_day_preference: "AVAILABLE" | "PREFERRED" | "UNAVAILABLE"
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
      availability_type: ["AVAILABLE", "UNAVAILABLE", "PREFERRED"],
      employee_experience_level: ["NOUVEAU", "VETERANE", "MANAGER"],
      employee_relationship_type: ["CONFLICT", "PREFERENCE", "MENTOR_MENTEE"],
      extended_leave_type: [
        "VACATION",
        "SICK",
        "MATERNITY",
        "PATERNITY",
        "PERSONAL",
        "EXAM_PERIOD",
      ],
      user_role: ["ADMIN", "SUPER_MANAGER", "EMPLOYEE", "MANAGER"],
      work_day_preference: ["AVAILABLE", "PREFERRED", "UNAVAILABLE"],
    },
  },
} as const
