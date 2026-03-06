import { useState, useEffect } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { Add, Delete } from '@mui/icons-material'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { THEME_COLORS } from '../theme'
import { normalize } from '../utils'

// Types
interface Ingredient {
  id: number
  name: string
}

interface IngredientRow {
  ingredient: Ingredient | null
  amount: string
  unit: string
  prep: string
}

interface SubmitCocktailDialogProps {
  open: boolean
  onClose: () => void
  onSubmitted: () => void
  user: User
}

const emptyRow = (): IngredientRow => ({ ingredient: null, amount: '', unit: '', prep: '' })

export default function SubmitCocktailDialog({
  open,
  onClose,
  onSubmitted,
  user,
}: SubmitCocktailDialogProps) {
  const [name, setName] = useState('')
  const [instructions, setInstructions] = useState('')
  const [glassware, setGlassware] = useState('')
  const [garnish, setGarnish] = useState('')
  const [notes, setNotes] = useState('')
  const [rows, setRows] = useState<IngredientRow[]>([emptyRow(), emptyRow()])
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([])
  const [glasswareOptions, setGlasswareOptions] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch ingredient options and glassware types when dialog opens
  useEffect(() => {
    if (!open) return
    supabase
      .from('ingredients')
      .select('id, name')
      .order('name')
      .then(({ data }) => setAllIngredients(data ?? []))
    supabase
      .from('cocktails')
      .select('glassware')
      .not('glassware', 'is', null)
      .then(({ data }) => {
        const unique = [...new Set((data ?? []).map((r) => r.glassware as string))].sort()
        setGlasswareOptions(unique)
      })
  }, [open])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setName('')
      setInstructions('')
      setGlassware('')
      setGarnish('')
      setNotes('')
      setRows([emptyRow(), emptyRow()])
      setError(null)
    }
  }, [open])

  const filledRows = rows.filter((r) => r.ingredient !== null)
  const canSubmit = name.trim() && instructions.trim() && filledRows.length >= 2 && !submitting

  const updateRow = (index: number, patch: Partial<IngredientRow>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    const { data: cocktailData, error: cocktailError } = await supabase
      .from('cocktails')
      .insert({
        name: name.trim(),
        instructions: instructions.trim(),
        notes: notes.trim() || null,
        glassware: glassware || null,
        garnish: garnish.trim() || null,
        submitted_by: user.id,
      })
      .select('id')
      .single()

    if (cocktailError) {
      setError(
        cocktailError.code === '23505'
          ? 'A cocktail with that name already exists. Please choose a different name.'
          : cocktailError.message
      )
      setSubmitting(false)
      return
    }

    const cocktailId = cocktailData.id

    const ingredientInserts = filledRows.map((r, i) => ({
      cocktail_id: cocktailId,
      ingredient_id: r.ingredient!.id,
      amount: r.amount ? parseFloat(r.amount) : null,
      unit: r.unit.trim() || null,
      prep: r.prep.trim() || null,
      sort_order: i,
    }))

    const { error: ingError } = await supabase
      .from('cocktail_ingredients')
      .insert(ingredientInserts)

    if (ingError) {
      // Roll back the cocktail insert so nothing is left in a partial state
      await supabase.from('cocktails').delete().eq('id', cocktailId)
      setError(ingError.message)
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    onSubmitted()
    onClose()
  }

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight={700}>Submit a Cocktail</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <TextField
          label="Cocktail Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl sx={{ flex: 1 }}>
            <InputLabel>Glassware</InputLabel>
            <Select
              value={glassware}
              label="Glassware"
              onChange={(e) => setGlassware(e.target.value)}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {glasswareOptions.map((g) => (
                <MenuItem key={g} value={g}>
                  {g}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Garnish"
            value={garnish}
            onChange={(e) => setGarnish(e.target.value)}
            sx={{ flex: 1 }}
          />
        </Box>

        {/* Ingredients */}
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>
          INGREDIENTS (min. 2 required)
        </Typography>
        {rows.map((row, index) => (
          <Box
            key={index}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, mb: 1 }}
          >
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
              <Autocomplete
                options={allIngredients}
                getOptionLabel={(o) => o.name}
                filterOptions={(options, { inputValue }) =>
                  options.filter((o) => normalize(o.name).includes(normalize(inputValue)))
                }
                value={row.ingredient}
                onChange={(_, val) => updateRow(index, { ingredient: val })}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                renderInput={(params) => (
                  <TextField {...params} label="Ingredient" size="small" required />
                )}
                sx={{ flex: 1 }}
              />
              <IconButton
                size="small"
                onClick={() => removeRow(index)}
                disabled={rows.length <= 2}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Amount"
                value={row.amount}
                onChange={(e) => updateRow(index, { amount: e.target.value })}
                size="small"
                type="number"
                sx={{ flex: 1 }}
                slotProps={{ htmlInput: { min: 0, step: 0.25 } }}
              />
              <TextField
                label="Unit"
                value={row.unit}
                onChange={(e) => updateRow(index, { unit: e.target.value })}
                size="small"
                placeholder="oz, ml…"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Prep (optional)"
                value={row.prep}
                onChange={(e) => updateRow(index, { prep: e.target.value })}
                size="small"
                placeholder="muddled, torn…"
                sx={{ flex: 2 }}
              />
            </Box>
          </Box>
        ))}
        <Button
          size="small"
          startIcon={<Add />}
          onClick={() => setRows((prev) => [...prev, emptyRow()])}
          sx={{ color: THEME_COLORS.primary, mb: 2 }}
        >
          Add Ingredient
        </Button>

        <TextField
          label="Instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          fullWidth
          multiline
          minRows={3}
          required
          sx={{ mb: 2 }}
        />

        <TextField
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          fullWidth
          multiline
          minRows={2}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit}
          startIcon={
            submitting ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : undefined
          }
          sx={{
            backgroundColor: THEME_COLORS.primary,
            '&:hover': { backgroundColor: THEME_COLORS.primaryDark },
          }}
        >
          {submitting ? 'Submitting…' : 'Submit Cocktail'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
