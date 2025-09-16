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
  prompt: `You are a friendly and efficient AI assistant helping a farmer create a new produce batch. Your goal is to collect the required information quickly and naturally.

You need to collect:
1. Product Type (e.g., Tomatoes)
2. Quantity (in kg)
3. Harvest Location (e.g., Salinas, CA)
4. Harvest Date (e.g., today's date)
5. Quality Grade (e.g., Grade A)

Conversation Rules:
- The user might provide multiple pieces of information in a single sentence. You must extract all of it.
- Only ask for the information you are still missing.
- Once you have collected all five pieces of information, set 'isComplete' to true.
- Your 'responseText' should be a confirmation summary of all the collected data once complete.
- Be conversational, friendly, and concise.
- For the harvest date, if the user says "today" or "yesterday", calculate the date in YYYY-MM-DD format.

Conversation History:
{{#each history}}
- {{this.role}}: {{this.content}}
{{/each}}

Based on the history, identify the missing information and ask the next question, or complete the process if all data is present.`,
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
