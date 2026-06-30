import { useState } from 'react';
import { Box } from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';

interface Props {
  value: number;
  onChange?: (rating: number) => void;
  size?: 'small' | 'medium' | 'large';
  readOnly?: boolean;
}

const SIZES = { small: 18, medium: 24, large: 32 };

const StarRating = ({ value, onChange, size = 'medium', readOnly = false }: Props) => {
  const [hovered, setHovered] = useState(0);
  const px = SIZES[size];
  const active = hovered || value;

  return (
    <Box display="flex" gap={0.25} sx={{ cursor: readOnly ? 'default' : 'pointer' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <Box
          key={star}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          onClick={() => !readOnly && onChange?.(star)}
          sx={{ lineHeight: 0, transition: 'transform 0.1s', '&:hover': readOnly ? {} : { transform: 'scale(1.2)' } }}
        >
          {star <= active
            ? <Star sx={{ fontSize: px, color: '#f59e0b' }} />
            : <StarBorder sx={{ fontSize: px, color: '#d1d5db' }} />
          }
        </Box>
      ))}
    </Box>
  );
};

export default StarRating;
