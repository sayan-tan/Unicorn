'use client';

import React, { useEffect, useState } from 'react';
import { Box, Stack } from '@mui/material';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { authService } from '../../services/auth';
import { BG_COLOR, PRIMARY_COLOR, SECONDARY_COLOR, TERTIARY_COLOR, QUATERNARY_COLOR, ICON_COLOR } from '../../components/colors';
import ChatbotIcon from '../../components/ChatbotIcon';
import InsightsCard from '../../components/InsightsCard';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import BugReportIcon from '@mui/icons-material/BugReport';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import PeopleIcon from '@mui/icons-material/People';
import ForksDialogBox from '../../components/DialogBox';
import IssueDialogBox from '../../components/IssueDialogBox';
import { RunAnalysisDialogBox } from '../../components/DialogBox';
import { PullRequestsDialogBox } from '@/components/DialogBox';
import NoDataError from '../../components/NoDataError';

interface ForkData {
  fork_owner_avatar: string;
  fork_owner_name: string;
  forked_repo_name: string;
}

interface ContributorData {
  login: string;
  avatar_url: string;
  contributions: number;
}

interface IssueData {
  number: number;
  title: string;
  state: string;
  created_at: string;
  closed_at?: string | null;
  user: string;
}

interface IssueItem {
  number: number;
  title: string;
  state: string;
  created_at: string;
  closed_at?: string | null;
  user: string;
}

interface PullRequestData {
  number: number;
  title: string;
  state: string;
  created_at: string;
  merged_at: string | null;
  author: {
    login: string;
    avatarUrl: string | null;
  };
  url: string;
}

interface PullRequestsResponse {
  total_pull_requests: number;
  open_pull_requests: number;
  merged_pull_requests: number;
  pull_requests: PullRequestData[];
}

export default function GithubInsightsPage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState<string>('');
  const [forksDialogOpen, setForksDialogOpen] = useState(false);
  const [contributorsDialogOpen, setContributorsDialogOpen] = useState(false);
  const [issuesDialogOpen, setIssuesDialogOpen] = useState(false);
  const [pullRequestsDialogOpen, setPullRequestsDialogOpen] = useState(false);
  const [forksCount, setForksCount] = useState(0);
  const [contributorsCount, setContributorsCount] = useState(0);
  const [openedIssuesCount, setOpenedIssuesCount] = useState(0);
  const [closedIssuesCount, setClosedIssuesCount] = useState(0);
  const [pullRequestsItems, setPullRequestsItems] = useState<PullRequestData[]>([]);
  const [pullRequestsError, setPullRequestsError] = useState<string | null>(null);
  const [pullRequestsStats, setPullRequestsStats] = useState<{ active: number; merged: number }>({ active: 0, merged: 0 });
  const [forksItems, setForksItems] = useState<Array<{ avatar: string; repoName: string; ownerName: string }>>([]);
  const [contributorsItems, setContributorsItems] = useState<Array<{ avatar: string; ownerName: string; contributions: number }>>([]);
  const [openedIssues, setOpenedIssues] = useState<Array<{ number: number; title: string; state: string; created_at: string; closed_at?: string | null; user: string }>>([]);
  const [closedIssues, setClosedIssues] = useState<Array<{ number: number; title: string; state: string; created_at: string; closed_at?: string | null; user: string }>>([]);
  const [expanded, setExpanded] = useState<'runAnalysis' | null>(null);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);

  const handleLogout = () => {
    authService.logout();
    router.replace('/login');
  };

  useEffect(() => {
    const storedRepoUrl = localStorage.getItem('repo_url');
    if (storedRepoUrl) {
      setRepoUrl(storedRepoUrl);
    }
  }, []);

  // Load forks data from localStorage when dialog opens
  useEffect(() => {
    if (forksDialogOpen) {
      const forksRaw = localStorage.getItem('github_forks');
      if (forksRaw) {
        try {
          const forksData = JSON.parse(forksRaw);
          setForksCount(forksData.total_forks || 0);
          // Transform forks data into the format expected by ForksDialogBox
          const formattedForks = (forksData.forks || []).map((fork: ForkData) => ({
            avatar: fork.fork_owner_avatar,
            repoName: fork.forked_repo_name,
            ownerName: fork.fork_owner_name
          }));
          setForksItems(formattedForks);
        } catch {
          setForksCount(0);
          setForksItems([]);
        }
      } else {
        setForksCount(0);
        setForksItems([]);
      }
    }
  }, [forksDialogOpen]);

  // Load contributors data from localStorage when dialog opens
  useEffect(() => {
    if (contributorsDialogOpen) {
      const contributorsRaw = localStorage.getItem('github_contributors');
      if (contributorsRaw) {
        try {
          const contributorsData = JSON.parse(contributorsRaw);
          setContributorsCount(contributorsData.total_contributors || 0);
          // Transform contributors data into the format expected by ForksDialogBox
          const formattedContributors = (contributorsData.top_contributors || []).map((contributor: ContributorData) => ({
            avatar: contributor.avatar_url,
            ownerName: contributor.login,
            contributions: contributor.contributions
          }));
          setContributorsItems(formattedContributors);
        } catch {
          setContributorsCount(0);
          setContributorsItems([]);
        }
      } else {
        setContributorsCount(0);
        setContributorsItems([]);
      }
    }
  }, [contributorsDialogOpen]);

  // Load issues data from localStorage when dialog opens
  useEffect(() => {
    if (issuesDialogOpen) {
      const issuesRaw = localStorage.getItem('github_issues');
      if (issuesRaw) {
        try {
          const issuesData = JSON.parse(issuesRaw);
          // Transform and separate opened and closed issues, sort by creation date (newest first)
          const opened = (issuesData.opened_last_year || [])
            .map((issue: IssueData) => ({
              number: issue.number,
              title: issue.title,
              state: issue.state,
              created_at: issue.created_at,
              closed_at: issue.closed_at,
              user: issue.user
            }))
            .sort((a: IssueItem, b: IssueItem) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 15); // Get only the latest 15 issues

          const closed = (issuesData.closed_last_year || [])
            .map((issue: IssueData) => ({
              number: issue.number,
              title: issue.title,
              state: issue.state,
              created_at: issue.created_at,
              closed_at: issue.closed_at,
              user: issue.user
            }))
            .sort((a: IssueItem, b: IssueItem) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 15); // Get only the latest 15 issues

          setOpenedIssues(opened);
          setClosedIssues(closed);
          setOpenedIssuesCount(issuesData.opened_last_year?.length || 0); // Keep total count
          setClosedIssuesCount(issuesData.closed_last_year?.length || 0); // Keep total count
        } catch (error) {
          console.error('Error parsing issues data:', error);
          setOpenedIssues([]);
          setClosedIssues([]);
          setOpenedIssuesCount(0);
          setClosedIssuesCount(0);
        }
      } else {
        setOpenedIssues([]);
        setClosedIssues([]);
        setOpenedIssuesCount(0);
        setClosedIssuesCount(0);
      }
    }
  }, [issuesDialogOpen]);

  const handleRunAnalysis = async () => {
    setExpanded('runAnalysis');
    setIsAnalysisRunning(true);
    try {
      const patToken = localStorage.getItem('github_pat');
      if (!patToken) {
        console.error('GitHub token not found');
        return;
      }

      const response = await fetch('/api/v1/github/pull-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo_url: repoUrl,
          pat_token: patToken,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch pull requests');
      }

      const data: PullRequestsResponse = await response.json();
      // Store the pull requests data in localStorage
      localStorage.setItem('github_pull_requests', JSON.stringify(data));
      
      // Update the state with the new data
      setPullRequestsItems(data.pull_requests);
      setPullRequestsStats({
        active: data.open_pull_requests,
        merged: data.merged_pull_requests
      });
      setPullRequestsError(null);
    } catch (error) {
      console.error('Error running analysis:', error);
      setPullRequestsError(error instanceof Error ? error.message : 'Failed to fetch pull requests');
    } finally {
      setIsAnalysisRunning(false);
      setExpanded(null);
    }
  };

  // Load pull requests data from localStorage when dialog opens
  useEffect(() => {
    if (pullRequestsDialogOpen) {
      const pullRequestsRaw = localStorage.getItem('github_pull_requests');
      if (pullRequestsRaw) {
        try {
          const data: PullRequestsResponse = JSON.parse(pullRequestsRaw);
          setPullRequestsItems(data.pull_requests);
          setPullRequestsStats({
            active: data.open_pull_requests,
            merged: data.merged_pull_requests
          });
          setPullRequestsError(null);
        } catch (error) {
          console.error('Error parsing pull requests data:', error);
          setPullRequestsError('Failed to load pull requests data');
        }
      } else {
        // If no data in localStorage, fetch from API
        const fetchPullRequests = async () => {
          try {
            const patToken = localStorage.getItem('github_pat');
            if (!patToken) {
              setPullRequestsError('GitHub token not found. Please add a token in settings.');
              return;
            }

            const response = await fetch('/api/v1/github/pull-requests', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                repo_url: repoUrl,
                pat_token: patToken,
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.detail || 'Failed to fetch pull requests');
            }

            const data: PullRequestsResponse = await response.json();
            localStorage.setItem('github_pull_requests', JSON.stringify(data));
            setPullRequestsItems(data.pull_requests);
            setPullRequestsStats({
              active: data.open_pull_requests,
              merged: data.merged_pull_requests
            });
            setPullRequestsError(null);
          } catch (error) {
            console.error('Error fetching pull requests:', error);
            setPullRequestsError(error instanceof Error ? error.message : 'Failed to fetch pull requests');
          }
        };

        fetchPullRequests();
      }
    }
  }, [pullRequestsDialogOpen, repoUrl]);

  // Check if any GitHub data is available
  const hasGitHubData = () => {
    if (typeof window === 'undefined') return false;
    return (
      localStorage.getItem('github_forks') ||
      localStorage.getItem('github_contributors') ||
      localStorage.getItem('github_issues') ||
      localStorage.getItem('github_pull_requests')
    );
  };

  return (
    <Box sx={{ minHeight: '80vh', bgcolor: BG_COLOR }}>
      <Navbar activePage="github-insights" handleLogout={handleLogout} />
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
        {!hasGitHubData() ? (
          <NoDataError
            title="No GitHub Insights Available"
            description="Run a GitHub analysis to see insights about forks, contributors, issues, and pull requests for your repository."
            onRunAnalysis={() => handleRunAnalysis()}
          />
        ) : (
          <Stack spacing={4} sx={{ width: 'auto', alignItems: 'center' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: 1200, mx: 'auto' }}>
              <InsightsCard
                icon={<MergeTypeIcon sx={{ fontSize: 48 }} />}
                title={<>Pull<br />Requests</>}
                description={
                  'See open and merged pull requests and their activity.'
                }
                gradient={`linear-gradient(135deg, ${SECONDARY_COLOR} 0%, ${TERTIARY_COLOR} 100%)`}
                iconColor={ICON_COLOR}
                onClick={() => setPullRequestsDialogOpen(true)}
              />
              <InsightsCard
                icon={<BugReportIcon sx={{ fontSize: 48 }} />}
                title={<>GitHub<br />Issues</>}
                description={
                  'Track open and closed issues and their recent activity.'
                }
                gradient={`linear-gradient(135deg, ${TERTIARY_COLOR} 0%, ${QUATERNARY_COLOR} 100%)`}
                iconColor={ICON_COLOR}
                onClick={() => setIssuesDialogOpen(true)}
              />
              <InsightsCard
                icon={<CallSplitIcon sx={{ fontSize: 48 }} />}
                title={<>Repository<br />Forks</>}
                description={
                  'See who has forked your repository and when.'
                }
                gradient={`linear-gradient(135deg, ${QUATERNARY_COLOR} 0%, ${PRIMARY_COLOR} 100%)`}
                iconColor={ICON_COLOR}
                onClick={() => setForksDialogOpen(true)}
              />
              <InsightsCard
                icon={<PeopleIcon sx={{ fontSize: 48 }} />}
                title={<>Top<br />Contributors</>}
                description={
                  'View the most active contributors to your repository.'
                }
                gradient={`linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${TERTIARY_COLOR} 100%)`}
                iconColor={ICON_COLOR}
                onClick={() => setContributorsDialogOpen(true)}
              />
            </Stack>
          </Stack>
        )}
      </Box>
      <ChatbotIcon />
      {/* Repository Forks Dialog */}
      <ForksDialogBox
        open={forksDialogOpen}
        onClose={() => setForksDialogOpen(false)}
        label="Repository Forks"
        number={forksCount}
        items={forksItems}
        gradient={`linear-gradient(135deg, ${QUATERNARY_COLOR} 0%, ${PRIMARY_COLOR} 100%)`}
        showSeparator={false}
      />
      <ForksDialogBox
        open={contributorsDialogOpen}
        onClose={() => setContributorsDialogOpen(false)}
        label="Top Contributors"
        number={contributorsCount}
        items={contributorsItems}
        gradient={`linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${TERTIARY_COLOR} 100%)`}
        showSeparator={false}
        showRightNumber={true}
      />
      <IssueDialogBox
        open={issuesDialogOpen}
        onClose={() => setIssuesDialogOpen(false)}
        openedCount={openedIssuesCount}
        closedCount={closedIssuesCount}
        openedIssues={openedIssues}
        closedIssues={closedIssues}
        gradient={`linear-gradient(135deg, ${TERTIARY_COLOR} 0%, ${QUATERNARY_COLOR} 100%)`}
      />
      <RunAnalysisDialogBox
        open={expanded === 'runAnalysis'}
        onClose={() => setExpanded(null)}
        onRun={() => handleRunAnalysis()}
        isRunning={isAnalysisRunning}
      />
      <PullRequestsDialogBox
        open={pullRequestsDialogOpen}
        onClose={() => setPullRequestsDialogOpen(false)}
        activeCount={pullRequestsStats.active}
        mergedCount={pullRequestsStats.merged}
        activePRs={pullRequestsItems.filter(pr => pr.state === 'OPEN')}
        mergedPRs={pullRequestsItems.filter(pr => pr.merged_at !== null)}
        gradient={`linear-gradient(135deg, ${SECONDARY_COLOR} 0%, ${TERTIARY_COLOR} 100%)`}
        errorMessage={pullRequestsError || undefined}
      />
    </Box>
  );
} 