import React from 'react';
import { Autocomplete, TextField, Chip } from '@mui/material';

interface ChipSelectorProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}

const ChipSelector = ({ label, options, value, onChange }: ChipSelectorProps) => (
  <Autocomplete
    multiple
    freeSolo
    options={options}
    value={value}
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
    renderInput={(params) => <TextField {...params} label={label} />}
  />
);

export default ChipSelector;
