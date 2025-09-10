import type { User, Batch, Transfer, UserRole } from './types';

export const mockUsers: User[] = [
  { id: 'user_farmer_1', name: 'Green Valley Farms', role: 'farmer', email: 'farmer@example.com' },
  { id: 'user_distributor_1', name: 'Fresh-Link Logistics', role: 'distributor', email: 'distributor@example.com' },
  { id: 'user_retailer_1', name: 'The Corner Market', role: 'retailer', email: 'retailer@example.com' },
  { id: 'user_consumer_1', name: 'Jane Doe', role: 'consumer', email: 'consumer@example.com' },
];

export const getUser = (id: string): User | undefined => mockUsers.find(u => u.id === id);
export const getUserByRole = (role: UserRole): User | undefined => mockUsers.find(u => u.role === role);

export let batches: Batch[] = [];
export let transfers: Transfer[] = [];

// Helper to reset data for demo purposes
export const resetData = () => {
  batches = [];
  transfers = [];
};
