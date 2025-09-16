'use server';
/**
 * @fileOverview A conversational AI assistant to help farmers create a new batch.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the structure for a single message in the conversation
const BatchCreationAssistantMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type BatchCreationAssistantMessage = z.infer<typeof BatchCreationAssistantMessageSchema>;

// Define the data structure for the information we want to extract
const ExtractedDataSchema = z.object({
  productType: z.string().optional().describe('The type of product (e.g., tomatoes, lettuce).'),
  quantity: z.number().optional().describe('The quantity of the product in kilograms.'),
  location: z.string().optional().describe('The location where the product was harvested.'),
  harvestDate: z.string().optional().describe('The harvest date of the product (e.g., 2024-01-01). Should be in YYYY-MM-DD format.'),
  qualityGrade: z.string().optional().describe('The quality grade of the product (e.g., Grade A, Premium).'),
});
type ExtractedData = z.infer<typeof ExtractedDataSchema>;


// Define the input for our main flow
const AssistantInputSchema = z.array(BatchCreationAssistantMessageSchema);

// Define the output of our main flow
const AssistantOutputSchema = z.object({
  response: z.string().optional().describe("The assistant's next message to the user."),
  extractedData: ExtractedDataSchema.optional().describe("The data extracted from the user's responses so far."),
  isComplete: z.boolean().describe('Whether all required information has been collected.'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;


export async function batchCreationAssistant(
  history: BatchCreationAssistantMessage[]
): Promise<AssistantOutput> {
  return batchCreationAssistantFlow({ history });
}

// Define the prompt for the AI model
const assistantPrompt = ai.definePrompt({
  name: 'batchCreationAssistantPrompt',
  input: { schema: z.object({ history: AssistantInputSchema }) },
  output: { schema: AssistantOutputSchema },
  prompt: `You are an AI assistant helping a farmer create a new batch of produce. Your goal is to collect the following information, one piece at a time:
- Product Type
- Quantity (in kg)
- Harvest Location
- Harvest Date
- Quality Grade

Analyze the conversation history to see what information has already been provided. If information is missing, ask a clear, simple question to get the next piece of information.

If the user provides a value, extract it and include it in the 'extractedData' field.
For the harvestDate, if the user says "today" or "yesterday", convert it to the YYYY-MM-DD format based on the current date: ${new Date().toISOString().split('T')[0]}.

Once all information is collected, set 'isComplete' to true and respond with a confirmation message like "Great, I have all the details. The form is now filled out.".

If the conversation has just started (history is empty), greet the user and ask the first question about the product type.

Conversation History:
{{#each history}}
  {{role}}: {{{content}}}
{{/each}}
`,
});


// Define the main flow
const batchCreationAssistantFlow = ai.defineFlow(
  {
    name: 'batchCreationAssistantFlow',
    inputSchema: z.object({ history: AssistantInputSchema }),
    outputSchema: AssistantOutputSchema,
  },
  async ({ history }) => {
    const { output } = await assistantPrompt({ history });
    return output!;
  }
);
