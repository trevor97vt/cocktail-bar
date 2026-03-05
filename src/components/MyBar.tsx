import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material'
import { Add, Clear, Search } from '@mui/icons-material'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

// Constants
const THEME_COLORS = {
  primary: '#e91e63',
} as const

const INGREDIENTS_QUERY = 'id, name, kind, is_alcoholic'

const LOADING_SX = {
  display: 'flex',
  justifyContent: 'center',
  py: 10,
}

const CONTAINER_SX = {
  maxWidth: 600,
  mx: 'auto',
}

const SECTION_TITLE_SX = {
  variant: 'subtitle2' as const,
  fontWeight: 700,
  color: 'text.secondary',
  gutterBottom: true,
}

const SEARCH_FIELD_SX = {
  mb: 1,
  '& .MuiOutlinedInput-root.Mui-focused fieldset': {
    borderColor: THEME_COLORS.primary,
  },
}

const EMPTY_LIST_MESSAGE_SX = {
  textAlign: 'center',
  py: 4,
  fontStyle: 'italic',
}

// Types
interface Ingredient {
  id: number
  name: string
  kind: string | null
  is_alcoholic: boolean | null
}

interface MyBarProps {
  user: User
}

export default function MyBar({ user }: MyBarProps) {
  const [myIngredients, setMyIngredients] = useState<Ingredient[]>([])
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set())

  const fetchIngredients = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    const [allResult, userResult] = await Promise.all([
      supabase.from('ingredients').select(INGREDIENTS_QUERY).order('name'),
      supabase.from('user_ingredients').select('ingredient_id').eq('user_id', user.id),
    ])
    
    if (allResult.error) {
      setError(allResult.error.message)
    } else {
      const myIds = new Set((userResult.data ?? []).map((r) => r.ingredient_id as number))
      const all = allResult.data ?? []
      setMyIngredients(all.filter((i) => myIds.has(i.id)))
      setAvailableIngredients(all.filter((i) => !myIds.has(i.id)))
    }
    
    setLoading(false)
  }, [user.id])

  useEffect(() => {
    fetchIngredients()
  }, [fetchIngredients])

  const addIngredient = useCallback(async (ingredient: Ingredient) => {
    setPendingIds((prev) => new Set(prev).add(ingredient.id))
    
    const { error } = await supabase
      .from('user_ingredients')
      .insert({ user_id: user.id, ingredient_id: ingredient.id })
    
    if (error) {
      setError(error.message)
    } else {
      setMyIngredients((prev) =>
        [...prev, ingredient].sort((a, b) => a.name.localeCompare(b.name))
      )
      setAvailableIngredients((prev) => prev.filter((i) => i.id !== ingredient.id))
    }
    
    setPendingIds((prev) => {
      const next = new Set(prev)
      next.delete(ingredient.id)
      return next
    })
  }, [user.id])

  const removeIngredient = useCallback(async (ingredient: Ingredient) => {
    setPendingIds((prev) => new Set(prev).add(ingredient.id))
    
    const { error } = await supabase
      .from('user_ingredients')
      .delete()
      .eq('user_id', user.id)
      .eq('ingredient_id', ingredient.id)
    
    if (error) {
      setError(error.message)
    } else {
      setAvailableIngredients((prev) =>
        [...prev, ingredient].sort((a, b) => a.name.localeCompare(b.name))
      )
      setMyIngredients((prev) => prev.filter((i) => i.id !== ingredient.id))
    }
    
    setPendingIds((prev) => {
      const next = new Set(prev)
      next.delete(ingredient.id)
      return next
    })
  }, [user.id])

  const filteredAvailable = availableIngredients
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      // Sort by kind first (nullish kinds go to the end)
      const kindA = a.kind ?? 'zzz_unknown'
      const kindB = b.kind ?? 'zzz_unknown'
      
      if (kindA !== kindB) {
        return kindA.localeCompare(kindB)
      }
      
      // Within the same kind, sort by name
      return a.name.localeCompare(b.name)
    })

  if (loading) {
    return (
      <Box sx={LOADING_SX}>
        <CircularProgress sx={{ color: THEME_COLORS.primary }} />
      </Box>
    )
  }

  return (
    <Box sx={CONTAINER_SX}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* My Ingredients */}
      <Typography {...SECTION_TITLE_SX}>
        MY INGREDIENTS
      </Typography>

      {myIngredients.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
          No ingredients added yet. Search below to add some. Ingredients are generic, not brand-specific.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {myIngredients.map((ingredient) => (
            <Chip
              key={ingredient.id}
              label={ingredient.name}
              onDelete={
                pendingIds.has(ingredient.id) ? undefined : () => removeIngredient(ingredient)
              }
              deleteIcon={
                pendingIds.has(ingredient.id) ? (
                  <CircularProgress size={16} sx={{ color: '#e57373 !important' }} />
                ) : undefined
              }
              sx={{
                backgroundColor: '#fce4ec',
                color: '#c2185b',
                '& .MuiChip-deleteIcon': {
                  color: '#e57373',
                  '&:hover': { color: '#c2185b' },
                },
              }}
            />
          ))}
        </Box>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Add Ingredients */}
      <Typography {...SECTION_TITLE_SX}>
        ADD INGREDIENTS
      </Typography>

      <TextField
        placeholder="Search ingredients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        size="small"
        sx={SEARCH_FIELD_SX}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch('')}>
                  <Clear fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          },
        }}
      />

      {filteredAvailable.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={EMPTY_LIST_MESSAGE_SX}
        >
          {search ? `No ingredients matching "${search}"` : 'All ingredients are already in your bar!'}
        </Typography>
      ) : (
        <List dense disablePadding>
          {filteredAvailable.map((ingredient, index) => (
            <Box key={ingredient.id}>
              <ListItem
                disableGutters
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() => addIngredient(ingredient)}
                    disabled={pendingIds.has(ingredient.id)}
                    size="small"
                    sx={{ color: THEME_COLORS.primary }}
                  >
                    {pendingIds.has(ingredient.id) ? (
                      <CircularProgress size={16} sx={{ color: THEME_COLORS.primary }} />
                    ) : (
                      <Add fontSize="small" />
                    )}
                  </IconButton>
                }
              >
                <ListItemText
                  primary={ingredient.name}
                  secondary={ingredient.kind ?? undefined}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
              {index < filteredAvailable.length - 1 && <Divider component="li" />}
            </Box>
          ))}
        </List>
      )}
    </Box>
  )
}
