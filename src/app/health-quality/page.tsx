'use client';

import React, { useState, useEffect } from 'react';
import { Box, Stack } from '@mui/material';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import ChatbotIcon from '../../components/ChatbotIcon';
import HealthQualityCard from '@/components/HealthQualityCard';
import { RunAnalysisDialogBox, HealthQualityDialogBox } from '@/components/DialogBox';
import { authService } from '../../services/auth';
import { BG_COLOR, PRIMARY_COLOR, SECONDARY_COLOR, TERTIARY_COLOR, QUATERNARY_COLOR, ICON_COLOR } from '../../components/colors';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BugReportIcon from '@mui/icons-material/BugReport';
import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DescriptionIcon from '@mui/icons-material/Description';
import SpeedIcon from '@mui/icons-material/Speed';
import NoDataError from '@/components/NoDataError';
import LastScanTime from '@/components/LastScanTime';

// Define HealthQualityDialogBoxFile locally since it's not exported
interface HealthQualityDialogBoxFile {
  file: string;
  suggestions?: string[];
  summary?: string;
}

interface QualityTiming {
  repository_clone: number;
  file_sampling: number;
  static_analysis: number;
  ai_analysis: number;
  other: number;
  total_seconds: number;
}

interface QualityData {
  files_analyzed: {
    total: number;
    by_language: Record<string, number>;
  };
  issues: {
    linting: number;
    todos: number;
    files_without_docs: number;
    todos_files: string[];
    duplicate_files: string[];
    files_without_docs_list: string[];
  };
  top_issues: Array<{
    file: string;
    summary: string;
    suggestions: string[];
    before: string;
    after: string | null;
  }>;
  quality_score: number;
  timing: QualityTiming;
}

export default function HealthQualityPage() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<'runAnalysis' | null>(null);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [hasQualityData, setHasQualityData] = useState<boolean | null>(null);
  // Dialog state for each card
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLabel, setDialogLabel] = useState('');
  const [dialogNumber, setDialogNumber] = useState(0);
  const [dialogFiles, setDialogFiles] = useState<HealthQualityDialogBoxFile[]>([]);
  const [dialogGradient, setDialogGradient] = useState('');
  const [dialogDescription, setDialogDescription] = useState('');
  const [scanTime, setScanTime] = useState<number | undefined>(undefined);

  useEffect(() => {
    try {
      const data = localStorage.getItem('codeQualityResult');
      console.log('Quality data from localStorage:', data);
      if (data) {
        try {
          const parsed = JSON.parse(data) as QualityData;
          console.log('Parsed quality data:', parsed);
          console.log('Timing data:', parsed.timing);
          if (parsed.timing?.total_seconds) {
            console.log('Setting scan time to:', parsed.timing.total_seconds);
            setScanTime(parsed.timing.total_seconds);
          }
          setHasQualityData(true);
        } catch (e) {
          console.error('Error parsing quality data:', e);
          setHasQualityData(false);
        }
      } else {
        setHasQualityData(false);
      }
    } catch (e) {
      console.error('Error accessing localStorage:', e);
      setHasQualityData(false);
    }
  }, []);

  const handleLogout = () => {
    authService.logout();
    router.replace('/login');
  };

  // Read qualityScore from localStorage (0-100 scale)
  let qualityScore: number | undefined = undefined;
  let codeQualityData: {
    files_analyzed?: { total?: number; by_language?: { [key: string]: number } };
    issues?: { linting?: number; todos?: number; files_without_docs?: number };
    top_issues?: { file: string; summary?: string; suggestions?: string[] }[];
    quality_score?: number;
    scan_time?: number; // Time taken for the scan in seconds
  } | undefined = undefined;
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('codeQualityResult');
    if (raw) {
      try {
        codeQualityData = JSON.parse(raw);
        if (codeQualityData && typeof codeQualityData.quality_score === 'number') {
          qualityScore = Math.round(codeQualityData.quality_score * 10);
        }
      } catch {}
    }
  }

  // Helper to open dialog with correct data
  const openDialog = (
    label: string,
    gradient: string,
    files: HealthQualityDialogBoxFile[],
    number: number,
    description = ''
  ) => {
    setDialogLabel(label);
    setDialogGradient(gradient);
    setDialogFiles(files);
    setDialogNumber(number);
    setDialogDescription(description);
    setDialogOpen(true);
  };

  // Helper to extract data for each card
  const getQualityData = (label: string): { files: HealthQualityDialogBoxFile[]; number: number; description: string } => {
    if (!codeQualityData) return { files: [], number: 0, description: '' };
    switch (label) {
      case 'Files Analyzed': {
        // Prepare breakdown by language as suggestions
        const byLang = codeQualityData?.files_analyzed?.by_language ?? {};
        const suggestions = Object.entries(byLang).map(
          ([lang, count]) => `${lang.toUpperCase()}: ${count} file${count === 1 ? '' : 's'}`
        );
        return {
          files: [
            {
              file: 'Breakdown by Language',
              suggestions,
              summary: ''
            }
          ],
          number: codeQualityData?.files_analyzed?.total ?? 0,
          description: 'Total files analyzed in the repository.'
        };
      }
      case 'Total Issues': {
        const lintingCount = codeQualityData?.issues?.linting ?? 0;
        const todosCount = codeQualityData?.issues?.todos ?? 0;
        const docsCount = codeQualityData?.issues?.files_without_docs ?? 0;
        const lintingFiles = Array.isArray(codeQualityData?.top_issues)
          ? codeQualityData.top_issues.filter(f => (f.summary || '').toLowerCase().includes('lint') || (f.summary || '').toLowerCase().includes('eslint'))
          : [];
        const todoFiles = Array.isArray(codeQualityData?.top_issues)
          ? codeQualityData.top_issues.filter(f => (f.summary || '').toLowerCase().includes('todo'))
          : [];
        const docsFiles: string[] = [];
        const files: HealthQualityDialogBoxFile[] = [];
        if (lintingCount > 0) {
          files.push({
            file: 'Linting Issues',
            suggestions: lintingFiles.length > 0 ? lintingFiles.map(f => f.file) : ['No specific files listed.'],
            summary: `Total: ${lintingCount}`
          });
        }
        if (todosCount > 0) {
          files.push({
            file: 'TODOs',
            suggestions: todoFiles.length > 0 ? todoFiles.map(f => f.file) : ['No specific files listed.'],
            summary: `Total: ${todosCount}`
          });
        }
        if (docsCount > 0) {
          files.push({
            file: 'Files Without Docs',
            suggestions: docsFiles.length > 0 ? docsFiles : ['No specific files listed.'],
            summary: `Total: ${docsCount}`
          });
        }
        if (files.length === 0) {
          files.push({ file: 'No issues found', suggestions: [], summary: '' });
        }
        return {
          files,
          number: lintingCount + todosCount + docsCount,
          description: ''
        };
      }
      case 'Linting Issues': {
        const lintingCount = codeQualityData?.issues?.linting ?? 0;
        const lintingFiles = Array.isArray(codeQualityData?.top_issues)
          ? codeQualityData.top_issues.filter(f => (f.summary || '').toLowerCase().includes('lint') || (f.summary || '').toLowerCase().includes('eslint'))
          : [];
        let files: HealthQualityDialogBoxFile[];
        if (lintingCount > 0) {
          files = [
            {
              file: 'Linting Issues',
              suggestions: lintingFiles.length > 0 ? lintingFiles.map(f => f.file) : ['No specific files listed.'],
              summary: `Total: ${lintingCount}`
            }
          ];
        } else {
          files = [
            {
              file: 'No linting issues found.',
              suggestions: [],
              summary: ''
            }
          ];
        }
        return {
          files,
          number: lintingCount,
          description: ''
        };
      }
      case 'Duplicate Files': {
        // Try to extract duplicate files from top_issues (if available)
        const duplicateFiles = Array.isArray(codeQualityData?.top_issues)
          ? codeQualityData.top_issues.filter(f => (f.summary || '').toLowerCase().includes('duplicate') || (f.file || '').toLowerCase().includes('duplicate'))
          : [];
        const duplicateCount = duplicateFiles.length;
        let files: HealthQualityDialogBoxFile[];
        if (duplicateCount > 0) {
          files = [
            {
              file: 'Duplicate Files',
              suggestions: duplicateFiles.map(f => f.file),
              summary: `Total: ${duplicateCount}`
            }
          ];
        } else {
          files = [
            {
              file: 'No duplicate files found.',
              suggestions: [],
              summary: ''
            }
          ];
        }
        return {
          files,
          number: duplicateCount,
          description: ''
        };
      }
      case 'Files Without Docs': {
        const docsCount = codeQualityData?.issues?.files_without_docs ?? 0;
        let files: HealthQualityDialogBoxFile[];
        if (docsCount > 0) {
          files = [
            {
              file: 'Files Without Docs',
              suggestions: ['No specific files listed.'],
              summary: `Total: ${docsCount}`
            }
          ];
        } else {
          files = [
            {
              file: 'No undocumented files found.',
              suggestions: [],
              summary: ''
            }
          ];
        }
        return {
          files,
          number: docsCount,
          description: ''
        };
      }
      case 'Quality Score':
        return {
          files: Array.isArray(codeQualityData?.top_issues)
            ? codeQualityData.top_issues.map(f => ({
                file: f.file,
                summary: f.summary,
                suggestions: f.suggestions
              }))
            : [],
          number: qualityScore ?? 0,
          description: 'Overall code quality score (out of 100).'
        };
      default:
        return { files: [], number: 0, description: '' };
    }
  };

  const handleRunAnalysis = async () => {
    setExpanded('runAnalysis');
    setIsAnalysisRunning(true);
    try {
      // ... existing analysis code ...
    } catch (error) {
      console.error('Error running analysis:', error);
    } finally {
      setIsAnalysisRunning(false);
      setExpanded(null);
    }
  };

  return (
    <Box sx={{ minHeight: '80vh', bgcolor: BG_COLOR }}>
      <Navbar activePage="health-quality" handleLogout={handleLogout} />
      <Box
        sx={{
          minHeight: 'calc(100vh - 48px)', // Adjust for navbar height
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
        }}
      >
        {hasQualityData === null ? null : !hasQualityData ? (
          <NoDataError
            title="No Health & Quality Data Available"
            description="Run a code analysis to see health and quality metrics for your repository."
            onRunAnalysis={() => router.replace('/')} />
        ) : (
          <Stack spacing={4} sx={{ width: 'auto', alignItems: 'center' }}>
            {/* First Row */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ justifyContent: 'center', alignItems: 'center' }}>
              <HealthQualityCard
                icon={<AssessmentIcon />}
                title="Files Analyzed"
                gradient={`linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`}
                iconColor={ICON_COLOR}
                sx={{ width: { xs: '100%', md: '400px' }, minHeight: 120 }}
                description="Total files analyzed in the repo"
                onClick={() => {
                  const d = getQualityData('Files Analyzed');
                  openDialog('Files Analyzed', `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`, d.files, d.number, '');
                }}
              />
              <HealthQualityCard
                icon={<BugReportIcon />}
                title="Total Issues"
                gradient={`linear-gradient(135deg, ${SECONDARY_COLOR} 0%, ${TERTIARY_COLOR} 100%)`}
                iconColor={ICON_COLOR}
                sx={{ width: { xs: '100%', md: '400px' }, minHeight: 120 }}
                description="All detected issues"
                onClick={() => {
                  const d = getQualityData('Total Issues');
                  openDialog('Total Issues', `linear-gradient(135deg, ${SECONDARY_COLOR} 0%, ${TERTIARY_COLOR} 100%)`, d.files, d.number, d.description);
                }}
              />
              <HealthQualityCard
                icon={<CodeIcon />}
                title="Linting Issues"
                gradient={`linear-gradient(135deg, ${TERTIARY_COLOR} 0%, ${QUATERNARY_COLOR} 100%)`}
                iconColor={ICON_COLOR}
                sx={{ width: { xs: '100%', md: '400px' }, minHeight: 120 }}
                description="Linting errors found"
                onClick={() => {
                  const d = getQualityData('Linting Issues');
                  openDialog('Linting Issues', `linear-gradient(135deg, ${TERTIARY_COLOR} 0%, ${QUATERNARY_COLOR} 100%)`, d.files, d.number, d.description);
                }}
              />
            </Stack>

            {/* Second Row */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ justifyContent: 'center', alignItems: 'center' }}>
              <HealthQualityCard
                icon={<ContentCopyIcon />}
                title="Duplicate Files"
                gradient={`linear-gradient(135deg, ${QUATERNARY_COLOR} 0%, ${PRIMARY_COLOR} 100%)`}
                iconColor={ICON_COLOR}
                sx={{ width: { xs: '100%', md: '400px' }, minHeight: 120 }}
                description="Files with duplicate content"
                onClick={() => {
                  const d = getQualityData('Duplicate Files');
                  openDialog('Duplicate Files', `linear-gradient(135deg, ${QUATERNARY_COLOR} 0%, ${PRIMARY_COLOR} 100%)`, d.files, d.number, d.description);
                }}
              />
              <HealthQualityCard
                icon={<DescriptionIcon />}
                title="Files Without Docs"
                gradient={`linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${TERTIARY_COLOR} 100%)`}
                iconColor={ICON_COLOR}
                sx={{ width: { xs: '100%', md: '400px' }, minHeight: 120 }}
                description="Files missing documentation"
                onClick={() => {
                  const d = getQualityData('Files Without Docs');
                  openDialog('Files Without Docs', `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${TERTIARY_COLOR} 100%)`, d.files, d.number, d.description);
                }}
              />
              <HealthQualityCard
                icon={<SpeedIcon />}
                title="Quality Score"
                gradient={`linear-gradient(135deg, ${SECONDARY_COLOR} 0%, ${QUATERNARY_COLOR} 100%)`}
                iconColor={ICON_COLOR}
                sx={{ width: { xs: '100%', md: '400px' }, minHeight: 120 }}
                description="Overall code quality score"
                score={qualityScore}
                onClick={undefined}
              />
            </Stack>
          </Stack>
        )}
      </Box>
      <ChatbotIcon />
      {hasQualityData && <LastScanTime scanTime={scanTime} />}
      <HealthQualityDialogBox
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        label={dialogLabel}
        number={dialogNumber}
        files={dialogFiles}
        gradient={dialogGradient}
        description={dialogDescription}
      />
      <RunAnalysisDialogBox
        open={expanded === 'runAnalysis'}
        onClose={() => setExpanded(null)}
        onRun={() => handleRunAnalysis()}
        isRunning={isAnalysisRunning}
      />
    </Box>
  );
} 