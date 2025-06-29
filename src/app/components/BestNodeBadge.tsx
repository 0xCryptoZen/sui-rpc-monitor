'use client';

import { Chip, Box, useTheme } from '@mui/material';
import { Star } from '@mui/icons-material';

export function BestNodeBadge() {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        position: 'absolute',
        top: -8,
        right: -8,
        zIndex: 10,
      }}
    >
      <Chip
        icon={<Star sx={{ fontSize: '1rem !important' }} />}
        label="BEST NODE"
        size="small"
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'white',
          fontWeight: 'bold',
          fontSize: '0.65rem',
          height: 24,
          borderRadius: '12px',
          boxShadow: theme.shadows[4],
          animation: 'pulse 2s infinite',
          '& .MuiChip-icon': {
            color: 'white',
          },
        }}
      />
      
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </Box>
  );
}