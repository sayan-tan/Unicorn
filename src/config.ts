/**
 * Frontend configuration
 * Environment variables are loaded from .env.local in development
 * and from the environment in production
 */

const config = {
  // API URLs
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  
  // Storage keys
  STORAGE_KEYS: {
    GITHUB_PAT: 'github_pat',
    REPO_URL: 'repo_url',
    REPOS: 'repos',
    GITHUB_FORKS: 'github_forks',
    GITHUB_CONTRIBUTORS: 'github_contributors',
    GITHUB_ISSUES: 'github_issues',
    GITHUB_PULL_REQUESTS: 'github_pull_requests',
    SAST_SECURITY_THREATS: 'sast_security_threats',
    CODE_QUALITY_RESULT: 'codeQualityResult'
  }
} as const;

export default config; 