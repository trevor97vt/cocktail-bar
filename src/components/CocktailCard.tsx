import { useState } from 'react'
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import {
  ExpandLess,
  ExpandMore,
  LocalBar,
  SportsBar,
  LocalFlorist,
} from '@mui/icons-material'
import { supabase } from '../lib/supabaseClient'
import type { Cocktail } from '../types/cocktail'
import { THEME_COLORS } from '../theme'

// Types
interface CocktailCardProps {
  cocktail: Cocktail
  userIngredientIds?: Set<number>
  submitterName?: string
}

// Helper functions
function formatIngredient(ci: Cocktail['cocktail_ingredients'][number]): string {
  const parts: string[] = []
  if (ci.amount !== null) parts.push(String(ci.amount))
  if (ci.unit) parts.push(ci.unit)
  parts.push(ci.ingredients.name)
  if (ci.prep) parts.push(`(${ci.prep})`)
  return parts.join(' ')
}

function getImageUrl(bucket: string, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

export default function CocktailCard({ cocktail, userIngredientIds, submitterName }: CocktailCardProps) {
  const [expanded, setExpanded] = useState(false)

  const imageUrl =
    cocktail.image_path
      ? getImageUrl(cocktail.image_bucket ?? 'cocktail-images', cocktail.image_path)
      : null

  const sortedIngredients = [...cocktail.cocktail_ingredients].sort(
    (a, b) => a.sort_order - b.sort_order
  )

  // Calculate missing ingredients (excluding garnishes)
  const missingIngredients = userIngredientIds 
    ? sortedIngredients
        .filter((ci) => ci.ingredients.kind !== 'garnish')
        .filter((ci) => !userIngredientIds.has(ci.ingredients.id))
    : []

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 6 },
      }}
    >
      {/* Top area — fixed 3:4 aspect ratio, swaps between image and details */}
      <Box
        sx={{
          aspectRatio: '3/4',
          overflow: 'hidden',
          cursor: expanded ? 'default' : 'pointer',
          position: 'relative',
        }}
        onClick={expanded ? undefined : () => setExpanded(true)}
      >
        {!expanded ? (
          /* Image */
          imageUrl ? (
            <Box
              component="img"
              src={imageUrl}
              alt={cocktail.image_alt ?? cocktail.name}
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #fce4ec, #f3e5f5)',
              }}
            >
              <LocalBar sx={{ fontSize: 64, color: THEME_COLORS.primary, opacity: 0.4 }} />
            </Box>
          )
        ) : (
          /* Scrollable detail content */
          <Box sx={{ height: '100%', overflowY: 'auto', p: 2 }}>
            {/* Glassware / Garnish chips */}
            {(cocktail.glassware || cocktail.garnish) && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {cocktail.glassware && (
                  <Chip
                    icon={<SportsBar fontSize="small" />}
                    label={cocktail.glassware}
                    size="small"
                    variant="outlined"
                  />
                )}
                {cocktail.garnish && (
                  <Chip
                    icon={<LocalFlorist fontSize="small" />}
                    label={cocktail.garnish}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            )}

            {/* Ingredients */}
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
              INGREDIENTS
            </Typography>
            <List dense disablePadding sx={{ mb: 2 }}>
              {sortedIngredients
                .filter((ci) => ci.ingredients.kind !== 'garnish') // Exclude garnishes
                .map((ci, i) => (
                <ListItem key={i} disableGutters sx={{ py: 0.25 }}>
                  <ListItemText
                    primary={formatIngredient(ci)}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>

            {/* Instructions */}
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
              INSTRUCTIONS
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
              {cocktail.instructions}
            </Typography>

            {/* Notes */}
            {cocktail.notes && (
              <>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
                  NOTES
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                  {cocktail.notes}
                </Typography>
              </>
            )}

            {/* Missing Ingredients */}
            {missingIngredients.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
                  MISSING INGREDIENTS
                </Typography>
                <List dense disablePadding sx={{ mb: 2 }}>
                  {missingIngredients.map((ci, i) => (
                    <ListItem key={i} disableGutters sx={{ py: 0.25 }}>
                      <ListItemText
                        primary={ci.ingredients.name}
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          color: 'error.main',
                          fontStyle: 'italic'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Box>
        )}
      </Box>

      <Divider />

      {/* Title row — always visible, always toggles expand/collapse */}
      <CardActionArea onClick={() => setExpanded((prev) => !prev)}>
        <CardContent sx={{ py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight={700} noWrap sx={{ flex: 1, mr: 1 }}>
              {cocktail.name}
            </Typography>
            {expanded ? (
              <ExpandLess sx={{ color: 'text.secondary', flexShrink: 0 }} />
            ) : (
              <ExpandMore sx={{ color: 'text.secondary', flexShrink: 0 }} />
            )}
          </Box>
          {submitterName && (
            <Typography variant="caption" color="text.secondary">
              Submitted by {submitterName}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
