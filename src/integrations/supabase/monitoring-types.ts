export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    __InternalSupabase: {
        PostgrestVersion: "13.0.5"
    }
    public: {
        Tables: {
            admin_notifications: {
                Row: {
                    action_url: string | null
                    created_at: string | null
                    id: string
                    is_read: boolean | null
                    message: string
                    read_by: string[] | null
                    recipient_role: string
                    severity: string | null
                    title: string
                }
                Insert: {
                    action_url?: string | null
                    created_at?: string | null
                    id?: string
                    is_read?: boolean | null
                    message: string
                    read_by?: string[] | null
                    recipient_role: string
                    severity?: string | null
                    title: string
                }
                Update: {
                    action_url?: string | null
                    created_at?: string | null
                    id?: string
                    is_read?: boolean | null
                    message?: string
                    read_by?: string[] | null
                    recipient_role?: string
                    severity?: string | null
                    title?: string
                }
                Relationships: []
            }
            api_metrics: {
                Row: {
                    created_at: string | null
                    duration_ms: number
                    id: string
                    operation: string
                    status: string
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    duration_ms: number
                    id?: string
                    operation: string
                    status: string
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    duration_ms?: number
                    id?: string
                    operation?: string
                    status?: string
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "api_metrics_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            error_logs: {
                Row: {
                    component_name: string | null
                    created_at: string | null
                    error_message: string
                    error_stack: string | null
                    id: string
                    page_url: string | null
                    severity: string | null
                    user_agent: string | null
                    user_id: string | null
                }
                Insert: {
                    component_name?: string | null
                    created_at?: string | null
                    error_message: string
                    error_stack?: string | null
                    id?: string
                    page_url?: string | null
                    severity?: string | null
                    user_agent?: string | null
                    user_id?: string | null
                }
                Update: {
                    component_name?: string | null
                    created_at?: string | null
                    error_message?: string
                    error_stack?: string | null
                    id?: string
                    page_url?: string | null
                    severity?: string | null
                    user_agent?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "error_logs_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            performance_metrics: {
                Row: {
                    created_at: string | null
                    id: string
                    metric_name: string
                    page_url: string | null
                    rating: string | null
                    user_agent: string | null
                    user_id: string | null
                    value: number
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    metric_name: string
                    page_url?: string | null
                    rating?: string | null
                    user_agent?: string | null
                    user_id?: string | null
                    value: number
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    metric_name?: string
                    page_url?: string | null
                    rating?: string | null
                    user_agent?: string | null
                    user_id?: string | null
                    value?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "performance_metrics_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
    }
}
