import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { PRIMARY_COLOR, SECONDARY_COLOR } from './colors';
import AssessmentIcon from '@mui/icons-material/Assessment';

interface NoDataErrorProps {
  title: string;
  description: string;
  onRunAnalysis?: () => void;
}

export default function NoDataError({ title, description, onRunAnalysis }: NoDataErrorProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        borderRadius: 4,
        background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`,
        boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)',
        width: '100%',
        maxWidth: 600,
        textAlign: 'center',
      }}
    >
      <AssessmentIcon sx={{ fontSize: 64, color: 'white', mb: 2, opacity: 0.9 }} />
      <Typography
        variant="h4"
        component="h2"
        sx={{
          color: 'white',
          fontWeight: 700,
          mb: 2,
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: 'white',
          opacity: 0.9,
          mb: 3,
          maxWidth: 400,
        }}
      >
        {description}
      </Typography>
      {onRunAnalysis && (
        <Button
          onClick={onRunAnalysis}
          sx={{
            color: 'white',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 999,
            px: 4,
            py: 1,
            fontWeight: 500,
            textTransform: 'none',
            '&:hover': {
              background: 'rgba(255,255,255,0.3)',
            },
          }}
        >
          Run Analysis
        </Button>
      )}
    </Box>
  );
} 