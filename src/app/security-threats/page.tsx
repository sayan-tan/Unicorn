'use client';

import React, { useState } from 'react';
import { Box, Stack } from '@mui/material';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import ChatbotIcon from '../../components/ChatbotIcon';
import SecurityCard from '@/components/SecurityCard';
import { SecurityDialogBox, RunAnalysisDialogBox } from '@/components/DialogBox';
import { authService } from '../../services/auth';
import { BG_COLOR, PRIMARY_COLOR, SECONDARY_COLOR, TERTIARY_COLOR, QUATERNARY_COLOR, ICON_COLOR } from '../../components/colors';
import SecurityIcon from '@mui/icons-material/Security';
import PieChartIcon from '@mui/icons-material/PieChart';
import KeyIcon from '@mui/icons-material/Key';
import BugReportIcon from '@mui/icons-material/BugReport';
import CodeOffIcon from '@mui/icons-material/CodeOff';
import InventoryIcon from '@mui/icons-material/Inventory';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ScoreIcon from '@mui/icons-material/Score';
import NoDataError from '@/components/NoDataError';

// Add TypeScript interfaces for SAST API response
interface SastIssue {
  severity: string;
  message: string;
  line?: number;
}

interface SastLeak {
  severity: string;
  type: string;
  description: string;
}

interface SastWarning {
  severity: string;
  message: string;
}

interface SastCVE {
  severity: string;
  package: string;
  version: string;
  cve: string;
  description?: string;
}

interface SastFileIssues {
  issues: SastIssue[];
}

interface SastFileLeaks {
  leaks: SastLeak[];
}

interface SastFileWarnings {
  warnings: SastWarning[];
}

interface SastSeveritySummary {
  critical?: { count: number; files: Record<string, { issues: SastIssue[] }> };
  high?: { count: number; files: Record<string, { issues: SastIssue[] }> };
  medium?: { count: number; files: Record<string, { issues: SastIssue[] }> };
  low?: { count: number; files: Record<string, { issues: SastIssue[] }> };
  info?: { count: number; files: Record<string, { issues: SastIssue[] }> };
}

interface SastTiming {
  total_time: number;
}

interface SastData {
  vulnerabilities?: {
    files: Record<string, SastFileIssues>;
    total: number;
  };
  secrets?: {
    files: Record<string, SastFileLeaks>;
    total: number;
  };
  static_warnings?: {
    files: Record<string, SastFileWarnings>;
    total: number;
  };
  dependency_cves?: {
    files: Record<string, SastCVE[]>;
    total: number;
  };
  severity_summary: SastSeveritySummary;
  timing?: SastTiming;
  top_risky_files?: { file: string; issue_count: number }[];
  remediation_score: number;
  vulnerability_score: number;
}

interface SastFile {
  name: string;
  path: string;
  severity: string;
  description: string;
}

interface SastCardData {
  files: SastFile[];
  number: number;
}

export default function SecurityThreatsPage() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<'runAnalysis' | null>(null);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogLabel, setDialogLabel] = React.useState('');
  const [dialogNumber, setDialogNumber] = React.useState(0);
  const [dialogFiles, setDialogFiles] = React.useState<{ file: string; suggestions: string[] }[]>([]);
  const [dialogGradient, setDialogGradient] = React.useState<string>('');

  const handleLogout = () => {
    authService.logout();
    router.replace('/login');
  };

  // Helper to open dialog with correct data
  const openDialog = (label: string, gradient: string, files: SastFile[], number: number) => {
    setDialogLabel(label);
    setDialogGradient(gradient);
    setDialogFiles(
      files.map(f => {
        // Only split description by newlines for Remediation Score and Security Score dialogs
        const shouldSplit = label === 'Remediation Score' || label === 'Security Score';
        return {
          file: f.name,
          suggestions: shouldSplit && typeof f.description === 'string'
            ? f.description.split('\n')
            : [f.description]
        };
      })
    );
    setDialogNumber(number);
    setDialogOpen(true);
  };

  // Helper to extract data from localStorage for each card
  const getSastData = (label: string): SastCardData => {
    const data = JSON.parse(localStorage.getItem('sast_security_threats') || '{}') as SastData;
    const severitySummary = data.severity_summary || {
      critical: { count: 0, files: {} },
      high: { count: 0, files: {} },
      medium: { count: 0, files: {} },
      low: { count: 0, files: {} },
      info: { count: 0, files: {} }
    };

    switch (label) {
      case 'Vulnerabilities Found':
        return {
          files: data.vulnerabilities?.files ? Object.entries(data.vulnerabilities.files).map(([file, v]) => ({
            name: file,
            path: '',
            severity: v.issues[0]?.severity || 'UNKNOWN',
            description: v.issues.map(i => `${i.severity}: ${i.message}`).join('\n')
          })) : [],
          number: data.vulnerabilities?.total || 0
        };
      case 'Severity Breakdown': {
        const severityLevels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
        const grouped: SastFile[] = [];

        severityLevels.forEach(sev => {
          const sevData = severitySummary[sev.toLowerCase() as keyof SastSeveritySummary];
          if (sevData && sevData.count > 0) {
            grouped.push({
              name: '',
              path: '',
              severity: `${sev} (${sevData.count} issues)`,
              description: ''
            });
            Object.entries(sevData.files).forEach(([file, fileData]) => {
              fileData.issues.forEach(issue => {
                grouped.push({
                  name: file,
                  path: '',
                  severity: issue.severity || 'UNKNOWN',
                  description: `Line ${issue.line || 'N/A'}: ${issue.message}`
                });
              });
            });
          }
        });

        return { files: grouped, number: grouped.length };
      }
      case 'Secrets Detected':
        return {
          files: data.secrets?.files ? Object.entries(data.secrets.files).map(([file, v]) => ({
            name: file,
            path: '',
            severity: v.leaks[0]?.severity || 'UNKNOWN',
            description: v.leaks.map(l => `${l.severity || 'UNKNOWN'}: ${l.type}: ${l.description}`).join('\n')
          })) : [],
          number: data.secrets?.total || 0
        };
      case 'Top Risky Files':
        return {
          files: data.top_risky_files?.map(f => ({
            name: f.file,
            path: '',
            severity: `Issue count: ${f.issue_count}`,
            description: ''
          })) || [],
          number: data.top_risky_files?.length || 0
        };
      case 'Static Warnings':
        return {
          files: data.static_warnings?.files ? Object.entries(data.static_warnings.files).map(([file, v]) => ({
            name: file,
            path: '',
            severity: v.warnings[0]?.severity || 'UNKNOWN',
            description: v.warnings.map(w => `${w.severity || 'UNKNOWN'}: ${w.message}`).join('\n')
          })) : [],
          number: data.static_warnings?.total || 0
        };
      case 'Dependency CVEs':
        return {
          files: data.dependency_cves?.files ? Object.entries(data.dependency_cves.files).map(([file, arr]) => ({
            name: file,
            path: '',
            severity: (arr as SastCVE[]).map(cve => `${cve.severity || 'UNKNOWN'}: ${cve.package}@${cve.version}: ${cve.cve} (${cve.description || 'No description'})`).join('\n'),
            description: ''
          })) : [],
          number: data.dependency_cves?.total || 0
        };
      case 'Remediation Score':
        return {
          files: [{
            name: 'Remediation Status',
            path: '',
            severity: `Overall Score: ${typeof data.remediation_score === 'number' ? Math.round(data.remediation_score) : 0}/100`,
            description: [
              `Critical/High Issues: ${typeof severitySummary.critical === 'number' ? severitySummary.critical : 0}`,
              `Total Issues: ${Object.values(severitySummary).reduce((sum, count) => sum + (typeof count === 'number' ? count : 0), 0)}`,
              `Scan Time: ${data.timing?.total_time ? Math.round(data.timing.total_time) : 0}s`
            ].join('\n')
          }],
          number: typeof data.remediation_score === 'number' ? Math.round(data.remediation_score) : 0
        };
      case 'Security Score':
        return {
          files: [{
            name: 'Security Assessment',
            path: '',
            severity: `Overall Score: ${typeof data.vulnerability_score === 'number' ? Math.round(data.vulnerability_score) : 0}/100`,
            description: [
              `Critical Issues: ${typeof severitySummary.critical === 'number' ? severitySummary.critical : 0}`,
              `High Issues: ${typeof severitySummary.high === 'number' ? severitySummary.high : 0}`,
              `Medium Issues: ${typeof severitySummary.medium === 'number' ? severitySummary.medium : 0}`,
              `Low Issues: ${typeof severitySummary.low === 'number' ? severitySummary.low : 0}`,
              `Info Issues: ${typeof severitySummary.info === 'number' ? severitySummary.info : 0}`,
              `Scan Time: ${data.timing?.total_time ? Math.round(data.timing.total_time) : 0}s`
            ].join('\n')
          }],
          number: typeof data.vulnerability_score === 'number' ? Math.round(data.vulnerability_score) : 0
        };
      default:
        return { files: [], number: 0 };
    }
  };

  // Check if security data is available
  const hasSecurityData = () => {
    return localStorage.getItem('sast_security_threats') !== null;
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
      <Navbar activePage="security-threats" handleLogout={handleLogout} />
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
        {!hasSecurityData() ? (
          <NoDataError
            title="No Security Analysis Data Available"
            description="Run a security analysis to see potential threats and vulnerabilities in your repository."
            onRunAnalysis={() => router.replace('/')}
          />
        ) : (
          <Stack spacing={4} sx={{ width: 'auto', alignItems: 'center' }}>
            {/* First Row */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ justifyContent: 'center', alignItems: 'center' }}>
              <SecurityCard
                icon={<SecurityIcon />}
                title="Vulnerabilities Found"
                gradient={`linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`}
                iconColor={ICON_COLOR}
                sx={{ width: { xs: '100%', md: '280px' }, minHeight: 160 }}
                description="All vulnerabilities found in the code"
                onClick={() => {
                  const d = getSastData('Vulnerabilities Found');
                  openDialog('Vulnerabilities Found', `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`, d.files, d.number);
                }}
              />
              <SecurityCard
                icon={<PieChartIcon />}
                title="Severity Breakdown"
                gradient={`linear-gradient(135deg, ${SECONDARY_COLOR} 0%, ${TERTIARY_COLOR} 100%)`}
                iconColor={ICON_COLOR}
                sx={{ width: { xs: '100%', md: '280px' }, minHeight: 160 }}
                description="Breakdown of severity levels"
                onClick={() => {
                  const d = getSastData('Severity Breakdown');
                  openDialog('Severity Breakdown', `linear-gradient(135deg, ${SECONDARY_COLOR} 0%, ${TERTIARY_COLOR} 100%)`, d.files, d.number);
                }}
              />
              <SecurityCard
                icon={<KeyIcon />}
                title="Secrets Detected"
                gradient={`linear-gradient(135deg, ${TERTIARY_COLOR} 0%, ${QUATERNARY_COLOR} 100%)`}
                iconColor={ICON_COLOR}
                sx={{ width: { xs: '100%', md: '280px' }, minHeight: 160 }}
                description="Secrets or keys detected in code"
                onClick={() => {
                  const d = getSastData('Secrets Detected');
                  openDialog('Secrets Detected', `linear-gradient(135deg, ${TERTIARY_COLOR} 0%, ${QUATERNARY_COLOR} 100%)`, d.files, d.number);
                }}
              />
              <SecurityCard
                icon={<BugReportIcon />}
                title="Top Risky Files"
                gradient={`linear-gradient(135deg, ${QUATERNARY_COLOR} 0%, ${PRIMARY_COLOR} 100%)`}
                iconColor={ICON_COLOR}
                sx={{ width: { xs: '100%', md: '280px' }, minHeight: 160 }}
                description="Files with highest risk"
                onClick={() => {
                  const d = getSastData('Top Risky Files');
                  openDialog('Top Risky Files', `linear-gradient(135deg, ${QUATERNARY_COLOR} 0%, ${PRIMARY_COLOR} 100%)`, d.files, d.number);
                }}
              />
            </Stack>

            {/* Second Row */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ justifyContent: 'center', alignItems: 'center' }}>
              <SecurityCard
                icon={<CodeOffIcon />}
                title="Static Warnings"
                gradient={`linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${TERTIARY_COLOR} 100%)`}
                iconColor={ICON_COLOR}
                sx={{ width: { xs: '100%', md: '280px' }, minHeight: 160 }}
                description="Static analysis warnings"
                onClick={() => {
                  const d = getSastData('Static Warnings');
                  openDialog('Static Warnings', `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${TERTIARY_COLOR} 100%)`, d.files, d.number);
                }}
              />
              <SecurityCard
                icon={<InventoryIcon />}
                title="Dependency CVEs"
                gradient={`linear-gradient(135deg, ${SECONDARY_COLOR} 0%, ${QUATERNARY_COLOR} 100%)`}
                iconColor={ICON_COLOR}
                sx={{ width: { xs: '100%', md: '280px' }, minHeight: 160 }}
                description="Known CVEs in dependencies"
                onClick={() => {
                  const d = getSastData('Dependency CVEs');
                  openDialog('Dependency CVEs', `linear-gradient(135deg, ${SECONDARY_COLOR} 0%, ${QUATERNARY_COLOR} 100%)`, d.files, d.number);
                }}
              />
              <SecurityCard
                icon={<AutoFixHighIcon />}
                title="Remediation Score"
                gradient={`linear-gradient(135deg, ${TERTIARY_COLOR} 0%, ${PRIMARY_COLOR} 100%)`}
                iconColor={ICON_COLOR}
                sx={{ width: { xs: '100%', md: '280px' }, minHeight: 160 }}
                description="Score for applied remediations"
                onClick={() => {
                  const d = getSastData('Remediation Score');
                  openDialog('Remediation Score', `linear-gradient(135deg, ${TERTIARY_COLOR} 0%, ${PRIMARY_COLOR} 100%)`, d.files, d.number);
                }}
                score={(() => { const d = getSastData('Remediation Score'); return typeof d.number === 'number' && d.number >= 0 ? Math.round(d.number) : undefined; })()}
              />
              <SecurityCard
                icon={<ScoreIcon />}
                title="Security Score"
                gradient={`linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`}
                iconColor={ICON_COLOR}
                sx={{ width: { xs: '100%', md: '280px' }, minHeight: 160 }}
                description="Overall security score"
                onClick={() => {
                  const d = getSastData('Security Score');
                  openDialog('Security Score', `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`, d.files, d.number);
                }}
                score={(() => { const d = getSastData('Security Score'); return typeof d.number === 'number' && d.number >= 0 ? Math.round(d.number) : undefined; })()}
              />
            </Stack>
          </Stack>
        )}
      </Box>
      <ChatbotIcon />
      <SecurityDialogBox
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        label={dialogLabel}
        number={dialogNumber}
        files={dialogFiles}
        gradient={dialogGradient}
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