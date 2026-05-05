import { useState } from 'react';
import { Autocomplete, TextField, Chip } from '@mui/material';

interface ChipSelectorProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}

const ChipSelector = ({ label, options, value, onChange }: ChipSelectorProps) => {
  const [inputValue, setInputValue] = useState('');

  const commitInput = (raw: string) => {
    const trimmed = raw.replace(/,/g, '').trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue('');
  };

  return (
    <Autocomplete
      multiple
      freeSolo
      options={options}
      value={value}
      inputValue={inputValue}
      open={inputValue.replace(/,/g, '').trim().length > 0}
      onInputChange={(_, newInputValue) => {
        if (newInputValue.includes(',')) {
          commitInput(newInputValue);
        } else {
          setInputValue(newInputValue);
        }
      }}
      onChange={(_, newValue) => onChange(newValue as string[])}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip
            label={option}
            {...getTagProps({ index })}
            sx={{ bgcolor: '#7B2FBE', color: 'white', '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)' } }}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={value.length === 0 ? `Search or type, then press comma…` : undefined}
        />
      )}
    />
  );
};

export default ChipSelector;
