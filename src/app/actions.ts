'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { generateDescriptiveBatchName } from '@/ai/flows/generate-descriptive-batch-name';
import { batches, transfers, mockUsers, getUser } from '@/lib/data';
import type { Batch, BatchDetails, EnrichedTransfer, User, Transfer, GradingCertificate } from '@/lib/types';
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
      qrCodeUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/?role=consumer&batchId=${batchId}`,
    };

    batches.unshift(newBatch);
    revalidatePath('/');
    return { success: true, batch: newBatch };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to create batch.' };
  }
}

const AddCertificateSchema = z.object({
  batchId: z.string(),
  grade: z.string().min(1, "Grade is required."),
  qualityStandards: z.string().min(1, "Quality standard is required."),
});

export async function addGradingCertificateAction(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = AddCertificateSchema.safeParse(rawFormData);
  
  if (!validatedFields.success) {
    return { error: 'Invalid certificate data.' };
  }
  
  const { batchId, grade, qualityStandards } = validatedFields.data;
  const batch = batches.find(b => b.id === batchId);
  if (!batch) return { error: 'Batch not found.' };

  const farmer = getUser(batch.farmerId);
  if (!farmer) return { error: 'Farmer not found.' };
  
  const certificateId = `cert_${batch.id}`;
  const issueDate = new Date().toISOString();

  const certificateDataString = JSON.stringify({ ...validatedFields.data, issueDate, farmerId: farmer.id });
  const certificateHash = createHash('sha256').update(certificateDataString).digest('hex');

  const newCertificate: GradingCertificate = {
    id: certificateId,
    ...validatedFields.data,
    issueDate,
    farmerId: farmer.id,
    certificateHash,
  };

  batch.gradingCertificate = newCertificate;
  // Also update qualityGrade on the batch itself
  batch.qualityGrade = grade;

  revalidatePath('/');
  return { success: true, certificate: newCertificate };
}

export async function getFarmerBatches(farmerId: string) {
  return batches.filter(b => b.farmerId === farmerId);
}


const ClaimBatchSchema = z.object({
  batchId: z.string().min(1, 'Batch ID is required.'),
  transportMode: z.string().min(1, 'Transport mode is required.'),
  vehicleNumber: z.string().min(1, 'Vehicle number is required.'),
  driverName: z.string().min(1, 'Driver name is required.'),
});

export async function claimBatchAction(formData: FormData, distributorId: string) {
    const rawFormData = Object.fromEntries(formData.entries());
    const validatedFields = ClaimBatchSchema.safeParse(rawFormData);
    if (!validatedFields.success) {
        return { error: 'Invalid data provided.' };
    }

    const { batchId, transportMode, vehicleNumber, driverName } = validatedFields.data;
    
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return { error: 'Batch not found.' };
    if (batch.status !== 'At Farm') return { error: 'Batch is not available for claim.' };

    batch.status = 'In Transit';
    batch.currentOwnerId = distributorId;

    const transferId = `transfer_${Date.now()}`;
    const timestamp = new Date().toISOString();
    const receiptData = {
        batchId,
        fromId: batch.farmerId,
        toId: distributorId,
        timestamp,
        quantity: batch.quantity,
        productName: batch.productType,
        transportDetails: {
            mode: transportMode,
            vehicleNumber,
            driverName
        }
    };
    const receiptHash = createHash('sha256').update(JSON.stringify(receiptData)).digest('hex');

    const transfer: Transfer = {
        id: transferId,
        batchId,
        fromId: batch.farmerId,
        toId: distributorId,
        timestamp,
        receiptHash,
        transportDetails: receiptData.transportDetails,
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
    
    // Find the original transfer to the distributor to copy transport details
    const originalTransfer = transfers.find(t => t.batchId === batchId && t.toId === fromDistributorId);
    if (!originalTransfer) return { error: 'Original transfer not found.' };

    batch.status = 'At Retailer';
    batch.currentOwnerId = toRetailerId;

    const transferId = `transfer_${Date.now()}`;
    const timestamp = new Date().toISOString();
    const receiptData = {
        batchId,
        fromId: fromDistributorId,
        toId: toRetailerId,
        timestamp,
        quantity: batch.quantity,
        productName: batch.productType,
        transportDetails: originalTransfer.transportDetails // Carry over transport details
    };
    const receiptHash = createHash('sha256').update(JSON.stringify(receiptData)).digest('hex');

    const transfer: Transfer = {
        id: transferId,
        batchId,
        fromId: fromDistributorId,
        toId: toRetailerId,
        timestamp,
        receiptHash,
        transportDetails: receiptData.transportDetails,
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
        .map(t => {
            const fromUser = getUser(t.fromId);
            const toUser = getUser(t.toId);
            return {
                ...t,
                fromUser,
                toUser
            };
        });

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
