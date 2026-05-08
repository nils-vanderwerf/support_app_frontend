import { useState, useEffect, useRef } from 'react';
import { TextField, Autocomplete, CircularProgress } from '@mui/material';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  required?: boolean;
}

const LocationAutocomplete = ({ value, onChange, label = 'Location', fullWidth = true, size, required }: Props) => {
  const {
    ready,
    suggestions: { status, data },
    setValue: setQuery,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: { componentRestrictions: { country: 'au' } },
    debounce: 300,
  });

  const [inputValue, setInputValue] = useState(value);
  const skipSync = useRef(false);

  // Keep input in sync when parent value changes externally (e.g. form reset)
  useEffect(() => {
    if (!skipSync.current) setInputValue(value);
    skipSync.current = false;
  }, [value]);

  const options = status === 'OK' ? data.map(d => d.description) : [];

  return (
    <Autocomplete
      freeSolo
      options={options}
      inputValue={inputValue}
      onInputChange={(_, newInput, reason) => {
        setInputValue(newInput);
        if (reason === 'input') setQuery(newInput);
        if (reason === 'clear') { onChange(''); clearSuggestions(); }
      }}
      onChange={(_, selected) => {
        if (typeof selected === 'string') {
          skipSync.current = true;
          setInputValue(selected);
          onChange(selected);
          clearSuggestions();
        }
      }}
      onBlur={() => {
        // Commit whatever is typed even if not selected from dropdown
        if (inputValue !== value) onChange(inputValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          fullWidth={fullWidth}
          size={size}
          required={required}
          disabled={!ready}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {!ready && <CircularProgress size={16} />}
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
