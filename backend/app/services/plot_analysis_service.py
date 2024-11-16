from anthropic import Anthropic
import json
from typing import Dict, Any
from datetime import datetime
from pathlib import Path
from ..config import config

class PlotAnalysisService:
    def __init__(self):
        self.client = Anthropic(api_key=config.ANTHROPIC_API_KEY)
        # Create logs directory if it doesn't exist
        self.logs_dir = Path(__file__).parent.parent / 'logs'
        self.logs_dir.mkdir(exist_ok=True)
        self.analysis_log_path = self.logs_dir / 'analysis_log.json'

    async def analyze_plot(self, plot_base64: str, code: str) -> Dict[str, Any]:
        """Simple version for initial testing"""
        try:
            response = self.client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=config.MAX_TOKENS,
                temperature=config.TEMPERATURE,
                messages=[{
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": plot_base64
                            }
                        },
                        {
                            "type": "text",
                            "text":
"""Analyze this visualization as a data scientist and critic. Provide:

1. Title: Describe what the plot shows
2. Relevance Score (0-10):
   - 0-2: Poor visualization (wrong plot type, unreadable, missing labels)
   - 3-4: Basic plot with minimal insights
   - 5-6: Decent visualization with some insights
   - 7-8: Good visualization with clear patterns
   - 9-10: Exceptional visualization with crucial insights
3. Description: Describe for the next data scientist to read (max 200 words). What does it reveal and why is it relevant from a data scientist's perspective (such as patterns, significant differences, etc.)

Common issues that should reduce scores:
- Missing labels or titles
- Inappropriate plot type
- Overcrowded or sparse data
- Poor color choices
- Lack of clear patterns or insights
- Single-value histograms
- Uninformative correlations (<0.3)

Output ONLY valid JSON with keys: title, relevance, description

Example:
{
    "title": "Student Sleep Patterns by Day Type",
    "relevance": 4,
    "description": "Basic boxplot showing sleep duration differences between weekdays and weekends. While it shows slightly longer weekend sleep, the difference is minimal (0.5 hours) and lacks additional insights about sleep quality or patterns."
}
"""
                        }
                    ]
                }]
            )

            try:
                analysis = json.loads(response.content[0].text)

            except json.JSONDecodeError:
                text = response.content[0].text
                analysis = {
                    "title": "Analysis Parsing Error",
                    "relevance": 0,
                    "description": text
                }

            analysis["code"] = code
            analysis["timestamp"] = datetime.now().isoformat()
            self._log_analysis(analysis)

            return analysis

        except Exception as e:
            print(f"Error analyzing plot: {str(e)}")
            return {
                "title": "Error in analysis",
                "relevance": 0,
                "code": code,
                "description": f"Failed to analyze plot: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }

    async def log_statistical_analysis(self, description: str, code: str) -> Dict[str, Any]:
        """Log statistical analysis results"""
        analysis = {
            "title": "Statistical Analysis Results",
            "relevance": 9,
            "description": description,
            "code": code,
            "timestamp": datetime.now().isoformat()
        }

        self._log_analysis(analysis)
        return analysis

    def _log_analysis(self, analysis: Dict[str, Any]) -> None:
        """Simple logging to JSON file"""
        try:
            try:
                with open(self.analysis_log_path, 'r') as f:
                    log = json.load(f)
            except FileNotFoundError:
                log = []

            log.append(analysis)

            with open(self.analysis_log_path, 'w') as f:
                json.dump(log, f, indent=2)

        except Exception as e:
            print(f"Error logging analysis: {str(e)}")

    def clear_log(self) -> None:
        """Clear the analysis log file"""
        try:
            with open(self.analysis_log_path, 'w') as f:
                json.dump([], f)
            print(f"Analysis log cleared: {self.analysis_log_path}")
        except Exception as e:
            print(f"Error clearing analysis log: {str(e)}")
