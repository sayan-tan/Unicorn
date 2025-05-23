# Dynamic Chatbot Context

This file is automatically updated with the latest analysis data from localStorage. The chatbot uses this context to provide accurate, up-to-date answers about the analyzed repository.

## Current Analysis Data

### Repository Information
```json
{
    "repoUrl": null,              // Current repository URL
    "lastAnalyzed": null,         // Timestamp of last analysis
    "analysisType": null          // Type of analysis (code_quality, security, etc.)
}
```

### Code Quality Analysis
```json
{
    "files_analyzed": {
        "total": null,
        "by_language": {}
    },
    "issues": {
        "linting": null,
        "todos": null,
        "files_without_docs": null
    },
    "top_issues": [],
    "quality_score": null,
    "timing": {
        "total_seconds": null,
        "breakdown": {}
    }
}
```

### Security Analysis
```json
{
    "vulnerabilities": {
        "critical": null,
        "high": null,
        "medium": null,
        "low": null
    },
    "secrets_found": null,
    "dependency_issues": null,
    "top_risky_files": []
}
```

### GitHub Insights
```json
{
    "forks": null,
    "contributors": [],
    "issues": {
        "open": null,
        "closed": null
    },
    "pull_requests": {
        "open": null,
        "merged": null
    }
}
```

## Context Update Rules

1. **Data Freshness**:
   - Analysis data is considered fresh for 24 hours
   - After 24 hours, the chatbot will suggest re-running the analysis
   - Historical data is preserved but marked as stale

2. **Context Priority**:
   - Most recent analysis takes precedence
   - Multiple analysis types can coexist
   - Security issues are always highlighted if present

3. **Response Guidelines**:
   - Always check data freshness before answering
   - Include timestamps in responses when relevant
   - Suggest re-analysis if data is stale
   - Use available metrics to provide specific answers

4. **Data Integration**:
   - Code quality metrics inform maintainability answers
   - Security findings influence risk assessment
   - GitHub insights provide contributor context
   - All data points can be cross-referenced

## Example Context-Aware Responses

1. **Code Quality Questions**:
   - "The repository has {quality_score} quality score based on analysis from {lastAnalyzed}"
   - "Top issues are in {top_issues[0].file} with {top_issues[0].summary}"
   - "There are {issues.linting} linting issues across {files_analyzed.total} files"

2. **Security Questions**:
   - "Found {vulnerabilities.critical} critical vulnerabilities in the latest scan"
   - "Top risky file is {top_risky_files[0]} with {top_risky_files[0].issues} issues"
   - "Security scan from {lastAnalyzed} shows {secrets_found} exposed secrets"

3. **GitHub Activity Questions**:
   - "Repository has {forks} forks and {contributors.length} contributors"
   - "Current open issues: {issues.open}, PRs: {pull_requests.open}"
   - "Top contributor is {contributors[0].name} with {contributors[0].contributions} contributions"

## Update Mechanism

The context is updated through the following process:

1. **LocalStorage Update**:
   ```javascript
   // When API returns new data
   localStorage.setItem('codeQualityData', JSON.stringify(analysisData));
   localStorage.setItem('lastUpdate', new Date().toISOString());
   ```

2. **Context Refresh**:
   ```javascript
   // Update dynamic context
   async function updateChatbotContext() {
       const data = {
           codeQuality: JSON.parse(localStorage.getItem('codeQualityData')),
           security: JSON.parse(localStorage.getItem('securityData')),
           github: JSON.parse(localStorage.getItem('githubData')),
           lastUpdate: localStorage.getItem('lastUpdate')
       };
       // Update DynamicContext.md with new data
   }
   ```

3. **Chatbot Integration**:
   ```javascript
   // When chatbot initializes
   async function initializeChatbot() {
       const dynamicContext = await loadDynamicContext();
       const baseContext = await loadBaseContext();
       return combineContexts(baseContext, dynamicContext);
   }
   ```

## Usage Notes

1. Always verify data freshness before answering
2. Include relevant timestamps in responses
3. Cross-reference multiple data points when available
4. Suggest re-analysis if data is stale
5. Use specific metrics from the context when answering
6. Maintain conversation history for context continuity 