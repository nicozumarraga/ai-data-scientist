from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse
from typing import Dict, Any
import traceback
import json

from .config import config
from .models import AnalysisRequest, ExecuteCodeRequest, GenerateReportRequest
from .services.data_service import DataService, NpEncoder
from .services.llm_service import LLMService
from .services.plot_analysis_service import PlotAnalysisService
from .services.report_service import ReportService

app = FastAPI(title=config.APP_NAME)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
data_service = DataService()
plot_analysis_service = PlotAnalysisService()
llm_service = LLMService(data_service, plot_analysis_service)
report_service = ReportService(plot_analysis_service, data_service, llm_service)

@app.get("/", response_class=HTMLResponse)
async def root():
    """Root endpoint with API documentation"""
    return """
    <html>
        <head>
            <title>AI Data Scientist API</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 40px;
                    line-height: 1.6;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                }
                .endpoint {
                    background: #f4f4f4;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 5px;
                }
                h1, h2 { color: #333; }
                code {
                    background: #e0e0e0;
                    padding: 2px 5px;
                    border-radius: 3px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>AI Data Scientist API</h1>
                <p>Welcome to the AI Data Scientist API. Available endpoints:</p>

                <div class="endpoint">
                    <h2>POST /upload</h2>
                    <p>Upload a CSV file for analysis</p>
                    <code>curl -X POST -F "file=@data.csv" http://localhost:8000/upload</code>
                </div>

                <div class="endpoint">
                    <h2>POST /visualize</h2>
                    <p>Create visualizations from the uploaded data</p>
                    <code>curl -X POST -H "Content-Type: application/json" -d '{"viz_type": "scatter", "params": {...}}' http://localhost:8000/visualize</code>
                </div>

                <div class="endpoint">
                    <h2>GET /data/summary</h2>
                    <p>Get summary statistics of the current dataset</p>
                    <code>curl http://localhost:8000/data/summary</code>
                </div>

                <div class="endpoint">
                    <h2>GET /data/column/{column}</h2>
                    <p>Get detailed statistics for a specific column</p>
                    <code>curl http://localhost:8000/data/column/column_name</code>
                </div>

                <p>For complete API documentation, visit <a href="/docs">/docs</a></p>
            </div>
        </body>
    </html>
    """

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Handle file upload and initial analysis"""
    if not file.filename.endswith('.csv'):
        return JSONResponse(
            status_code=400,
            content={"error": "Please upload a CSV file"}
        )

    try:
        plot_analysis_service.clear_log()
        contents = await file.read()
        summary_stats = data_service.analyze_data(contents)
        llm_service.reset_namespace()

        return JSONResponse(
            content=json.loads(json.dumps(summary_stats, cls=NpEncoder)),
            status_code=200
        )

    except Exception as e:
        print("Error processing file:")
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e)
            }
        )

@app.post("/analyze")
async def analyze_data(request: AnalysisRequest):
    """Analyze data using LLM"""
    try:
        if not data_service.current_df is not None:
            raise HTTPException(400, "No data has been uploaded yet")

        # Get current data info
        df_info = data_service.get_summary_stats(data_service.current_df)

        # Call AI Data Scientist
        response = await llm_service.analyze(
            query=request.query,
            data_info=df_info,
            chat_history=request.chat_history
        )

        return {
            "analysis": response["analysis"],
            "code_blocks": response["code_blocks"]
        }

    except Exception as e:
        print(f"Error in analyze_data: {str(e)}")
        traceback.print_exc()
        raise HTTPException(500, f"Error analyzing data: {str(e)}")

@app.post("/execute")
async def execute_code(request: ExecuteCodeRequest):
    """Execute Python code and return visualization with analysis"""
    try:
        result = await llm_service.execute_code(request.code)

        if not result["success"]:
            raise HTTPException(500, result.get("error", "Code execution failed"))

        return {
            "success": True,
            "result": result["result"],
            "type": "visualization" if result["result"].get("plot") else "text"
        }
    except Exception as e:
        raise HTTPException(500, f"Error executing code: {str(e)}")

@app.post("/generate-report")
async def generate_report(request: GenerateReportRequest):
    try:
        if data_service.current_df is None:
            raise HTTPException(400, "No data has been analyzed yet")

        report = await report_service.generate_report(request.chat_history)

        if "pdf_path" in report:
            # Return PDF file
            return FileResponse(
                report["pdf_path"],
                media_type="application/pdf",
                filename="analysis_report.pdf"
            )
        else:
            return JSONResponse(
                content={
                    "success": False,
                    "error": "PDF generation failed"
                },
                status_code=500
            )

    except Exception as e:
        print(f"Error generating report: {str(e)}")
        traceback.print_exc()
        raise HTTPException(500, f"Error generating report: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
