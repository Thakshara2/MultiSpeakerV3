import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileAudio, Loader2, Download } from 'lucide-react';
import { AssemblyAI } from 'assemblyai';

const ASSEMBLY_AI_API_KEY = import.meta.env.VITE_ASSEMBLY_AI_API_KEY;
const MAX_FILE_SIZE = 800 * 1024 * 1024; // 800MB in bytes

interface TranscriptionProps {
  darkMode: boolean;
}

function Transcription({ darkMode }: TranscriptionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedTranscription, setEditedTranscription] = useState<string>('');

  useEffect(() => {
    if (isEditing) {
      const timeoutId = setTimeout(() => {
        handleSaveEdit();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [editedTranscription]);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;

    setIsLoading(true);
    setError('');
    setProgress(0);

    const client = new AssemblyAI({
      apiKey: ASSEMBLY_AI_API_KEY
    });

    try {
      const transcript = await client.transcripts.transcribe({
        audio: file,
        speech_model: 'best'
      }, (progress) => {
        setProgress(progress);
      });

      if (transcript.status === 'error') {
        throw new Error(`Transcription failed: ${transcript.error}`);
      }

      setTranscription(transcript.text || '');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      console.error('Transcription error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [file]);

  const handleDownload = () => {
    const blob = new Blob([transcription], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcription.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedTranscription(transcription);
  };

  const handleSaveEdit = () => {
    setTranscription(editedTranscription);
    setIsEditing(false);
  };

  return (
    <div>
      <p className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>Most Accurate Transcriptions</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-center w-full">
          <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'}`}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {file ? (
                <FileAudio className={`w-12 h-12 mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              ) : (
                <Upload className={`w-12 h-12 mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              )}
              <p className={`mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>MP3, MP4, or WAV (MAX. 800MB)</p>
            </div>
            <input
              id="dropzone-file"
              type="file"
              className="hidden"
              accept=".mp3,.mp4,.wav"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile && selectedFile.size <= MAX_FILE_SIZE) {
                  setFile(selectedFile);
                  setError('');
                } else if (selectedFile) {
                  setError('File size exceeds 800MB limit. Please choose a smaller file.');
                }
              }}
            />
          </label>
        </div>
        {file && (
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} text-center`}>
            Selected file: {file.name}
          </p>
        )}
        <button
          type="submit"
          disabled={!file || isLoading}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : (
            'Transcribe'
          )}
        </button>
      </form>
      {error && (
        <p className="mt-4 text-red-600 text-center">{error}</p>
      )}
      {isLoading && (
        <div className="mt-4">
          <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2.5`}>
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          <p className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>Transcription progress: {progress.toFixed(2)}%</p>
        </div>
      )}
      {transcription && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Transcription Result:</h2>
            <button
              onClick={handleDownload}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              <Download className="inline-block mr-2" size={16} />
              Download
            </button>
          </div>
          <div
            className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-700'}`}
            onClick={handleEdit}
          >
            {isEditing ? (
              <textarea
                value={editedTranscription}
                onChange={(e) => setEditedTranscription(e.target.value)}
                className={`w-full h-64 p-2 rounded ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-700'}`}
              />
            ) : (
              <p className="whitespace-pre-wrap">{transcription}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Transcription;