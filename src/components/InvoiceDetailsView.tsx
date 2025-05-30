import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeDollarSign, CalendarDays, Hash, Building, Fingerprint, FileText } from 'lucide-react'; // Added FileText for invoice number
import type { ExtractedInvoiceDetails, AssignedInvoice } from '@/lib/types';

type InvoiceData = Partial<ExtractedInvoiceDetails & Pick<AssignedInvoice, 'uniqueCode'>>;

interface InvoiceDetailsViewProps {
  title: string;
  data: InvoiceData;
  variant?: 'assigned' | 'extracted';
}

const iconMap: Record<keyof InvoiceData, React.ReactNode> = {
  invoiceNumber: <Hash className="h-5 w-5 text-muted-foreground" />,
  date: <CalendarDays className="h-5 w-5 text-muted-foreground" />,
  totalAmount: <BadgeDollarSign className="h-5 w-5 text-muted-foreground" />,
  supplierName: <Building className="h-5 w-5 text-muted-foreground" />,
  uniqueCode: <Fingerprint className="h-5 w-5 text-muted-foreground" />,
};

const labelMap: Record<keyof InvoiceData, string> = {
  invoiceNumber: 'Invoice Number',
  date: 'Date',
  totalAmount: 'Total Amount',
  supplierName: 'Supplier Name',
  uniqueCode: 'Unique Code',
};

export function InvoiceDetailsView({ title, data, variant = 'assigned' }: InvoiceDetailsViewProps) {
  const entries = Object.entries(data).filter(([, value]) => value !== undefined && value !== null);

  return (
    <Card className={variant === 'assigned' ? "bg-secondary/30" : ""}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {variant === 'assigned' ? 
            <FileText className="h-6 w-6 text-primary" /> : 
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary lucide lucide-wand-2"><path d="m3 21 9-9"/><path d="M11.5 2.5c.13-.26.34-.5.6-.7.24-.18.5-.32.78-.4.22-.07.45-.1.68-.1H14c.36.01.7.12 1 .33.32.2.56.5.72.87.2.42.32.89.32 1.38V6c0 .51-.12 1-.32 1.44a2.26 2.26 0 0 1-.72.9c-.28.24-.59.4-.92.48-.24.06-.48.1-.72.1H13c-.42 0-.83-.1-1.22-.34-.32-.2-.56-.5-.72-.87-.2-.42-.32-.89-.32-1.38V3.5c0-.5.12-1 .32-1.42Z"/><path d="M18 14V5"/><path d="m18 21-3.5-3.5"/><path d="M21 21H11.5"/><path d="M18 8c.2-.16.38-.36.5-.6s.2-.5.2-.8V6c0-.3-.1-.58-.2-.82s-.28-.45-.5-.6c-.22-.15-.48-.24-.75-.28s-.54-.04-.8 0c-.28.03-.54.12-.78.24s-.45.28-.63.5a2.7 2.7 0 0 0-.5 1.62V7c0 .3.1.58.2.82s.28.45.5.6c.22.15.48.24.75.28s.54.04.8 0c.28-.03.54-.12.78-.24s.45-.28.63-.5a2.7 2.7 0 0 0 .5-1.62Z"/></svg>
            // Using inline SVG for Wand2 as it's not directly in lucide-react standard set
          }
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data available.</p>
        ) : (
          <ul className="space-y-3">
            {(Object.keys(labelMap) as Array<keyof InvoiceData>).map((key) => {
              const value = data[key];
              if (value === undefined || value === null) return null;
              
              return (
                <li key={key} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 mt-0.5">{iconMap[key]}</span>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{labelMap[key]}</p>
                    <p className="text-sm font-semibold text-foreground">
                      {key === 'totalAmount' && typeof value === 'number' ? `$${value.toFixed(2)}` : String(value)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
