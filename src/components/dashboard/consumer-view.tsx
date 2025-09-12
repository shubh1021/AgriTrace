'use client';

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
import { useRouter } from 'next/navigation';
import { ScanLine } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

const TraceBatchSchema = z.object({
  batchId: z.string().min(1, 'Batch ID is required.'),
});
type TraceBatchValues = z.infer<typeof TraceBatchSchema>;

export function ConsumerView() {
  const router = useRouter();
  const { t } = useLanguage();
  const form = useForm<TraceBatchValues>({
    resolver: zodResolver(TraceBatchSchema),
    defaultValues: { batchId: '' },
  });

  const onSubmit = (values: TraceBatchValues) => {
    router.push(`/batches/${values.batchId}`);
  };

  return (
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
            <Button type="submit">{t('trace')}</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
