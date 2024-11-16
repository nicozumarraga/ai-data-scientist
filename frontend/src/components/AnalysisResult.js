import React, { useState, useEffect } from 'react';
import { CodeBlock } from './CodeBlock';
import { ChevronRight, ChevronDown } from 'lucide-react';

export const AnalysisResult = ({ result, chatHistory, setChatHistory }) => {
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visibleBlocks, setVisibleBlocks] = useState({});

  useEffect(() => {
    const execute = async () => {
      if (result?.code_blocks?.length > 0) {
        await executeAllCode();
        setVisibleBlocks({});
      }
    };
    execute();
  }, [result, executeAllCode]);


  useEffect(() => {
    if (outputs.length > 0 && chatHistory?.length > 0) {
      setChatHistory(prev => prev.map((msg, index) => {
        if (index === prev.length - 1 && msg.type === 'response') {
          return {
            ...msg,
            content: msg.content,
            outputs: outputs
          };
        }
        return msg;
      }));
    }
  }, [outputs, setChatHistory]);

  const toggleCodeBlock = (index) => {
    setVisibleBlocks(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const executeAllCode = async () => {
    setLoading(true);
    setError(null);
    const newOutputs = [];

    try {
      for (const code of result.code_blocks) {
        const response = await fetch('http://localhost:8000/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error('Failed to execute code');
        }

        const data = await response.json();
        newOutputs.push({
          code,
          ...data.result,
        });
      }
      setOutputs(newOutputs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Analysis Text */}
      <div className="prose prose-invert max-w-none">
        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
          {result.analysis}
        </div>
      </div>

      {/* Code Blocks*/}
      {result.code_blocks?.map((code, index) => {
        const output = outputs[index];
        const isVisible = visibleBlocks[index] || false;

        return (
          <div key={index} className="space-y-4">
            {/* Code Toggle Button */}
            <button
              onClick={() => toggleCodeBlock(index)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              {isVisible ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              {isVisible ? 'Hide Code' : 'Show Code'}
            </button>

            {/* Code Block - Collapsible */}
            {isVisible && <CodeBlock code={code} />}

            {/* Output - Always Visible */}
            {output && (output.plot || output.text_output) && (
              <div className="bg-dark-surface rounded-lg shadow-lg p-6 border border-dark-border/10">
                {output.plot && (
                  <img
                    src={`data:image/png;base64,${output.plot}`}
                    alt={`Visualization ${index + 1}`}
                    className="w-full h-auto rounded-lg max-h-[600px] object-contain"
                  />
                )}
                {output.text_output && (
                  <div className="bg-black/30 rounded-lg p-4 mt-4">
                    <pre className="text-gray-300 text-sm font-mono whitespace-pre-wrap">
                      {output.text_output}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dark-accent"></div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r">
          <p className="text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};
