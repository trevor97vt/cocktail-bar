import { useState, useCallback } from 'react'
import {
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material'
import { Visibility, VisibilityOff, LocalBar } from '@mui/icons-material'
import { supabase } from '../lib/supabaseClient'

// Constants
const THEME_COLORS = {
  primary: '#e91e63',
  gradient: 'linear-gradient(90deg, #e91e63, #9c27b0)',
} as const

const INPUT_SX = {
  '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: THEME_COLORS.primary },
  '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLORS.primary },
}

// Types
type AuthMode = 'signIn' | 'signUp'

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [displayNameError, setDisplayNameError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const validateDisplayName = useCallback((value: string): string | null => {
    if (value.trim().length < 6) return 'Display name must be at least 6 characters.'
    return null
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (mode === 'signUp') {
      const nameError = validateDisplayName(displayName)
      setDisplayNameError(nameError)
      if (nameError) return
    }

    setLoading(true)

    try {
      if (mode === 'signIn') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        // Check display name uniqueness before signing up
        const { data: existing, error: lookupError } = await supabase
          .from('profiles')
          .select('id')
          .eq('display_name', displayName.trim())
          .maybeSingle()

        if (lookupError) throw lookupError
        if (existing) {
          setDisplayNameError('That display name is already taken.')
          return
        }

        const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError

        const user = data.user
        if (user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({ id: user.id, display_name: displayName.trim() })
          if (profileError) throw profileError
        }

        setSuccessMessage('Account created! Check your email to confirm your account.')
        setEmail('')
        setPassword('')
        setDisplayName('')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setMode((prev) => (prev === 'signIn' ? 'signUp' : 'signIn'))
    setError(null)
    setSuccessMessage(null)
    setDisplayNameError(null)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fff8f0 0%, #fce4ec 50%, #f3e5f5 100%)',
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 3,
          }}
        >
          {/* Logo / Branding */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LocalBar sx={{ fontSize: 48, color: THEME_COLORS.primary, mb: 1 }} />
            <Typography variant="h4" fontWeight={700} letterSpacing={1}>
              Cocktail Bar
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {mode === 'signIn' ? 'Welcome back! Sign in to continue.' : 'Create an account to get started.'}
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Email address"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={textFieldSx}
              margin="normal"
              autoComplete="email"
              autoFocus
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                ...textFieldSx,
                '& input::-ms-reveal': { display: 'none' },
                '& input::-ms-clear': { display: 'none' },
              }}
              margin="normal"
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            {mode === 'signUp' && (
              <TextField
                label="Display name"
                type="text"
                fullWidth
                required
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value)
                  if (displayNameError) setDisplayNameError(validateDisplayName(e.target.value))
                }}
                onBlur={() => setDisplayNameError(validateDisplayName(displayName))}
                error={!!displayNameError}
                helperText={displayNameError ?? 'At least 6 characters. Must be unique.'}
                sx={textFieldSx}
                margin="normal"
                autoComplete="username"
              />
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                background: THEME_COLORS.gradient,
                fontWeight: 700,
                fontSize: '1rem',
                letterSpacing: 0.5,
                '&:hover': {
                  background: 'linear-gradient(90deg, #c2185b, #7b1fa2)',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : mode === 'signIn' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </Button>
          </Box>

          {/* Toggle mode */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {mode === 'signIn' ? "Don't have an account? " : 'Already have an account? '}
              <Link
                component="button"
                type="button"
                onClick={toggleMode}
                sx={{
                  color: THEME_COLORS.primary,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {mode === 'signIn' ? 'Sign Up' : 'Sign In'}
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}

const textFieldSx = INPUT_SX
