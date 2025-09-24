import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { useApi } from '../utils/api';
import { useSpeechRecognition } from '../utils/useSpeechRecognition';
import { useAuth } from '../context/AuthContext';

export default function AiAssistant({ onNavigateToPage, activePdf }) {
  const [input, setInput] = useState('');
  const [chatId, setChatId] = useState(null);
  const [thinking, setThinking] = useState(false);
  const chatIdRef = useRef(null);
  const chatContainerRef = useRef(null);

  const { messages, setMessages, sendMessage, handleSubmit, addToolResult } =
    useChat({
      onData: (data) => {
        console.log('data received', data);
      },
      onToolCall: (event) => {
        // event = { toolName: string, args: object, message: UIMessage }
        console.log('Tool called:', event);
        console.log('tool things', {
          tool: event.toolCall.toolName,
          toolCallId: event.toolCall.toolCallId,
          output: event.toolCall.input,
        });
        addToolResult({
          tool: event.toolCall.toolName,
          toolCallId: event.toolCall.toolCallId,
          output: event.toolCall.input,
        });
      },
      onFinish: ({ message, messages, isAbort, isDisconnect, isError }) => {
        setThinking(false);
        console.log('message finish', message);
        let newMessage;
        newMessage =
          message.parts[message.parts.length - 1]?.text ||
          message.parts[message.parts.length - 1]?.output;

        // only save and parse if there is actual return data
        if (newMessage.length === 0) return;
        handleNewMessage(newMessage);
        apiFetch('/chat', {
          method: 'POST',
          body: { chatId: chatIdRef.current, messages: messages },
        });
      },
    });

  const { apiFetch } = useApi();
  const { token } = useAuth();

  const { listening, toggleListening } = useSpeechRecognition(
    (transcript, type) => {
      // add a space to the previous text just to ensure we are spacing between sentences
      setInput((prev) => prev + ' ' + transcript);
    }
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

  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);

  // scroll to bottom when new message logs
  useEffect(() => {
    console.log('message update', messages[messages.length - 1]);
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  // before sending chat to Vercel AI, create the embeddings based on your question to send them as context to LLM
  const handleSend = async (e) => {
    e.preventDefault();
    const freezeInput = input;
    if (!freezeInput.trim()) return;
    setInput('');

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    setThinking(true);
    //set user message placeholder immediately
    setMessages((prev) => [
      ...prev,
      {
        id: tempId, // temporary unique ID
        role: 'user',
        parts: [{ type: 'text', text: freezeInput }],
      },
    ]);

    //remove user placeholder
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
    await sendMessage(
      { text: freezeInput },
      {
        body: {
          pdfId: activePdf.id,
          token: token,
        },
      }
    );
  };

  // parse the correct page and sentence from the LLM response
  const handleNewMessage = (llmResponseText) => {
    // text to speech if on
    const match = llmResponseText.match(/\(Page (\d+), Sentence (\d+)\)/);
    if (match) {
      const page = parseInt(match[1], 10);
      const sentence = parseInt(match[2], 10);
      onNavigateToPage({
        page,
        sentence,
        filteredChunks: [{ text: llmResponseText }],
      });
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4 h-[80vh] flex flex-col">
      <h2 className="font-semibold text-lg">AI Assistant</h2>
      <div
        ref={chatContainerRef}
        className="bg-gray-100 p-4 rounded-lg text-gray-500 flex-1 overflow-auto flex flex-col space-y-2"
      >
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
            {message.parts[message.parts.length - 1]?.text ? (
              <div key={message.id}>
                {message.parts[message.parts.length - 1]?.text}
              </div>
            ) : message.parts[message.parts.length - 1]?.output &&
              typeof message.parts[message.parts.length - 1]?.output ===
                'string' ? (
              <div key={message.id}>
                {message.parts[message.parts.length - 1]?.output}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="mt-2 flex gap-2 items-center">
        <button
          type="button"
          onClick={toggleListening}
          className={`p-2 rounded-lg border transition-colors duration-200 ${!activePdf || thinking ? 'cursor-not-allowed' : ''}
      ${listening ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          disabled={!activePdf || thinking}
        >
          {listening ? '🛑' : '🎤'}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            thinking ? 'Thinking....' : 'Ask something about the document...'
          }
          disabled={!activePdf || thinking}
          className={`flex-1 border rounded-lg px-3 py-2
    ${!activePdf || thinking ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-black'}`}
        />
        <button
          type="submit"
          disabled={!activePdf || thinking}
          className={`px-4 py-2 rounded-lg
      ${
        !activePdf || thinking
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
