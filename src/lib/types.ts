export type UserRole = 'farmer' | 'distributor' | 'retailer' | 'consumer';

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

export interface GradingCertificate {
  id: string;
  grade: string;
  qualityStandards: string;
  issueDate: string;
  farmerId: string;
  certificateHash: string;
}

export interface Batch {
  id: string; // batchId
  name: string; // From GenAI
  farmerId: string;
  productType: string;
  quantity: number;
  harvestDate: string;
  location: string;
  qualityGrade: string; // From farmer input, becomes part of certificate
  status: BatchStatus;
  metadataHash: string;
  currentOwnerId: string;
  currentPrice?: number;
  priceHistory: PriceHistory[];
  qrCodeUrl: string;
  gradingCertificate?: GradingCertificate;
}

export interface Transfer {
  id:string;
  batchId: string;
  fromId: string;
  toId: string;
  timestamp: string;
  receiptHash: string;
  transportDetails: {
    mode: string;
    vehicleNumber: string;
    driverName: string;
  };
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
