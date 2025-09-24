import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import {
  streamText,
  convertToModelMessages,
  tool,
  stepCountIs,
  type UIMessage,
} from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;
const API_URL = process.env.NEXT_PUBLIC_EXTERNAL_API_URL;

export async function POST(req: Request) {
  try {
    const {
      messages,
      pdfId,
      token,
    }: {
      messages: UIMessage[];
      pdfId?: string;
      token?: string;
    } = await req.json();

    const authHeader: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...authHeader,
    };

    // fetch PDF embeddings:
    const lastMessage = messages[messages.length - 1]; // get the last message
    let userText: string = '';
    if (lastMessage.role === 'user') {
      userText = lastMessage.parts
        .filter((p) => p.type === 'text')
        .map((p) => p.text)
        .join(''); // combine all text parts if multiple
    }

    const res = await fetch(`${API_URL}/embeddings/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ question: userText, pdfId }),
    });

    const data = await res.json();
    const chunkString = data.chunks
      .map(
        (c: any) =>
          `PageNumber: ${c.page} SentenceNumber: ${c.sentenceIndex} Text: ${c.text}`
      )
      .join('\n');

    const updatedMessage = {
      ...lastMessage,
      parts: lastMessage.parts.map((part) =>
        part.type === 'text'
          ? { ...part, text: part.text + '\n Context: ' + chunkString } // replace text
          : part
      ),
    };

    const searchSchema = z.object({
      question: z.string().describe('the users intial input'),
      context: z
        .string()
        .describe(
          'vector search content returning potential matching passages from the pdf file'
        ),
      vectorSummary: z
        .string()
        .describe('the summary of all supplied context items'),
      contextItem: z
        .string()
        .describe('the text of the best matched context item'),
      contextPage: z
        .int()
        .describe('the page number of the best matched context item'),
      contextSentence: z
        .int()
        .describe('the page number of the best matched context item'),
    });

    // 3️⃣ Stream response
    const result = streamText({
      model: openai('gpt-4o'),
      messages: convertToModelMessages([updatedMessage]),
      system: `Search messege for the most relevent context related to the users question and then return a summary with the page and sentence number. Only include the most relevant page reference for your response and ensure you only put it at the very end of the summary in the format: (Page x, Sentence y).`,
      stopWhen: stepCountIs(2),
      tools: {
        search: tool({
          description: 'Search PDF context for the most relevent passage',
          inputSchema: searchSchema,
          execute: async (searchSchema) => {
            return {
              question: searchSchema.question,
              context: searchSchema.context,
              vectorSummary: searchSchema.vectorSummary,
              contextItem: searchSchema.contextItem,
              contextPage: searchSchema.contextPage,
              contextSentence: searchSchema.contextSentence,
            };
          },
        }),
        summarize: tool({
          description: `Return summary and the page and sentence number with (Page x, Sentence y) appended to the end of the summary. Only include the most relevant page reference for your response and ensure you only put it at the very end of the summary.`,
          inputSchema: z.object({
            summary: z.string(
              'Summary of the most relevent context item with (Page x, Sentence y) appended to the end of the summary. Only include the most relevant page reference for your response and ensure you only put it at the very end of the summary.'
            ),
          }),
          execute: async ({ summary }) => {
            return summary;
          },
        }),
      },
      onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
        // console.log('text', text);
        // console.log('tool calls', toolCalls);
        // console.log('tool results', toolResults);
        // console.log('finish reason', finishReason);
        // console.log('usage', usage);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
    });
  }
}
