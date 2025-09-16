'use server';
/**
 * @fileOverview A conversational AI assistant flow for creating produce batches.
 *
 * - batchCreationAssistant - A function that drives the conversation with the farmer.
 */

import { ai } from '@/ai/genkit';
import {
  type BatchCreationAssistantInput,
  BatchCreationAssistantInputSchema,
  type BatchCreationAssistantOutput,
  BatchCreationAssistantOutputSchema
} from '@/lib/types';


// The exported function that the frontend will call.
export async function batchCreationAssistant(
  input: BatchCreationAssistantInput
): Promise<BatchCreationAssistantOutput> {
  return batchCreationAssistantFlow(input);
}

const assistantPrompt = ai.definePrompt({
  name: 'batchCreationAssistantPrompt',
  input: { schema: BatchCreationAssistantInputSchema },
  output: { schema: BatchCreationAssistantOutputSchema },
  prompt: `You are a friendly AI assistant helping a farmer create a new produce batch. Your goal is to collect the following information, one piece at a time:
1. Product Type (e.g., Tomatoes)
2. Quantity (in kg)
3. Harvest Location (e.g., Salinas, CA)
4. Harvest Date (e.g., today's date)
5. Quality Grade (e.g., Grade A)

Conversation Rules:
- Ask one question at a time.
- If the user provides more than one piece of information, acknowledge it and ask for the next required piece.
- Once you have collected all the information, set 'isComplete' to true and set 'responseText' to a summary of the collected data.
- Be conversational and friendly.
- For harvest date, if the user says "today", use today's date in YYYY-MM-DD format.
- Keep your questions and responses concise.

Here is the conversation history so far:
{{#each history}}
- {{this.role}}: {{this.content}}
{{/each}}

Based on the history, ask the next question or complete the process.`,
});

const batchCreationAssistantFlow = ai.defineFlow(
  {
    name: 'batchCreationAssistantFlow',
    inputSchema: BatchCreationAssistantInputSchema,
    outputSchema: BatchCreationAssistantOutputSchema,
  },
  async ({ history }) => {
    const { output } = await assistantPrompt({ history });
    return output!;
  }
);
