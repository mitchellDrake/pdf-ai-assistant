import { useState, useRef, useEffect } from 'react';

export function useSpeechRecognition(callback, lang = 'en-US') {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // single phrase
    recognition.interimResults = true;
    recognition.lang = lang;

    let lastFinalIndex = 0;

    recognition.onresult = (event) => {
      let finalTranscript = '';

      for (let i = lastFinalIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
          lastFinalIndex = i + 1;
        }
      }

      if (finalTranscript) {
        callback(finalTranscript, 'speech');
      }
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
  }, [callback, lang]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  return { listening, toggleListening };
}
