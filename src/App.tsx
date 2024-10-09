import React, { useState, useEffect } from 'react';
import Transcription from './components/Transcription';
import MultiSpeaker from './components/MultiSpeaker';

function App() {
  const [activeTab, setActiveTab] = useState<'transcription' | 'multiSpeaker'>('transcription');
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} transition-colors duration-200`}>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Multi Speaker Transcription App</h1>
            <button
              onClick={toggleDarkMode}
              className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
          <div className="mb-6">
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab('transcription')}
                className={`px-3 py-2 rounded-md ${
                  activeTab === 'transcription'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Transcription
              </button>
              <button
                onClick={() => setActiveTab('multiSpeaker')}
                className={`px-3 py-2 rounded-md ${
                  activeTab === 'multiSpeaker'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Multi Speaker
              </button>
            </nav>
          </div>
          {activeTab === 'transcription' ? <Transcription darkMode={darkMode} /> : <MultiSpeaker darkMode={darkMode} />}
        </div>
      </div>
    </div>
  );
}

export default App;