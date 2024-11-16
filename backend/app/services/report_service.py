from anthropic import Anthropic
import json
from typing import Dict, Any, List
from datetime import datetime
from pathlib import Path
from ..config import config
import subprocess
import re

class ReportService:
    def __init__(self, plot_analysis_service, data_service, llm_service):
        self.client = Anthropic(api_key=config.ANTHROPIC_API_KEY)
        self.plot_analysis_service = plot_analysis_service
        self.template_path = Path(__file__).parent.parent / 'templates' / 'report_template.tex'
        self.reports_dir = Path(__file__).parent.parent / 'reports'
        self.reports_dir.mkdir(exist_ok=True)
        self.data_service = data_service
        self.llm_service = llm_service

    def _create_system_prompt(self) -> str:
        return """You are an expert data analyst tasked with creating a LaTeX report from a data analysis session.
Your job is to:
1. Review the entire analysis history
2. Create a professional LaTeX report with proper sections
3. Include the Python code blocks that generated important visualizations
4. Focus on actionable insights and clear communication

Important LaTeX guidelines:
- Use standard article class with graphicx and listings packages
- Put Python code in verbatim environments
- Each visualization code should be included and properly commented
- Use section headers for organization
- Reference figures using \includegraphics
- Code blocks should be directly executable to generate the plots

IMPORTANT: Output ONLY an executable latex code that will be executed directly by the next step in the process.

Your job is to:
1. Review the analysis history and extract key insights
2. Create a professional LaTeX report following the template structure
3. Include only the most relevant code blocks and visualizations
4. Focus on actionable insights and clear communication
Write ONLY the Latex code. Do not introduce it as it will create errors in rendering.

Important LaTeX formatting:
1. For code blocks, use:
\\\\beginlstlisting[language=Python]
# Your code here
\\\\endlstlisting

2. For figures, use:
\\\\beginfigure[H]
\\\\centering
\\\\includegraphics{"Visualization_Title.png}
\\\\captionDescriptive caption here
\\\\labelfig:visualization_title
\\\\endfigure

Example:
If visualization title is "Correlation Heatmap: Analysis", use:
\\\\includegraphics{Correlation_Heatmap:_Analysis.png}

EXCEPTION: If title is "Statistical Analysis Results", do not try to plot it. Simply reference the modelling results in your report.

3. When referencing figures, use \\\\ref{fig:calories_by_workout}

Key sections to fill:
- Executive Summary: Brief overview of key findings
- Data Overview: Description of dataset and variables
- Methodology: Explanation of analysis approach
- Analysis and Findings: Detailed results with visualizations
- Conclusions: Clear, actionable recommendations

Remember:
- Keep code blocks clean and well-commented
- Ensure all figures have descriptive captions
- Maintain professional language throughout
- Focus on insights rather than just descriptions
- Make recommendations specific and actionable

Keep in mind:
- Be concise but thorough
- Connect different insights to tell a coherent story
- Include specific numbers and statistics
- Make clear recommendations based on the findings"""

    async def generate_report(self, chat_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate a complete LaTeX report"""
        try:
            # Process chat history to extract essential information
            processed_history = []
            for message in chat_history:
                if message.get('type') == 'response':
                    entry = {
                        'analysis': message['content']['analysis'],
                        'code_blocks': message['content'].get('code_blocks', []),
                        'visualizations': []
                    }

                    if 'outputs' in message:
                        for output in message['outputs']:
                            if 'analysis' in output and output['analysis'].get('relevance', 0) >= 3:
                                # Only keep analysis metadata, skip redundant code and plot data
                                viz = {
                                    'title': output['analysis']['title'],
                                    'description': output['analysis']['description'],
                                    'relevance': output['analysis']['relevance']
                                }
                                entry['visualizations'].append(viz)

                    processed_history.append(entry)

            analysis_log = []
            try:
                with open(self.plot_analysis_service.analysis_log_path, 'r') as f:
                    analysis_log = json.load(f)
            except FileNotFoundError:
                print("No analysis log found, continuing with empty log")

            # Read LaTeX template
            with open(self.template_path, 'r') as f:
                template = f.read()

            prompt = f"""Generate a comprehensive LaTeX report using this template:

{template}

Based on this analysis log:
Available Visualizations:
{json.dumps([{
    'title': analysis['title'],
    'description': analysis['description'],
    'relevance': analysis['relevance']
} for analysis in analysis_log], indent=2)}

When referencing plots in your LaTeX document, use the title with underscores instead of spaces.
For example: If the title is "Correlation Heatmap: Factors Related to Calories Burned",
use: \\\\includegraphics{{Correlation_Heatmap:_Factors_Related_to_Calories_Burned.png}}

Generate a coherent report focusing on the most relevant visualizations for your analysis.
"""

            print(prompt)

            # Get report content
            response = self.client.messages.create(
                model=config.MODEL_NAME,
                max_tokens=4096,
                temperature=config.TEMPERATURE,
                system=self._create_system_prompt(),
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            report_content = response.content[0].text

            # Create timestamped directory
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            report_dir = self.reports_dir / f"report_{timestamp}"
            report_dir.mkdir(exist_ok=True)

            # Extract referenced plot titles
            referenced_plots = re.findall(r'\\includegraphics{\"?(.*?)\.png\"?}', report_content)
            print(f"Referenced plots in LaTeX: {referenced_plots}")

            for ref_title in referenced_plots:
                clean_ref = ref_title.replace('"', '').replace(' ', '_')

                for analysis in analysis_log:
                    if analysis['title'].replace(' ', '_') == clean_ref:
                        found_match = True

                        plot_path = report_dir / f"{clean_ref}.png"
                        result = await self.llm_service.execute_code(analysis['code'], str(plot_path))
                        if result["success"]:
                            print(f"Successfully generated plot at: {plot_path}")

                            if plot_path.exists():
                                print(f"File exists at: {plot_path}")
                            else:
                                print(f"WARNING: File not found at: {plot_path}")
                        else:
                            print(f"Error generating plot {clean_ref}: {result.get('error')}")
                        break

            # Compile LaTeX
            report_path = report_dir / "report.tex"
            with open(report_path, 'w') as f:
                f.write(report_content)

            try:
                process = subprocess.run([
                    'pdflatex',
                    '-interaction=nonstopmode',
                    'report.tex'
                ],
                cwd=str(report_dir),
                capture_output=True,
                text=True
                )

                if process.returncode != 0:
                    print("LaTeX Compilation Error:")
                    print(process.stdout)
                    print(process.stderr)
                    raise Exception(f"PDF compilation failed: {process.stderr}")

                # Run twice
                subprocess.run([
                    'pdflatex',
                    '-interaction=nonstopmode',
                    'report.tex'
                ],
                cwd=str(report_dir),
                check=True
                )

                pdf_path = report_dir / "report.pdf"
                if pdf_path.exists():
                    return {
                        "content": report_content,
                        "path": str(report_path),
                        "pdf_path": str(pdf_path)
                    }
                else:
                    raise Exception("PDF file not created")

            except subprocess.CalledProcessError as e:
                print(f"LaTeX compilation error: {e}")
                raise Exception("PDF compilation failed")

        except Exception as e:
            print(f"Error generating report: {str(e)}")
            raise
