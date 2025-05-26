import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { PRIMARY_COLOR, SECONDARY_COLOR } from './colors';

interface LastScanTimeProps {
  scanTime?: number; // Time in seconds
}

export default function LastScanTime({ scanTime }: LastScanTimeProps) {
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (showLabel) {
      timeoutId = setTimeout(() => {
        setShowLabel(false);
      }, 5000);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showLabel]);

  if (!scanTime) return null;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} seconds`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    }
    return `${minutes} minute${minutes === 1 ? '' : 's'} ${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'}`;
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {showLabel && (
        <Box
          sx={{
            background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`,
            borderRadius: 2,
            p: 1.5,
            boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)',
            animation: 'fadeIn 0.2s ease-in-out',
            '@keyframes fadeIn': {
              '0%': {
                opacity: 0,
                transform: 'translateX(10px)',
              },
              '100%': {
                opacity: 1,
                transform: 'translateX(0)',
              },
            },
          }}
        >
          <Typography
            sx={{
              color: 'white',
              fontSize: 14,
              fontWeight: 500,
              fontFamily: 'Roboto, sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            Last scan took {formatTime(scanTime)}
          </Typography>
        </Box>
      )}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`,
          borderRadius: '50%',
          p: 0.5,
          boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)',
          cursor: 'pointer',
        }}
        onClick={() => setShowLabel(true)}
      >
        <IconButton
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <AccessTimeIcon />
        </IconButton>
      </Box>
    </Box>
  );
} 