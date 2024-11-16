from anthropic import Anthropic
from typing import Dict, Any, List, Optional
import json
import re
from ..config import config
from ..models import ChatMessage
from .data_service import NpEncoder
import traceback

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import io
import base64

class LLMService:
    def __init__(self, data_service, plot_analysis_service):
        self.data_service = data_service
        self.plot_analysis_service = plot_analysis_service
        self.client = Anthropic(api_key=config.ANTHROPIC_API_KEY)
        self.model = config.MODEL_NAME

        self.namespace = {
            'pd': pd,
            'plt': plt,
            'sns': sns,
            'np': np,
            '__builtins__': __builtins__,
        }

    def reset_namespace(self):
        """Reset namespace when new data is loaded"""
        try:
            df = self.data_service.current_df.copy()
            self.namespace = {
                'pd': pd,
                'plt': plt,
                'sns': sns,
                'np': np,
                'df': df,
                '__builtins__': __builtins__,
            }
        except ValueError:
            self.namespace = {
                'pd': pd,
                'plt': plt,
                'sns': sns,
                'np': np,
                '__builtins__': __builtins__,
            }

        if hasattr(self.data_service, '_current_df') and self.data_service._current_df is not None:
            self.namespace['df'] = self.data_service.current_df.copy()

    def _create_system_prompt(self, data_info: Dict[str, Any]) -> str:
        try:
            with open(self.plot_analysis_service.analysis_log_path, 'r') as f:
                analysis_log = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            analysis_log = []

        previous_analyses = ""
        if analysis_log:
            previous_analyses = "\nPrevious visualization analyses:\n"
            for analysis in analysis_log[-10:]:
                previous_analyses += f"""
- {analysis['title']} (Relevance: {analysis['relevance']}/10)
  {analysis['description']}
"""

        return f"""You are a seasoned AI Data Scientist analyzing a dataset with the following properties:
Dataset Information:
{json.dumps(data_info, cls=NpEncoder, indent=2)}

{previous_analyses}

Important Instructions:
1. The DataFrame is already loaded as 'df'
2. Treat each code block as INDEPENDENT. Do not assume previous variables YOU create exist.
    - Example: You create a visualization using a new variables Z_types.
    - Mistake to avoid: referencing Z_types in a later visualization.
    - rule to follow: create the variables you need for each new plot.

3. When analyzing data, use the metadata from previous visualizations to inform your analysis:
   - Build upon statistical insights from previous visualizations
   - Use the metadata to identify relationships between different visualizations
   - Compare new findings with previous statistical observations
4. Generate separate code blocks for each visualization
5. Use matplotlib and seaborn for visualizations
6. Use the most updated code documentation for APIs like sklearn, matplotlib (example: using sparse_output parameter instead of sparse in OneHotEncoder)
7. When printing model fitting results, explicitely reference the model that acheived these results.
6. For each plot:
   - Use proper figure sizing
   - Add clear labels and titles
   - End with plt.show()
7. When previous visualizations are relevant:
   - Explicitly mention the statistical findings (e.g., "The previous analysis showed a mean value of X...")
   - Reference specific trends (e.g., "Building on the increasing trend we observed...")
   - Connect insights across visualizations

Example of good code:
```python
plt.figure(figsize=(12, 6))
plt.plot(df['Year'], df['column_name'])
plt.title('Time Series Analysis')
plt.xlabel('Year')
plt.ylabel('Values')
plt.show()
```

You text response should be concise and complementary to the plots, not simply repeat what the plots already say. In most cases, let the visuals speak for themselves and
add commentary when needed.

Bad practices to avoid:
- Do not create multiple figures in one code block
- Do not use fig.show()
- Do not create more than four plots.
- Do not add code after the return statement
- Do not create sample, dummy data or a new dataframe under any circumstance.

Now listen to the user's query and answer considering all the previous requirements.
"""

    def _clean_code_block(self, code: str) -> str:
        """Clean a code block to ensure it works with matplotlib while preserving indentation"""

        code = code.replace('\r\n', '\n')
        lines = code.split('\n')

        # Remove any common leading indentation while preserving relative indentation
        if lines:
            # Find minimum indentation (excluding empty lines)
            non_empty_lines = [line for line in lines if line.strip()]
            if non_empty_lines:
                min_indent = min(len(line) - len(line.lstrip()) for line in non_empty_lines)
                # Remove only the common indentation
                lines = [line[min_indent:] if line.strip() else line for line in lines]

        imports = [
            'import pandas as pd',
            'import matplotlib.pyplot as plt',
            'import seaborn as sns',
            'import numpy as np',
            ''
        ]

        has_imports = any(line.startswith('import') for line in lines)
        if not has_imports:
            lines = imports + lines

        code = '\n'.join(lines)

        if 'plt.figure' in code and not code.strip().endswith('plt.show()'):
            code = code.rstrip() + '\n\nplt.show()'

        code = code.replace(';', '')
        code = re.sub(r'\n\s*\n\s*\n', '\n\n', code)

        return code.strip()

    def _clean_analysis_text(self, text: str) -> str:
        """Remove code blocks from analysis text and clean up"""

        text = re.sub(r'```python.*?```', '', text, flags=re.DOTALL)
        text = re.sub(r'\n\s*\n+', '\n\n', text)
        text = re.sub(r'Here\'s the code:?\s*\n?', '', text)
        text = re.sub(r'Here\'s how to create.*?\n', '', text)
        return text.strip()

    def _extract_code_blocks(self, text: str) -> List[str]:
        """Extract Python code blocks and split into separate plot sections"""
        pattern = r'```python\n(.*?)\n```'
        matches = re.findall(pattern, text, re.DOTALL)

        cleaned_blocks = []
        for match in matches:
            # Split on comments that start new sections
            sections = re.split(r'\n# \d+\.|\n# Visualization \d+:', match)

            for section in sections:
                if section.strip():
                    cleaned_code = self._clean_code_block(section)
                    if cleaned_code:
                        cleaned_blocks.append(cleaned_code)

        return cleaned_blocks

    async def analyze(self, query: str, data_info: Dict[str, Any], chat_history: Optional[List[ChatMessage]] = None) -> Dict[str, Any]:
        """Analyze data based on user query and chat history"""
        try:
            messages = []

            if chat_history:
                for msg in chat_history:
                    if isinstance(msg.content, str):

                        messages.append({
                            "role": "user",
                            "content": msg.content
                        })
                    elif isinstance(msg.content, dict) and 'analysis' in msg.content:

                        messages.append({
                            "role": "assistant",
                            "content": msg.content['analysis']
                        })

            response = self.client.messages.create(
                model=self.model,
                system=self._create_system_prompt(data_info),
                messages=messages,
                max_tokens=config.MAX_TOKENS,
                temperature=config.TEMPERATURE
            )

            analysis_text = response.content[0].text
            clean_analysis = self._clean_analysis_text(analysis_text)
            code_blocks = self._extract_code_blocks(analysis_text)

            return {
                "analysis": clean_analysis,
                "code_blocks": code_blocks
            }

        except Exception as e:
            print(f"LLM Error: {str(e)}")
            traceback.print_exc()
            raise Exception(f"Error in LLM analysis: {str(e)}")

    async def execute_code(self, code: str, plot_path: str = None) -> Dict[str, Any]:
        """Execute code and capture plots properly"""
        try:
            plt.close('all')

            output_buffer = []
            def custom_print(*args, **kwargs):
                output_buffer.append(' '.join(map(str, args)))

            self.namespace['print'] = custom_print
            code = code.replace('plt.show()', '')

            exec(code, self.namespace)

            # Log statistical output if present
            output_text = '\n'.join(output_buffer) if output_buffer else ''
            if output_text and any(metric in output_text.lower() for metric in ['r-squared', 'mse', 'error', 'score', 'accuracy, MSE, Mean Squared Error, RMSE, R-squared Score, R, Mean, f, t, F']):
                await self.plot_analysis_service.log_statistical_analysis(output_text, code)

            # Capture and analyze the plot if exists
            if plt.get_fignums():
                if plot_path:
                    plt.savefig(plot_path, bbox_inches="tight", dpi=300)
                    plt.close('all')

                    return {"success": True}

                else:
                    buf = io.BytesIO()
                    plt.savefig(buf, format='png', bbox_inches='tight', dpi=100)
                    buf.seek(0)
                    plot_data = base64.b64encode(buf.getvalue()).decode('utf-8')
                    plt.close('all')

                    # Get plot analysis
                    plot_analysis = await self.plot_analysis_service.analyze_plot(plot_data, code)

                    return {
                        "success": True,
                        "result": {
                            "plot": plot_data,
                            "text_output": '\n'.join(output_buffer) if output_buffer else None,
                            "analysis": plot_analysis
                        },
                        "error": None
                    }
            else:
                return {
                    "success": True,
                    "result": {
                        "text_output": '\n'.join(output_buffer) if output_buffer else None
                    },
                    "error": None
                }

        except Exception as e:
            print(f"Code execution error: {str(e)}")
            traceback.print_exc()
            plt.close('all')
            return {
                "success": False,
                "result": None,
                "error": str(e)
            }
