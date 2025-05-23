'use client';

import React from 'react';
import { Box, Typography, Button, Checkbox, FormControlLabel, TextField, Paper, Stack } from '@mui/material';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import ChatbotIcon from '../../components/ChatbotIcon';
import GradientCard from '../../components/GradientCard';
import { authService } from '../../services/auth';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import FeaturedPlayListOutlinedIcon from '@mui/icons-material/FeaturedPlayListOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { PRIMARY_COLOR, QUATERNARY_COLOR, SECONDARY_COLOR, ICON_COLOR } from '../../components/colors';

export default function TestingToolsPage() {
  const router = useRouter();

  const handleLogout = () => {
    authService.logout();
    router.replace('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#eae9e8', position: 'relative' }}>
      <Navbar activePage="testing-tools" handleLogout={handleLogout} />
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 48px)' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ mb: 6, position: 'relative' }}>
          <GradientCard
            icon={<ChecklistOutlinedIcon />}
            title="Generate Unit Tests"
            description={
              'This creates unit test cases using Python\'s unittest or JavaScript\'s Jest frameworks.'
            }
            gradient={`linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`}
            iconColor={ICON_COLOR}
            sx={{ minHeight: 420 }}
          />
          <GradientCard
            icon={<FeaturedPlayListOutlinedIcon />}
            title="Generate Functional Tests"
            description={
              'This generates both manual and automated functional test cases using Playwright in Python or TypeScript.'
            }
            gradient={`linear-gradient(135deg, ${QUATERNARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`}
            iconColor={ICON_COLOR}
            sx={{ minHeight: 420 }}
          />
          <GradientCard
            icon={<DescriptionOutlinedIcon />}
            title="Generate Test Documentation"
            description={
              'This generates Test Strategy Document, Recommended Folder Structure For Automation, Etc.'
            }
            gradient={`linear-gradient(135deg, ${SECONDARY_COLOR} 0%, ${PRIMARY_COLOR} 100%)`}
            iconColor={ICON_COLOR}
            sx={{ minHeight: 420 }}
          />
        </Stack>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 6, mb: 4 }}>
          <FormControlLabel control={<Checkbox />} label="Automation" />
          <FormControlLabel control={<Checkbox />} label="Manual" />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 3, mb: 4 }}>
          <TextField
            variant="outlined"
            size="small"
            value="UnitTestFile.py"
            sx={{ minWidth: 220, bgcolor: 'white', borderRadius: 2 }}
            InputProps={{
              startAdornment: <InsertDriveFileIcon sx={{ mr: 1, color: PRIMARY_COLOR }} />,
              readOnly: true,
            }}
          />
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            sx={{
              bgcolor: PRIMARY_COLOR,
              color: 'white',
              borderRadius: 999,
              px: 3,
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: 'none',
              '&:hover': { bgcolor: SECONDARY_COLOR, color: '#23243a' },
            }}
          >
            Upload
          </Button>
          <Button
            variant="contained"
            startIcon={<CloudDownloadIcon />}
            sx={{
              bgcolor: SECONDARY_COLOR,
              color: '#23243a',
              borderRadius: 999,
              px: 3,
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: 'none',
              '&:hover': { bgcolor: PRIMARY_COLOR, color: 'white' },
            }}
          >
            Download
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 6, alignItems: 'center', mt: 2 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, minWidth: 160, textAlign: 'center', background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)` }}>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>35</Typography>
            <Typography variant="subtitle1" sx={{ color: 'white', opacity: 0.9 }}>Total Tests</Typography>
          </Paper>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, minWidth: 160, textAlign: 'center', background: `linear-gradient(135deg, ${SECONDARY_COLOR} 0%, ${PRIMARY_COLOR} 100%)` }}>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>20</Typography>
            <Typography variant="subtitle1" sx={{ color: 'white', opacity: 0.9 }}>Automated</Typography>
          </Paper>
        </Box>
      </Box>
      <ChatbotIcon />
    </Box>
  );
} 