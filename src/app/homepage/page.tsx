'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../services/auth';
import { Box, Snackbar, Alert } from '@mui/material';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import Navbar from '../../components/Navbar';
import ActionCard from '../../components/ActionCard';
import { AddRepoDialogBox, RunAnalysisDialogBox } from '../../components/DialogBox';
import ChatbotIcon from '../../components/ChatbotIcon';
import { PRIMARY_COLOR, SECONDARY_COLOR, TERTIARY_COLOR, ICON_COLOR } from '../../components/colors';
import config from '../../config';

type ToastType = 'success' | 'duplicate' | 'timing';

interface ToastState {
  show: boolean;
  type: ToastType;
  message?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState<'addRepo' | 'runAnalysis' | null>(null);
  const [toast, setToast] = React.useState<ToastState>({ show: false, type: 'success' });
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.replace('/login');
    }
  }, [router]);

  const handleLogout = () => {
    authService.logout();
    router.replace('/login');
  };

  const handleAddRepo = async (isDuplicate: boolean) => {
    setExpanded(null); // Close the dialog
    setToast({ 
      show: true, 
      type: isDuplicate ? 'duplicate' : 'success' 
    });
  };

  const handleRunAnalysis = async (selected: string[]) => {
    const repoUrl = localStorage.getItem(config.STORAGE_KEYS.REPO_URL);
    const patToken = localStorage.getItem(config.STORAGE_KEYS.GITHUB_PAT);

    if (!repoUrl || !patToken) {
      console.error('Repository URL or PAT token not found');
      setIsAnalysisRunning(false);
      setExpanded(null);
      return;
    }

    setIsAnalysisRunning(true);

    try {
      if (selected.includes('Github Insights')) {
        // Call all Github Insights APIs in parallel
        const [forksRes, contributorsRes, issuesRes, pullRequestsRes] = await Promise.all([
          fetch(`${config.API_BASE_URL}/api/v1/github/forks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repo_url: repoUrl, pat_token: patToken }),
          }),
          fetch(`${config.API_BASE_URL}/api/v1/github/contributors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repo_url: repoUrl, pat_token: patToken }),
          }),
          fetch(`${config.API_BASE_URL}/api/v1/github/issues`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repo_url: repoUrl, pat_token: patToken }),
          }),
          fetch(`${config.API_BASE_URL}/api/v1/github/pull-requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repo_url: repoUrl, pat_token: patToken }),
          })
        ]);
        const forksData = await forksRes.json();
        const contributorsData = await contributorsRes.json();
        const issuesData = await issuesRes.json();
        const pullRequestsData = await pullRequestsRes.json();
        localStorage.setItem(config.STORAGE_KEYS.GITHUB_FORKS, JSON.stringify(forksData));
        localStorage.setItem(config.STORAGE_KEYS.GITHUB_CONTRIBUTORS, JSON.stringify(contributorsData));
        localStorage.setItem(config.STORAGE_KEYS.GITHUB_ISSUES, JSON.stringify(issuesData));
        localStorage.setItem(config.STORAGE_KEYS.GITHUB_PULL_REQUESTS, JSON.stringify(pullRequestsData));
      }

      if (selected.includes('Security & Threats')) {
        const res = await fetch(`${config.API_BASE_URL}/api/v1/sast/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo_url: repoUrl, pat_token: patToken }),
        });
        const data = await res.json();
        localStorage.setItem(config.STORAGE_KEYS.SAST_SECURITY_THREATS, JSON.stringify(data));
        
        // Show timing notification
        if (data.timing) {
          const totalTime = data.timing.total_seconds?.toFixed(2);
          const toolTimes = Object.entries(data.timing.breakdown || {})
            .map(([tool, time]) => `${tool.replace('_seconds', '')}: ${Number(time).toFixed(2)}s`)
            .join(', ');
          setToast({
            show: true,
            type: 'timing',
            message: `Scan completed in ${totalTime}s (${toolTimes})`
          });
        }
      }

      if (selected.includes('Health & Quality')) {
        const res = await fetch(`${config.API_BASE_URL}/api/v1/scan/code_quality.api`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoUrl: repoUrl, patToken: patToken }),
        });
        const data = await res.json();
        localStorage.setItem(config.STORAGE_KEYS.CODE_QUALITY_RESULT, JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error running analysis:', err);
    } finally {
      setIsAnalysisRunning(false);
      setExpanded(null);
    }
  };

  const handleSnackbarClose = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'duplicate':
        return {
          background: `linear-gradient(135deg, ${TERTIARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`,
          message: 'Repository already added!'
        };
      case 'timing':
        return {
          background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${TERTIARY_COLOR} 100%)`,
          message: toast.message || 'Scan completed!'
        };
      case 'success':
      default:
        return {
          background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`,
          message: 'Repository added successfully!'
        };
    }
  };

  const toastStyles = getToastStyles(toast.type);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#eae9e8' }}>
      <Navbar handleLogout={handleLogout} />
      {/* Main Content */}
      <Box
        sx={{
          minHeight: 'calc(100vh - 60px)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6,
          px: 2,
        }}
      >
        {expanded === 'addRepo' ? (
          <Box sx={{ width: { xs: '90%', sm: '64%', md: '48%' } }}>
            <AddRepoDialogBox 
              open={true} 
              onClose={() => setExpanded(null)} 
              onAdd={handleAddRepo} 
            />
          </Box>
        ) : expanded === 'runAnalysis' ? (
          <Box sx={{ width: { xs: '90%', sm: '64%', md: '48%' } }}>
            <RunAnalysisDialogBox 
              open={true} 
              onClose={() => setExpanded(null)} 
              onRun={(selected) => handleRunAnalysis(selected)}
              isRunning={isAnalysisRunning}
            />
          </Box>
        ) : (
          <>
            <Box onClick={() => setExpanded('addRepo')} sx={{ cursor: 'pointer', width: 'fit-content' }}>
              <ActionCard
                icon={<AddCircleOutlineOutlinedIcon />}
                title="Add Repository"
                description="This opens a dialog to input a GitHub repo, fetches its metadata using the URL & PAT, and stores it for analysis."
                gradient={`linear-gradient(135deg,${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`}
                iconColor={ICON_COLOR}
                sx={{ minHeight: 420 }}
              />
            </Box>
            <Box onClick={() => setExpanded('runAnalysis')} sx={{ cursor: 'pointer', width: 'fit-content' }}>
              <ActionCard
                icon={<QueryStatsIcon />}
                title="Run Analysis"
                description="This opens a dialog to select analysis types, then triggers selected scans and stores the results for display."
                gradient={`linear-gradient(135deg,${SECONDARY_COLOR} 0%, ${TERTIARY_COLOR} 100%)`}
                iconColor={ICON_COLOR}
                sx={{ minHeight: 420 }}
              />
            </Box>
          </>
        )}
      </Box>
      <ChatbotIcon />

      {/* Snackbar at the parent level */}
      <Snackbar
        open={toast.show}
        autoHideDuration={toast.type === 'timing' ? 6000 : 4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{ 
          zIndex: 9999,
          bottom: '24px !important',
          right: '24px !important'
        }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={toast.type === 'duplicate' ? 'warning' : toast.type === 'timing' ? 'info' : 'success'}
          variant="filled"
          sx={{
            background: toastStyles.background,
            color: 'white',
            borderRadius: 2,
            fontWeight: 500,
            minWidth: '300px',
            '& .MuiAlert-icon': {
              color: 'white',
            },
            '& .MuiAlert-message': {
              color: 'white',
              fontSize: '0.95rem',
            },
            '& .MuiAlert-action': {
              color: 'white',
            },
          }}
        >
          {toastStyles.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
