import { useCallback, useEffect, useState } from 'react'
import {
  AppBar,
  Box,
  Button,
  Container,
  Skeleton,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  Alert,
} from '@mui/material'
import { ArrowDownward, ArrowUpward, LocalBar, Logout, Upload } from '@mui/icons-material'
import { supabase } from '../lib/supabaseClient'
import type { User } from '@supabase/supabase-js'
import type { Cocktail } from '../types/cocktail'
import CocktailCard from '../components/CocktailCard'
import MyBar from '../components/MyBar'
import SubmitCocktailDialog from '../components/SubmitCocktailDialog'
import { THEME_COLORS } from '../theme'

const COCKTAILS_QUERY = `
  id, name, instructions, notes, glassware, garnish,
  created_at, image_path, image_bucket, image_alt, submitted_by,
  cocktail_ingredients (
    amount, unit, prep, sort_order,
    ingredients (id, name, kind, is_alcoholic)
  )
`

const MAIN_CONTAINER_SX = {
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: 'linear-gradient(135deg, #fff8f0 0%, #fce4ec 50%, #f3e5f5 100%)',
}

const APP_BAR_SX = {
  background: 'rgba(255,255,255,0.8)',
  backdropFilter: 'blur(10px)',
  boxShadow: 'none',
  borderBottom: '1px solid rgba(0,0,0,0.08)',
}

const GRID_SX = {
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, 1fr)',
    md: 'repeat(4, 1fr)',
  },
  alignItems: 'start',
  gap: 3,
}

interface HomePageProps {
  user: User
}

export default function HomePage({ user }: HomePageProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [cocktails, setCocktails] = useState<Cocktail[]>([])
  const [cocktailsLoading, setCocktailsLoading] = useState(true)
  const [cocktailsError, setCocktailsError] = useState<string | null>(null)
  const [userIngredientIds, setUserIngredientIds] = useState<Set<number>>(new Set())
  const [submitterNames, setSubmitterNames] = useState<Map<string, string>>(new Map())
  const [communitySort, setCommunitySort] = useState<'asc' | 'desc'>('desc')
  const [submitOpen, setSubmitOpen] = useState(false)

  // Fetch user display name
  const fetchDisplayName = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()
    
    setDisplayName(data?.display_name ?? null)
  }, [user.id])

  // Fetch cocktails and user ingredients
  const fetchData = useCallback(async () => {
    const [cocktailsResult, userIngredientsResult] = await Promise.all([
      supabase.from('cocktails').select(COCKTAILS_QUERY).order('name'),
      supabase.from('user_ingredients').select('ingredient_id').eq('user_id', user.id),
    ])

    if (cocktailsResult.error) {
      setCocktailsError(cocktailsResult.error.message)
    } else {
      const cocktailData = (cocktailsResult.data as unknown as Cocktail[]) ?? []
      setCocktails(cocktailData)

      const submitterIds = [...new Set(
        cocktailData.filter((c) => c.submitted_by).map((c) => c.submitted_by as string)
      )]
      if (submitterIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', submitterIds)
        setSubmitterNames(new Map((profiles ?? []).map((p) => [p.id, p.display_name])))
      } else {
        setSubmitterNames(new Map())
      }
    }

    setUserIngredientIds(
      new Set((userIngredientsResult.data ?? []).map((r) => r.ingredient_id as number))
    )
    setCocktailsLoading(false)
  }, [user.id])

  // Re-sync user ingredients
  const syncUserIngredients = useCallback(async () => {
    if (activeTab !== 0 || cocktailsLoading) return
    
    const { data } = await supabase
      .from('user_ingredients')
      .select('ingredient_id')
      .eq('user_id', user.id)
    
    setUserIngredientIds(new Set((data ?? []).map((r) => r.ingredient_id as number)))
  }, [activeTab, cocktailsLoading, user.id])

  // Categorize cocktails based on available ingredients
  const categorizeCocktails = useCallback(() => {
    const regularCocktails = cocktails.filter((c) => c.submitted_by === null)

    const makeable = regularCocktails.filter(
      (c) =>
        c.cocktail_ingredients.length > 0 &&
        c.cocktail_ingredients
          .filter((ci) => ci.ingredients.kind !== 'garnish') // Ignore garnishes
          .every((ci) => userIngredientIds.has(ci.ingredients.id))
    )

    const missing = regularCocktails.filter(
      (c) =>
        c.cocktail_ingredients.length === 0 ||
        c.cocktail_ingredients
          .filter((ci) => ci.ingredients.kind !== 'garnish') // Ignore garnishes
          .some((ci) => !userIngredientIds.has(ci.ingredients.id))
    )

    return { makeable, missing }
  }, [cocktails, userIngredientIds])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  useEffect(() => {
    fetchDisplayName()
  }, [fetchDisplayName])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    syncUserIngredients()
  }, [syncUserIngredients])

  return (
    <Box sx={MAIN_CONTAINER_SX}>
      <AppBar position="fixed" sx={APP_BAR_SX}>
        <Toolbar>
          <LocalBar sx={{ color: THEME_COLORS.primary, mr: 1 }} />
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
              color: THEME_COLORS.primary,
              borderColor: THEME_COLORS.primary,
              '&:hover': { borderColor: THEME_COLORS.primaryDark, background: THEME_COLORS.primaryLighter },
            }}
          >
            Sign Out
          </Button>
        </Toolbar>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            px: 2,
            '& .MuiTab-root': { 
              color: 'text.secondary', 
              fontWeight: 600,
              '&.Mui-selected': { 
                color: THEME_COLORS.primary 
              }
            },
            '& .MuiTabs-indicator': { backgroundColor: THEME_COLORS.primary },
          }}
        >
          <Tab label="Cocktails" />
          <Tab label="Community Creations" />
          <Tab label="My Bar" />
        </Tabs>
      </AppBar>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          mt: '112px', // Account for fixed AppBar + Tabs height
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
        {activeTab === 0 && (
          <>
            {cocktailsError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {cocktailsError}
              </Alert>
            )}

            {cocktailsLoading ? (
              <Box sx={GRID_SX}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={260} sx={{ borderRadius: 3 }} />
                ))}
              </Box>
            ) : (() => {
              const regularCocktails = cocktails.filter((c) => c.submitted_by === null)
              if (regularCocktails.length === 0) return (
                <Box sx={{ textAlign: 'center', py: 10 }}>
                  <LocalBar sx={{ fontSize: 64, color: THEME_COLORS.primary, opacity: 0.3, mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No cocktails yet.
                  </Typography>
                </Box>
              )
              if (userIngredientIds.size === 0) return (
                <>
                  <Alert
                    severity="info"
                    sx={{
                      mb: 3,
                      backgroundColor: THEME_COLORS.alertBackground,
                      color: THEME_COLORS.primaryDark,
                      border: `1px solid ${THEME_COLORS.alertBorder}`,
                      '& .MuiAlert-icon': {
                        color: THEME_COLORS.primary
                      }
                    }}
                  >
                    Add ingredients in <strong>My Bar</strong> to see which cocktails you can make.
                  </Alert>
                  <Box sx={GRID_SX}>
                    {regularCocktails.map((cocktail) => (
                      <CocktailCard key={cocktail.id} cocktail={cocktail} userIngredientIds={userIngredientIds} submitterName={cocktail.submitted_by ? submitterNames.get(cocktail.submitted_by) : undefined} />
                    ))}
                  </Box>
                </>
              )
              const { makeable, missing } = categorizeCocktails()
              return (
                <>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    YOU CAN MAKE ({makeable.length})
                  </Typography>
                  {makeable.length === 0 ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 4, fontStyle: 'italic' }}
                    >
                      None yet — add more ingredients in My Bar.
                    </Typography>
                  ) : (
                    <Box sx={{ ...GRID_SX, mb: 4 }}>
                      {makeable.map((cocktail) => (
                        <CocktailCard key={cocktail.id} cocktail={cocktail} userIngredientIds={userIngredientIds} submitterName={cocktail.submitted_by ? submitterNames.get(cocktail.submitted_by) : undefined} />
                      ))}
                    </Box>
                  )}

                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    MISSING INGREDIENTS ({missing.length})
                  </Typography>
                  <Box sx={GRID_SX}>
                    {missing.map((cocktail) => (
                      <CocktailCard key={cocktail.id} cocktail={cocktail} userIngredientIds={userIngredientIds} submitterName={cocktail.submitted_by ? submitterNames.get(cocktail.submitted_by) : undefined} />
                    ))}
                  </Box>
                </>
              )
            })()}
          </>
        )}

        {activeTab === 1 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={communitySort === 'desc' ? <ArrowDownward /> : <ArrowUpward />}
                onClick={() => setCommunitySort((s) => (s === 'desc' ? 'asc' : 'desc'))}
                sx={{
                  color: THEME_COLORS.primary,
                  borderColor: THEME_COLORS.primary,
                  '&:hover': { borderColor: THEME_COLORS.primaryDark, background: THEME_COLORS.primaryLighter },
                }}
              >
                {communitySort === 'desc' ? 'Newest first' : 'Oldest first'}
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<Upload />}
                onClick={() => setSubmitOpen(true)}
                sx={{
                  backgroundColor: THEME_COLORS.primary,
                  '&:hover': { backgroundColor: THEME_COLORS.primaryDark },
                }}
              >
                Upload a Cocktail
              </Button>
            </Box>
            {cocktailsLoading ? (
              <Box sx={GRID_SX}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={260} sx={{ borderRadius: 3 }} />
                ))}
              </Box>
            ) : (() => {
              const communityCocktails = cocktails
                .filter((c) => c.submitted_by !== null)
                .sort((a, b) => {
                  const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                  return communitySort === 'asc' ? diff : -diff
                })
              if (communityCocktails.length === 0) return (
                <Box sx={{ textAlign: 'center', py: 10 }}>
                  <LocalBar sx={{ fontSize: 64, color: THEME_COLORS.primary, opacity: 0.3, mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No community creations yet.
                  </Typography>
                </Box>
              )
              return (
                <Box sx={GRID_SX}>
                  {communityCocktails.map((cocktail) => (
                    <CocktailCard key={cocktail.id} cocktail={cocktail} userIngredientIds={userIngredientIds} submitterName={cocktail.submitted_by ? submitterNames.get(cocktail.submitted_by) : undefined} />
                  ))}
                </Box>
              )
            })()}
          </>
        )}

        {activeTab === 2 && (
          <MyBar user={user} />
        )}
        </Container>
      </Box>

      <SubmitCocktailDialog
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onSubmitted={fetchData}
        user={user}
      />
    </Box>
  )
}
