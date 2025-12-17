export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      list_tables_custom: {
        Args: Record<string, never>
        Returns: { table_name: string }[]
      }
      describe_table_custom: {
        Args: { table_name_param: string }
        Returns: {
          column_name: string
          data_type: string
          is_nullable: string
          column_default: string | null
        }[]
      }
      exec_sql_custom: {
        Args: { query: string }
        Returns: { success: boolean; message?: string; error?: string }
      }
    }
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']
