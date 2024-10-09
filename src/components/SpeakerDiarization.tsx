import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileAudio, Loader2, Download, Plus, Edit2, Check, X } from 'lucide-react';
import { AssemblyAI } from 'assemblyai';

const ASSEMBLY_AI_API_KEY = import.meta.env.VITE_ASSEMBLY_AI_API_KEY;
const MAX_FILE_SIZE = 800 * 1024 * 1024; // 800MB in bytes

interface Utterance {
  id: string;
  speaker: string;
  text: string;
}

const SPEAKER_OPTIONS = ['Speaker A', 'Speaker B', 'Speaker C', 'Speaker D', 'Speaker E', 'Speaker F', 'Speaker G'];

function SpeakerDiarization() {
  const [file, setFile] = useState<File | null>(null);
  const [diarization, setDiarization] = useState<Utterance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  useEffect(() => {
    if (!ASSEMBLY_AI_API_KEY) {
      setError('AssemblyAI API key is missing. Please check your environment variables.');
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError('File size exceeds 800MB limit. Please choose a smaller file.');
        setFile(null);
      } else {
        setFile(selectedFile);
        setError('');
      }
    }
  };

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;
    if (!ASSEMBLY_AI_API_KEY) {
      setError('AssemblyAI API key is missing. Please check your environment variables.');
      return;
    }

    setIsLoading(true);
    setError('');
    setDiarization([]);
    setProgress(0);

    const client = new AssemblyAI({
      apiKey: ASSEMBLY_AI_API_KEY
    });

    try {
      const transcript = await client.transcripts.transcribe({
        audio: file,
        speaker_labels: true,
        speech_model: 'best'
      }, (progress) => {
        setProgress(progress);
      });

      if (transcript.status === 'error') {
        throw new Error(`Diarization failed: ${transcript.error}`);
      }

      if (transcript.utterances) {
        const processedDiarization = transcript.utterances.map((utterance, index) => ({
          id: `utterance-${index}`,
          speaker: `Speaker ${String.fromCharCode(65 + (utterance.speaker % 7))}`,
          text: utterance.text
        }));
        setDiarization(processedDiarization);
      } else {
        setError('No utterances found in the diarization result.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
      console.error('Diarization error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [file]);

  const handleDownload = () => {
    const content = diarization.map(utterance => `${utterance.speaker}: ${utterance.text}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diarization.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSpeakerChange = (id: string, newSpeaker: string) => {
    setDiarization(prev => prev.map(utterance =>
      utterance.id === id ? { ...utterance, speaker: newSpeaker } : utterance
    ));
  };

  const handleEdit = (id: string) => {
    const utteranceToEdit = diarization.find(u => u.id === id);
    if (utteranceToEdit) {
      setEditingId(id);
      setEditingText(utteranceToEdit.text);
    }
  };

  const handleSaveEdit = () => {
    setDiarization(prev => prev.map(utterance =>
      utterance.id === editingId ? { ...utterance, text: editingText } : utterance
    ));
    setEditingId(null);
    setEditingText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const handleAddUtterance = (index: number) => {
    const newUtterance: Utterance = { id: `utterance-${Date.now()}`, speaker: 'Speaker A', text: '' };
    setDiarization(prev => [
      ...prev.slice(0, index + 1),
      newUtterance,
      ...prev.slice(index + 1)
    ]);
  };

  return (
    <div>
      <p className="text-center text-gray-600 mb-6">Speaker Diarization using AssemblyAI's Best Model</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-center w-full">
          <label htmlFor="dropzone-file-diarization" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {file ? (
                <FileAudio className="w-12 h-12 mb-3 text-gray-400" />
              ) : (
                <Upload className="w-12 h-12 mb-3 text-gray-400" />
              )}
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">MP3, MP4, or WAV (MAX. 800MB)</p>
            </div>
            <input
              id="dropzone-file-diarization"
              type="file"
              className="hidden"
              accept=".mp3,.mp4,.wav"
              onChange={handleFileChange}
            />
          </label>
        </div>
        {file && (
          <p className="text-sm text-gray-600 text-center">
            Selected file: {file.name}
          </p>
        )}
        <button
          type="submit"
          disabled={!file || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : (
            'Diarize Audio'
          )}
        </button>
      </form>
      {error && (
        <p className="mt-4 text-red-600 text-center">{error}</p>
      )}
      {isLoading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-center text-gray-600 mt-2">Diarization progress: {progress.toFixed(2)}%</p>
        </div>
      )}
      {diarization.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Diarization Result:</h2>
            <button
              onClick={handleDownload}
              className="flex items-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              <Download className="mr-2" size={16} />
              Download
            </button>
          </div>
          <div className="space-y-4">
            {diarization.map((utterance, index) => (
              <div key={utterance.id} className="flex items-start space-x-2">
                <select
                  value={utterance.speaker}
                  onChange={(e) => handleSpeakerChange(utterance.id, e.target.value)}
                  className="p-2 border rounded"
                >
                  {SPEAKER_OPTIONS.map((speaker, idx) => (
                    <option key={idx} value={speaker}>{speaker}</option>
                  ))}
                </select>
                {editingId === utterance.id ? (
                  <>
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="flex-grow p-2 border rounded"
                    />
                    <button onClick={handleSaveEdit} className="p-2 text-green-600 hover:text-green-800">
                      <Check size={20} />
                    </button>
                    <button onClick={handleCancelEdit} className="p-2 text-red-600 hover:text-red-800">
                      <X size={20} />
                    </button>
                  </>
                ) : (
                  <>
                    <p className="flex-grow text-gray-700">{utterance.text}</p>
                    <button onClick={() => handleEdit(utterance.id)} className="p-2 text-blue-600 hover:text-blue-800">
                      <Edit2 size={20} />
                    </button>
                  </>
                )}
                <button onClick={() => handleAddUtterance(index)} className="p-2 text-gray-600 hover:text-gray-800">
                  <Plus size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SpeakerDiarization;