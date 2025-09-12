'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { generateDescriptiveBatchName } from '@/ai/flows/generate-descriptive-batch-name';
import { batches, transfers, mockUsers, getUser } from '@/lib/data';
import type { Batch, BatchDetails, EnrichedTransfer, User } from '@/lib/types';
import { createHash } from 'crypto';

const CreateBatchSchema = z.object({
  productType: z.string().min(1, 'Product type is required.'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  location: z.string().min(1, 'Location is required.'),
  harvestDate: z.string().min(1, 'Harvest date is required.'),
  qualityGrade: z.string().min(1, 'Quality grade is required.'),
});

export async function createBatchAction(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = CreateBatchSchema.safeParse(rawFormData);
  
  if (!validatedFields.success) {
    return { error: 'Invalid data. Please check your inputs.' };
  }

  const data = validatedFields.data;
  const farmer = mockUsers.find(u => u.role === 'farmer');
  if (!farmer) return { error: 'No farmer user found.' };

  try {
    const { batchName } = await generateDescriptiveBatchName(data);

    const batchId = `batch_${Date.now()}`;
    const batchDataString = JSON.stringify({ ...data, batchId, farmerId: farmer.id });
    const metadataHash = createHash('sha256').update(batchDataString).digest('hex');

    const newBatch: Batch = {
      id: batchId,
      name: batchName,
      farmerId: farmer.id,
      ...data,
      status: 'At Farm',
      currentOwnerId: farmer.id,
      priceHistory: [],
      metadataHash,
      qrCodeUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/batches/${batchId}`,
    };

    batches.unshift(newBatch);
    revalidatePath('/');
    return { success: true, batch: newBatch };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to create batch.' };
  }
}

export async function getFarmerBatches(farmerId: string) {
  return batches.filter(b => b.farmerId === farmerId);
}

export async function claimBatchAction(batchId: string, distributorId: string) {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return { error: 'Batch not found.' };
    if (batch.status !== 'At Farm') return { error: 'Batch is not available for claim.' };

    batch.status = 'In Transit';
    batch.currentOwnerId = distributorId;

    const transfer: Transfer = {
        id: `transfer_${Date.now()}`,
        batchId,
        fromId: batch.farmerId,
        toId: distributorId,
        timestamp: new Date().toISOString(),
    };
    transfers.push(transfer);
    revalidatePath('/');
    return { success: true, batch };
}

export async function getDistributorBatches(distributorId: string) {
    return batches.filter(b => b.currentOwnerId === distributorId && b.status === 'In Transit');
}

export async function transferToRetailerAction(batchId: string, fromDistributorId: string, toRetailerId: string) {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return { error: 'Batch not found.' };
    if (batch.currentOwnerId !== fromDistributorId) return { error: 'You do not own this batch.' };
    
    const retailer = mockUsers.find(u => u.id === toRetailerId && u.role === 'retailer');
    if (!retailer) return { error: 'Retailer not found.' };

    batch.status = 'At Retailer';
    batch.currentOwnerId = toRetailerId;

    const transfer: Transfer = {
        id: `transfer_${Date.now()}`,
        batchId,
        fromId: fromDistributorId,
        toId: toRetailerId,
        timestamp: new Date().toISOString(),
    };
    transfers.push(transfer);

    revalidatePath('/');
    return { success: true, batch };
}


export async function getRetailerBatches(retailerId: string) {
    return batches.filter(b => b.currentOwnerId === retailerId && b.status === 'At Retailer');
}

export async function setPriceAction(batchId: string, retailerId: string, price: number) {
    if (price <= 0) return { error: 'Price must be positive.' };
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return { error: 'Batch not found.' };
    if (batch.currentOwnerId !== retailerId) return { error: 'You do not own this batch.' };

    batch.currentPrice = price;
    batch.priceHistory.push({
        price,
        retailerId,
        timestamp: new Date().toISOString(),
    });

    revalidatePath('/');
    return { success: true, batch };
}

export async function getBatchDetails(batchId: string): Promise<BatchDetails | null> {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return null;

    const batchTransfers: EnrichedTransfer[] = transfers
        .filter(t => t.batchId === batchId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map(t => ({
            ...t,
            fromUser: getUser(t.fromId),
            toUser: getUser(t.toId)
        }));

    const farmer = getUser(batch.farmerId);
    const retailer = batch.status === 'At Retailer' || batch.status === 'Sold' 
        ? mockUsers.find(u => u.role === 'retailer') 
        : undefined;

    return {
        batch,
        transfers: batchTransfers,
        farmer,
        retailer
    };
}
