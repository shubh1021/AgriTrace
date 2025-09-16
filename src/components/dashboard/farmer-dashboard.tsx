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
  CardFooter,
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
import { createBatchAction, getFarmerBatches, addGradingCertificateAction } from '@/app/actions';
import type { User, Batch } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { QrCode, PlusCircle, Sprout, Loader2, Award, FileText } from 'lucide-react';
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
import { useLanguage } from '@/context/language-context';
import { format } from 'date-fns';

const CreateBatchSchema = z.object({
  productType: z.string().min(2, 'Too short'),
  quantity: z.coerce.number().min(1),
  location: z.string().min(2, 'Too short'),
  harvestDate: z.string(),
  qualityGrade: z.string().min(1, 'Required'),
});
type CreateBatchValues = z.infer<typeof CreateBatchSchema>;

function CreateBatchForm({ onBatchCreated, form }: { onBatchCreated: () => void; form: ReturnType<typeof useForm<CreateBatchValues>> }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { t } = useLanguage();

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
            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : t('create_batch')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

const AddCertificateSchema = z.object({
  grade: z.string().min(1, 'Required'),
  qualityStandards: z.string().min(1, 'Required'),
});
type AddCertificateValues = z.infer<typeof AddCertificateSchema>;

function GradingCertificateDialog({ batch, onCertificateAdded }: { batch: Batch, onCertificateAdded: () => void }) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const form = useForm<AddCertificateValues>({
    resolver: zodResolver(AddCertificateSchema),
    defaultValues: { grade: batch.qualityGrade, qualityStandards: '' },
  });

  const onSubmit = (values: AddCertificateValues) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('batchId', batch.id);
      formData.append('grade', values.grade);
      formData.append('qualityStandards', values.qualityStandards);

      const result = await addGradingCertificateAction(formData);
      if (result.error) {
        toast({ title: t('error'), description: result.error, variant: 'destructive' });
      } else {
        toast({ title: t('success'), description: t('certificate_generated_successfully') });
        onCertificateAdded();
        setIsOpen(false);
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm"><Award className="mr-2" /> {t('add_grading_certificate')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('generate_quality_certificate')}</DialogTitle>
          <CardDescription>{t('for_batch')} {batch.name}</CardDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField name="grade" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>{t('final_grade')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="qualityStandards" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>{t('quality_standards_met')}</FormLabel><FormControl><Input {...field} placeholder={t('e_g_usda_organic_iso_22000')} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">{t('cancel')}</Button></DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : t('generate_certificate')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ViewCertificateDialog({ batch }: { batch: Batch }) {
  const { t } = useLanguage();
  if (!batch.gradingCertificate) return null;

  const cert = batch.gradingCertificate;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><FileText className="mr-2" />{t('view_certificate')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Award /> {t('quality_certificate')}</DialogTitle>
          <CardDescription>ID: {cert.id}</CardDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p><strong>{t('batch_name')}:</strong> {batch.name}</p>
          <p><strong>{t('grade')}:</strong> <span className="font-bold text-primary">{cert.grade}</span></p>
          <p><strong>{t('quality_standards')}:</strong> {cert.qualityStandards}</p>
          <p><strong>{t('issue_date')}:</strong> {format(new Date(cert.issueDate), 'PPP')}</p>
          <p><strong>{t('issued_by')}:</strong> {t('farmer')}</p>
          <div className="space-y-1">
            <p className="text-sm font-medium">{t('certificate_hash')}</p>
            <p className="text-xs font-mono break-all bg-muted p-2 rounded-md">{cert.certificateHash}</p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button>{t('close')}</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BatchList({ batches, onCertificateAdded }: { batches: Batch[], onCertificateAdded: () => void }) {
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
              <CardContent>
                <div>
                  <p><strong>{t('product')}:</strong> {batch.productType}</p>
                  <p><strong>{t('quantity')}:</strong> {batch.quantity} kg</p>
                  <p><strong>{t('status')}:</strong> <span className="font-semibold text-primary">{batch.status}</span></p>
                  <p><strong>{t('quality')}:</strong> <span className="font-semibold">{batch.qualityGrade}</span></p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                 <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm"><QrCode className="mr-2" /> {t('show_qr_code')}</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('qr_code_for')} {batch.name}</DialogTitle>
                    </DialogHeader>
                    <QRCodeDisplay url={batch.qrCodeUrl} />
                    <p className="text-center text-sm text-muted-foreground">{t('scan_to_trace')}</p>
                  </DialogContent>
                </Dialog>
                {batch.gradingCertificate ? (
                  <ViewCertificateDialog batch={batch} />
                ) : (
                  <GradingCertificateDialog batch={batch} onCertificateAdded={onCertificateAdded} />
                )}
              </CardFooter>
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

  const fetchBatches = async () => {
    setIsLoading(true);
    const farmerBatches = await getFarmerBatches(user.id);
    setBatches(farmerBatches);
    setIsLoading(false);
  }

  useEffect(() => {
    fetchBatches();
  }, [user.id]);
  
  const handleUpdate = () => {
    fetchBatches();
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-8">
      <CreateBatchForm 
        onBatchCreated={handleUpdate} 
        form={form}
      />
      <BatchList batches={batches} onCertificateAdded={handleUpdate} />
    </div>
  );
}
