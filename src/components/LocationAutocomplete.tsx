import { useState, useEffect, useRef, useCallback } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { useJsApiLoader } from '@react-google-maps/api';
import { LatLng } from '../utils/geoDistance';

const MAPS_LIBRARIES: ('places')[] = ['places'];

interface Props {
  value: string;
  onChange: (value: string) => void;
  onCoordinates?: (latLng: LatLng | null) => void;
  label?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  required?: boolean;
}

const LocationAutocomplete = ({ value, onChange, onCoordinates, label = 'Location', fullWidth = true, size, required }: Props) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY!,
    libraries: MAPS_LIBRARIES,
  });
  const [inputValue, setInputValue] = useState(value);
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const suggestionMapRef = useRef<Map<string, google.maps.places.AutocompleteSuggestion>>(new Map());

  useEffect(() => { setInputValue(value); }, [value]);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input || input.length < 2 || !isLoaded) { setOptions([]); return; }
    setLoading(true);
    try {
      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
      }
      const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
        sessionToken: sessionTokenRef.current,
        includedRegionCodes: ['au'],
      });
      const map = new Map<string, google.maps.places.AutocompleteSuggestion>();
      const texts: string[] = [];
      suggestions.forEach(s => {
        const text = s.placePrediction?.text?.text ?? '';
        if (text) { map.set(text, s); texts.push(text); }
      });
      suggestionMapRef.current = map;
      setOptions(texts);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (_: unknown, newInput: string, reason: string) => {
    setInputValue(newInput);
    if (reason === 'clear') { onChange(''); setOptions([]); onCoordinates?.(null); return; }
    if (reason === 'input') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchSuggestions(newInput), 300);
    }
  };

  const handleChange = async (_: unknown, selected: string | null) => {
    if (!selected) return;
    onChange(selected);
    sessionTokenRef.current = null;

    if (onCoordinates) {
      const suggestion = suggestionMapRef.current.get(selected);
      if (suggestion?.placePrediction) {
        try {
          const place = suggestion.placePrediction.toPlace();
          await place.fetchFields({ fields: ['location'] });
          const loc = (place as any).location;
          onCoordinates(loc ? { lat: loc.lat(), lng: loc.lng() } : null);
        } catch {
          onCoordinates(null);
        }
      } else {
        onCoordinates(null);
      }
    }
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
          label={label}
          fullWidth={fullWidth}
          size={size}
          required={required}
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

export default LocationAutocomplete;
