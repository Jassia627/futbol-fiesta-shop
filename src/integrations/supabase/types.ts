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
      carrito_items: {
        Row: {
          cantidad: number
          carrito_id: string | null
          created_at: string | null
          id: string
          precio_unitario: number
          producto_id: string | null
        }
        Insert: {
          cantidad: number
          carrito_id?: string | null
          created_at?: string | null
          id?: string
          precio_unitario: number
          producto_id?: string | null
        }
        Update: {
          cantidad?: number
          carrito_id?: string | null
          created_at?: string | null
          id?: string
          precio_unitario?: number
          producto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carrito_items_carrito_id_fkey"
            columns: ["carrito_id"]
            isOneToOne: false
            referencedRelation: "carritos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrito_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      carritos: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      equipos: {
        Row: {
          created_at: string | null
          id: string
          liga_id: string | null
          logo: string | null
          nombre: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          liga_id?: string | null
          logo?: string | null
          nombre: string
        }
        Update: {
          created_at?: string | null
          id?: string
          liga_id?: string | null
          logo?: string | null
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipos_liga_id_fkey"
            columns: ["liga_id"]
            isOneToOne: false
            referencedRelation: "ligas"
            referencedColumns: ["id"]
          },
        ]
      }
      ligas: {
        Row: {
          created_at: string | null
          id: string
          logo: string | null
          nombre: string
          pais: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo?: string | null
          nombre: string
          pais?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo?: string | null
          nombre?: string
          pais?: string | null
        }
        Relationships: []
      }
      pedido_items: {
        Row: {
          cantidad: number
          id: string
          pedido_id: string | null
          precio_unitario: number
          producto_id: string | null
        }
        Insert: {
          cantidad: number
          id?: string
          pedido_id?: string | null
          precio_unitario: number
          producto_id?: string | null
        }
        Update: {
          cantidad?: number
          id?: string
          pedido_id?: string | null
          precio_unitario?: number
          producto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedido_items_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          direccion_envio: string | null
          estado: string
          fecha_pedido: string | null
          id: string
          metodo_pago: string
          total: number
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          direccion_envio?: string | null
          estado?: string
          fecha_pedido?: string | null
          id?: string
          metodo_pago: string
          total: number
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          direccion_envio?: string | null
          estado?: string
          fecha_pedido?: string | null
          id?: string
          metodo_pago?: string
          total?: number
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      perfiles: {
        Row: {
          apellido: string | null
          created_at: string | null
          direccion: string | null
          id: string
          nombre: string | null
          rol: Database["public"]["Enums"]["tipo_usuario"] | null
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          apellido?: string | null
          created_at?: string | null
          direccion?: string | null
          id: string
          nombre?: string | null
          rol?: Database["public"]["Enums"]["tipo_usuario"] | null
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          apellido?: string | null
          created_at?: string | null
          direccion?: string | null
          id?: string
          nombre?: string | null
          rol?: Database["public"]["Enums"]["tipo_usuario"] | null
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      productos: {
        Row: {
          categoria: string | null
          created_at: string | null
          descripcion: string | null
          destacado: boolean | null
          equipo: string | null
          id: string
          imagen: string | null
          liga: string | null
          nombre: string
          precio: number
          stock: number
          updated_at: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          destacado?: boolean | null
          equipo?: string | null
          id?: string
          imagen?: string | null
          liga?: string | null
          nombre: string
          precio: number
          stock?: number
          updated_at?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          destacado?: boolean | null
          equipo?: string | null
          id?: string
          imagen?: string | null
          liga?: string | null
          nombre?: string
          precio?: number
          stock?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      proveedores: {
        Row: {
          contacto: string | null
          created_at: string | null
          direccion: string | null
          email: string | null
          id: string
          nombre: string
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          contacto?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          nombre: string
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          contacto?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          nombre?: string
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      valoraciones: {
        Row: {
          calificacion: number
          comentario: string | null
          created_at: string | null
          id: string
          producto_id: string | null
          usuario_id: string | null
        }
        Insert: {
          calificacion: number
          comentario?: string | null
          created_at?: string | null
          id?: string
          producto_id?: string | null
          usuario_id?: string | null
        }
        Update: {
          calificacion?: number
          comentario?: string | null
          created_at?: string | null
          id?: string
          producto_id?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "valoraciones_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      tipo_usuario: "admin" | "cliente" | "vendedor"
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
  public: {
    Enums: {
      tipo_usuario: ["admin", "cliente", "vendedor"],
    },
  },
} as const
