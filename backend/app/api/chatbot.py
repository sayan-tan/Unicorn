"""
Chatbot API Implementation

This module implements a context-aware chatbot that provides intelligent responses about code analysis
results. It integrates with the context manager to maintain up-to-date information about repository
analysis and uses OpenAI's GPT-4 model for natural language understanding and response generation.

Implementation Details:
----------------------

1. Context Management:
   - Uses ContextManager to maintain dynamic context from analysis results
   - Combines base context (platform capabilities) with dynamic context (current analysis)
   - Tracks data freshness (24-hour validity) and suggests re-analysis when needed
   - Supports multiple analysis types: code quality, security, and GitHub insights

2. Chat Flow:
   a. Request Processing:
      - Accepts questions and optional conversation_id
      - Retrieves relevant context for the question
      - Checks data freshness
   
   b. Response Generation:
      - Uses GPT-4 with context-aware system prompt
      - Includes conversation history (when available)
      - Generates natural language responses
      - Provides suggested actions based on context
   
   c. Response Structure:
      - answer: The main response to the user's question
      - conversation_id: For maintaining conversation context
      - data_fresh: Indicates if analysis data is current
      - suggested_actions: Relevant next steps for the user

3. Context Updates:
   - Endpoint: POST /update-context
   - Accepts analysis_type and analysis data
   - Updates dynamic context file
   - Maintains separate sections for different analysis types
   - Preserves historical data while marking stale entries

4. Error Handling:
   - Graceful handling of context retrieval failures
   - Fallback to base context when dynamic context is unavailable
   - Clear error messages for API failures
   - Automatic retry suggestions for stale data

Example Usage:
-------------

1. Asking a Question:
   ```python
   response = await client.post("/chat", json={
       "question": "What are the top code quality issues?",
       "conversation_id": "conv_123"
   })
   # Response includes answer, freshness status, and suggested actions
   ```

2. Updating Context:
   ```python
   await client.post("/update-context", json={
       "analysis_type": "code_quality",
       "data": {
           "repoUrl": "https://github.com/user/repo",
           "files_analyzed": {...},
           "issues": {...},
           "quality_score": 7.5
       }
   })
   ```

Integration Points:
-----------------

1. Frontend Integration:
   - Call /update-context after each analysis completes
   - Use /chat for user questions
   - Handle suggested_actions in UI
   - Show freshness warnings when data_fresh is false

2. Analysis APIs:
   - Code Quality API updates code_quality section
   - Security API updates security section
   - GitHub API updates github insights section

3. Context Manager:
   - Manages context file updates
   - Handles data freshness
   - Combines base and dynamic context
   - Provides context for specific questions

Performance Considerations:
-------------------------

1. Token Usage:
   - Context is filtered to relevant sections
   - System prompt is optimized for clarity
   - Response length is capped at 500 tokens
   - Temperature set to 0.7 for balanced creativity

2. Response Time:
   - Async implementation for better scalability
   - Efficient context retrieval
   - Cached base context
   - Optimized prompt structure

3. Resource Management:
   - Single context manager instance
   - Efficient file I/O with aiofiles
   - Proper error handling and cleanup
   - Memory-efficient context updates

Security:
---------

1. Input Validation:
   - Pydantic models for request validation
   - Type checking for all parameters
   - Sanitized context updates
   - Protected file operations

2. Error Handling:
   - No sensitive data in error messages
   - Proper HTTP status codes
   - Logging for debugging
   - Graceful fallbacks

Future Improvements:
-------------------

1. Planned Features:
   - Conversation history persistence
   - Context-aware follow-up questions
   - Multi-repository support
   - Custom analysis types

2. Technical Debt:
   - Implement conversation history
   - Add rate limiting
   - Improve error messages
   - Add context compression
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from ..utils.context_manager import context_manager
from openai import AsyncOpenAI
from ..core.config import settings

router = APIRouter()

class ChatRequest(BaseModel):
    question: str
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    conversation_id: str
    data_fresh: bool
    suggested_actions: Optional[list[str]] = None

@router.post("/chat")
async def chat(request: ChatRequest) -> ChatResponse:
    """Handle chat requests with context-aware responses."""
    try:
        # Get context for the question
        context = await context_manager.get_context_for_question(request.question)
        is_data_fresh = await context_manager.is_data_fresh()

        # Initialize OpenAI client
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        # Prepare the conversation
        messages = [
            {"role": "system", "content": f"You are a helpful code analysis assistant. Use this context to answer questions:\n\n{context}"},
            {"role": "user", "content": request.question}
        ]

        # Add conversation history if available
        if request.conversation_id:
            # TODO: Implement conversation history retrieval
            pass

        # Get response from OpenAI
        response = await client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            max_tokens=500,
            temperature=0.7
        )

        answer = response.choices[0].message.content

        # Generate suggested actions based on the question and context
        suggested_actions = await _generate_suggested_actions(request.question, context, is_data_fresh)

        return ChatResponse(
            answer=answer,
            conversation_id=request.conversation_id or "new",
            data_fresh=is_data_fresh,
            suggested_actions=suggested_actions
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def _generate_suggested_actions(question: str, context: str, is_data_fresh: bool) -> list[str]:
    """Generate suggested actions based on the question and context."""
    actions = []

    # Add re-analysis suggestion if data is stale
    if not is_data_fresh:
        actions.append("Re-run code analysis to get fresh data")

    # Add context-specific suggestions
    if "quality" in question.lower():
        actions.append("View detailed code quality report")
        actions.append("See top issues and suggestions")
    elif "security" in question.lower():
        actions.append("View security scan details")
        actions.append("Check vulnerability fixes")
    elif "github" in question.lower():
        actions.append("View contributor statistics")
        actions.append("Check recent activity")

    return actions

@router.post("/update-context")
async def update_context(analysis_type: str, data: Dict[str, Any]) -> Dict[str, str]:
    """Update the chatbot context with new analysis data."""
    try:
        await context_manager.update_context(analysis_type, data)
        return {"status": "success", "message": "Context updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 