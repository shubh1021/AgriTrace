import { Tractor, Truck, Store, CheckCircle2, DollarSign, Info, Hash, Award, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { BatchDetails, User, EnrichedTransfer } from '@/lib/types';
import { format } from 'date-fns';
import { getUser } from '@/lib/data';

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

const FarmEventCard = ({ batch, farmer, t }: { batch: BatchDetails['batch'], farmer: User | undefined, t: (key: string) => string}) => {
  return (
    <Card className="relative top-[-8px] shadow-md">
      <CardHeader>
        <CardTitle>{t('harvested_by')} {farmer?.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p><strong>{t('product')}:</strong> {batch.productType}</p>
        <p><strong>{t('location')}:</strong> {batch.location}</p>
        <p><strong>{t('harvest_date')}:</strong> {format(new Date(batch.harvestDate), 'PPP')}</p>
        <p><strong>{t('quantity')}:</strong> {batch.quantity} kg</p>
        
        {batch.gradingCertificate ? (
          <div className="pt-2 border-t mt-2">
            <p className="font-semibold flex items-center gap-2"><Award size={16} />{t('quality_certificate')}</p>
            <p className="text-sm"><strong>{t('grade')}:</strong> {batch.gradingCertificate.grade}</p>
            <p className="text-sm"><strong>{t('standards')}:</strong> {batch.gradingCertificate.qualityStandards}</p>
            <p className="text-sm"><strong>{t('issued_on')}:</strong> {format(new Date(batch.gradingCertificate.issueDate), 'PPP')}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground pt-2 border-t mt-2">{t('no_grading_certificate')}</p>
        )}
      </CardContent>
    </Card>
  )
}

const TransferEventCard = ({ transfer, t }: { transfer: EnrichedTransfer, t: (key: string) => string}) => {
  return (
     <Card className="relative top-[-8px] shadow-md">
      <CardHeader>
        <CardTitle>{t('transferred_from_to', { from: transfer.fromUser?.name || t('unknown'), to: transfer.toUser?.name || t('unknown')})}</CardTitle>
        <CardDescription>{t('date')}: {format(new Date(transfer.timestamp), 'PPP p')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="pt-2 border-t">
            <p className="font-semibold flex items-center gap-2"><Receipt size={16} />{t('digital_receipt')}</p>
            <p className="text-sm"><strong>{t('transport_mode')}:</strong> {transfer.transportDetails.mode}</p>
            <p className="text-sm"><strong>{t('vehicle_number')}:</strong> {transfer.transportDetails.vehicleNumber}</p>
            <p className="text-sm"><strong>{t('driver_name')}:</strong> {transfer.transportDetails.driverName}</p>
        </div>
         <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">{t('receipt_hash')}:</p>
            <p className="text-xs font-mono break-all bg-muted p-2 rounded-md">{transfer.receiptHash}</p>
        </div>
      </CardContent>
    </Card>
  )
}

const RetailEventCard = ({ batch, t }: { batch: BatchDetails['batch'], t: (key: string) => string}) => {
    const retailer = batch.currentOwnerId ? getUser(batch.currentOwnerId) : undefined;
    const priceEvent = batch.priceHistory[batch.priceHistory.length - 1];

    return (
        <Card className="relative top-[-8px] shadow-md">
            <CardHeader>
                 <CardTitle>{t('stocked_at')} {retailer?.name || t('retailer')}</CardTitle>
            </CardHeader>
            <CardContent>
            {priceEvent ? (
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>{t('price_set_on')} {format(new Date(priceEvent.timestamp), 'PPP')}</li>
                    <li>{t('price')}: ₹{priceEvent.price.toFixed(2)}</li>
                </ul>
                ) : (
                <p>{t('awaiting_pricing_information')}</p>
            )}
            </CardContent>
        </Card>
    )
}

export function BatchTimeline({ details, t }: { details: BatchDetails | null, t: (key: string) => string }) {
  if (!details) {
    return null;
  }
  const { batch, transfers } = details;
  const farmer = getUser(batch.farmerId);
  
  const timelineEvents = [];

  // Farm event
  if (farmer) {
    timelineEvents.push({
      status: 'Farmed',
      component: <FarmEventCard batch={batch} farmer={farmer} t={t} />
    });
  }

  // Transfer events
  transfers.forEach(transfer => {
    timelineEvents.push({
      status: 'Distribution',
      component: <TransferEventCard transfer={transfer} t={t} />
    });
  });

  // Retail event
  if (batch.status === 'At Retailer' || batch.status === 'Sold') {
    timelineEvents.push({
        status: 'Retail',
        component: <RetailEventCard batch={batch} t={t} />
    });
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign/>{t('current_status')}</CardTitle></CardHeader>
            <CardContent>
                <p className="text-2xl font-bold text-primary">{t(batch.status.replace(/\s/g, ''))}</p>
                {batch.currentPrice && <p className="text-xl text-accent-foreground mt-2">₹{batch.currentPrice.toFixed(2)}</p>}
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 />{t('verification')}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                <p className="flex items-center gap-2 text-sm text-muted-foreground"><Hash className="w-4 h-4" />{t('blockchain_hash')}:</p>
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
              {event.component}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
