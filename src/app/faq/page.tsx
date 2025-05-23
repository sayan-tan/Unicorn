'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { authService } from '../../services/auth';
import { BG_COLOR, PRIMARY_COLOR, SECONDARY_COLOR, TERTIARY_COLOR, QUATERNARY_COLOR } from '../../components/colors';

const topQuestions = [
  {
    question: "What does 'Commits Over Time' represent?",
    tags: ["Trends"],
    answer: "This chart shows the number of commits made each month. It helps visualize development activity and can highlight periods of high or low contribution."
  },
  {
    question: "What does the Pull Requests chart tell me?",
    tags: ["Trends"],
    answer: "It shows the current distribution of active and merged pull requests. This helps track collaboration, feature development, and code review progress."
  },
  {
    question: "What does the GitHub Issues chart represent?",
    tags: ["Trends"],
    answer: "This chart shows the number of open vs closed issues. It helps assess how effectively issues are being resolved and the backlog trend."
  },
  {
    question: "Who are the Top Contributors and what does their count mean?",
    tags: ["Trends"],
    answer: "Top Contributors shows who made the most commits. It's useful for identifying key team members or bots driving activity."
  },
  {
    question: "What does the GitHub Forks number represent?",
    tags: ["Trends"],
    answer: "It shows how many users have forked the repository, indicating how many developers are potentially using or contributing to your codebase."
  },
  {
    question: "What is shown under Recent Activity?",
    tags: ["Trends"],
    answer: "Recent Activity logs show recent pull requests, commits, and other GitHub events, helping you stay up to date with project progress in real time."
  },
  {
    question: "What is a Code Quality Score?",
    tags: ["Quality"],
    answer: "The Code Quality Score is a composite metric calculated from test coverage, linting issues, code duplication, complexity, and docstring presence. Higher scores reflect cleaner, more maintainable code."
  },
  {
    question: "How is Test Coverage calculated?",
    tags: ["Quality"],
    answer: "Test Coverage is the percentage of code lines exercised by automated tests. It's calculated by dividing the number of lines executed during testing by the total number of lines of code."
  },
  {
    question: "How are Vulnerabilities counted?",
    tags: ["Quality", "Security"],
    answer: "Vulnerabilities are counted based on static analysis, CVE data, and security scanners. Each detected issue, such as insecure functions or outdated dependencies, adds to the total."
  },
  {
    question: "What are the Top 5 Files Impacting Quality?",
    tags: ["Quality"],
    answer: "These are the files with the lowest individual quality scores based on complexity, test coverage, duplication, and doc quality. They offer the biggest opportunities for improvement."
  },
  {
    question: "What are the Top 5 Files with Maximum Vulnerabilities?",
    tags: ["Quality", "Security"],
    answer: "These are the files where the most critical or frequent vulnerabilities were detected, including CVEs, secrets, or unsafe functions. Prioritizing them helps reduce security risk."
  },
  {
    question: "What are Quick Suggestions for improving code quality?",
    tags: ["Quality", "Security"],
    answer: "Quick Suggestions include actionable advice like increasing test coverage, refactoring duplicated code, removing hardcoded secrets, or avoiding risky functions like eval()."
  },
  {
    question: "What are Linting Issues and why do they matter?",
    tags: ["Health"],
    answer: "Linting issues are violations of style, syntax, or programming best practices identified by static analysis tools. Fixing them improves code readability, consistency, and reliability."
  },
  {
    question: "What does Cyclomatic Complexity measure?",
    tags: ["Health"],
    answer: "Cyclomatic Complexity measures the number of independent logical paths through a function. Higher complexity makes code harder to test, maintain, and debug."
  },
  {
    question: "What is Code Duplication and Dead Code?",
    tags: ["Health"],
    answer: "Code duplication refers to repeating logic across files, while dead code is unused logic that remains in the codebase. Both reduce maintainability and increase potential bugs."
  },
  {
    question: "What are the Top 5 Files with Linting Issues?",
    tags: ["Health"],
    answer: "These files have the highest number of lint rule violations. Fixing them can drastically improve code cleanliness and consistency."
  },
  {
    question: "What are the Top 5 Files with Complexity Issues?",
    tags: ["Health"],
    answer: "These files contain overly complex logic, such as long functions, deep nesting, or duplicated code. Simplifying them can improve readability and maintainability."
  },
  {
    question: "What does Average Complexity mean?",
    tags: ["Health"],
    answer: "Average Complexity shows the mean cyclomatic complexity across all scanned files. Lower values indicate simpler, easier-to-maintain code."
  },
  {
    question: "What does 'Files with Linting Issues' percentage show?",
    tags: ["Health"],
    answer: "This percentage represents how many files in the project have linting errors out of the total files analyzed. Lower percentages are better."
  },
  {
    question: "What are 'Files Without Comments'?",
    tags: ["Health"],
    answer: "This refers to code files or functions that lack inline comments or docstrings. Adding documentation improves code clarity and team collaboration."
  },
  {
    question: "Who are the Top Contributors to Problematic Files?",
    tags: ["Health"],
    answer: "This shows which users have contributed most to files with issues, helping prioritize collaboration or review efforts to fix code quality concerns."
  },
  {
    question: "What does 'Overall Maintainability' mean?",
    tags: ["Health"],
    answer: "Overall Maintainability is a combined rating based on complexity, duplication, documentation, and linting. It indicates how easy the codebase is to evolve safely."
  },
  {
    question: "What are Secrets Detected?",
    tags: ["Security"],
    answer: "Secrets detection identifies hardcoded tokens, API keys, passwords, or credentials in your code. These pose a security risk if exposed publicly or in shared codebases."
  },
  {
    question: "What are Static Security Warnings?",
    tags: ["Security"],
    answer: "Static Security Warnings are alerts from security tools that scan code for risky patterns like SQL injection, unsafe eval, or use of outdated dependencies."
  },
  {
    question: "What is the Severity Breakdown chart?",
    tags: ["Security"],
    answer: "The Severity Breakdown visualizes the number of vulnerabilities by criticality: Critical, High, Medium, and Low. It helps you prioritize which issues to fix first."
  },
  {
    question: "What kind of suggestions are shown under Quick Suggestions?",
    tags: ["Security"],
    answer: "Suggestions may include rotating credentials, upgrading packages with known CVEs, removing risky logic, or reviewing unused dependencies to improve security."
  },
  {
    question: "What are OWASP Scan Results?",
    tags: ["Security"],
    answer: "OWASP scan results come from dynamic or static security tools that check your app against the OWASP Top 10 vulnerabilities like XSS, CSRF, or insecure deserialization."
  }
];

const tagOrder = ['Trends', 'Quality', 'Health', 'Security'];
const tagColors = [
  `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`,
  `linear-gradient(135deg, ${SECONDARY_COLOR} 0%, ${TERTIARY_COLOR} 100%)`,
  `linear-gradient(135deg, ${TERTIARY_COLOR} 0%, ${QUATERNARY_COLOR} 100%)`,
  `linear-gradient(135deg, ${QUATERNARY_COLOR} 0%, ${PRIMARY_COLOR} 100%)`,
];

const questionsByTag = tagOrder.map(tag => ({
  tag,
  questions: topQuestions.filter(q => q.tags.includes(tag)),
}));

export default function FAQPage() {
  const router = useRouter();

  const handleLogout = () => {
    authService.logout();
    router.replace('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: BG_COLOR }}>
      <Navbar activePage="faq" handleLogout={handleLogout} />
      <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 1200, mx: 'auto', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography variant="h4" fontWeight={600} mb={4} align="center"></Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', alignItems: 'center', minHeight: 720 }}>
          {questionsByTag.map((cat, i) => (
            <Box
              key={cat.tag}
              sx={{
                width: 550,
                height: 340,
                borderRadius: 4,
                background: tagColors[i % tagColors.length],
                color: 'white',
                boxShadow: '0 4px 24px 0 rgba(56,182,255,0.10)',
                display: 'flex',
                flexDirection: 'column',
                mb: i < 2 ? 0 : 0,
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  p: 3,
                  '::-webkit-scrollbar': {
                    width: 8,
                  },
                  '::-webkit-scrollbar-thumb': {
                    background: 'rgba(255,255,255,0.18)',
                    borderRadius: 8,
                  },
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255,255,255,0.18) transparent',
                }}
              >
                <Typography variant="h5" fontWeight={700} mb={2} letterSpacing={1} sx={{ textTransform: 'uppercase', opacity: 0.92 }}>
                  {cat.tag}
                </Typography>
                {cat.questions.length === 0 ? (
                  <Typography fontSize={16} color="white" sx={{ opacity: 0.8 }}>
                    No questions in this category.
                  </Typography>
                ) : (
                  cat.questions.map((q, idx) => (
                    <Box key={idx} sx={{ mb: 3 }}>
                      <Typography fontWeight={600} fontSize={17} mb={0.5}>
                        {q.question}
                      </Typography>
                      <Typography fontSize={15} sx={{ opacity: 0.93, wordBreak: 'break-word' }}>
                        {q.answer}
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
} 