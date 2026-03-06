export interface CocktailIngredient {
  amount: number | null
  unit: string | null
  prep: string | null
  sort_order: number
  ingredients: {
    id: number
    name: string
    kind: string | null
    is_alcoholic: boolean | null
  }
}

export interface Cocktail {
  id: number
  name: string
  instructions: string
  notes: string | null
  glassware: string | null
  garnish: string | null
  created_at: string
  image_path: string | null
  image_bucket: string
  image_alt: string | null
  submitted_by: string | null
  cocktail_ingredients: CocktailIngredient[]
}
