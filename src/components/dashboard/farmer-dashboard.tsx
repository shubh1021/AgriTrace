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
import { QrCode, PlusCircle, Sprout, Loader2, Mic } from 'lucide-react';
import { QRCodeDisplay } from '../shared/qr-code-display';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useEffect } from 'react';
import { useLanguage } from '@/context/language-context';

const CreateBatchSchema = z.object({
  productType: z.string().min(2, 'Too short'),
  quantity: z.coerce.number().min(1),
  location: z.string().min(2, 'Too short'),
  harvestDate: z.string(),
  qualityGrade: z.string().min(1, 'Required'),
});
type CreateBatchValues = z.infer<typeof CreateBatchSchema>;

function AiAssistantDialog({
  onBatchCreated,
}: {
  onBatchCreated: () => void;
}) {
  const { t } = useLanguage();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Mic className="mr-2" /> {t('create_with_ai_assistant')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('ai_batch_creation_assistant')}</DialogTitle>
          <CardDescription>{t('ai_assistant_description')}</CardDescription>
        </DialogHeader>
        <div className="mt-4 h-96 flex items-center justify-center bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">{t('voice_assistant_feature_coming_soon')}</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">{t('close')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateBatchForm({ onBatchCreated }: { onBatchCreated: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { t } = useLanguage();
  const form = useForm<CreateBatchValues>({
    resolver: zodResolver(CreateBatchSchema),
    defaultValues: {
      productType: '',
      quantity: 100,
      location: '',
      harvestDate: new Date().toISOString().split('T')[0],
      qualityGrade: '',
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
        toast({ title: t('error'), description: result.error, variant: 'destructive' });
      } else {
        toast({ title: t('success'), description: t('new_batch_created_successfully') });
        form.reset({
          productType: '',
          quantity: 100,
          location: '',
          harvestDate: new Date().toISOString().split('T')[0],
          qualityGrade: '',
        });
        onBatchCreated();
      }
    });
  };

  return (
    <Card className="shadow-lg mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
          <PlusCircle /> {t('create_new_batch')}
        </CardTitle>
        <CardDescription>{t('create_new_batch_description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="productType" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>{t('product_type')}</FormLabel><FormControl><Input {...field} placeholder={t('product_type_placeholder')} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="quantity" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>{t('quantity_kg')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="location" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>{t('harvest_location')}</FormLabel><FormControl><Input {...field} placeholder={t('harvest_location_placeholder')} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="harvestDate" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>{t('harvest_date')}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="qualityGrade" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>{t('quality_grade')}</FormLabel><FormControl><Input {...field} placeholder={t('quality_grade_placeholder')} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="flex items-center gap-4">
              <Button type="submit" disabled={isPending} variant="default">
                {isPending ? <Loader2 className="animate-spin" /> : t('create_batch')}
              </Button>
              <AiAssistantDialog onBatchCreated={onBatchCreated} />
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function BatchList({ batches, user }: { batches: Batch[], user: User }) {
  const { t } = useLanguage();
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
          <Sprout /> {t('my_batches')}
        </CardTitle>
        <CardDescription>{t('my_batches_description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {batches.length === 0 ? <p>{t('no_batches_created_yet')}</p> : batches.map((batch) => (
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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline"><QrCode className="mr-2" /> {t('show_qr_code')}</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('qr_code_for')} {batch.name}</DialogTitle>
                    </DialogHeader>
                    <QRCodeDisplay url={batch.qrCodeUrl} />
                    <p className="text-center text-sm text-muted-foreground">{t('scan_to_trace')}</p>
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
