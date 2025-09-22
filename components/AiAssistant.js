import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { useApi } from '../utils/api';
import { useSpeechRecognition } from '../utils/useSpeechRecognition';

export default function AiAssistant({ onNavigateToPage, activePdf }) {
  const [input, setInput] = useState('');
  const [chunks, setChunks] = useState([]);
  const [chatId, setChatId] = useState(null);

  const chatIdRef = useRef(null);
  const chunksRef = useRef([]);

  const { messages, setMessages, sendMessage, handleSubmit } = useChat({
    onFinish: ({ message, messages, isAbort, isDisconnect, isError }) => {
      handleNewMessage(message.parts[1].text);
      apiFetch('/chat', {
        method: 'POST',
        body: { chatId: chatIdRef.current, messages: messages },
      });
    },
  });

  const apiFetch = useApi();
  const { listening, toggleListening } = useSpeechRecognition((e) =>
    setInput(e.target.value)
  );

  // initialize or load chat
  useEffect(() => {
    async function loadChat() {
      try {
        if (!activePdf) return;
        const response = await apiFetch(`/chat/${activePdf.id}`);
        setChatId(response.chatId);

        if (response.messages && response.messages.length > 0) {
          setMessages(response.messages);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.log(error);
      }
    }
    loadChat();
  }, [activePdf]);

  const handleSend = async (e) => {
    e.preventDefault();
    const freezeInput = input;
    setInput('');
    if (!freezeInput.trim()) return;
    const response = await apiFetch('/embeddings/search', {
      method: 'POST',
      body: { question: freezeInput, pdfId: activePdf.id },
    });

    const chunks = response.chunks || [];
    setChunks(chunks);
    const context = chunks
      .map((c) => `Page ${c.page} Sentence ${c.sentenceIndex}: ${c.text}`)
      .join('\n');

    await sendMessage(
      { text: freezeInput },
      {
        body: {
          context: context,
          pdfId: activePdf.id,
        },
      }
    );
  };

  useEffect(() => {
    chunksRef.current = chunks;
  }, [chunks]);
  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);
  const handleNewMessage = (llmResponseText) => {
    // Example LLM response: "Traderlink is a data platform ... (Page 2, Sentence 2)"
    const match = llmResponseText.match(/\(Page (\d+), Sentence (\d+)\)/);
    if (match) {
      const page = parseInt(match[1], 10);
      const sentence = parseInt(match[2], 10);

      const filteredChunks = chunksRef.current.filter(
        (v) => v.page === page && v.sentenceIndex === sentence
      );
      // Call Dashboard callback
      onNavigateToPage({ page, sentence, filteredChunks });
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4 h-[80vh] flex flex-col">
      <h2 className="font-semibold text-lg">AI Assistant</h2>

      {/* Chat messages */}
      <div className="bg-gray-100 p-4 rounded-lg text-gray-500 flex-1 overflow-auto flex flex-col space-y-2">
        {messages.length === 0 && (
          <div className="text-gray-400 text-sm">
            {!activePdf
              ? 'Please select a document to use the AI assistant'
              : 'Chat / analysis results will appear here'}
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`${
              message.role === 'user'
                ? 'self-end bg-blue-600 text-white rounded-lg p-2'
                : 'self-start bg-gray-300 text-gray-900 rounded-lg p-2'
            } max-w-[75%]`}
          >
            {message.parts?.map((part, i) => {
              // console.log(part);
              if (part.type === 'text') return <div key={i}>{part.text}</div>;
              return null;
            })}
          </div>
        ))}
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} className="mt-2 flex gap-2 items-center">
        {/* Microphone button */}
        <button
          type="button"
          onClick={toggleListening} // your toggle function
          className={`p-2 rounded-lg border transition-colors duration-200 ${!activePdf ? 'cursor-not-allowed' : ''}
      ${listening ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          disabled={!activePdf}
        >
          {listening ? '🛑' : '🎤'}
        </button>

        {/* Text input */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something about the document..."
          disabled={!activePdf}
          className={`flex-1 border rounded-lg px-3 py-2
      ${!activePdf ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-black'}`}
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={!activePdf}
          className={`px-4 py-2 rounded-lg
      ${
        !activePdf
          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
        >
          Send
        </button>
      </form>
    </div>
  );
}
