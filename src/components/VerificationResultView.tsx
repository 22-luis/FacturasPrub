import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertTriangle, ScanSearch } from 'lucide-react';
import type { VerificationResult, VerificationField } from '@/lib/types';
import { cn } from '@/lib/utils';

interface VerificationResultViewProps {
  result: VerificationResult | null;
}

function FieldComparison({ field }: { field: VerificationField }) {
  return (
    <li className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 rounded-md even:bg-muted/30 odd:bg-background">
      <div className="flex items-center gap-2 mb-2 sm:mb-0">
        {field.match ? (
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
        )}
        <span className="text-sm font-medium text-foreground">{field.label}</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs ml-7 sm:ml-0">
        <div className='truncate'>
          <span className="text-muted-foreground">Assigned: </span>
          <span className="font-medium text-foreground">{String(field.assigned)}</span>
        </div>
        <div className='truncate'>
          <span className="text-muted-foreground">Extracted: </span>
          <span className={cn("font-medium", field.extracted === undefined ? "italic text-muted-foreground" : "text-foreground")}>
            {field.extracted !== undefined ? String(field.extracted) : 'Not found'}
          </span>
        </div>
      </div>
    </li>
  );
}

export function VerificationResultView({ result }: VerificationResultViewProps) {
  if (!result) {
    return (
       <Card className="border-dashed">
        <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
                <ScanSearch className="h-6 w-6 text-primary" />
                Verification Pending
            </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Upload an invoice image and extract data to see verification results.</p>
        </CardContent>
      </Card>
    );
  }

  const overallStatusIcon = result.overallMatch ? (
    <CheckCircle2 className="h-8 w-8 text-green-500" />
  ) : (
    <XCircle className="h-8 w-8 text-destructive" />
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          {overallStatusIcon}
          <div>
            <CardTitle className="text-xl">
              {result.overallMatch ? 'Data Matched' : 'Data Mismatch'}
            </CardTitle>
            <CardDescription>
              {result.overallMatch
                ? 'Extracted data matches the assigned invoice details.'
                : 'Some extracted data does not match the assigned invoice details.'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <h4 className="mb-3 text-md font-semibold text-foreground">Field Comparison:</h4>
        {result.fields.length > 0 ? (
          <ul className="space-y-1 rounded-md border">
            {result.fields.map((field, index) => (
              <FieldComparison key={index} field={field} />
            ))}
          </ul>
        ) : (
          <div className="flex items-center space-x-2 text-muted-foreground p-4 border rounded-md">
            <AlertTriangle className="h-5 w-5"/>
            <p>No fields were available for comparison.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
