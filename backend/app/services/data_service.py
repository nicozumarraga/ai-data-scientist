import pandas as pd
import numpy as np
from typing import Dict, Any
import io
import json
import traceback
import csv

class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if pd.isna(obj):
            return None
        return super(NpEncoder, self).default(obj)

class DataService:
    def __init__(self):
        self._current_df = None

    def clean_column_names(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean column names by removing unnecessary quotes and handling commas"""

        if len(df.columns) == 1 and ',' in df.columns[0]:
            new_columns = df.columns[0].replace('"', '').split(',')

            df = pd.DataFrame([
                row[0].replace('"', '').split(',')
                for row in df.values
            ], columns=new_columns)

            # Convert numeric columns
            for col in df.columns:
                try:
                    if not col in ['Entity', 'Code']:  # Keep these as strings
                        df[col] = pd.to_numeric(df[col], errors='coerce')
                except:
                    pass
        else:
            # Clean existing column names
            df.columns = df.columns.str.strip().str.replace('"', '').str.replace("'", "")

        return df

    def get_column_info(self, df: pd.DataFrame) -> Dict:
        """Get detailed information about each column"""
        column_info = {}
        for column in df.columns:
            info = {
                'dtype': str(df[column].dtype),
                'null_count': int(df[column].isnull().sum()),
                'total_count': len(df[column]),
                'null_percentage': round(df[column].isnull().sum() / len(df[column]) * 100, 2)
            }

            if pd.api.types.is_numeric_dtype(df[column]):
                not_null_series = df[column].dropna()
                if not not_null_series.empty:
                    info.update({
                        'mean': float(not_null_series.mean()),
                        'median': float(not_null_series.median()),
                        'std': float(not_null_series.std()),
                        'min': float(not_null_series.min()),
                        'max': float(not_null_series.max())
                    })
            else:
                not_null_series = df[column].dropna()
                info.update({
                    'unique_count': len(not_null_series.unique()),
                    'top_values': not_null_series.value_counts().head(5).to_dict()
                })

            column_info[column] = info

        return column_info

    def get_summary_stats(self, df: pd.DataFrame) -> Dict:
        """Generate initial summary statistics"""
        return {
            'total_rows': len(df),
            'total_columns': len(df.columns),
            'total_cells': df.size,
            'missing_cells': df.isnull().sum().sum(),
            'missing_percentage': round(df.isnull().sum().sum() / df.size * 100, 2),
            'duplicate_rows': df.duplicated().sum(),
            'column_info': self.get_column_info(df),
            'columns': df.columns.tolist(),
            'sample_rows': df.head().replace({np.nan: None}).to_dict(orient='records')
        }

    def analyze_data(self, contents: bytes) -> Dict[str, Any]:
        """Analyze uploaded data file"""
        try:
            # Decode content
            text_content = contents.decode("UTF8")
            print("Raw content first line:", text_content.split('\n')[0])

            # Try different parsing approaches
            try:
                # First attempt: standard read_csv
                df = pd.read_csv(io.StringIO(text_content))
            except:
                try:
                    # Second attempt: with explicit separator
                    df = pd.read_csv(io.StringIO(text_content), sep=',', quotechar='"', escapechar='\\')
                except:
                    # Last attempt: read as single column and split
                    df = pd.read_csv(io.StringIO(text_content), header=0)

            # Clean up the column names and data
            df = self.clean_column_names(df)

            # Store the dataframe
            self._current_df = df

            # Print debug information
            print("Final columns:", df.columns.tolist())
            print("Sample data:\n", df.head())

            return self.get_summary_stats(df)

        except Exception as e:
            traceback.print_exc()
            raise ValueError(f"Error analyzing data: {str(e)}")

    @property
    def current_df(self):
        if self._current_df is None:
            raise ValueError("No data has been loaded")
        return self._current_df
