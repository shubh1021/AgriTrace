'use server';
/**
 * @fileOverview A flow that generates a descriptive name for a produce batch using AI.
 *
 * - generateDescriptiveBatchName - A function that generates a descriptive name for a produce batch.
 * - GenerateDescriptiveBatchNameInput - The input type for the generateDescriptiveBatchName function.
 * - GenerateDescriptiveBatchNameOutput - The return type for the generateDescriptiveBatchName function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDescriptiveBatchNameInputSchema = z.object({
  productType: z.string().describe('The type of product (e.g., tomatoes, lettuce).'),
  quantity: z.number().describe('The quantity of the product (e.g., 100).'),
  location: z.string().describe('The location where the product was harvested (e.g., Salinas, CA).'),
  harvestDate: z.string().describe('The harvest date of the product (e.g., 2024-01-01).'),
  qualityGrade: z.string().describe('The quality grade of the product (e.g., Grade A, Premium).'),
});
export type GenerateDescriptiveBatchNameInput = z.infer<
  typeof GenerateDescriptiveBatchNameInputSchema
>;

const GenerateDescriptiveBatchNameOutputSchema = z.object({
  batchName: z.string().describe('A descriptive name for the produce batch.'),
});
export type GenerateDescriptiveBatchNameOutput = z.infer<
  typeof GenerateDescriptiveBatchNameOutputSchema
>;

export async function generateDescriptiveBatchName(
  input: GenerateDescriptiveBatchNameInput
): Promise<GenerateDescriptiveBatchNameOutput> {
  return generateDescriptiveBatchNameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDescriptiveBatchNamePrompt',
  input: {schema: GenerateDescriptiveBatchNameInputSchema},
  output: {schema: GenerateDescriptiveBatchNameOutputSchema},
  prompt: `You are an expert agricultural naming specialist. You will generate a descriptive name for a produce batch based on the following information:

Product Type: {{{productType}}}
Quantity: {{{quantity}}}
Location: {{{location}}}
Harvest Date: {{{harvestDate}}}
Quality Grade: {{{qualityGrade}}}

Generate a concise and descriptive name for this batch. The name should be easily identifiable and reflect the key characteristics of the batch. Do not include any special characters.

Name:`,
});

const generateDescriptiveBatchNameFlow = ai.defineFlow(
  {
    name: 'generateDescriptiveBatchNameFlow',
    inputSchema: GenerateDescriptiveBatchNameInputSchema,
    outputSchema: GenerateDescriptiveBatchNameOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
