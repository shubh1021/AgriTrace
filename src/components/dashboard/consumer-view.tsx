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

const TraceBatchSchema = z.object({
  batchId: z.string().min(1, 'Batch ID is required.'),
});
type TraceBatchValues = z.infer<typeof TraceBatchSchema>;

export function ConsumerView() {
  const router = useRouter();
  const form = useForm<TraceBatchValues>({
    resolver: zodResolver(TraceBatchSchema),
    defaultValues: { batchId: '' },
  });

  const onSubmit = (values: TraceBatchValues) => {
    router.push(`/batches/${values.batchId}`);
  };

  return (
    <Card className="shadow-lg max-w-lg mx-auto border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
          <ScanLine /> Trace Your Produce
        </CardTitle>
        <CardDescription>Enter the Batch ID from the product's QR code to see its full journey.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
            <FormField name="batchId" control={form.control} render={({ field }) => (
              <FormItem className="flex-grow"><FormControl><Input placeholder="Enter Batch ID..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <Button type="submit">Trace</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
