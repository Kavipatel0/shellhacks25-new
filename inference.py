code = open('./test.js', 'r')

from openai import OpenAI
from fastapi import FastAPI
from pydantic import BaseModel
import requests

app = FastAPI()

client = OpenAI()
class InferenceBody(BaseModel):
    filePath: str

baseURL = "https://raw.githubusercontent.com/"

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/infer")
def read_root(body: InferenceBody):
    # body.filePath must be in this format "hieunguyent12/shellhacks25/refs/heads/main/app/src/components/FlowGraph.jsx"
    response = requests.get(baseURL + body.filePath)
    code = response.text

    response = client.responses.create(
        model="gpt-5-mini",
        input=[{"role": "system", "content": "You are a helpful assistant that summarizes code files in context of a project."},
                {"role": "user", "content": f"""
            File code: {code}
            Summarize what this file does in 2–3 sentences.
            """}],
        max_output_tokens=5000
    )

    return {"response": response}