// Generado con `supabase generate_typescript_types` contra el proyecto real.
// Para regenerar: usar el MCP de Supabase (generate_typescript_types) o
// `npx supabase gen types typescript --project-id jajlvbbdscbaaexzlhsc`.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      brands: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: number
          logo_path: string | null
          meta_description: string | null
          meta_title: string | null
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id?: never
          logo_path?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: never
          logo_path?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          faq: Json
          id: number
          image_path: string | null
          intro_html: string
          meta_description: string | null
          meta_title: string | null
          name: string
          parent_id: number | null
          slug: string
          sort_order: number
          species: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          faq?: Json
          id?: never
          image_path?: string | null
          intro_html?: string
          meta_description?: string | null
          meta_title?: string | null
          name: string
          parent_id?: number | null
          slug: string
          sort_order?: number
          species?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          faq?: Json
          id?: never
          image_path?: string | null
          intro_html?: string
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          parent_id?: number | null
          slug?: string
          sort_order?: number
          species?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_related_products: {
        Row: {
          guide_id: number
          product_id: number
          sort_order: number
        }
        Insert: {
          guide_id: number
          product_id: number
          sort_order?: number
        }
        Update: {
          guide_id?: number
          product_id?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "guide_related_products_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_related_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      guides: {
        Row: {
          body_markdown: string
          cover_image_path: string | null
          created_at: string
          excerpt: string
          id: number
          legacy_urls: string[]
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          body_markdown?: string
          cover_image_path?: string | null
          created_at?: string
          excerpt?: string
          id?: never
          legacy_urls?: string[]
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          body_markdown?: string
          cover_image_path?: string | null
          created_at?: string
          excerpt?: string
          id?: never
          legacy_urls?: string[]
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text: string
          height: number | null
          id: number
          is_primary: boolean
          product_id: number
          sort_order: number
          storage_path: string
          width: number | null
        }
        Insert: {
          alt_text?: string
          height?: number | null
          id?: never
          is_primary?: boolean
          product_id: number
          sort_order?: number
          storage_path: string
          width?: number | null
        }
        Update: {
          alt_text?: string
          height?: number | null
          id?: never
          is_primary?: boolean
          product_id?: number
          sort_order?: number
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          benefits: Json
          brand_id: number
          category_id: number
          characteristics: Json
          created_at: string
          featured: boolean
          id: number
          long_description: string
          meta_description: string | null
          meta_title: string | null
          name: string
          net_weight_kg: number | null
          presentation: string
          previous_slugs: string[]
          price_uyu: number
          published_at: string | null
          short_description: string
          sku: string | null
          slug: string
          sort_order: number
          stock_status: string
          tier: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          benefits?: Json
          brand_id: number
          category_id: number
          characteristics?: Json
          created_at?: string
          featured?: boolean
          id?: never
          long_description?: string
          meta_description?: string | null
          meta_title?: string | null
          name: string
          net_weight_kg?: number | null
          presentation?: string
          previous_slugs?: string[]
          price_uyu: number
          published_at?: string | null
          short_description?: string
          sku?: string | null
          slug: string
          sort_order?: number
          stock_status?: string
          tier?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          benefits?: Json
          brand_id?: number
          category_id?: number
          characteristics?: Json
          created_at?: string
          featured?: boolean
          id?: never
          long_description?: string
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          net_weight_kg?: number | null
          presentation?: string
          previous_slugs?: string[]
          price_uyu?: number
          published_at?: string | null
          short_description?: string
          sku?: string | null
          slug?: string
          sort_order?: number
          stock_status?: string
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      brand_active_product_counts: {
        Row: {
          brand_id: number | null
          n: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      category_active_product_counts: {
        Row: {
          category_id: number | null
          n: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

// ---------------------------------------------------------------------
// Alias de conveniencia usados por lib/data/*.ts (más cortos que navegar
// Database['public']['Tables'][...]['Row'], y con los tipos de unión que
// las columnas `text` con `check` no expresan en el codegen genérico).
// ---------------------------------------------------------------------

export type Tier = 'premium' | 'standard' | 'economico';
export type StockStatus = 'in_stock' | 'out_of_stock';
export type Species = 'perro' | 'gato' | null;
export type GuideStatus = 'draft' | 'published';

export interface FaqItem {
  question: string;
  answer: string;
}

export type BrandRow = DefaultSchema['Tables']['brands']['Row'];

export type CategoryRow = Omit<DefaultSchema['Tables']['categories']['Row'], 'species' | 'faq'> & {
  species: Species;
  faq: FaqItem[];
};

export type ProductRow = Omit<
  DefaultSchema['Tables']['products']['Row'],
  'tier' | 'stock_status' | 'benefits' | 'characteristics'
> & {
  tier: Tier;
  stock_status: StockStatus;
  benefits: string[];
  characteristics: string[];
};

export type ProductImageRow = DefaultSchema['Tables']['product_images']['Row'];

export type GuideRow = Omit<DefaultSchema['Tables']['guides']['Row'], 'status'> & {
  status: GuideStatus;
};

export type GuideRelatedProductRow = DefaultSchema['Tables']['guide_related_products']['Row'];
