'use client';
import React, { useState } from 'react';
import { Box, IconButton } from '@mui/material';
import ChatDialog from './ChatDialog';
import { PRIMARY_COLOR, SECONDARY_COLOR } from './colors';
import Image from 'next/image';

export default function ChatbotIcon() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 1200,
        }}
      >
        <IconButton
          onClick={() => setIsOpen(true)}
          sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: `linear-gradient(135deg,${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`,
            boxShadow: '0 4px 24px 0 rgba(56,182,255,0.18)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'box-shadow 0.2s, transform 0.2s',
            '&:hover': {
              boxShadow: '0 8px 32px 0 rgba(56,182,255,0.28)',
              transform: 'scale(1.08)',
              background: `linear-gradient(135deg,${SECONDARY_COLOR} 0%, ${PRIMARY_COLOR} 100%)`,
            },
          }}
          size="large"
        >
          <Image src="/chat.svg" alt="Chatbot" width={32} height={32} />
        </IconButton>
      </Box>
      <ChatDialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
} 