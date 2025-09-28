import google.generativeai as genai
import openai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from typing import Optional
import io
import base64

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # If python-dotenv is not available, try to manually load .env
    try:
        with open('.env', 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
    except FileNotFoundError:
        pass

app = FastAPI()

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://shellhacks25.vercel.app"],  # Allow frontend ports
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
print(f"🔑 GEMINI_API_KEY loaded: {'✅ Yes' if api_key else '❌ No'}")
if api_key:
    print(f"🔑 API Key starts with: {api_key[:10]}...")
else:
    print("❌ GEMINI_API_KEY not found in environment variables")
    print("📋 Available environment variables:")
    for key, value in os.environ.items():
        if 'GEMINI' in key or 'API' in key:
            print(f"   {key}: {value[:10] if value else 'None'}...")

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.5-flash')

# Configure OpenAI API for codebase assistant
openai_api_key = os.getenv("OPENAI_API_KEY")
print(f"🔑 OPENAI_API_KEY loaded: {'✅ Yes' if openai_api_key else '❌ No'}")
if openai_api_key:
    print(f"🔑 OpenAI API Key starts with: {openai_api_key[:10]}...")
    openai_client = openai.OpenAI(api_key=openai_api_key)
else:
    print("❌ OPENAI_API_KEY not found in environment variables")
    openai_client = None

# Configure ElevenLabs API for voice synthesis
elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
print(f"🔑 ELEVENLABS_API_KEY loaded: {'✅ Yes' if elevenlabs_api_key else '❌ No'}")
if elevenlabs_api_key:
    print(f"🔑 ElevenLabs API Key starts with: {elevenlabs_api_key[:10]}...")
else:
    print("❌ ELEVENLABS_API_KEY not found in environment variables")

class InferenceBody(BaseModel):
    filePath: str

class FileSummaryBody(BaseModel):
    filePath: str
    fileName: str
    fileType: str

class CodebaseQuestionBody(BaseModel):
    question: str
    repoUrl: str
    nodes: list
    edges: list

class VoiceSynthesisBody(BaseModel):
    text: str

def fetch_repository_tree(owner, repo, branch):
    """
    Fetch repository tree from GitHub API to find files when nodes don't contain them
    """
    try:
        # Use GitHub API to get repository tree
        api_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"
        
        print(f"🌳 Fetching repository tree from: {api_url}")
        response = requests.get(api_url, timeout=15)
        
        if response.status_code != 200:
            print(f"❌ GitHub API error: {response.status_code}")
            return []
        
        tree_data = response.json()
        files = []
        
        # Extract files from tree
        for item in tree_data.get('tree', []):
            if item.get('type') == 'blob':  # blob = file, tree = directory
                file_path = item.get('path', '')
                file_name = file_path.split('/')[-1]
                
                # Skip binary files
                skip_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.pdf', '.zip', '.tar', '.gz'}
                if any(file_name.lower().endswith(ext) for ext in skip_extensions):
                    continue
                
                files.append({
                    'name': file_name,
                    'path': file_path,
                    'priority': get_file_priority(file_name, file_path)
                })
        
        print(f"🌳 Found {len(files)} files in repository tree")
        return files[:25]  # Limit to top 25 files
        
    except Exception as e:
        print(f"❌ Error fetching repository tree: {str(e)}")
        return []

def get_file_priority(file_name, file_path):
    """
    Assign priority to files for analysis (higher = more important)
    """
    # Critical configuration files (highest priority)
    if file_name in ['package.json', 'requirements.txt', 'Pipfile', 'pyproject.toml', 'Cargo.toml', 'go.mod', 'pom.xml']:
        return 100
    
    # Main entry points and important files
    if file_name in ['main.py', 'app.py', 'index.js', 'index.ts', 'main.js', 'main.ts', 'App.js', 'App.jsx', 'App.tsx', 'server.js', 'server.ts']:
        return 90
    
    # Configuration files
    if file_name.endswith(('.config.js', '.config.ts', '.yml', '.yaml', '.toml', '.json')) or file_name in ['Dockerfile', 'docker-compose.yml']:
        return 80
    
    # README and documentation
    if file_name.lower() in ['readme.md', 'readme.txt'] or file_path.lower().endswith('readme.md'):
        return 75
    
    # Source code files in src/ or main directories
    if '/src/' in file_path or '/lib/' in file_path or file_path.count('/') <= 2:
        return 70
    
    # React/Vue components
    if file_name.endswith(('.jsx', '.tsx', '.vue')):
        return 65
    
    # Python/JavaScript/TypeScript files
    if file_name.endswith(('.py', '.js', '.ts')):
        return 60
    
    # Other source code files
    if file_name.endswith(('.java', '.go', '.rs', '.cpp', '.c', '.cs', '.php', '.rb')):
        return 55
    
    # Stylesheets and templates
    if file_name.endswith(('.css', '.scss', '.sass', '.less', '.html')):
        return 50
    
    # Test files (lower priority)
    if '/test' in file_path.lower() or file_name.startswith('test_') or file_name.endswith('.test.js'):
        return 30
    
    # Default priority
    return 40

baseURL = "https://raw.githubusercontent.com/"

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/debug-files")
def debug_files(body: CodebaseQuestionBody):
    """Debug endpoint to check file detection"""
    try:
        repo_url = body.repoUrl
        nodes = body.nodes
        
        # Parse repository info
        from urllib.parse import urlparse
        parsed_url = urlparse(repo_url)
        path_parts = parsed_url.path.strip('/').split('/')
        owner = path_parts[0]
        repo = path_parts[1]
        branch = 'main'
        
        debug_info = {
            "repo": f"{owner}/{repo}",
            "total_nodes": len(nodes),
            "files_detected": [],
            "files_fetched": [],
            "errors": []
        }
        
        # Detect files
        for node in nodes:
            node_data = node.get('data', {})
            node_type = node_data.get('nodeType', '')
            node_label = node_data.get('label', '')
            node_id = node.get('id', '')
            
            common_extensions = {'.js', '.jsx', '.ts', '.tsx', '.py', '.json', '.md', '.txt', '.css', '.html'}
            has_file_extension = any(node_label.lower().endswith(ext) or node_id.lower().endswith(ext) for ext in common_extensions)
            
            is_file = (
                node_type == 'file' or
                (node_type != 'folder' and has_file_extension) or
                (node_type != 'folder' and '.' in node_label and not node_label.endswith('/'))
            )
            
            if is_file:
                file_name = node_label or node_id.split('/')[-1]
                file_path = node_id
                debug_info["files_detected"].append({
                    "name": file_name,
                    "path": file_path,
                    "priority": get_file_priority(file_name, file_path)
                })
                
                # Try to fetch the file
                try:
                    file_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{file_path}"
                    response = requests.get(file_url, timeout=10)
                    if response.status_code == 200:
                        content_preview = response.text[:200] + "..." if len(response.text) > 200 else response.text
                        debug_info["files_fetched"].append({
                            "name": file_name,
                            "status": "success",
                            "size": len(response.text),
                            "preview": content_preview
                        })
                    else:
                        debug_info["errors"].append(f"{file_name}: HTTP {response.status_code}")
                except Exception as e:
                    debug_info["errors"].append(f"{file_name}: {str(e)}")
        
        return debug_info
        
    except Exception as e:
        return {"error": str(e)}

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

@app.post("/ask-codebase")
def ask_codebase(body: CodebaseQuestionBody):
    """
    Answer questions about the codebase using Gemini AI
    """
    try:
        # Extract repository information
        repo_url = body.repoUrl
        nodes = body.nodes
        edges = body.edges
        question = body.question
        
        print(f"🤖 Codebase question received: {question}")
        print(f"📁 Repository: {repo_url}")
        print(f"🗂️ Nodes count: {len(nodes)}")
        print(f"🔗 Edges count: {len(edges)}")
        
        # Build repository structure context
        structure_info = "Repository Structure:\n"
        structure_info += f"- Total files and folders: {len(nodes)}\n"
        structure_info += f"- Total connections: {len(edges)}\n\n"
        
        # Extract repository info for comprehensive code analysis
        try:
            from urllib.parse import urlparse
            parsed_url = urlparse(repo_url)
            path_parts = parsed_url.path.strip('/').split('/')
            if len(path_parts) >= 2:
                owner = path_parts[0]
                repo = path_parts[1]
                
                # Determine branch (default to 'main')
                branch = 'main'
                if len(path_parts) > 2 and path_parts[2] == 'tree' and len(path_parts) > 3:
                    branch = path_parts[3]
                
                print(f"🔍 Analyzing repository: {owner}/{repo} (branch: {branch})")
                print(f"📊 Total nodes to analyze: {len(nodes)}")
                print(f"🔍 Sample node structure: {nodes[0] if nodes else 'No nodes'}")
                
                # Debug: Show all node types and labels
                print("🔍 All nodes received:")
                for i, node in enumerate(nodes[:10]):  # Show first 10 nodes
                    node_data = node.get('data', {})
                    node_type = node_data.get('nodeType', 'NONE')
                    node_label = node_data.get('label', 'NO_LABEL')
                    node_id = node.get('id', 'NO_ID')
                    print(f"  Node {i+1}: type='{node_type}', label='{node_label}', id='{node_id}'")
                
                # Initialize structure info
                structure_info = f"Repository: {repo_url}\n"
                
                # Fetch ALL code files for comprehensive analysis
                code_files = {}
                total_files_analyzed = 0
                files_found = 0
                
                # Collect all files first, then prioritize them
                all_files = []
                
                for file_node in nodes:
                    # Check multiple possible ways files might be identified
                    node_data = file_node.get('data', {})
                    node_type = node_data.get('nodeType', '')
                    node_label = node_data.get('label', '')
                    node_id = file_node.get('id', '')
                    
                    # Debug: Print node structure for first few nodes
                    if files_found < 3:
                        print(f"🔍 Debug node {files_found + 1}: type='{node_type}', label='{node_label}', id='{node_id}'")
                    
                    # Detect files by multiple criteria - be more aggressive about finding files
                    # 1. Explicit nodeType == 'file'
                    # 2. Node has file extension in label or id
                    # 3. Node is not explicitly marked as folder
                    # 4. Check for common file extensions
                    # 5. If nodeType is missing/empty, assume it's a file if it has an extension
                    common_extensions = {'.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.cs', '.php', '.rb', '.swift', '.kt', '.scala', '.clj', '.hs', '.ml', '.fs', '.vb', '.pl', '.sh', '.bat', '.ps1', '.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.md', '.txt', '.html', '.css', '.scss', '.sass', '.less', '.sql', '.r', '.m', '.mm', '.h', '.hpp', '.cc', '.cxx', '.f', '.f90', '.f95', '.pas', '.ada', '.d', '.nim', '.cr', '.ex', '.exs', '.elm', '.purs', '.res', '.rei'}
                    
                    has_file_extension = any(node_label.lower().endswith(ext) or node_id.lower().endswith(ext) for ext in common_extensions)
                    
                    # More aggressive file detection
                    is_file = (
                        node_type == 'file' or  # Explicitly marked as file
                        (node_type != 'folder' and has_file_extension) or  # Has file extension and not folder
                        (node_type in ['NONE', '', None] and has_file_extension) or  # No type specified but has extension
                        (node_type != 'folder' and '.' in node_label and not node_label.endswith('/')) or  # Has dot in name
                        (node_type != 'folder' and '.' in node_id and not node_id.endswith('/'))  # Has dot in ID
                    )
                    
                    if is_file:
                        file_name = node_label or node_id.split('/')[-1]
                        file_path = node_id
                        files_found += 1
                        
                        # Skip very large files and binary files
                        skip_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.pdf', '.zip', '.tar', '.gz'}
                        if any(file_name.lower().endswith(ext) for ext in skip_extensions):
                            continue
                        
                        # Add to files list for prioritization
                        all_files.append({
                            'name': file_name,
                            'path': file_path,
                            'priority': get_file_priority(file_name, file_path)
                        })
                
                print(f"🔍 Found {len(all_files)} code files to analyze")
                
                # If no files found but we have folders, try to fetch repository tree
                if len(all_files) == 0 and len(nodes) > 0:
                    print("🔄 No files detected in nodes, attempting to fetch repository tree...")
                    try:
                        additional_files = fetch_repository_tree(owner, repo, branch)
                        all_files.extend(additional_files)
                        print(f"✅ Found {len(additional_files)} additional files from repository tree")
                    except Exception as e:
                        print(f"❌ Failed to fetch repository tree: {str(e)}")
                
                print(f"🔍 Total files to analyze: {len(all_files)}")
                
                # Sort files by priority (higher priority first)
                all_files.sort(key=lambda x: x['priority'], reverse=True)
                
                # Analyze files in priority order
                for file_info in all_files:
                    file_name = file_info['name']
                    file_path = file_info['path']
                    
                    print(f"🔍 Analyzing file {total_files_analyzed + 1}: {file_name} (priority: {file_info['priority']})")
                    
                    try:
                        file_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{file_path}"
                        print(f"📄 Fetching code file: {file_name}")
                        print(f"🔗 File URL: {file_url}")
                        
                        file_response = requests.get(file_url, timeout=15)
                        print(f"📊 Response status: {file_response.status_code}")
                        
                        if file_response.status_code == 200:
                            content = file_response.text
                            print(f"📄 Content preview (first 100 chars): {content[:100]}...")
                            
                            # Limit content size but keep it reasonable for analysis
                            max_size = 3000  # Increased for better analysis
                            if len(content) > max_size:
                                content = content[:max_size] + "\n... [truncated for analysis]"
                            
                            code_files[file_name] = {
                                "name": file_name,
                                "path": file_path,
                                "content": content,
                                "size": len(content)
                            }
                            total_files_analyzed += 1
                            print(f"✅ Successfully fetched {file_name} ({len(content)} chars)")
                            
                            # Limit to prevent token overflow - analyze top 25 most important files
                            if total_files_analyzed >= 25:
                                print("📊 Reached analysis limit (25 files)")
                                break
                        else:
                            print(f"❌ Failed to fetch {file_name}: {file_response.status_code}")
                            print(f"❌ Response content: {file_response.text[:200]}")
                    except Exception as e:
                        print(f"❌ Error fetching {file_name}: {str(e)}")
                        print(f"❌ Exception type: {type(e).__name__}")
                
                # Add comprehensive code analysis to structure_info
                if code_files:
                    structure_info += f"\n=== ACTUAL CODE ANALYSIS ({len(code_files)} files) ===\n"
                    for file_path, file_data in code_files.items():
                        structure_info += f"\n--- FILE: {file_data['name']} ({file_data['size']} chars) ---\n"
                        structure_info += file_data['content']
                        structure_info += "\n"
                    
                    structure_info += f"\n=== SUMMARY ===\n"
                    structure_info += f"- Successfully analyzed {len(code_files)} code files\n"
                    structure_info += f"- Total code content: {sum(f['size'] for f in code_files.values())} characters\n"
                else:
                    structure_info += "\n❌ Could not fetch any code files for analysis\n"
                
                print(f"📊 Analysis complete: {total_files_analyzed} code files analyzed out of {files_found} total files found")
                    
        except Exception as e:
            print(f"❌ Error in comprehensive code analysis: {str(e)}")
            structure_info += f"\n❌ Error analyzing codebase: {str(e)}\n"
        
        # Analyze file types using the same logic as file detection
        file_types = {}
        for node in nodes:
            node_data = node.get('data', {})
            node_type = node_data.get('nodeType', '')
            node_label = node_data.get('label', '')
            node_id = node.get('id', '')
            
            # Use same file detection logic
            common_extensions = {'.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.cs', '.php', '.rb', '.swift', '.kt', '.scala', '.clj', '.hs', '.ml', '.fs', '.vb', '.pl', '.sh', '.bat', '.ps1', '.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.md', '.txt', '.html', '.css', '.scss', '.sass', '.less', '.sql', '.r', '.m', '.mm', '.h', '.hpp', '.cc', '.cxx', '.f', '.f90', '.f95', '.pas', '.ada', '.d', '.nim', '.cr', '.ex', '.exs', '.elm', '.purs', '.res', '.rei'}
            
            has_file_extension = any(node_label.lower().endswith(ext) or node_id.lower().endswith(ext) for ext in common_extensions)
            
            is_file = (
                node_type == 'file' or
                (node_type != 'folder' and has_file_extension) or
                (node_type != 'folder' and '.' in node_label and not node_label.endswith('/')) or
                (node_type != 'folder' and '.' in node_id and not node_id.endswith('/'))
            )
            
            if is_file:
                file_name = node_label or node_id.split('/')[-1]
                if '.' in file_name:
                    ext = file_name.split('.')[-1]
                    file_types[ext] = file_types.get(ext, 0) + 1
        
        if file_types:
            structure_info += "File Types:\n"
            for ext, count in sorted(file_types.items(), key=lambda x: x[1], reverse=True):
                structure_info += f"- .{ext}: {count} files\n"
        
        # Get top-level directories
        top_level = []
        for node in nodes:
            node_data = node.get('data', {})
            node_type = node_data.get('nodeType', '')
            node_id = node.get('id', '')
            
            # Check if it's a folder (explicit or implicit)
            is_folder = (
                node_type == 'folder' or
                (node_type != 'file' and '.' not in node_data.get('label', '') and node_id.endswith('/')) or
                (node_type != 'file' and '/' in node_id and not any(node_data.get('label', '').endswith(ext) for ext in ['.js', '.jsx', '.py', '.md', '.json', '.txt', '.css', '.html']))
            )
            
            if is_folder and ('/' not in node_id or node_id.count('/') <= 1):
                top_level.append(node_data.get('label', node_id.split('/')[-1]))
        
        if top_level:
            structure_info += f"\nTop-level directories: {', '.join(top_level)}\n"
        
        # Create comprehensive prompt for Gemini
        prompt = f"""
You are an expert codebase analyst. You have been provided with the ACTUAL SOURCE CODE from a GitHub repository. Analyze the real code content below to answer the user's question with complete factual accuracy.

Repository URL: {repo_url}

{structure_info}

User Question: {question}

CRITICAL ANALYSIS REQUIREMENTS:
1. You have been given the ACTUAL SOURCE CODE content from multiple files
2. Analyze the real code, imports, dependencies, functions, and structure
3. Identify the EXACT technologies, frameworks, and libraries used based on the code
4. Explain what the code ACTUALLY does, not what it might do
5. Reference specific files, functions, and code patterns you can observe
6. If you see package.json, requirements.txt, or config files, use that dependency information
7. If you see React components, Python functions, or other code structures, describe them accurately
8. Be specific about the application's purpose based on the actual code logic
9. If you cannot determine something from the provided code, say "Based on the code provided, I cannot determine..."
10. Keep the response conversational but 100% factual based on the actual code
11. Limit to 2-3 paragraphs for voice synthesis

Answer based on the ACTUAL CODE CONTENT:
        """
        
        # Generate response using OpenAI GPT-4o or fallback to Gemini
        if not openai_client:
            print("❌ OPENAI_API_KEY not found - falling back to Gemini")
            # Fallback to Gemini if OpenAI key is not available
            response = model.generate_content(prompt)
            answer = response.text
        else:
            try:
                response = openai_client.chat.completions.create(
                    model="gpt-4o",  # Using GPT-4o as GPT-5 is not yet available
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert codebase analyst. Analyze the provided source code with complete factual accuracy. Only state facts you can directly observe from the code. Be specific about technologies, frameworks, and code patterns you can identify."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    max_tokens=1000,
                    temperature=0.3
                )
                
                answer = response.choices[0].message.content
                
            except Exception as e:
                print(f"❌ OpenAI API error: {str(e)}")
                print("🔄 Falling back to Gemini")
                # Fallback to Gemini if OpenAI fails
                response = model.generate_content(prompt)
                answer = response.text
        
        return {
            "question": question,
            "answer": answer,
            "repoUrl": repo_url,
            "context": {
                "totalNodes": len(nodes),
                "totalEdges": len(edges),
                "fileTypes": file_types,
                "topLevelDirs": top_level
            }
        }
        
    except Exception as e:
        print(f"❌ Error in codebase assistant: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze codebase: {str(e)}")

@app.post("/synthesize-voice")
def synthesize_voice(body: VoiceSynthesisBody):
    """
    Convert text to speech using ElevenLabs API
    """
    try:
        if not elevenlabs_api_key:
            raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
        
        text = body.text
        print(f"🔊 Synthesizing voice for text: {text[:100]}...")
        
        # Use ElevenLabs to generate speech using direct API call
        import requests as req
        
        # ElevenLabs API endpoint
        url = f"https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL"
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": elevenlabs_api_key
        }
        
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }
        
        response = req.post(url, json=data, headers=headers)
        
        if response.status_code != 200:
            raise Exception(f"ElevenLabs API error: {response.status_code} - {response.text}")
        
        audio_bytes = response.content
        
        # Convert audio to base64 for frontend
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        print(f"✅ Voice synthesis completed: {len(audio_bytes)} bytes")
        
        return {
            "audio_base64": audio_base64,
            "text": text,
            "voice": "Bella"
        }
        
    except Exception as e:
        print(f"❌ Error in voice synthesis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to synthesize voice: {str(e)}")