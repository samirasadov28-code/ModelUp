# Source Models

Place the Excel source files here before running the service:

| File | Used for |
|------|----------|
| `StartUp Model.xlsx` | SaaS / subscription businesses |
| `StartUp Model Alternative.xlsx` | Marketplace / service / physical+tech |
| `Generic PF.xlsb` | Cleantech / infrastructure / project finance (read as reference; output is .xlsx) |

These files are **not committed to git** (see .gitignore) because they are proprietary source models.

## Running the service locally

```bash
cd excel-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Deploying to Railway

1. Push the `excel-service/` folder as a separate service
2. Add `source_models/` as a volume mount or upload files via Railway's file system
3. Set `PYTHON_SERVICE_URL` in Netlify to your Railway service URL

## Deploying to Fly.io

```bash
cd excel-service
flyctl launch
flyctl volumes create modelup_models --size 1
flyctl deploy
```
