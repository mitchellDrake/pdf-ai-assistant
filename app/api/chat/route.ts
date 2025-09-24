import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import {
  streamText,
  generateText,
  generateObject,
  streamObject,
  convertToModelMessages,
  tool,
  stepCountIs,
  type ModelMessage,
  type UIMessage,
} from 'ai';
// Allow streaming responses up to 30 seconds
export const maxDuration = 30;
const API_URL = process.env.NEXT_PUBLIC_EXTERNAL_API_URL;

// export async function POST(req: Request) {
//   try {
//     const {
//       messages,
//       context,
//     }: {
//       messages: UIMessage[];
//       context?: string;
//     } = await req.json();

//     // 1️⃣ Convert UI messages to plain model messages
//     const convertedMessages: ModelMessage[] = convertToModelMessages(messages);

//     // 2️⃣ Build a fresh array with system message if context exists
//     const finalMessages: ModelMessage[] = [];

//     // Optional global system instructions can go here first
//     finalMessages.push({
//       role: 'system',
//       content: 'You are a helpful assistant.',
//     });

//     // Per-question PDF context
//     if (context?.trim()) {
//       finalMessages.push({
//         role: 'system',
//         content: `Use the following PDF context to answer the user's question. If you have more info to add from online or the additional context provided you may include it. Include page/sentence number as (Page x, Sentence y) at the end of your response and only include the single most relevant page and sentence number(1). Context:\n\n${context.trim()}`,
//       });
//     }

//     // Append the rest of the conversation (user + assistant)
//     finalMessages.push(...convertedMessages);

//     // 3️⃣ Stream response
//     const result = streamText({
//       model: openai('gpt-4o'),
//       messages: finalMessages,
//     });

//     return result.toUIMessageStreamResponse();
//   } catch (err) {
//     console.error(err);
//     return new Response(JSON.stringify({ error: (err as Error).message }), {
//       status: 500,
//     });
//   }
// }

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
      system: `Search messege for the most relevent context related to the users question and then return a summary with the page and sentence number`,
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
          description: `Return summary and the page and sentence number with (Page x, Sentence y) appended to the end of the summary`,
          inputSchema: z.object({
            summary: z.string(
              'Summary of the most relevent context item with (Page x, Sentence y) appended to the end of the summary'
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
