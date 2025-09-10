'use client';

import { useState, useTransition, useEffect } from 'react';
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
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  claimBatchAction,
  getDistributorBatches,
  transferToRetailerAction,
} from '@/app/actions';
import type { User, Batch } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { QrCode, ClipboardCheck, Truck, Store, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { mockUsers } from '@/lib/data';

const ClaimBatchSchema = z.object({
  batchId: z.string().min(1, 'Batch ID is required.'),
});
type ClaimBatchValues = z.infer<typeof ClaimBatchSchema>;

function ClaimBatchForm({ user, onBatchClaimed }: { user: User, onBatchClaimed: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const form = useForm<ClaimBatchValues>({
    resolver: zodResolver(ClaimBatchSchema),
    defaultValues: { batchId: '' },
  });

  const onSubmit = (values: ClaimBatchValues) => {
    startTransition(async () => {
      const result = await claimBatchAction(values.batchId, user.id);
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Batch claimed successfully!' });
        form.reset();
        onBatchClaimed();
      }
    });
  };

  return (
     <Card className="shadow-lg mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
          <ClipboardCheck /> Claim Batch
        </CardTitle>
        <CardDescription>Enter a batch ID to claim it from a farmer.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
            <FormField name="batchId" control={form.control} render={({ field }) => (
              <FormItem className="flex-grow"><FormControl><Input placeholder="Enter Batch ID..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : 'Claim'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function TransferBatchDialog({ batch, user, onBatchTransferred }: { batch: Batch, user: User, onBatchTransferred: () => void }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const retailer = mockUsers.find(u => u.role === 'retailer');

    const handleTransfer = () => {
        if (!retailer) {
            toast({ title: 'Error', description: 'No retailer found to transfer to.', variant: 'destructive'});
            return;
        }
        startTransition(async () => {
            const result = await transferToRetailerAction(batch.id, user.id, retailer.id);
            if (result.error) {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            } else {
                toast({ title: 'Success', description: `Batch transferred to ${retailer.name}` });
                onBatchTransferred();
            }
        });
    }

    return (
        <Dialog>
            <DialogTrigger asChild><Button><Store className="mr-2" /> Transfer to Retailer</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Transfer Batch: {batch.name}</DialogTitle>
                </DialogHeader>
                <div>
                    <p>You are about to transfer this batch to the retailer:</p>
                    <p className="font-bold my-4">{retailer?.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">This action is irreversible.</p>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={handleTransfer} disabled={isPending}>
                        {isPending ? <Loader2 className="animate-spin" /> : 'Confirm Transfer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function BatchList({ batches, user, onBatchTransferred }: { batches: Batch[], user: User, onBatchTransferred: () => void }) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
          <Truck /> My Inventory
        </CardTitle>
        <CardDescription>Batches you currently have in transit.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {batches.length === 0 ? <p>No batches in your inventory.</p> : batches.map((batch) => (
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
                <TransferBatchDialog batch={batch} user={user} onBatchTransferred={onBatchTransferred} />
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DistributorDashboard({ user }: { user: User }) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBatches = async () => {
    const distributorBatches = await getDistributorBatches(user.id);
    setBatches(distributorBatches);
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
      <ClaimBatchForm user={user} onBatchClaimed={fetchBatches} />
      <BatchList batches={batches} user={user} onBatchTransferred={fetchBatches} />
    </div>
  );
}
