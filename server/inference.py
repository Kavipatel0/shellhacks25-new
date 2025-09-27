import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from typing import Optional

app = FastAPI()

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.5-flash')

class InferenceBody(BaseModel):
    filePath: str

class FileSummaryBody(BaseModel):
    filePath: str
    fileName: str
    fileType: str

baseURL = "https://raw.githubusercontent.com/"

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/infer")
def infer_code(body: InferenceBody):
    # body.filePath must be in this format "hieunguyent12/shellhacks25/refs/heads/main/app/src/components/FlowGraph.jsx"
    try:
        response = requests.get(baseURL + body.filePath)
        response.raise_for_status()
        code = response.text

        prompt = f"""
        Please analyze the following code file and provide a concise summary:
        
        File: {body.filePath}
        Code:
        {code}
        
        Please provide:
        1. What this file does (2-3 sentences)
        2. Its role in the overall codebase
        3. Key functions/components it provides
        
        Keep the response concise and informative for developers trying to understand the codebase.
        """

        response = model.generate_content(prompt)
        return {"summary": response.text}
    except requests.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch file: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")

@app.post("/summarize-file")
def summarize_file(body: FileSummaryBody):
    """
    Summarize a specific file for the file click feature
    """
    try:
        # Construct the GitHub raw URL
        full_url = baseURL + body.filePath
        
        # Fetch the file content
        response = requests.get(full_url)
        response.raise_for_status()
        code = response.text

        # Create a focused prompt for file summarization
        prompt = f"""
        Analyze this {body.fileType} file named "{body.fileName}":
        
        {code}
        
        Provide a comprehensive analysis in this exact format:
        
        **File Purpose:**
        [Write a concise, well-structured paragraph (2-3 sentences) explaining exactly what this file does and its primary purpose in the codebase.]
        
        **Codebase Relationships:**
        • [Bullet point 1: How this file connects to or is used by other parts of the codebase]
        • [Bullet point 2: Dependencies this file has on other files/modules]
        • [Bullet point 3: Files that likely import or depend on this file]
        • [Bullet point 4: Its role in the overall architecture or workflow]
        • [Bullet point 5: Any specific patterns, conventions, or frameworks it follows]
        
        Focus on making this helpful for developers trying to understand how this file fits into the larger project structure.
        """

        # Generate summary using Gemini
        response = model.generate_content(prompt)
        
        return {
            "fileName": body.fileName,
            "fileType": body.fileType,
            "summary": response.text,
            "filePath": body.filePath
        }
        
    except requests.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch file from GitHub: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")