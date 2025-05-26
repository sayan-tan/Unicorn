import React, { ReactNode } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

interface ActionCardProps {
  icon: ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  gradient: string;
  iconColor?: string;
  sx?: SxProps<Theme>;
  onClick?: () => void;
}

export default function ActionCard({ icon, title, description, gradient, iconColor, sx, onClick }: ActionCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        background: gradient,
        borderRadius: 4,
        width: 350,
        minWidth: 320,
        height: 400,
        minHeight: 360,
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
      {/* Icon Container */}
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
          '& .MuiSvgIcon-root': {
            fontSize: 28,
            color: iconColor || '#ff6301',
          },
          mt: 4,
        }}
      >
        {icon}
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