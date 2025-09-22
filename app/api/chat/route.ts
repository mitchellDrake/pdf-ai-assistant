import { openai } from '@ai-sdk/openai';
import {
  streamText,
  convertToModelMessages,
  type ModelMessage,
  type UIMessage,
} from 'ai';
// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const {
      messages,
      context,
    }: {
      messages: UIMessage[];
      context?: string;
    } = await req.json();

    // 1️⃣ Convert UI messages to plain model messages
    const convertedMessages: ModelMessage[] = convertToModelMessages(messages);

    // 2️⃣ Build a fresh array with system message if context exists
    const finalMessages: ModelMessage[] = [];

    // Optional global system instructions can go here first
    finalMessages.push({
      role: 'system',
      content: 'You are a helpful assistant.',
    });

    // Per-question PDF context
    if (context?.trim()) {
      finalMessages.push({
        role: 'system',
        content: `Use the following PDF context to answer the user's question. If you have more info to add from online or the additional context provided you may include it. Include page/sentence number as (Page x, Sentence y) at the end of your response and only include the single most relevant page and sentence number(1). Context:\n\n${context.trim()}`,
      });
    }

    // Append the rest of the conversation (user + assistant)
    finalMessages.push(...convertedMessages);

    // 3️⃣ Stream response
    const result = streamText({
      model: openai('gpt-4o'),
      messages: finalMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
    });
  }
}
