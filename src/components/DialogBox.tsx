import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Box,
  Checkbox,
  DialogTitle,
  List,
  ListItem,
  Divider,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CloseIcon from '@mui/icons-material/Close';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import BarChartIcon from '@mui/icons-material/BarChart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SecurityIcon from '@mui/icons-material/Security';
import { PRIMARY_COLOR, SECONDARY_COLOR, TERTIARY_COLOR, ICON_COLOR } from './colors';
import Image from 'next/image';
import config from '../config';

interface Repository {
  url: string;
  pat?: string;
  addedAt: string;
}

interface AddRepoDialogBoxProps {
  open: boolean;
  onClose: () => void;
  onAdd: (isDuplicate: boolean) => void;
}

export function AddRepoDialogBox({ open, onClose, onAdd }: AddRepoDialogBoxProps) {
  const [url, setUrl] = useState('');
  const [pat, setPat] = useState('');
  const [showPat, setShowPat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    try {
      setError(null);
      
      if (!url) {
        setError('Please enter a repository URL');
        return;
      }

      // Check if repo already exists in localStorage
      const existingRepos = JSON.parse(localStorage.getItem(config.STORAGE_KEYS.REPOS) || '[]') as Repository[];
      const isDuplicate = existingRepos.some((repo) => repo.url === url);

      if (isDuplicate) {
        onAdd(true); // Notify parent that this is a duplicate
        onClose();
        return;
      }

      // Get current repo URL from localStorage
      const currentRepoUrl = localStorage.getItem(config.STORAGE_KEYS.REPO_URL);
      
      // Only clean up API data if this is a different repository
      if (currentRepoUrl !== url) {
        const keysToRemove = [
          config.STORAGE_KEYS.GITHUB_FORKS,
          config.STORAGE_KEYS.GITHUB_CONTRIBUTORS,
          config.STORAGE_KEYS.GITHUB_ISSUES,
          config.STORAGE_KEYS.GITHUB_PULL_REQUESTS,
          config.STORAGE_KEYS.SAST_SECURITY_THREATS,
          config.STORAGE_KEYS.CODE_QUALITY_RESULT
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      // If not duplicate, proceed with saving
      const newRepo: Repository = {
        url,
        pat: pat || undefined,
        addedAt: new Date().toISOString()
      };

      // Save to repos array
      localStorage.setItem(config.STORAGE_KEYS.REPOS, JSON.stringify([...existingRepos, newRepo]));
      
      // Save current repo URL and PAT for immediate use
      localStorage.setItem(config.STORAGE_KEYS.REPO_URL, url);
      if (pat) {
        localStorage.setItem(config.STORAGE_KEYS.GITHUB_PAT, pat);
      }

      onAdd(false); // Notify parent that this is a new repo
      
      // Reset form and close dialog
      setUrl('');
      setPat('');
      onClose();
    } catch (error) {
      console.error('Error adding repository:', error);
      setError('Failed to add repository. Please try again.');
    }
  };

  const handleCancel = () => {
    setUrl('');
    setPat('');
    setError(null);
    onClose();
  };

  // Load saved values when dialog opens
  React.useEffect(() => {
    if (open) {
      // Get the most recently added repository
      const repos = JSON.parse(localStorage.getItem(config.STORAGE_KEYS.REPOS) || '[]') as Repository[];
      const lastRepo = repos[repos.length - 1];
      
      if (lastRepo) {
        setUrl(lastRepo.url);
        if (lastRepo.pat) {
          setPat(lastRepo.pat);
        }
      }
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      aria-labelledby="add-repo-dialog-title"
      slotProps={{
        paper: {
          sx: {
            background: `linear-gradient(135deg,${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`,
            borderRadius: 4,
            boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)',
            width: { xs: '90%', sm: '48%', md: '32%' },
            height: error ? '38vh' : '32vh',
          },
        },
      }}
    >
      <DialogTitle 
        id="add-repo-dialog-title"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" fontWeight={700} component="span" sx={{ color: 'white' }}>
            Add Repository
          </Typography>
        </Box>
        <IconButton onClick={handleCancel} size="large">
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
          maxHeight: '100%',
          position: 'relative',
        }}
      >
        {error && (
          <Typography
            sx={{
              color: '#ff6b6b',
              fontSize: '0.875rem',
              mb: 2,
              fontWeight: 500,
            }}
          >
            {error}
          </Typography>
        )}
        <TextField
          placeholder="Repository Link"
          variant="standard"
          fullWidth={false}
          value={url}
          onChange={e => setUrl(e.target.value)}
          sx={{
            mb: 2,
            mt: 5,
            input: { color: 'white', textAlign: 'left', fontSize: 14, pl: 0.5, '::placeholder': { fontSize: 18, color: 'white', opacity: 1 } },
            '& .MuiInputLabel-root': {
              left: 0,
              transform: 'none',
              textAlign: 'left',
              width: '100%',
              color: 'white',
              fontWeight: 400,
            },
            '& .MuiInput-underline:before': { borderBottomColor: 'white', borderBottomWidth: '1px' },
            '& .MuiInput-underline:after': { borderBottomColor: 'white', borderBottomWidth: '1.5px' },
            width: '80%',
            minWidth: 220,
            maxWidth: 340,
          }}
        />
        <TextField
          placeholder="Personal Access Token"
          variant="standard"
          type={showPat ? 'text' : 'password'}
          fullWidth={false}
          value={pat}
          onChange={e => setPat(e.target.value)}
          sx={{
            mb: 2,
            mt: 1,
            input: { color: 'white', textAlign: 'left', fontSize: 14, pl: 0.5, '::placeholder': { fontSize: 18, color: 'white', opacity: 1 } },
            '& .MuiInputLabel-root': {
              left: 0,
              transform: 'none',
              textAlign: 'left',
              width: '100%',
              color: 'white',
              fontWeight: 400,
            },
            '& .MuiInput-underline:before': { borderBottomColor: 'white', borderBottomWidth: '1px' },
            '& .MuiInput-underline:after': { borderBottomColor: 'white', borderBottomWidth: '1.5px' },
            width: '80%',
            minWidth: 220,
            maxWidth: 340,
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle pat visibility"
                  onClick={() => setShowPat((show) => !show)}
                  edge="end"
                  sx={{ color: 'white' }}
                >
                  {showPat ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ position: 'absolute', bottom: 24, right: 32, display: 'flex', gap: 1 }}>
          <Button
            onClick={handleAdd}
            sx={{
              color: 'white',
              background: PRIMARY_COLOR,
              borderRadius: 999,
              px: 3,
              fontWeight: 400,
              textTransform: 'none',
              boxShadow: 'none',
              fontSize: 14,
              height: 32,
              width: 90,
              '&:hover': { background: SECONDARY_COLOR },
            }}
          >
            Add
          </Button>
          <Button
            onClick={handleCancel}
            sx={{
              color: 'white',
              background: 'rgba(0,0,0,0.25)',
              borderRadius: 999,
              px: 3,
              fontWeight: 400,
              textTransform: 'none',
              boxShadow: 'none',
              fontSize: 14,
              height: 32,
              width: 90,
              '&:hover': { background: 'rgba(0,0,0,0.35)' },
            }}
          >
            Cancel
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

interface RunAnalysisDialogBoxProps {
  open: boolean;
  onClose: () => void;
  onRun: (selected: string[]) => void;
  isRunning?: boolean;
}

export function RunAnalysisDialogBox({ open, onClose, onRun, isRunning = false }: RunAnalysisDialogBoxProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const handleToggle = (label: string) => {
    setSelected(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const handleRun = () => {
    onRun(selected);
    // Don't reset selected or close dialog here - let parent handle that
  };

  const handleCancel = () => {
    setSelected([]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            background: `linear-gradient(135deg, ${TERTIARY_COLOR} 10%, ${SECONDARY_COLOR} 100%)`,
            borderRadius: 4,
            boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)',
            width: { xs: '90%', sm: '48%', md: '32%' },
            height: '35vh',
          },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" fontWeight={700} component="span" sx={{ color: 'white' }}>
            Run Analysis
          </Typography>
        </Box>
        <IconButton onClick={handleCancel} size="large" disabled={isRunning}>
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
          maxHeight: '100%',
          position: 'relative',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', width: '100%', mb: 4, mt: 5, gap: 4 }}>
          {/* Github Insights */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120 }}>
            <BarChartIcon sx={{ color: 'white', fontSize: 44, mb: 1 }} />
            <Typography sx={{ color: 'white', fontSize: 16, fontWeight: 600, mb: 1 }}>Github Insights</Typography>
            <Checkbox
              checked={selected.includes('Github Insights')}
              onChange={() => handleToggle('Github Insights')}
              sx={{ color: 'white', '&.Mui-checked': { color: 'white' }, mb: 0 }}
              disabled={isRunning}
            />
          </Box>
          {/* Health & Quality */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120 }}>
            <FavoriteIcon sx={{ color: 'white', fontSize: 44, mb: 1 }} />
            <Typography sx={{ color: 'white', fontSize: 16, fontWeight: 600, mb: 1 }}>Health & Quality</Typography>
            <Checkbox
              checked={selected.includes('Health & Quality')}
              onChange={() => handleToggle('Health & Quality')}
              sx={{ color: 'white', '&.Mui-checked': { color: 'white' }, mb: 0 }}
              disabled={isRunning}
            />
          </Box>
          {/* Security & Threats */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120 }}>
            <SecurityIcon sx={{ color: 'white', fontSize: 44, mb: 1 }} />
            <Typography sx={{ color: 'white', fontSize: 16, fontWeight: 600, mb: 1 }}>Security & Threats</Typography>
            <Checkbox
              checked={selected.includes('Security & Threats')}
              onChange={() => handleToggle('Security & Threats')}
              sx={{ color: 'white', '&.Mui-checked': { color: 'white' }, mb: 0 }}
              disabled={isRunning}
            />
          </Box>
        </Box>
        <Box sx={{ position: 'absolute', bottom: 24, right: 32, display: 'flex', gap: 1 }}>
          <Button
            onClick={handleRun}
            disabled={isRunning || selected.length === 0}
            sx={{
              color: 'white',
              background: isRunning 
                ? 'rgba(255,255,255,0.2)' 
                : `linear-gradient(90deg, ${TERTIARY_COLOR} 100%, ${SECONDARY_COLOR} 10%)`,
              borderRadius: 999,
              px: 3,
              fontWeight: 400,
              textTransform: 'none',
              boxShadow: 'none',
              fontSize: 14,
              height: 32,
              width: 90,
              '&:hover': { 
                background: isRunning 
                  ? 'rgba(255,255,255,0.2)' 
                  : `linear-gradient(90deg,${TERTIARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)` 
              },
              '&.Mui-disabled': {
                color: 'rgba(255,255,255,0.5)',
                background: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            {isRunning ? 'Running...' : 'Run'}
          </Button>
          <Button
            onClick={handleCancel}
            disabled={isRunning}
            sx={{
              color: 'white',
              background: 'rgba(0,0,0,0.25)',
              borderRadius: 999,
              px: 3,
              fontWeight: 400,
              textTransform: 'none',
              boxShadow: 'none',
              fontSize: 14,
              height: 32,
              width: 90,
              '&:hover': { background: 'rgba(0,0,0,0.35)' },
              '&.Mui-disabled': {
                color: 'rgba(255,255,255,0.5)',
                background: 'rgba(0,0,0,0.15)',
              },
            }}
          >
            Cancel
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

interface ForkItem {
  avatar: string;
  ownerName: string;
  repoName?: string; // Make repoName optional
  number?: number;
  contributions?: number;
}

interface DialogBoxProps {
  open: boolean;
  onClose: () => void;
  label: string;
  number: number;
  items: ForkItem[];
  gradient?: string;
  showSeparator?: boolean;
  showRightNumber?: boolean;
}

const ForksDialogBox: React.FC<DialogBoxProps> = ({ open, onClose, label, number, items, gradient, showSeparator = false, showRightNumber = false }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="forks-dialog-title"
      slotProps={{
        paper: {
          sx: {
            background: gradient || `linear-gradient(135deg,${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`,
            borderRadius: 4,
            boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)',
            width: { xs: '90%', sm: '48%', md: '32%' },
          },
        },
      }}
    >
      <DialogTitle
        id="forks-dialog-title"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          pb: 0,
          pl: 2,
        }}
      >
        <Typography
          variant="h5"
          component="div"
          fontWeight={700}
          sx={{
            color: 'white',
            mb: 0.5,
            letterSpacing: 1.5,
            textAlign: 'left',
            fontSize: 40,
            ml: 3,
            mt: 4,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="h3"
          component="div"
          fontWeight={700}
          sx={{
            color: 'white',
            fontFamily: 'Roboto Mono, monospace',
            fontSize: 32,
            textAlign: 'left',
            mb: 0.5,
            ml: 3,
          }}
        >
          {number}
        </Typography>
        <IconButton onClick={onClose} size="large" sx={{ position: 'absolute', right: 18, top: 16, color: 'white' }}>
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
          maxHeight: '100%',
        }}
      >
        <Box sx={{ mt: 2, borderRadius: 2, p: 2, width: '100%' }}>
          <List>
            {items.map((item, idx) => (
              <ListItem
                key={idx}
                sx={{
                  py: 1.5,
                  px: 0,
                  borderBottom: showSeparator && idx !== items.length - 1 ? '1px solid #e0e0e0' : 'none',
                  alignItems: 'flex-start',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Image
                    src={item.avatar}
                    alt={item.ownerName}
                    width={36}
                    height={36}
                    style={{ borderRadius: '50%', objectFit: 'cover', background: '#fff', marginRight: 16 }}
                  />
                  <Box sx={{ flex: 1 }}>
                    {item.repoName ? (
                      <>
                        <Typography variant="body1" fontWeight={600} sx={{ color: 'white' }}>{item.repoName}</Typography>
                        <Typography variant="body2" sx={{ color: 'white', opacity: 0.85, fontSize: 14, mt: 0.5 }}>{item.ownerName}</Typography>
                      </>
                    ) : (
                      <Typography variant="body1" fontWeight={600} sx={{ color: 'white' }}>{item.ownerName}</Typography>
                    )}
                  </Box>
                  {showRightNumber && (typeof item.number === 'number' || typeof item.contributions === 'number') && (
                    <Typography
                      variant="body1"
                      sx={{
                        color: 'white',
                        fontFamily: 'Roboto Mono, monospace',
                        fontWeight: 700,
                        fontSize: 18,
                        minWidth: 40,
                        textAlign: 'right',
                        ml: 2,
                      }}
                    >
                      {typeof item.number === 'number' ? item.number : item.contributions}
                    </Typography>
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ForksDialogBox;

interface ChartDialogBoxProps {
  open: boolean;
  onClose: () => void;
  label: string;
  number: number;
}

export const ChartDialogBox: React.FC<ChartDialogBoxProps> = ({ open, onClose, label, number }) => {
  // Mock pull request data
  const mockPRs = [
    {
      username: 'alice',
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      date: '2024-06-01',
      info: 'Refactored authentication logic for better security.'
    },
    {
      username: 'bob',
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      date: '2024-05-28',
      info: 'Fixed bug in dashboard rendering.'
    },
    {
      username: 'carol',
      avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
      date: '2024-05-20',
      info: 'Added new API endpoint for user stats.'
    },
    {
      username: 'dave',
      avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
      date: '2024-05-15',
      info: 'Improved test coverage for core modules.'
    },
    {
      username: 'eve',
      avatar: 'https://randomuser.me/api/portraits/women/5.jpg',
      date: '2024-05-10',
      info: 'Updated dependencies and fixed vulnerabilities.'
    },
    {
      username: 'frank',
      avatar: 'https://randomuser.me/api/portraits/men/6.jpg',
      date: '2024-05-05',
      info: 'Enhanced UI responsiveness on mobile.'
    },
    {
      username: 'grace',
      avatar: 'https://randomuser.me/api/portraits/women/7.jpg',
      date: '2024-05-01',
      info: 'Optimized database queries for performance.'
    },
  ];

  // Group PRs by date
  const prsByDate = mockPRs.reduce((acc, pr) => {
    if (!acc[pr.date]) acc[pr.date] = [];
    acc[pr.date].push(pr);
    return acc;
  }, {} as Record<string, typeof mockPRs>);
  const sortedDates = Object.keys(prsByDate).sort((a, b) => b.localeCompare(a));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="chart-dialog-title"
      slotProps={{
        paper: {
          sx: {
            background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`,
            borderRadius: 4,
            boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)',
            width: { xs: '90%', sm: '48%', md: '32%' },
          },
        },
      }}
    >
      <DialogTitle
        id="chart-dialog-title"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          pb: 0,
          pl: 2,
        }}
      >
        <Typography
          variant="h5"
          component="div"
          fontWeight={700}
          sx={{
            color: 'white',
            mb: 0.5,
            letterSpacing: 1.5,
            textAlign: 'left',
            fontSize: 40,
            ml: 3,
            mt: 4,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="h3"
          component="div"
          fontWeight={700}
          sx={{
            color: 'white',
            fontFamily: 'Roboto Mono, monospace',
            fontSize: 32,
            textAlign: 'left',
            mb: 0.5,
            ml: 3,
          }}
        >
          {number}
        </Typography>
        <IconButton onClick={onClose} size="large" sx={{ position: 'absolute', right: 18, top: 16, color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          background: 'none',
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 0,
          maxWidth: '100%',
        }}
      >
        {/* PRs grouped by date */}
        <Box
          sx={{
            width: '100%',
            maxWidth: 650,
            maxHeight: 420,
            overflowY: 'auto',
            bgcolor: 'transparent',
            borderRadius: 3,
            p: 1.5,
            mt: 1,
            ml: 3,
          }}
        >
          {sortedDates.map(date => (
            <Box key={date} sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 700, fontSize: 16, mb: 0.5, ml: 1 }}>
                {new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
              <List>
                {prsByDate[date].map((pr, idx) => (
                  <ListItem key={idx} sx={{ px: 0, py: 0.75, alignItems: 'flex-start', borderBottom: idx !== prsByDate[date].length - 1 ? '1px solid #e0e0e0' : 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                      {/* Avatar on the left */}
                      <Image
                        src={pr.avatar}
                        alt={pr.username}
                        width={36}
                        height={36}
                        style={{ borderRadius: '50%', objectFit: 'cover', background: '#fff', marginRight: 16 }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          {/* Title with username, text, and icon at the end, truncating if too long */}
                          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body1"
                              fontWeight={700}
                              sx={{
                                color: 'white',
                                fontSize: 18,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                flex: 1,
                                minWidth: 0,
                              }}
                              noWrap
                            >
                              {pr.username} created a pull request
                            </Typography>
                            <MergeTypeIcon sx={{ color: ICON_COLOR, fontSize: 18, ml: 1, flexShrink: 0 }} />
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'white', opacity: 0.85, fontSize: 14, mt: 0.25 }}>
                          {pr.info}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}
        </Box>
        {/* End PRs grouped by date */}
      </DialogContent>
    </Dialog>
  );
};

interface PullRequestItem {
  number: number;
  title: string;
  state: string;
  created_at: string;
  merged_at?: string | null;
  author: {
    login: string;
    avatarUrl: string | null;
  };
  url: string;
}

interface PullRequestsDialogBoxProps {
  open: boolean;
  onClose: () => void;
  activeCount: number;
  mergedCount: number;
  activePRs: PullRequestItem[];
  mergedPRs: PullRequestItem[];
  gradient?: string;
  errorMessage?: string;
}

export const PullRequestsDialogBox: React.FC<PullRequestsDialogBoxProps> = ({
  open,
  onClose,
  activeCount,
  mergedCount,
  activePRs,
  mergedPRs,
  gradient,
  errorMessage
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="pull-requests-dialog-title"
      slotProps={{
        paper: {
          sx: {
            background: gradient || `linear-gradient(135deg, ${SECONDARY_COLOR} 0%, ${PRIMARY_COLOR} 100%)`,
            borderRadius: 4,
            boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)',
            width: { xs: '90%', sm: '48%', md: '32%' },
          },
        },
      }}
    >
      <DialogTitle 
        id="pull-requests-dialog-title"
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', pb: 0, position: 'relative' }}
      >
        <Box sx={{ display: 'flex', gap: 4, width: '100%', mt: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700} sx={{ color: 'white', mb: 0.5 }}>Active PRs</Typography>
            <Typography variant="h3" fontWeight={700} sx={{ color: 'white', fontFamily: 'Roboto Mono, monospace', fontSize: 32 }}>{activeCount}</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700} sx={{ color: 'white', mb: 0.5 }}>Merged PRs</Typography>
            <Typography variant="h3" fontWeight={700} sx={{ color: 'white', fontFamily: 'Roboto Mono, monospace', fontSize: 32 }}>{mergedCount}</Typography>
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
            <Typography variant="h6" fontWeight={700} sx={{ color: 'white', mt: 2, mb: 1 }}>Active Pull Requests</Typography>
            <List sx={{ maxHeight: 180, overflowY: 'auto', width: '100%', bgcolor: 'transparent' }}>
              {activePRs.length === 0 ? (
                <Typography sx={{ color: 'white', opacity: 0.7, fontStyle: 'italic', pl: 2 }}>No active pull requests in the last 6 months.</Typography>
              ) : (
                activePRs.map((pr) => (
                  <ListItem key={pr.number} sx={{ px: 0, py: 1, alignItems: 'flex-start' }}>
                    <MergeTypeIcon sx={{ color: ICON_COLOR, mr: 2, mt: 0.5 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" fontWeight={600} sx={{ color: 'white' }}>{pr.title}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {pr.author.avatarUrl && (
                          <Image
                            src={pr.author.avatarUrl}
                            alt={pr.author.login}
                            width={16}
                            height={16}
                            style={{ borderRadius: '50%', objectFit: 'cover', background: '#fff' }}
                          />
                        )}
                        <Typography variant="body2" sx={{ color: 'white', opacity: 0.85, fontSize: 13 }}>
                          #{pr.number} by {pr.author.login} • Created {new Date(pr.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                ))
              )}
            </List>
            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }} />
            <Typography variant="h6" fontWeight={700} sx={{ color: 'white', mt: 2, mb: 1 }}>Merged Pull Requests</Typography>
            <List sx={{ maxHeight: 180, overflowY: 'auto', width: '100%', bgcolor: 'transparent' }}>
              {mergedPRs.length === 0 ? (
                <Typography sx={{ color: 'white', opacity: 0.7, fontStyle: 'italic', pl: 2 }}>No merged pull requests in the last 6 months.</Typography>
              ) : (
                mergedPRs.map((pr) => (
                  <ListItem key={pr.number} sx={{ px: 0, py: 1, alignItems: 'flex-start' }}>
                    <MergeTypeIcon sx={{ color: ICON_COLOR, mr: 2, mt: 0.5 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" fontWeight={600} sx={{ color: 'white' }}>{pr.title}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {pr.author.avatarUrl && (
                          <Image
                            src={pr.author.avatarUrl}
                            alt={pr.author.login}
                            width={16}
                            height={16}
                            style={{ borderRadius: '50%', objectFit: 'cover', background: '#fff' }}
                          />
                        )}
                        <Typography variant="body2" sx={{ color: 'white', opacity: 0.85, fontSize: 13 }}>
                          #{pr.number} by {pr.author.login} • Merged {pr.merged_at ? new Date(pr.merged_at).toLocaleDateString() : ''}
                        </Typography>
                      </Box>
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

// --- SecurityDialogBox ---
interface SecurityDialogBoxFile {
  file: string;
  suggestions: string[];
  severity?: string;
}

interface SecurityDialogBoxProps {
  open: boolean;
  onClose: () => void;
  label: string;
  number: number;
  files: SecurityDialogBoxFile[];
  gradient?: string;
}

export const SecurityDialogBox: React.FC<SecurityDialogBoxProps> = ({ open, onClose, label, number, files, gradient }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="security-dialog-title"
      slotProps={{
        paper: {
          sx: {
            background: gradient || `linear-gradient(135deg,${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`,
            borderRadius: 4,
            boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)',
            width: { xs: '90%', sm: '48%', md: '32%' },
          },
        },
      }}
    >
      <DialogTitle
        id="security-dialog-title"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          pb: 0,
          pl: 2,
        }}
      >
        <Typography
          variant="h5"
          component="div"
          fontWeight={700}
          sx={{
            color: 'white',
            mb: 0.5,
            letterSpacing: 1.5,
            textAlign: 'left',
            fontSize: 40,
            ml: 3,
            mt: 4,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="h3"
          component="div"
          fontWeight={700}
          sx={{
            color: 'white',
            fontFamily: 'Roboto Mono, monospace',
            fontSize: 32,
            textAlign: 'left',
            mb: 0.5,
            ml: 3,
          }}
        >
          {number}
        </Typography>
        <IconButton onClick={onClose} size="large" sx={{ position: 'absolute', right: 18, top: 16, color: 'white' }}>
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
        <Box sx={{ mt: 2, borderRadius: 2, p: 2, width: '100%', maxHeight: 340, overflowY: 'auto', bgcolor: 'rgba(255,255,255,0.04)' }}>
          <List sx={{ p: 0 }}>
            {files.map((item, idx) => (
              <React.Fragment key={idx}>
                {item.severity ? (
                  <ListItem sx={{ py: 1, px: 0 }}>
                    <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, fontSize: 16, letterSpacing: 1, textTransform: 'uppercase' }}>
                      {item.severity}
                    </Typography>
                  </ListItem>
                ) : (
                  item.file && (
                    <ListItem alignItems="flex-start" sx={{ py: 1.5, px: 0, display: 'block' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'white',
                          fontFamily: 'Roboto Mono, monospace',
                          fontSize: 13,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          mb: 0.5,
                          maxWidth: 320,
                        }}
                        title={item.file}
                      >
                        {typeof item.file === 'string' ? item.file.split('/').pop() : ''}
                      </Typography>
                      {Array.isArray(item.suggestions) && item.suggestions.length > 0 && (
                        <Box component="ul" sx={{ ml: 2, mt: 0.5, pl: 2, mb: 0, color: 'white' }}>
                          {item.suggestions.map((s, i) => (
                            <li key={i} style={{ marginBottom: 4, fontSize: 14, fontFamily: 'Roboto Mono, monospace', opacity: 0.85, lineHeight: 1.5 }}>{s}</li>
                          ))}
                        </Box>
                      )}
                    </ListItem>
                  )
                )}
                {idx !== files.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', my: 1 }} />}
              </React.Fragment>
            ))}
          </List>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// --- HealthQualityDialogBox ---
interface HealthQualityDialogBoxFile {
  file: string;
  suggestions?: string[];
  summary?: string;
}

interface HealthQualityDialogBoxProps {
  open: boolean;
  onClose: () => void;
  label: string;
  number: number;
  files?: HealthQualityDialogBoxFile[];
  gradient?: string;
  description?: string;
}

export const HealthQualityDialogBox: React.FC<HealthQualityDialogBoxProps> = ({ open, onClose, label, number, files = [], gradient, description }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="health-quality-dialog-title"
      slotProps={{
        paper: {
          sx: {
            background: gradient || `linear-gradient(135deg,${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`,
            borderRadius: 4,
            boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)',
            width: { xs: '90%', sm: '48%', md: '32%' },
          },
        },
      }}
    >
      <DialogTitle
        id="health-quality-dialog-title"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          pb: 0,
          pl: 2,
        }}
      >
        <Typography
          variant="h5"
          component="div"
          fontWeight={700}
          sx={{
            color: 'white',
            mb: 0.5,
            letterSpacing: 1.5,
            textAlign: 'left',
            fontSize: 40,
            ml: 3,
            mt: 4,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="h3"
          component="div"
          fontWeight={700}
          sx={{
            color: 'white',
            fontFamily: 'Roboto Mono, monospace',
            fontSize: 32,
            textAlign: 'left',
            mb: 0.5,
            ml: 3,
          }}
        >
          {number}
        </Typography>
        <IconButton onClick={onClose} size="large" sx={{ position: 'absolute', right: 18, top: 16, color: 'white' }}>
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
        {description && (
          <Typography sx={{ color: 'white', mb: 2, fontSize: 16 }}>{description}</Typography>
        )}
        <Box sx={{ mt: 2, borderRadius: 2, p: 2, width: '100%', maxHeight: 340, overflowY: 'auto', bgcolor: 'rgba(255,255,255,0.04)' }}>
          <List sx={{ p: 0 }}>
            {files.length === 0 ? (
              <Typography sx={{ color: 'white', opacity: 0.7, fontStyle: 'italic', pl: 2 }}>No details available.</Typography>
            ) : (
              files.map((item, idx) => (
                <React.Fragment key={idx}>
                  <ListItem alignItems="flex-start" sx={{ py: 1.5, px: 0, display: 'block' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'white',
                        fontFamily: 'Roboto Mono, monospace',
                        fontSize: 13,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        mb: 0.5,
                        maxWidth: 320,
                      }}
                      title={item.file}
                    >
                      {item.file}
                    </Typography>
                    {item.summary && (
                      <Typography sx={{ color: 'white', opacity: 0.85, fontSize: 14, mb: 0.5 }}>{item.summary}</Typography>
                    )}
                    {Array.isArray(item.suggestions) && item.suggestions.length > 0 && (
                      <Box component="ul" sx={{ ml: 2, mt: 0.5, pl: 2, mb: 0, color: 'white' }}>
                        {item.suggestions.map((s, i) => (
                          <li key={i} style={{ marginBottom: 4, fontSize: 14, fontFamily: 'Roboto Mono, monospace', opacity: 0.85, lineHeight: 1.5 }}>{s}</li>
                        ))}
                      </Box>
                    )}
                  </ListItem>
                  {idx !== files.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', my: 1 }} />}
                </React.Fragment>
              ))
            )}
          </List>
        </Box>
      </DialogContent>
    </Dialog>
  );
};