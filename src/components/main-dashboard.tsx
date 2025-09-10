'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tractor, Truck, Store, Scan } from 'lucide-react';
import type { User, UserRole } from '@/lib/types';
import { mockUsers, getUserByRole } from '@/lib/data';

const FarmerDashboard = dynamic(() => import('./dashboard/farmer-dashboard').then(mod => mod.FarmerDashboard));
const DistributorDashboard = dynamic(() => import('./dashboard/distributor-dashboard').then(mod => mod.DistributorDashboard));
const RetailerDashboard = dynamic(() => import('./dashboard/retailer-dashboard').then(mod => mod.RetailerDashboard));
const ConsumerView = dynamic(() => import('./dashboard/consumer-view').then(mod => mod.ConsumerView));

const roles: { name: UserRole; icon: React.ReactNode }[] = [
  { name: 'farmer', icon: <Tractor className="mr-2 h-5 w-5" /> },
  { name: 'distributor', icon: <Truck className="mr-2 h-5 w-5" /> },
  { name: 'retailer', icon: <Store className="mr-2 h-5 w-5" /> },
  { name: 'consumer', icon: <Scan className="mr-2 h-5 w-5" /> },
];

export function MainDashboard() {
  const [activeRole, setActiveRole] = useState<UserRole>('farmer');
  const activeUser = getUserByRole(activeRole) || mockUsers[0];

  const renderDashboard = () => {
    if (!activeUser) return <p>Select a role to begin.</p>;

    switch (activeRole) {
      case 'farmer':
        return <FarmerDashboard user={activeUser} />;
      case 'distributor':
        return <DistributorDashboard user={activeUser} />;
      case 'retailer':
        return <RetailerDashboard user={activeUser} />;
      case 'consumer':
        return <ConsumerView />;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div className="md:col-span-1">
        <Card className="sticky top-24 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Select Your Role</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col space-y-2">
            {roles.map(({ name, icon }) => (
              <Button
                key={name}
                variant={activeRole === name ? 'default' : 'ghost'}
                className="w-full justify-start text-base py-6"
                onClick={() => setActiveRole(name)}
              >
                {icon}
                <span className="capitalize">{name}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-3">
        {renderDashboard()}
      </div>
    </div>
  );
}
