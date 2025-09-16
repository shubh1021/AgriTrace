'use client';

import { useState, useTransition, useRef } from 'react';
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
import { useSearchParams } from 'next/navigation';
import { ScanLine, Loader2, FileQuestion, Volume2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useEffect } from 'react';
import { getBatchDetails } from '@/app/actions';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import type { BatchDetails } from '@/lib/types';
import { BatchTimeline } from '../shared/batch-timeline';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { format } from 'date-fns';

const TraceBatchSchema = z.object({
  batchId: z.string().min(1, 'Batch ID is required.'),
});
type TraceBatchValues = z.infer<typeof TraceBatchSchema>;

export function ConsumerView() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [isSynthesizing, startSynthesizingTransition] = useTransition();
  const [details, setDetails] = useState<BatchDetails | null>(null);
  const [notFound, setNotFound] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const form = useForm<TraceBatchValues>({
    resolver: zodResolver(TraceBatchSchema),
    defaultValues: { batchId: searchParams.get('batchId') || '' },
  });

  const onSubmit = (values: TraceBatchValues) => {
    setDetails(null);
    setNotFound(false);
    startTransition(async () => {
      const data = await getBatchDetails(values.batchId);
      if (data) {
        setDetails(data);
      } else {
        setNotFound(true);
      }
    });
  };

  // Automatically submit the form if batchId is in the URL
  useEffect(() => {
    const batchId = searchParams.get('batchId');
    if (batchId) {
      form.setValue('batchId', batchId);
      onSubmit({ batchId });
    }
  }, [searchParams, form]);

  const handleReadAloud = () => {
    if (!details) return;

    startSynthesizingTransition(async () => {
      try {
        const { batch } = details;
        const textToRead = `
          Batch Name: ${batch.name}.
          Product Type: ${batch.productType}.
          Quantity: ${batch.quantity} kilograms.
          Harvest Location: ${batch.location}.
          Harvest Date: ${format(new Date(batch.harvestDate), 'PPP')}.
          Quality Grade: ${batch.qualityGrade}.
          Current Status: ${batch.status}.
          ${batch.currentPrice ? `Current Price: ₹${batch.currentPrice.toFixed(2)}` : ''}
        `;
        const { media } = await textToSpeech(textToRead);
        if (audioRef.current) {
          audioRef.current.src = media;
          audioRef.current.play();
        }
      } catch (error) {
        console.error('Failed to synthesize speech', error);
      }
    });
  };


  return (
    <div className="space-y-8">
      <Card className="shadow-lg max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline text-2xl">
            <ScanLine /> {t('trace_your_produce')}
          </CardTitle>
          <CardDescription>{t('trace_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
              <FormField name="batchId" control={form.control} render={({ field }) => (
                <FormItem className="flex-grow"><FormControl><Input placeholder={t('enter_batch_id')} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : t('trace')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isPending && <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}

      {notFound && (
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <FileQuestion className="h-4 w-4" />
          <AlertTitle>{t('batch_not_found')}</AlertTitle>
          <AlertDescription>
            {t('batch_id_not_found', { batchId: form.getValues('batchId') })}
          </AlertDescription>
        </Alert>
      )}

      {details && (
        <Card className="w-full max-w-4xl mx-auto shadow-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center items-center gap-4">
                <CardTitle className="font-headline text-4xl">{details.batch.name}</CardTitle>
                <Button onClick={handleReadAloud} variant="ghost" size="icon" disabled={isSynthesizing}>
                  {isSynthesizing ? <Loader2 className="animate-spin" /> : <Volume2 />}
                </Button>
              </div>
              <CardDescription className="text-lg">{t('supply_chain_journey')}</CardDescription>
            </CardHeader>
            <CardContent>
              <BatchTimeline details={details} t={t} />
            </CardContent>
        </Card>
      )}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
