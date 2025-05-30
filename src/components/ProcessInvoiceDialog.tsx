'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, BadgeCheck, ScanLine } from 'lucide-react';

import type { AssignedInvoice, ExtractedInvoiceDetails, VerificationResult, VerificationField } from '@/lib/types';
import { extractInvoiceDataAction } from '@/lib/actions';

import { FileUpload } from './FileUpload';
import { InvoiceDetailsView } from './InvoiceDetailsView';
import { VerificationResultView } from './VerificationResultView';
import { LoadingIndicator } from './LoadingIndicator';

interface ProcessInvoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: AssignedInvoice | null;
}

export function ProcessInvoiceDialog({ isOpen, onOpenChange, invoice }: ProcessInvoiceDialogProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceDetails | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when dialog is closed or invoice changes
    if (!isOpen || !invoice) {
      setUploadedFile(null);
      setImageDataUri(null);
      setExtractedData(null);
      setVerificationResult(null);
      setIsLoading(false);
      setError(null);
    }
  }, [isOpen, invoice]);

  const handleFileSelect = (file: File | null, dataUrl: string | null) => {
    setUploadedFile(file);
    setImageDataUri(dataUrl);
    setExtractedData(null); // Reset previous extraction results
    setVerificationResult(null);
    setError(null);
  };

  const verifyData = useCallback((assigned: AssignedInvoice, extracted: ExtractedInvoiceDetails): VerificationResult => {
    const fields: VerificationField[] = [];
    let overallMatch = true;

    const fieldDefinitions: Array<{ key: keyof AssignedInvoice & keyof ExtractedInvoiceDetails, label: string, compareFn?: (a: any, e: any) => boolean }> = [
      { key: 'invoiceNumber', label: 'Invoice Number', compareFn: (a, e) => String(a).trim().toLowerCase() === String(e).trim().toLowerCase() },
      { key: 'date', label: 'Date', compareFn: (a, e) => String(a).trim() === String(e).trim() }, // Simple string comparison for dates for now
      { key: 'totalAmount', label: 'Total Amount', compareFn: (a, e) => Math.abs(Number(a) - Number(e)) < 0.01 },
      { key: 'supplierName', label: 'Supplier Name', compareFn: (a, e) => String(a).trim().toLowerCase().includes(String(e).trim().toLowerCase()) || String(e).trim().toLowerCase().includes(String(a).trim().toLowerCase()) },
    ];
    
    for (const { key, label, compareFn } of fieldDefinitions) {
      const assignedValue = assigned[key];
      const extractedValue = extracted[key];
      let match = false;

      if (extractedValue !== undefined && extractedValue !== null) {
        if (compareFn) {
          match = compareFn(assignedValue, extractedValue);
        } else {
           match = String(assignedValue).trim().toLowerCase() === String(extractedValue).trim().toLowerCase();
        }
      }
      
      fields.push({ assigned: assignedValue, extracted: extractedValue, match, label });
      if (!match) overallMatch = false;
    }

    return { overallMatch, fields };
  }, []);

  const handleExtractData = async () => {
    if (!imageDataUri || !invoice) return;

    setIsLoading(true);
    setError(null);
    setExtractedData(null);
    setVerificationResult(null);

    try {
      const result = await extractInvoiceDataAction({ photoDataUri: imageDataUri });
      setExtractedData(result);
      const verification = verifyData(invoice, result);
      setVerificationResult(verification);
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred during data extraction.');
      console.error("Extraction error:", e);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
             <ScanLine className="h-6 w-6 text-primary" />
            Process Invoice: {invoice.invoiceNumber}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto space-y-6 p-1 pr-3">
          <InvoiceDetailsView title="Assigned Invoice Details" data={invoice} variant="assigned" />
          
          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-primary"/>
                Capture &amp; Extract
            </h3>
            <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />
            {imageDataUri && (
              <Button onClick={handleExtractData} disabled={isLoading || !imageDataUri} className="mt-4 w-full sm:w-auto">
                {isLoading ? <LoadingIndicator text="Extracting..." /> : 'Extract & Verify Data'}
              </Button>
            )}
          </div>

          {isLoading && <LoadingIndicator text="Extracting and verifying data..." />}
          
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Extraction Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {(extractedData || verificationResult) && !isLoading && !error && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Verification Results</h3>
                 {extractedData && <InvoiceDetailsView title="Extracted Invoice Data" data={extractedData} variant="extracted" />}
                <div className="mt-4">
                  <VerificationResultView result={verificationResult} />
                </div>
              </div>
            </>
          )}
           {!isLoading && !error && !extractedData && !verificationResult && (
             <VerificationResultView result={null} />
           )}


        </div>
        <DialogFooter className="mt-auto pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
