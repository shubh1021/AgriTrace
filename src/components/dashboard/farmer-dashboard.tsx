'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
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
import { QrCode, PlusCircle, Sprout, Loader2, Mic, MicOff } from 'lucide-react';
import { QRCodeDisplay } from '../shared/qr-code-display';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/context/language-context';
import { batchCreationAssistant } from '@/ai/flows/batch-creation-assistant';
import type { ConversationMessage, BatchData } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '../ui/avatar';

const CreateBatchSchema = z.object({
  productType: z.string().min(2, 'Too short'),
  quantity: z.coerce.number().min(1),
  location: z.string().min(2, 'Too short'),
  harvestDate: z.string(),
  qualityGrade: z.string().min(1, 'Required'),
});
type CreateBatchValues = z.infer<typeof CreateBatchSchema>;

function AiAssistantDialog({
  isOpen,
  onOpenChange,
  onFormComplete,
  messages,
  setMessages
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFormComplete: (data: Partial<CreateBatchValues>) => void;
  messages: ConversationMessage[];
  setMessages: (messages: ConversationMessage[]) => void;
}) {
  const { t } = useLanguage();
  const [isAssistantPending, startAssistantTransition] = useTransition();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const speak = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const processResponse = (text: string) => {
    if (!text) return;
    const userMessage: ConversationMessage = { role: 'user', content: text };
    setMessages([...messages, userMessage]);

    startAssistantTransition(async () => {
      try {
        const result = await batchCreationAssistant({ history: [...messages, userMessage] });

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: result.responseText },
        ]);
        
        speak(result.responseText);
        
        if (result.isComplete) {
            stopRecording();
            onFormComplete(result.extractedData);
            toast({
              title: 'Form Complete!',
              description: 'The form has been filled with the extracted details.',
            });
        }
      } catch (error) {
        console.error('Error processing response:', error);
        toast({
          title: t('error'),
          description: 'The assistant encountered an error.',
          variant: 'destructive',
        });
        stopRecording();
      }
    });
  };

  const startRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(false);
      recognitionRef.current.stop();
    }
  };
  
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      window.speechSynthesis?.cancel();
      return;
    }
    
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim();
        const userMessage: ConversationMessage = { role: 'user', content: transcript };
        setMessages((prev) => [...prev, userMessage]);
        processResponse(transcript);
      };
      
      recognition.onend = () => {
         setIsRecording(false);
      };

      recognition.onerror = (event) => {
        if (event.error === 'no-speech') {
            stopRecording();
            return;
        }
        console.error("Speech recognition error", event.error);
        toast({ title: "Voice Error", description: `Speech recognition error: ${event.error}`, variant: "destructive"})
        setIsRecording(false);
      };
      
      recognitionRef.current = recognition;

    } else {
        toast({ title: "Unsupported Browser", description: "Your browser does not support voice recognition.", variant: "destructive"})
    }

    if(messages.length === 0){
        startAssistantTransition(async () => {
            try {
                const result = await batchCreationAssistant({ history: [] });
                const initialMessage = { role: 'assistant', content: result.responseText };
                setMessages([initialMessage]);
                speak(initialMessage.content);
            } catch (e) {
                toast({title: "Assistant Error", description: "Could not start the AI assistant."})
            }
        });
    }

    return () => {
        stopRecording();
        window.speechSynthesis?.cancel();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic /> {t('ai_assistant')}
          </DialogTitle>
        </DialogHeader>
        <div className="h-[32rem] flex flex-col">
          <ScrollArea className="flex-1 p-4 pr-6">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : '')}>
                  {msg.role === 'assistant' && <Avatar className="w-8 h-8"><AvatarFallback>AI</AvatarFallback></Avatar>}
                  <div className={cn("rounded-lg px-4 py-2 max-w-sm", msg.role === 'assistant' ? 'bg-muted' : 'bg-primary text-primary-foreground')}>
                    <p>{msg.content}</p>
                  </div>
                </div>
              ))}
              {(isAssistantPending || isRecording) && (
                 <div className="flex items-start gap-3 justify-center py-4">
                    <div className={cn("rounded-full p-4", isRecording ? 'bg-red-500/20' : 'bg-muted')}>
                       <Mic className={cn("w-6 h-6", isRecording ? 'text-red-500' : 'text-muted-foreground')} />
                    </div>
                 </div>
              )}
            </div>
          </ScrollArea>
           <div className="p-4 border-t flex items-center justify-center">
             <Button 
                variant="outline" 
                size="icon" 
                className="w-16 h-16 rounded-full" 
                onClick={toggleRecording}
                disabled={isAssistantPending}
            >
                {isRecording ? <MicOff /> : <Mic />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateBatchForm({ onBatchCreated, onAssistantOpen, form }: { onBatchCreated: () => void; onAssistantOpen: () => void; form: ReturnType<typeof useForm<CreateBatchValues>> }) {
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
               <Button type="button" variant="outline" onClick={onAssistantOpen}>
                <Mic className="mr-2" />
                {t('create_with_ai_assistant')}
              </Button>
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
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  
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
    const farmerBatches = await getFarmerBatches(user.id);
    setBatches(farmerBatches);
    setIsLoading(false);
  }

  useEffect(() => {
    fetchBatches();
  }, [user.id]);

  const handleFormComplete = (data: Partial<BatchData>) => {
    // This function is called when the assistant has all the data.
    // It will fill the form and close the dialog.
    Object.entries(data).forEach(([key, value]) => {
      if (value) {
        form.setValue(key as keyof CreateBatchValues, value);
      }
    });
    setIsAssistantOpen(false);
  };
  
  const handleBatchCreated = () => {
    setMessages([]);
    fetchBatches();
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-8">
      <CreateBatchForm 
        onBatchCreated={handleBatchCreated} 
        onAssistantOpen={() => setIsAssistantOpen(true)}
        form={form}
      />
      <BatchList batches={batches} user={user} />
      <AiAssistantDialog 
        isOpen={isAssistantOpen}
        onOpenChange={setIsAssistantOpen}
        onFormComplete={handleFormComplete}
        messages={messages}
        setMessages={setMessages}
      />
    </div>
  );
}
