
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
import { AlertTriangle, BadgeCheck, ScanLine, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

import type { AssignedInvoice, ExtractedInvoiceDetails, VerificationResult, InvoiceStatus } from '@/lib/types';
import { extractInvoiceDataAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

import { FileUpload } from './FileUpload';
import { InvoiceDetailsView } from './InvoiceDetailsView';
import { VerificationResultView } from './VerificationResultView';
import { LoadingIndicator } from './LoadingIndicator';

interface ProcessInvoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: AssignedInvoice | null;
  onUpdateStatus: (invoiceId: string, newStatus: InvoiceStatus) => void;
}

export function ProcessInvoiceDialog({ isOpen, onOpenChange, invoice, onUpdateStatus }: ProcessInvoiceDialogProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceDetails | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
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
    setExtractedData(null); 
    setVerificationResult(null);
    setError(null);
  };

  const verifyData = useCallback((assigned: AssignedInvoice, extracted: ExtractedInvoiceDetails): VerificationResult => {
    const fieldsToVerify: Array<{ key: keyof AssignedInvoice & keyof ExtractedInvoiceDetails, label: string, compareFn?: (a: any, e: any) => boolean }> = [
      { key: 'invoiceNumber', label: 'Invoice Number', compareFn: (a, e) => String(a).trim().toLowerCase() === String(e).trim().toLowerCase() },
      { key: 'date', label: 'Date', compareFn: (a, e) => String(a).trim() === String(e).trim() },
      { key: 'totalAmount', label: 'Total Amount', compareFn: (a, e) => Math.abs(Number(a) - Number(e)) < 0.01 },
      { key: 'supplierName', label: 'Supplier Name', compareFn: (a, e) => String(a).trim().toLowerCase().includes(String(e).trim().toLowerCase()) || String(e).trim().toLowerCase().includes(String(a).trim().toLowerCase()) },
    ];
    
    const verificationFields = fieldsToVerify.map(({ key, label, compareFn }) => {
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
      return { assigned: assignedValue, extracted: extractedValue, match, label };
    });
    
    const overallMatch = verificationFields.every(f => f.match);
    return { overallMatch, fields: verificationFields };
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
      toast({ title: 'Datos Extraídos', description: 'Se han extraído y verificado los datos de la factura.' });
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred during data extraction.');
      toast({ variant: 'destructive', title: 'Error de Extracción', description: e.message || 'Ocurrió un error desconocido.' });
      console.error("Extraction error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeStatus = (newStatus: InvoiceStatus) => {
    if (invoice) {
      onUpdateStatus(invoice.id, newStatus);
      toast({
        title: 'Estado Actualizado',
        description: `La factura #${invoice.invoiceNumber} ha sido actualizada a ${newStatus.toLowerCase()}.`,
      });
      onOpenChange(false); // Close dialog after status change
    }
  };
  
  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
             <ScanLine className="h-6 w-6 text-primary" />
            Procesar Factura: {invoice.invoiceNumber} (Estado: {invoice.status})
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto space-y-6 p-1 pr-3">
          <InvoiceDetailsView title="Detalles de Factura Asignada" data={invoice} variant="assigned" />
          
          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-primary"/>
                Cambiar Estado de la Factura
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {invoice.status === 'PENDIENTE' && (
                <>
                  <Button onClick={() => handleChangeStatus('ENTREGADA')} variant="default" className="bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle className="mr-2 h-4 w-4" /> Marcar como ENTREGADA
                  </Button>
                  <Button onClick={() => handleChangeStatus('CANCELADA')} variant="destructive">
                    <XCircle className="mr-2 h-4 w-4" /> Marcar como CANCELADA
                  </Button>
                </>
              )}
              {(invoice.status === 'ENTREGADA' || invoice.status === 'CANCELADA') && (
                <Button onClick={() => handleChangeStatus('PENDIENTE')} variant="outline">
                  <RotateCcw className="mr-2 h-4 w-4" /> Revertir a PENDIENTE
                </Button>
              )}
            </div>
          </div>

          <Separator />
          
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <ScanLine className="h-5 w-5 text-primary"/>
                Capturar y Extraer Datos (Opcional)
            </h3>
            <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />
            {imageDataUri && (
              <Button onClick={handleExtractData} disabled={isLoading || !imageDataUri} className="mt-4 w-full sm:w-auto">
                {isLoading && extractedData === null ? <LoadingIndicator text="Extrayendo..." /> : 'Extraer y Verificar Datos'}
              </Button>
            )}
          </div>

          {isLoading && !extractedData && <LoadingIndicator text="Extrayendo y verificando datos..." />}
          
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error de Extracción</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {(extractedData || verificationResult) && !isLoading && !error && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Resultados de Verificación</h3>
                 {extractedData && <InvoiceDetailsView title="Datos Extraídos de Factura" data={extractedData} variant="extracted" />}
                <div className="mt-4">
                  <VerificationResultView result={verificationResult} />
                </div>
              </div>
            </>
          )}
           {!isLoading && !error && !extractedData && !verificationResult && !imageDataUri && (
             <VerificationResultView result={null} />
           )}


        </div>
        <DialogFooter className="mt-auto pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
