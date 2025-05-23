import React from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  IconButton,
  Box,
  DialogTitle,
  List,
  ListItem,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BugReportIcon from '@mui/icons-material/BugReport';
import { QUATERNARY_COLOR, TERTIARY_COLOR, ICON_COLOR } from './colors';

interface IssueItem {
  number: number;
  title: string;
  state: string;
  created_at: string;
  closed_at?: string | null;
  user: string;
}

interface IssueDialogBoxProps {
  open: boolean;
  onClose: () => void;
  openedCount: number;
  closedCount: number;
  openedIssues: IssueItem[];
  closedIssues: IssueItem[];
  gradient?: string;
  errorMessage?: string;
}

const IssueDialogBox: React.FC<IssueDialogBoxProps> = ({
  open,
  onClose,
  openedCount,
  closedCount,
  openedIssues,
  closedIssues,
  gradient,
  errorMessage
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            background: gradient || `linear-gradient(135deg, ${TERTIARY_COLOR} 0%, ${QUATERNARY_COLOR} 100%)`,
            borderRadius: 4,
            boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)',
            width: { xs: '90%', sm: '48%', md: '32%' },
          },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', pb: 0, position: 'relative' }}>
        <Box sx={{ display: 'flex', gap: 4, width: '100%', mt: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700} sx={{ color: 'white', mb: 0.5 }}>Opened Issues</Typography>
            <Typography variant="h3" fontWeight={700} sx={{ color: 'white', fontFamily: 'Roboto Mono, monospace', fontSize: 32 }}>{openedCount}</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700} sx={{ color: 'white', mb: 0.5 }}>Closed Issues</Typography>
            <Typography variant="h3" fontWeight={700} sx={{ color: 'white', fontFamily: 'Roboto Mono, monospace', fontSize: 32 }}>{closedCount}</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="large" sx={{ position: 'absolute', right: 16, top: 16, color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          background: 'none',
          p: { xs: 3, sm: 4 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          height: '100%',
          minHeight: 0,
          maxHeight: '60vh',
        }}
      >
        {errorMessage ? (
          <Typography sx={{ color: '#ff6b6b', fontWeight: 600, fontSize: 18, mt: 2 }}>{errorMessage}</Typography>
        ) : (
          <>
            <Typography variant="h6" fontWeight={700} sx={{ color: 'white', mt: 2, mb: 1 }}>Open Issues</Typography>
            <List sx={{ maxHeight: 180, overflowY: 'auto', width: '100%', bgcolor: 'transparent' }}>
              {openedIssues.length === 0 ? (
                <Typography sx={{ color: 'white', opacity: 0.7, fontStyle: 'italic', pl: 2 }}>No open issues in the last year.</Typography>
              ) : (
                openedIssues.map((issue) => (
                  <ListItem key={issue.number} sx={{ px: 0, py: 1, alignItems: 'flex-start' }}>
                    <BugReportIcon sx={{ color: ICON_COLOR, mr: 2, mt: 0.5 }} />
                    <Box>
                      <Typography variant="body1" fontWeight={600} sx={{ color: 'white' }}>{issue.title}</Typography>
                      <Typography variant="body2" sx={{ color: 'white', opacity: 0.85, fontSize: 13 }}>#{issue.number} by {issue.user} • Opened {issue.created_at.slice(0, 10)}</Typography>
                    </Box>
                  </ListItem>
                ))
              )}
            </List>
            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }} />
            <Typography variant="h6" fontWeight={700} sx={{ color: 'white', mt: 2, mb: 1 }}>Closed Issues</Typography>
            <List sx={{ maxHeight: 180, overflowY: 'auto', width: '100%', bgcolor: 'transparent' }}>
              {closedIssues.length === 0 ? (
                <Typography sx={{ color: 'white', opacity: 0.7, fontStyle: 'italic', pl: 2 }}>No closed issues in the last year.</Typography>
              ) : (
                closedIssues.map((issue) => (
                  <ListItem key={issue.number} sx={{ px: 0, py: 1, alignItems: 'flex-start' }}>
                    <BugReportIcon sx={{ color: ICON_COLOR, mr: 2, mt: 0.5 }} />
                    <Box>
                      <Typography variant="body1" fontWeight={600} sx={{ color: 'white' }}>{issue.title}</Typography>
                      <Typography variant="body2" sx={{ color: 'white', opacity: 0.85, fontSize: 13 }}>#{issue.number} by {issue.user} • Closed {issue.closed_at ? issue.closed_at.slice(0, 10) : ''}</Typography>
                    </Box>
                  </ListItem>
                ))
              )}
            </List>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default IssueDialogBox; 