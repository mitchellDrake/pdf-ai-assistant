import { z } from 'zod';
import { tool } from 'ai';
const API_URL = process.env.NEXT_PUBLIC_EXTERNAL_API_URL;

export default function createSearchTool(pdfId: string, token: string) {
  return tool({
    description:
      'Get the pdf context based on the users input. Always return context as the response data from await fetch',
    inputSchema: z.object({
      question: z.string().describe('The user’s input question'),
    }),
    execute: async ({ question }) => {
      const headers: HeadersInit = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const res = await fetch(`${API_URL}/embeddings/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ question, pdfId }),
      });

      const data = await res.json();

      const context = (data.chunks || [])
        .map(
          (c: any) => `Page ${c.page} Sentence ${c.sentenceIndex}: ${c.text}`
        )
        .join('\n');

      // console.log('search response', {
      //   question,
      //   pdfId,
      //   context,
      // });

      return {
        question,
        pdfId,
        context,
      };
    },
  });
}
