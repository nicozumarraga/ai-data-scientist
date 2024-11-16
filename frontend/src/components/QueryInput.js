import React, { useState } from 'react';

export const QueryInput = ({ onSubmit, disabled, currentData }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || disabled) return;

    await onSubmit(query);
    setQuery('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex justify-center items-center gap-3">
      <div className="flex-1">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Chat with Max..."
          className="w-full p-3 bg-dark-surface border border-dark-border/20 rounded-lg
                     text-text-primary placeholder:text-text-secondary
                     focus:ring-2 focus:ring-dark-accent focus:border-dark-accent
                     resize-none overflow-hidden"
          style={{ height: '50px' }}
          disabled={disabled}
        />
      </div>
      <button
        type="submit"
        disabled={disabled || !query.trim()}
        className="h-[40px] w-[70px] bg-dark-accent hover:bg-dark-hover disabled:bg-dark-muted
                 text-text-primary disabled:text-text-secondary rounded-lg
                 transition-all duration-200 flex items-center justify-center
                 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
      >
        {disabled ? (
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        )}
      </button>
    </form>
  );
};
