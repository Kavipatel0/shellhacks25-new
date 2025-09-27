/**
 * API service for file summarization
 */

const API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:8000"
  : "https://shellhacks25-uy86.vercel.app"; // Update this to match your backend URL

/**
 * Summarize a file using the backend API
 * @param {string} filePath - The GitHub file path (e.g., "owner/repo/branch/path/to/file.js")
 * @param {string} fileName - The name of the file
 * @param {string} fileType - The type/extension of the file
 * @returns {Promise<Object>} The file summary response
 */
export async function summarizeFile(filePath, fileName, fileType) {
  try {
    const response = await fetch(`${API_BASE_URL}/summarize-file`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filePath,
        fileName,
        fileType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error summarizing file:", error);
    throw error;
  }
}

/**
 * Get file type from file name
 * @param {string} fileName - The file name
 * @returns {string} The file type/extension
 */
export function getFileType(fileName) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const typeMap = {
    js: "JavaScript",
    jsx: "React JSX",
    ts: "TypeScript",
    tsx: "React TypeScript",
    py: "Python",
    java: "Java",
    cpp: "C++",
    c: "C",
    css: "CSS",
    html: "HTML",
    json: "JSON",
    md: "Markdown",
    yml: "YAML",
    yaml: "YAML",
    xml: "XML",
    php: "PHP",
    rb: "Ruby",
    go: "Go",
    rs: "Rust",
    swift: "Swift",
    kt: "Kotlin",
    scala: "Scala",
    sh: "Shell Script",
    sql: "SQL",
    dockerfile: "Docker",
  };

  return typeMap[extension] || extension?.toUpperCase() || "Unknown";
}
