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
import { Input } from '@/components/ui/input';
import { getRetailerBatches, setPriceAction } from '@/app/actions';
import type { User, Batch } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tag, Store, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';

const SetPriceSchema = z.object({
  price: z.coerce.number().min(0.01, 'Price must be greater than 0.'),
});
type SetPriceValues = z.infer<typeof SetPriceSchema>;

function SetPriceDialog({ batch, user, onPriceSet }: { batch: Batch, user: User, onPriceSet: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const form = useForm<SetPriceValues>({
    resolver: zodResolver(SetPriceSchema),
    defaultValues: { price: batch.currentPrice || 0 },
  });

  const onSubmit = (values: SetPriceValues) => {
    startTransition(async () => {
      const result = await setPriceAction(batch.id, user.id, values.price);
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Price set successfully!' });
        onPriceSet();
        setIsOpen(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild><Button><Tag className="mr-2" />Set Price</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Price for {batch.name}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField name="price" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Price ($)</FormLabel>
                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : 'Confirm Price'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function BatchList({ batches, user, onPriceSet }: { batches: Batch[], user: User, onPriceSet: () => void }) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
          <Store /> My Stock
        </CardTitle>
        <CardDescription>Batches you have in stock and ready to sell.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {batches.length === 0 ? <p>You have no batches in stock.</p> : batches.map((batch) => (
            <Card key={batch.id} className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-xl">{batch.name}</CardTitle>
                <CardDescription>ID: {batch.id}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p><strong>Product:</strong> {batch.productType}</p>
                  <p><strong>Current Price:</strong> <span className="font-semibold text-accent-foreground">{batch.currentPrice ? `$${batch.currentPrice.toFixed(2)}` : 'Not set'}</span></p>
                </div>
                <SetPriceDialog batch={batch} user={user} onPriceSet={onPriceSet} />
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function RetailerDashboard({ user }: { user: User }) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBatches = async () => {
    const retailerBatches = await getRetailerBatches(user.id);
    setBatches(retailerBatches);
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
      <BatchList batches={batches} user={user} onPriceSet={fetchBatches} />
    </div>
  );
}
