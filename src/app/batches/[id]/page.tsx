import { getBatchDetails } from '@/app/actions';
import { BatchTimeline } from '@/components/shared/batch-timeline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileQuestion } from 'lucide-react';
import { LanguageProvider, useLanguage } from '@/context/language-context';

type BatchPageProps = {
  params: { id: string };
};

function BatchPageComponent({ params }: BatchPageProps) {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="w-full max-w-4xl mx-auto shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-4xl">{t('batch_name_placeholder')}</CardTitle>
          <CardDescription className="text-lg">{t('supply_chain_journey')}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* BatchTimeline does not have access to language context, so we pass t */}
          <BatchTimeline details={null} t={t} />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function BatchPage({ params }: BatchPageProps) {
  const data = await getBatchDetails(params.id);

  if (!data) {
    return (
      <div className="container mx-auto p-8">
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <FileQuestion className="h-4 w-4" />
          <AlertTitle>Batch Not Found</AlertTitle>
          <AlertDescription>
            The batch ID "{params.id}" could not be found. Please check the ID and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="w-full max-w-4xl mx-auto shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-4xl">{data.batch.name}</CardTitle>
          <CardDescription className="text-lg">Supply Chain Journey</CardDescription>
        </CardHeader>
        <CardContent>
          <BatchTimeline details={data} t={(key: string) => key} />
        </CardContent>
      </Card>
    </div>
  );
}
