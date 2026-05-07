import { useState, useEffect, useRef, useCallback } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';

interface Props {
  value: string;
  onChange: (value: string) => void;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}

const InstitutionAutocomplete = ({ value, onChange, size, fullWidth = true }: Props) => {
  const [inputValue, setInputValue] = useState(value);
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => { setInputValue(value); }, [value]);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input || input.length < 2) { setOptions([]); return; }
    setLoading(true);
    try {
      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
      }
      const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
        sessionToken: sessionTokenRef.current,
        includedPrimaryTypes: ['university', 'school'],
      });
      const texts: string[] = [];
      suggestions.forEach(s => {
        const text = s.placePrediction?.text?.text ?? '';
        if (text) texts.push(text);
      });
      setOptions(texts);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (_: unknown, newInput: string, reason: string) => {
    setInputValue(newInput);
    if (reason === 'clear') { onChange(''); setOptions([]); return; }
    if (reason === 'input') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchSuggestions(newInput), 300);
    }
  };

  const handleChange = (_: unknown, selected: string | null) => {
    if (!selected) return;
    onChange(selected);
    sessionTokenRef.current = null;
  };

  return (
    <Autocomplete
      freeSolo
      options={options}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={handleChange}
      onBlur={() => { if (inputValue !== value) onChange(inputValue); }}
      loading={loading}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Institution (optional)"
          placeholder="University, TAFE, college…"
          fullWidth={fullWidth}
          size={size}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading && <CircularProgress size={16} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default InstitutionAutocomplete;
