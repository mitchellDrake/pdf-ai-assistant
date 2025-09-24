import { z } from 'zod';
import { tool } from 'ai';

export const summarizeContext = tool({
  description: 'Summarize context and select the most relevant passage.',
  inputSchema: z.object({
    question: z.string(),
    context: z.string(),
  }),
  execute: async ({ question, context }) => {
    // LLM fills in these values
    return {
      question,
      vectorSummary: 'Traderlink is a real-time data platform...',
      contextItem: 'Traderlink aggregates stock market data...',
      contextPage: 2,
      contextSentence: 1,
    };
  },
});
