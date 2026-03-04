import { useEffect, useState } from 'react'
import { CssBaseline, ThemeProvider, createTheme, CircularProgress, Box } from '@mui/material'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'

const theme = createTheme({
  palette: {
    mode: 'light',
  },
  typography: {
    fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif',
  },
})

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #fff8f0 0%, #fce4ec 50%, #f3e5f5 100%)',
          }}
        >
          <CircularProgress sx={{ color: '#e91e63' }} />
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {session ? <HomePage user={session.user} /> : <LoginPage />}
    </ThemeProvider>
  )
}

export default App
