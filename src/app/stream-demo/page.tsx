'use client';

import { useState } from 'react';

export default function StreamDemo() {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setResponse('');

    const formData = new FormData(e.currentTarget);
    const prompt = formData.get('prompt') as string;

    try {
      const res = await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.body) {
        throw new Error('No response body');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunkText = decoder.decode(value);
        setResponse(prev => prev + chunkText);
      }
    } catch (error) {
      console.error('Error:', error);
      setResponse('Error occurred while streaming response');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Streaming Demo</h1>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            name="prompt"
            placeholder="Enter your prompt..."
            className="flex-1 p-2 border rounded"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Streaming...' : 'Send'}
          </button>
        </div>
      </form>

      {response && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h2 className="font-semibold mb-2">Response:</h2>
          <pre className="whitespace-pre-wrap">{response}</pre>
        </div>
      )}
    </div>
  );
} 