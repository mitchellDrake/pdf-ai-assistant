import { z } from 'zod';
import { tool, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const composeAnswer = tool({
  description: `Take the summarized context data and return a natural language answer. 
  The answer must end with the most relevant page/sentence reference in the format (Page x, Sentence y). 
  Only include one reference, and only put it at the end.`,
  inputSchema: z.object({
    question: z.string().describe('the original input from the user'),
    contextItem: z.string(),
    contextPage: z.number().int(),
    contextSentence: z.number().int(),
  }),
  async execute({ question, contextItem, contextPage, contextSentence }) {
    // Here we hand it BACK to the model to compose text
    const { text } = await generateText({
      model: openai('gpt-4o'),
      messages: [
        {
          role: 'system',
          content: `You are an assistant that writes concise answers from PDF context.`,
        },
        {
          role: 'user',
          content: `The user asked: "${question}". 
          

Most relevant passage: "${contextItem}" (Page ${contextPage}, Sentence ${contextSentence})

Return a short answer for the user by summarizing the content inside the context objects. Append the page/sentence reference at the very end like (Page ${contextPage}, Sentence ${contextSentence}).`,
        },
      ],
    });

    return { text };
  },
});
