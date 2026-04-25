"""
ModelUp Excel Microservice
FastAPI service that injects questionnaire answers into source Excel models
and streams back the populated .xlsx file.

Usage:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

Place source Excel files in excel-service/source_models/:
    - StartUp Model.xlsx
    - StartUp Model Alternative.xlsx
    - Generic PF.xlsb  (read-only reference; output always .xlsx)
"""

import os
import tempfile
from typing import Any, Dict, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from models.injector import inject_answers


app = FastAPI(title="ModelUp Excel Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    answers: Dict[str, Any]
    model_type: Literal["saas", "alternative", "project_finance"] = "saas"


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ModelUp Excel Service"}


@app.post("/generate")
async def generate_excel(req: GenerateRequest):
    """
    Inject questionnaire answers into the appropriate source model
    and return the populated .xlsx file as a binary stream.
    """
    tmp_path: str | None = None
    try:
        tmp_path = inject_answers(req.answers, req.model_type)

        company = req.answers.get("companyName", "Model")
        filename = f"ModelUp_{company}_{req.model_type}.xlsx"

        # FileResponse streams the file; background cleanup handled below
        return FileResponse(
            path=tmp_path,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename=filename,
            background=_CleanupTask(tmp_path),
        )

    except FileNotFoundError as e:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise HTTPException(status_code=404, detail=str(e))

    except Exception as e:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise HTTPException(status_code=500, detail=f"Excel generation failed: {e}")


class _CleanupTask:
    """Background task to delete the temp file after the response is sent."""
    def __init__(self, path: str):
        self.path = path

    async def __call__(self):
        try:
            if os.path.exists(self.path):
                os.unlink(self.path)
        except Exception:
            pass
