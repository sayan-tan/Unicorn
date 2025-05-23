import React, { ReactNode } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

interface HealthQualityCardProps {
  icon: ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  gradient: string;
  iconColor?: string;
  sx?: SxProps<Theme>;
  onClick?: () => void;
  score?: number;
}

export default function HealthQualityCard({ icon, title, description, gradient, iconColor, sx, onClick, score }: HealthQualityCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        background: gradient,
        borderRadius: 4,
        width: 350,
        minWidth: 320,
        height: 300,
        minHeight: 120,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 2px 16px 0 rgba(0,0,0,0.04)',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
        },
        ...sx,
      }}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {/* Icon or Score Container */}
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
          mt: 4,
        }}
      >
        {typeof score === 'number' ? (
          <Typography
            variant="h4"
            sx={{
              color: iconColor || '#ff6301',
              fontWeight: 800,
              fontFamily: 'Roboto Mono, monospace',
              fontSize: 22,
              lineHeight: 1,
            }}
          >
            {score}
          </Typography>
        ) : (
          icon
        )}
      </Box>

      {/* Title */}
      <Typography
        variant="h4"
        component="h2"
        sx={{
          color: 'white',
          fontWeight: 700,
          textAlign: 'center',
          mb: description ? 2 : 0,
          lineHeight: 1.1,
        }}
      >
        {typeof title === 'string'
          ? (title.split(' ').length > 1
              ? <>{title.split(' ').slice(0, -1).join(' ')}<br />{title.split(' ').slice(-1)}</>
              : title)
          : title}
      </Typography>

      {/* Description */}
      {description && (
        <Typography
          variant="body2"
          sx={{
            color: 'white',
            textAlign: 'center',
            opacity: 0.95,
            fontFamily: 'Roboto Mono, monospace',
            fontSize: { xs: '0.95rem', sm: '1.05rem' },
            letterSpacing: 0.5,
            width: '90%',
            px: 2,
            mx: 'auto',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {description}
        </Typography>
      )}
    </Paper>
  );
} 