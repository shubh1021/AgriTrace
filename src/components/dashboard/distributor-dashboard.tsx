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
import { useLanguage } from '@/context/language-context';

const ClaimBatchSchema = z.object({
  batchId: z.string().min(1, 'Batch ID is required.'),
});
type ClaimBatchValues = z.infer<typeof ClaimBatchSchema>;

function ClaimBatchForm({ user, onBatchClaimed }: { user: User, onBatchClaimed: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { t } = useLanguage();
  const form = useForm<ClaimBatchValues>({
    resolver: zodResolver(ClaimBatchSchema),
    defaultValues: { batchId: '' },
  });

  const onSubmit = (values: ClaimBatchValues) => {
    startTransition(async () => {
      const result = await claimBatchAction(values.batchId, user.id);
      if (result.error) {
        toast({ title: t('error'), description: result.error, variant: 'destructive' });
      } else {
        toast({ title: t('success'), description: t('batch_claimed_successfully') });
        form.reset();
        onBatchClaimed();
      }
    });
  };

  return (
     <Card className="shadow-lg mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
          <ClipboardCheck /> {t('claim_batch')}
        </CardTitle>
        <CardDescription>{t('claim_batch_description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
            <FormField name="batchId" control={form.control} render={({ field }) => (
              <FormItem className="flex-grow"><FormControl><Input placeholder={t('enter_batch_id_placeholder')} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : t('claim')}
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
    const { t } = useLanguage();
    const retailer = mockUsers.find(u => u.role === 'retailer');

    const handleTransfer = () => {
        if (!retailer) {
            toast({ title: t('error'), description: t('no_retailer_found'), variant: 'destructive'});
            return;
        }
        startTransition(async () => {
            const result = await transferToRetailerAction(batch.id, user.id, retailer.id);
            if (result.error) {
                toast({ title: t('error'), description: result.error, variant: 'destructive' });
            } else {
                toast({ title: t('success'), description: t('batch_transferred_successfully', { retailerName: retailer.name }) });
                onBatchTransferred();
            }
        });
    }

    return (
        <Dialog>
            <DialogTrigger asChild><Button><Store className="mr-2" /> {t('transfer_to_retailer')}</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('transfer_batch')}: {batch.name}</DialogTitle>
                </DialogHeader>
                <div>
                    <p>{t('transfer_to_retailer_confirmation')}</p>
                    <p className="font-bold my-4">{retailer?.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{t('action_irreversible')}</p>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">{t('cancel')}</Button></DialogClose>
                    <Button onClick={handleTransfer} disabled={isPending}>
                        {isPending ? <Loader2 className="animate-spin" /> : t('confirm_transfer')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function BatchList({ batches, user, onBatchTransferred }: { batches: Batch[], user: User, onBatchTransferred: () => void }) {
  const { t } = useLanguage();
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
          <Truck /> {t('my_inventory')}
        </CardTitle>
        <CardDescription>{t('my_inventory_description_distributor')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {batches.length === 0 ? <p>{t('no_batches_in_inventory')}</p> : batches.map((batch) => (
            <Card key={batch.id} className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-xl">{batch.name}</CardTitle>
                <CardDescription>ID: {batch.id}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div>
                  <p><strong>{t('product')}:</strong> {batch.productType}</p>
                  <p><strong>{t('quantity')}:</strong> {batch.quantity} kg</p>
                  <p><strong>{t('status')}:</strong> <span className="font-semibold text-primary">{batch.status}</span></p>
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
