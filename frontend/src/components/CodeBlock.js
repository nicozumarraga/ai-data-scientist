import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Play, Check } from 'lucide-react';

export const CodeBlock = ({ code, onExecute, isExecuting, error }) => {
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleExecute = async () => {
    try {
      const response = await fetch('http://localhost:8000/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Code execution failed');
      }

      setResult(data.result);
    } catch (err) {
      console.error('Execution error:', err);
      setResult({ error: err.message });
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg overflow-hidden border border-gray-700">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#1E1E1E] border-b border-gray-700">
          <span className="text-sm text-gray-400">Python</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 text-sm text-gray-400
                       hover:text-gray-200 transition-colors rounded"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Code content */}
        <div className="text-sm">
          <SyntaxHighlighter
            language="python"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '1rem',
              background: '#1E1E1E',
              fontSize: '0.875rem',
              lineHeight: '1.5',
            }}
            showLineNumbers={true}
            wrapLongLines={true}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="rounded-lg overflow-hidden border border-gray-700">
          {result.error ? (
            // Error Display
            <div className="bg-red-900/20 border-l-4 border-red-500 p-4">
              <p className="text-red-400">Error: {result.error}</p>
            </div>
          ) : (
            <div className="bg-[#1E1E1E] p-4">
              {/* Plot Display */}
              {result.plot && (
                <img
                  src={`data:image/png;base64,${result.plot}`}
                  alt="Data visualization"
                  className="w-full h-auto rounded-lg"
                />
              )}
              {/* Text Output Display */}
              {result.text_output && (
                <pre className="mt-4 text-gray-200 whitespace-pre-wrap font-mono text-sm">
                  {result.text_output}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
