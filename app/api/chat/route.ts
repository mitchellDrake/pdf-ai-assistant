import { openai } from '@ai-sdk/openai';
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from 'ai';

// tool imports
import createSearchTool from '../../../utils/ai/tools/createSearchTool';
// import { summarizeContext } from '../../../utils/ai/tools/summarizeContext';
import { composeAnswer } from '../../../utils/ai/tools/composeAnswer';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const {
      messages,
      pdfId,
      token,
    }: {
      messages: UIMessage[];
      pdfId: string;
      token: string;
    } = await req.json();

    if (!pdfId || !token) {
      return new Response('Missing pdfId or token', { status: 400 });
    }

    const searchTool = createSearchTool(pdfId, token);

    // 3️⃣ Stream response
    const result = streamText({
      model: openai('gpt-4o'),
      messages: convertToModelMessages(messages),
      system: `
You must ALWAYS run the tools in this exact sequence:
1. Call "search" with the user question.
2. Call "composeAnswer" with the summary and context details.
After step 2, return the composed answer as the final assistant message.
`,
      stopWhen: stepCountIs(3), // wait until all tools run
      tools: {
        search: searchTool,
        // summarize: summarizeContext,
        composeAnswer: composeAnswer,
      },
      onStepFinish({ text, toolCalls, toolResults }) {
        console.log('step done:', { text, toolCalls, toolResults });
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
