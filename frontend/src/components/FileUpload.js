import React, { useState } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';

export const FileUpload = ({ onUpload }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      onUpload(result);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="flex items-center justify-center w-full h-32 px-4 transition
                   bg-dark-surface border-2 border-dark-border/10 border-dashed rounded-lg
                   appearance-none cursor-pointer hover:border-dark-accent/50 focus:outline-none"
        >
          <div className="flex flex-col items-center space-y-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-500">
              {file ? file.name : "Choose a CSV file"}
            </span>
          </div>
        </label>
      </div>

      <button
        type="submit"
        disabled={!file || loading}
        className="w-full px-4 py-2 text-white bg-dark-accent rounded-lg
                 hover:bg-dark-accent/90 disabled:bg-dark-muted disabled:cursor-not-allowed
                 transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </>
        )}
      </button>

      {error && (
        <div className="bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r flex gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </form>
  );
};
