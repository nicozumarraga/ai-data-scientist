import React, { useState } from 'react';

export const DataSummary = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data) return null;

  const columns = data.columns || [];
  const columnInfo = data.column_info || {};
  const sampleRows = data.sample_rows || [];
  const totalRows = data.total_rows || 0;
  const totalColumns = data.total_columns || 0;
  const missingCells = data.missing_cells || 0;
  const missingPercentage = data.missing_percentage || 0;

  return (
    <div className="space-y-4">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-light-accent">Dataset Overview</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-1 rounded-md bg-dark-tertiary/50
                     hover:bg-dark-tertiary/70 transition-colors text-sm text-gray-200"
        >
          {isExpanded ? (
            <>
              <span>Show Less</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </>
          ) : (
            <>
              <span>Show More</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Basic Stats - Always Visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-dark-tertiary/50 p-2 rounded">
          <p className="text-sm text-gray-300">Rows</p>
          <p className="text-lg font-semibold text-light-accent">{totalRows}</p>
        </div>
        <div className="bg-dark-tertiary/50 p-2 rounded">
          <p className="text-sm text-gray-300">Columns</p>
          <p className="text-lg font-semibold text-light-accent">{totalColumns}</p>
        </div>
        <div className="bg-dark-tertiary/50 p-2 rounded">
          <p className="text-sm text-gray-300">Missing</p>
          <p className="text-lg font-semibold text-light-accent">{missingCells}</p>
        </div>
        <div className="bg-dark-tertiary/50 p-2 rounded">
          <p className="text-sm text-gray-300">Missing %</p>
          <p className="text-lg font-semibold text-light-accent">{missingPercentage.toFixed(2)}%</p>
        </div>
      </div>

      {/* Detailed Information - Toggleable */}
      {isExpanded && (
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {/* Column Information */}
          <div className="bg-dark-tertiary/30 rounded p-3">
            <h4 className="text-sm font-semibold text-light-accent mb-2">
              Columns ({columns.length})
            </h4>
            <div className="space-y-1 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-dark-tertiary scrollbar-track-transparent">
              {columns.map((column) => {
                const info = columnInfo[column] || {};
                return (
                  <div key={column} className="text-sm bg-dark-tertiary/20 p-2 rounded">
                    <p className="font-medium text-gray-200">{column}</p>
                    <div className="text-xs text-gray-400 mt-1">
                      <span className="inline-block">Type: {info.dtype || 'Unknown'}</span>
                      {info.null_count > 0 && (
                        <span className="inline-block ml-2">
                          Missing: {info.null_percentage?.toFixed(1)}%
                        </span>
                      )}
                      {info.unique_count !== undefined && (
                        <span className="inline-block ml-2">
                          Unique: {info.unique_count}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sample Data */}
          <div className="bg-dark-tertiary/30 rounded p-3">
            <h4 className="text-sm font-semibold text-light-accent mb-2">
              Sample Data
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-dark-tertiary/50">
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column}
                        className="px-2 py-1 text-left text-xs font-medium text-gray-400"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-tertiary/50">
                  {sampleRows.slice(0, 3).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {columns.map((column) => (
                        <td
                          key={`${rowIndex}-${column}`}
                          className="px-2 py-1 text-xs text-gray-300 whitespace-nowrap"
                        >
                          {row[column]?.toString() || 'null'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
