import React, { useState, useRef, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { DataSummary } from './components/DataSummary';
import { QueryInput } from './components/QueryInput';
import { AnalysisResult } from './components/AnalysisResult';
import { Upload } from 'lucide-react';
import { ReportButton } from './components/ReportButton';

const App = () => {
  const [data, setData] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const contentRef = useRef(null);

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        setIsScrolled(contentRef.current.scrollTop > 20);
      }
    };

    const currentRef = contentRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
      return () => currentRef.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Smooth scroll when new content is added
  useEffect(() => {
    if (contentRef.current) {
      const currentScroll = contentRef.current.scrollTop;
      const targetScroll = Math.min(
        currentScroll + 300,
        contentRef.current.scrollHeight - contentRef.current.clientHeight
      );

      contentRef.current.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    }
  }, [chatHistory]);

  const formatChatHistory = (history) => {

    const recentHistory = history.slice(-10);

    return recentHistory.map(msg => {
      if (msg.type === 'query') {
        return {
          role: 'user',
          content: msg.content
        };
      } else if (msg.type === 'response') {
        // Build a comprehensive context including analysis, code, and metadata
        const parts = [];

        // Add the analysis
        parts.push(msg.content.analysis);

        // Add the generated code blocks
        if (msg.content.code_blocks?.length > 0) {
          parts.push('\nPrevious code generated:');
          msg.content.code_blocks.forEach((code, index) => {
            parts.push(`\nCode Block ${index + 1}:\n${code}`);
          });
        }

        // Add visualization metadata and insights
        if (msg.outputs?.length > 0) {
          parts.push('\nPrevious visualization insights:');
          msg.outputs.forEach((output, index) => {
            if (output.metadata?.summary) {
              parts.push(`\nVisualization ${index + 1} Analysis:\n${output.metadata.summary}`);
            }
          });
        }

        return {
          role: 'assistant',
          content: parts.join('\n')
        };
      }
      return null;
    }).filter(Boolean);
  };

  const handleFileUpload = async (result) => {
    try {
      setLoading(true);
      setError(null);
      setData(result);
      setChatHistory([{
        type: 'dataSummary',
        content: result
      }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuery = async (query) => {
    try {
      setLoading(true);
      setError(null);

      const newChatHistory = [...chatHistory, {
        type: 'query',
        content: query
      }];
      setChatHistory(newChatHistory);

      const formattedHistory = formatChatHistory(newChatHistory);

      const response = await fetch(`${process.env.VITE_API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          chat_history: formattedHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();

      setChatHistory(prev => [...prev, {
        type: 'response',
        content: {
          analysis: result.analysis,
          code_blocks: result.code_blocks
        },
        outputs: [],
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      setError(err.message);
      setChatHistory(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto bg-dark-bg text-text-primary"
      >
        {/* Header Section - Three states: centered, top, left */}
        <div className={`transition-all duration-500 ease-in-out
                      ${!data
                        ? 'pt-[20vh] mb-8' // Initial centered state
                        : 'sticky top-0 z-50 py-8' // Sticky header when data exists
                      }`}
        >
          <div className={`transition-all duration-500 ease-in-out
                        ${!data
                          ? 'text-center' // Centered initially
                          : isScrolled
                            ? 'pl-6 text-left' // Left aligned when scrolled
                            : 'text-center' // Centered at top when data exists but not scrolled
                        }`}>
            <h1 className={`font-bold text-text-accent transition-all duration-500 ease-in-out
                         ${!data
                            ? 'text-4xl mb-4' // Large when centered
                            : isScrolled
                              ? 'text-xl mb-0' // Smallest when scrolled
                              : 'text-3xl mb-0' // Medium when at top
                         }`}
                onClick={() => {
                  if (contentRef.current) {
                    contentRef.current.scrollTo({
                      top: 0, // Scroll to the top of the container
                      behavior: 'smooth', // Smooth scrolling
                    });
                  }
                }}
                style={{ cursor: 'pointer' }} // Make the header visually clickable
                >
              AI Data Scientist
            </h1>
            {!data && (
              <p className="text-text-secondary text-lg animate-fade-in">
                Upload your data and get AI-powered analysis
              </p>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="px-4 pb-6 space-y-6">
          <div className="max-w-5xl mx-auto w-full">
            {/* File Upload Section - Only shown when no data */}
            {!data && (
              <div className="max-w-xl mx-auto">
                <div className="bg-dark-muted rounded-lg shadow-lg p-8 border border-dark-border/10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-dark-accent/10 rounded">
                      <Upload className="w-5 h-5 text-dark-accent" />
                    </div>
                    <h2 className="text-xl font-semibold text-text-primary">
                      Upload Your Data
                    </h2>
                  </div>
                  <FileUpload onUpload={handleFileUpload} />
                </div>
              </div>
            )}

            {/* Chat History */}
            {chatHistory.map((item, index) => (
              <div key={index} className="space-y-8">
                {item.type === 'dataSummary' && (
                  <div className="bg-dark-muted rounded-lg shadow-lg p-6 border border-dark-border/10">
                    <DataSummary data={item.content} />
                  </div>
                )}

                {item.type === 'query' && (
                  <div className="my-6">
                    <div className="flex justify-end">
                      <div className="bg-dark-accent text-text-primary rounded-lg py-2 px-4 max-w-2xl">
                        <p className="whitespace-pre-wrap">{item.content}</p>
                      </div>
                    </div>
                  </div>
                )}

                {item.type === 'response' && (
                  <div className="flex justify-start">
                    <div className="bg-dark-muted rounded-lg shadow-lg p-6 border border-dark-border/10 max-w-4xl w-full">
                      <AnalysisResult
                        result={item.content}
                        chatHistory={chatHistory}
                        setChatHistory={setChatHistory}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dark-accent"></div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-900/20 border-l-4 border-red-500 p-4 mt-4">
                <p className="text-red-400">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Query Input and Report Button at Bottom */}
      {data && (
        <div className="p-4 bg-dark-bg">
          <div className="max-w-6xl mx-auto flex gap-6 items-start">
            <div className="flex-1 min-w-0">
              <div className="bg-dark-surface shadow-lg rounded-lg border border-dark-border/10 p-3">
                <QueryInput
                  onSubmit={handleQuery}
                  disabled={loading}
                  currentData={data}
                />
              </div>
            </div>
            <div className="flex-shrink-0">
              <ReportButton chatHistory={chatHistory}/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
