export type UserRole = 'farmer' | 'distributor' | 'retailer' | 'consumer';
import { z } from 'zod';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface PriceHistory {
  price: number;
  timestamp: string;
  retailerId: string;
}

export type BatchStatus = 'At Farm' | 'In Transit' | 'At Retailer' | 'Sold';

export interface Batch {
  id: string; // batchId
  name: string; // From GenAI
  farmerId: string;
  productType: string;
  quantity: number;
  harvestDate: string;
  location: string;
  qualityGrade: string;
  status: BatchStatus;
  metadataHash: string;
  currentOwnerId: string;
  currentPrice?: number;
  priceHistory: PriceHistory[];
  qrCodeUrl: string;
}

export interface Transfer {
  id:string;
  batchId: string;
  fromId: string;
  toId: string;
  timestamp: string;
}

export type EnrichedTransfer = Transfer & {
  fromUser?: User;
  toUser?: User;
}

export type BatchDetails = {
  batch: Batch;
  transfers: EnrichedTransfer[];
  farmer: User | undefined;
  retailer: User | undefined;
}


// Defines a single message in the conversation history.
export const ConversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});
export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;

// The full data structure for a new batch.
export const BatchDataSchema = z.object({
  productType: z.string().optional(),
  quantity: z.number().optional(),
  location: z.string().optional(),
  harvestDate: z.string().optional(),
  qualityGrade: z.string().optional(),
});
export type BatchData = z.infer<typeof BatchDataSchema>;


// Defines the input for the assistant flow.
export const BatchCreationAssistantInputSchema = z.object({
  history: z.array(ConversationMessageSchema),
});
export type BatchCreationAssistantInput = z.infer<
  typeof BatchCreationAssistantInputSchema
>;

// Defines the output of the assistant flow.
export const BatchCreationAssistantOutputSchema = z.object({
  responseText: z.string().describe("The assistant's next response in the conversation."),
  extractedData: BatchDataSchema.describe("The data extracted from the conversation so far."),
  isComplete: z.boolean().describe("Whether all required information has been collected."),
});
export type BatchCreationAssistantOutput = z.infer<
  typeof BatchCreationAssistantOutputSchema
>;
