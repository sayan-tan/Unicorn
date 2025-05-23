"""
Context Manager for Chatbot

This module manages the dynamic context updates for the chatbot based on localStorage data.
It provides functions to update, validate, and combine context data.
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import aiofiles
from pathlib import Path

class ContextManager:
    def __init__(self, context_file_path: str = None):
        base_dir = Path(__file__).parent.parent.parent  # Points to the 'backend' directory
        if context_file_path is None:
            self.context_file_path = str(base_dir / "context" / "DynamicContext.md")
        else:
            self.context_file_path = context_file_path
        self.base_context_path = str(base_dir / "context" / "Context.md")
        self.data_freshness_hours = 24

    async def update_context(self, analysis_type: str, data: Dict[str, Any]) -> None:
        """Update the dynamic context with new analysis data."""
        try:
            # Read current context
            async with aiofiles.open(self.context_file_path, 'r') as f:
                content = await f.read()

            # Update repository information
            repo_info = {
                "repoUrl": data.get("repoUrl"),
                "lastAnalyzed": datetime.now().isoformat(),
                "analysisType": analysis_type
            }

            # Update specific analysis section
            if analysis_type == "code_quality":
                section_data = self._format_code_quality_data(data)
            elif analysis_type == "security":
                section_data = self._format_security_data(data)
            elif analysis_type == "github":
                section_data = self._format_github_data(data)
            else:
                raise ValueError(f"Unknown analysis type: {analysis_type}")

            # Update the context file
            updated_content = self._update_context_section(content, analysis_type, section_data)
            updated_content = self._update_repo_info(updated_content, repo_info)

            # Write back to file
            async with aiofiles.open(self.context_file_path, 'w') as f:
                await f.write(updated_content)

        except Exception as e:
            print(f"Error updating context: {e}")
            raise

    def _format_code_quality_data(self, data: Dict[str, Any]) -> str:
        """Format code quality data for context update."""
        return json.dumps({
            "files_analyzed": data.get("files_analyzed", {}),
            "issues": data.get("issues", {}),
            "top_issues": data.get("top_issues", []),
            "quality_score": data.get("quality_score"),
            "timing": data.get("timing", {})
        }, indent=4)

    def _format_security_data(self, data: Dict[str, Any]) -> str:
        """Format security analysis data for context update."""
        return json.dumps({
            "vulnerabilities": data.get("vulnerabilities", {}),
            "secrets_found": data.get("secrets_found"),
            "dependency_issues": data.get("dependency_issues"),
            "top_risky_files": data.get("top_risky_files", [])
        }, indent=4)

    def _format_github_data(self, data: Dict[str, Any]) -> str:
        """Format GitHub insights data for context update."""
        return json.dumps({
            "forks": data.get("forks"),
            "contributors": data.get("contributors", []),
            "issues": data.get("issues", {}),
            "pull_requests": data.get("pull_requests", {})
        }, indent=4)

    def _update_context_section(self, content: str, analysis_type: str, section_data: str) -> str:
        """Update a specific section in the context file."""
        section_markers = {
            "code_quality": ("### Code Quality Analysis", "### Security Analysis"),
            "security": ("### Security Analysis", "### GitHub Insights"),
            "github": ("### GitHub Insights", "## Context Update Rules")
        }

        if analysis_type not in section_markers:
            raise ValueError(f"Unknown analysis type: {analysis_type}")

        start_marker, end_marker = section_markers[analysis_type]
        start_idx = content.find(start_marker)
        end_idx = content.find(end_marker)

        if start_idx == -1 or end_idx == -1:
            raise ValueError(f"Could not find section markers for {analysis_type}")

        # Replace the section content
        new_section = f"{start_marker}\n```json\n{section_data}\n```\n"
        return content[:start_idx] + new_section + content[end_idx:]

    def _update_repo_info(self, content: str, repo_info: Dict[str, Any]) -> str:
        """Update repository information in the context file."""
        start_marker = "### Repository Information"
        end_marker = "### Code Quality Analysis"
        
        start_idx = content.find(start_marker)
        end_idx = content.find(end_marker)

        if start_idx == -1 or end_idx == -1:
            raise ValueError("Could not find repository information section")

        new_section = f"{start_marker}\n```json\n{json.dumps(repo_info, indent=4)}\n```\n"
        return content[:start_idx] + new_section + content[end_idx:]

    async def is_data_fresh(self) -> bool:
        """Check if the current context data is fresh."""
        try:
            async with aiofiles.open(self.context_file_path, 'r') as f:
                content = await f.read()

            # Extract lastAnalyzed timestamp
            start_marker = '"lastAnalyzed": "'
            end_marker = '"'
            start_idx = content.find(start_marker)
            if start_idx == -1:
                return False

            start_idx += len(start_marker)
            end_idx = content.find(end_marker, start_idx)
            if end_idx == -1:
                return False

            last_analyzed = datetime.fromisoformat(content[start_idx:end_idx])
            return datetime.now() - last_analyzed < timedelta(hours=self.data_freshness_hours)

        except Exception:
            return False

    async def get_combined_context(self) -> str:
        """Combine base context with dynamic context."""
        try:
            async with aiofiles.open(self.base_context_path, 'r') as f:
                base_context = await f.read()
            async with aiofiles.open(self.context_file_path, 'r') as f:
                dynamic_context = await f.read()

            # Add dynamic context after the base context
            return f"{base_context}\n\n## Current Analysis Context\n\n{dynamic_context}"

        except Exception as e:
            print(f"Error combining contexts: {e}")
            return base_context  # Fallback to base context only

    async def get_context_for_question(self, question: str) -> str:
        """Get relevant context for a specific question."""
        try:
            combined_context = await self.get_combined_context()
            # Check data freshness
            if not await self.is_data_fresh():
                combined_context += "\n\nNote: The following data may be stale, but it is the latest available. Please re-run analysis for the most up-to-date information. Still, always use the numbers and details below to answer the user's question."
            return combined_context
        except Exception as e:
            print(f"Error getting context for question: {e}")
            return await self.get_combined_context()  # Fallback to full context

# Create a singleton instance
context_manager = ContextManager() 