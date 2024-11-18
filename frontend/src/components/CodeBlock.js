import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

export const CodeBlock = ({ code }) => {  // Remove unused props
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
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
  );
};
