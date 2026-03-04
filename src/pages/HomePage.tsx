import { useEffect, useState } from 'react'
import {
  AppBar,
  Box,
  Button,
  Container,
  Skeleton,
  Toolbar,
  Typography,
  Alert,
} from '@mui/material'
import { LocalBar, Logout } from '@mui/icons-material'
import { supabase } from '../lib/supabaseClient'
import type { User } from '@supabase/supabase-js'
import type { Cocktail } from '../types/cocktail'
import CocktailCard from '../components/CocktailCard'

interface HomePageProps {
  user: User
}

export default function HomePage({ user }: HomePageProps) {
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [cocktails, setCocktails] = useState<Cocktail[]>([])
  const [cocktailsLoading, setCocktailsLoading] = useState(true)
  const [cocktailsError, setCocktailsError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setDisplayName(data?.display_name ?? null))
  }, [user.id])

  useEffect(() => {
    supabase
      .from('cocktails')
      .select(`
        id, name, instructions, notes, glassware, garnish,
        image_path, image_bucket, image_alt,
        cocktail_ingredients (
          amount, unit, prep, sort_order,
          ingredients (id, name, kind, is_alcoholic)
        )
      `)
      .order('name')
      .then(({ data, error }) => {
        if (error) {
          setCocktailsError(error.message)
        } else {
          setCocktails((data as unknown as Cocktail[]) ?? [])
        }
        setCocktailsLoading(false)
      })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fff8f0 0%, #fce4ec 50%, #f3e5f5 100%)',
      }}
    >
      <AppBar
        position="static"
        sx={{
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(10px)',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <Toolbar>
          <LocalBar sx={{ color: '#e91e63', mr: 1 }} />
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1, color: 'text.primary' }}>
            Cocktail Bar
          </Typography>
          {displayName !== null ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', mr: 2 }}>
              {displayName}
            </Typography>
          ) : (
            <Skeleton variant="text" width={80} sx={{ mr: 2 }} />
          )}
          <Button
            variant="outlined"
            startIcon={<Logout />}
            onClick={handleSignOut}
            size="small"
            sx={{
              color: '#e91e63',
              borderColor: '#e91e63',
              '&:hover': { borderColor: '#c2185b', background: 'rgba(233,30,99,0.08)' },
            }}
          >
            Sign Out
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {cocktailsError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {cocktailsError}
          </Alert>
        )}

        {cocktailsLoading ? (
          <Box sx={gridSx}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={260} sx={{ borderRadius: 3 }} />
            ))}
          </Box>
        ) : cocktails.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <LocalBar sx={{ fontSize: 64, color: '#e91e63', opacity: 0.3, mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No cocktails yet.
            </Typography>
          </Box>
        ) : (
          <Box sx={gridSx}>
            {cocktails.map((cocktail) => (
              <CocktailCard key={cocktail.id} cocktail={cocktail} />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  )
}

const gridSx = {
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, 1fr)',
    md: 'repeat(4, 1fr)',
  },
  alignItems: 'start',
  gap: 3,
}
