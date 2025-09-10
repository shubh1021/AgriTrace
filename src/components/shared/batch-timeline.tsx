import { Tractor, Truck, Store, CheckCircle2, DollarSign, Info, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { BatchDetails } from '@/lib/types';
import { format } from 'date-fns';

const StatusIcon = ({ status, isLast }: { status: string, isLast: boolean }) => {
  const Icon = {
    'Farmed': Tractor,
    'Distribution': Truck,
    'Retail': Store,
    'Verification': CheckCircle2
  }[status] || Info;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground">
        <Icon className="w-6 h-6" />
      </div>
      {!isLast && <div className="w-px h-16 bg-border mt-2"></div>}
    </div>
  );
};

export function BatchTimeline({ details }: { details: BatchDetails }) {
  const { batch, transfers, farmer } = details;
  
  const timelineEvents = [];

  // Farm event
  if (farmer) {
    timelineEvents.push({
      status: 'Farmed',
      title: `Harvested by ${farmer.name}`,
      details: [
        `Product: ${batch.productType}`,
        `Location: ${batch.location}`,
        `Harvest Date: ${format(new Date(batch.harvestDate), 'PPP')}`,
        `Quantity: ${batch.quantity} kg`,
        `Quality: ${batch.qualityGrade}`
      ]
    });
  }

  // Transfer events
  transfers.forEach(transfer => {
    timelineEvents.push({
      status: 'Distribution',
      title: `Transferred to ${transfer.toUser?.name || 'Unknown'}`,
      details: [
        `Handled by: ${transfer.fromUser?.name || 'Unknown'}`,
        `Date: ${format(new Date(transfer.timestamp), 'PPP p')}`
      ]
    });
  });

  // Retail event
  if (batch.status === 'At Retailer' || batch.status === 'Sold') {
    const retailer = transfers[transfers.length -1]?.toUser;
    const priceEvent = batch.priceHistory[batch.priceHistory.length -1];
    timelineEvents.push({
      status: 'Retail',
      title: `Stocked at ${retailer?.name || 'Retailer'}`,
      details: priceEvent ? [
          `Price set on ${format(new Date(priceEvent.timestamp), 'PPP')}`,
          `Price: $${priceEvent.price.toFixed(2)}`
      ] : ['Awaiting pricing information.']
    });
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign/>Current Status</CardTitle></CardHeader>
            <CardContent>
                <p className="text-2xl font-bold text-primary">{batch.status}</p>
                {batch.currentPrice && <p className="text-xl text-accent mt-2">${batch.currentPrice.toFixed(2)}</p>}
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 />Verification</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                <p className="flex items-center gap-2 text-sm text-muted-foreground"><Hash className="w-4 h-4" />Blockchain Hash:</p>
                <p className="text-xs font-mono break-all bg-muted p-2 rounded-md">{batch.metadataHash}</p>
            </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />
      
      <div>
        {timelineEvents.map((event, index) => (
          <div key={index} className="flex gap-4 md:gap-8">
            <StatusIcon status={event.status} isLast={index === timelineEvents.length - 1} />
            <div className="flex-1 pb-8">
              <Card className="relative top-[-8px] shadow-md">
                <CardHeader>
                  <CardTitle>{event.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    {event.details.map((detail, i) => <li key={i}>{detail}</li>)}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
