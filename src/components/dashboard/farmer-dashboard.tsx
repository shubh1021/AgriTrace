'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createBatchAction, getFarmerBatches } from '@/app/actions';
import type { User, Batch } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { QrCode, PlusCircle, Sprout, Loader2 } from 'lucide-react';
import { QRCodeDisplay } from '../shared/qr-code-display';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useEffect } from 'react';

const CreateBatchSchema = z.object({
  productType: z.string().min(2, 'Too short').default('Tomatoes'),
  quantity: z.coerce.number().min(1).default(100),
  location: z.string().min(2, 'Too short').default('Salinas, CA'),
  harvestDate: z.string().default('2024-07-30'),
  qualityGrade: z.string().min(1, 'Required').default('Grade A'),
});
type CreateBatchValues = z.infer<typeof CreateBatchSchema>;

function CreateBatchForm({ onBatchCreated }: { onBatchCreated: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const form = useForm<CreateBatchValues>({
    resolver: zodResolver(CreateBatchSchema),
    defaultValues: {
      productType: 'Tomatoes',
      quantity: 100,
      location: 'Salinas, CA',
      harvestDate: new Date().toISOString().split('T')[0],
      qualityGrade: 'Premium',
    },
  });

  const onSubmit = (values: CreateBatchValues) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      const result = await createBatchAction(formData);
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'New batch created successfully!' });
        form.reset();
        onBatchCreated();
      }
    });
  };

  return (
    <Card className="shadow-lg mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
          <PlusCircle /> Create New Batch
        </CardTitle>
        <CardDescription>Enter the details for the new produce batch.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="productType" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Product Type</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="quantity" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Quantity (kg)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="location" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Harvest Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="harvestDate" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Harvest Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="qualityGrade" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Quality Grade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <Button type="submit" disabled={isPending} className="w-full md:w-auto" variant="default">
              {isPending ? <Loader2 className="animate-spin" /> : 'Create Batch'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function BatchList({ batches, user }: { batches: Batch[], user: User }) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
          <Sprout /> My Batches
        </CardTitle>
        <CardDescription>A list of all produce batches you have created.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {batches.length === 0 ? <p>No batches created yet.</p> : batches.map((batch) => (
            <Card key={batch.id} className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-xl">{batch.name}</CardTitle>
                <CardDescription>ID: {batch.id}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p><strong>Product:</strong> {batch.productType}</p>
                  <p><strong>Quantity:</strong> {batch.quantity} kg</p>
                  <p><strong>Status:</strong> <span className="font-semibold text-primary">{batch.status}</span></p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline"><QrCode className="mr-2" /> Show QR Code</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>QR Code for {batch.name}</DialogTitle>
                    </DialogHeader>
                    <QRCodeDisplay url={batch.qrCodeUrl} />
                    <p className="text-center text-sm text-muted-foreground">Scan to trace this batch</p>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


export function FarmerDashboard({ user }: { user: User }) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBatches = async () => {
    const farmerBatches = await getFarmerBatches(user.id);
    setBatches(farmerBatches);
    setIsLoading(false);
  }

  useEffect(() => {
    fetchBatches();
  }, [user.id]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-8">
      <CreateBatchForm onBatchCreated={fetchBatches} />
      <BatchList batches={batches} user={user} />
    </div>
  );
}
