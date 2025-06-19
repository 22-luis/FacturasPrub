
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, BadgeCheck, ScanLine, CheckCircle, XCircle, RotateCcw, Upload, Trash2, MessageSquareText } from 'lucide-react';

import type { AssignedInvoice, ExtractedInvoiceDetails, VerificationResult, InvoiceStatus } from '@/lib/types';
import { extractInvoiceDataAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

import { FileUpload } from './FileUpload';
import { InvoiceDetailsView } from './InvoiceDetailsView';
import { VerificationResultView } from './VerificationResultView';
import { LoadingIndicator } from './LoadingIndicator';
import { CancellationReasonDialog } from './CancellationReasonDialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ProcessInvoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: AssignedInvoice | null;
  onUpdateStatus: (invoiceId: string, newStatus: InvoiceStatus, cancellationReason?: string, deliveryNotes?: string) => void;
}

export function ProcessInvoiceDialog({ isOpen, onOpenChange, invoice, onUpdateStatus }: ProcessInvoiceDialogProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceDetails | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false); 
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isCancellationReasonSubDialogOpen, setIsCancellationReasonSubDialogOpen] = useState(false);
  const [deliveryNotesInput, setDeliveryNotesInput] = useState('');

  const resetAllStates = useCallback(() => {
    setUploadedFile(null);
    setImageDataUri(null);
    setExtractedData(null);
    setVerificationResult(null);
    setIsLoading(false);
    setError(null);
    setIsCancellationReasonSubDialogOpen(false);
    setDeliveryNotesInput('');
  }, []);

  useEffect(() => {
    if (!isOpen || !invoice) {
      resetAllStates();
    }
    if (invoice && isOpen) {
        setDeliveryNotesInput(invoice.deliveryNotes || '');
    }
  }, [isOpen, invoice, resetAllStates]);


  const handleFileSelect = (file: File | null, dataUrl: string | null) => {
    setUploadedFile(file);
    setImageDataUri(dataUrl);
    setExtractedData(null); 
    setVerificationResult(null);
    setError(null);
  };
  
  const clearImageData = () => {
    setImageDataUri(null);
    setUploadedFile(null);
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
    if (!invoice) return;

    if (newStatus === 'CANCELADA') {
      setIsCancellationReasonSubDialogOpen(true); // This will open the sub-dialog
    } else {
      // For ENTREGADA or other statuses, directly call onUpdateStatus
      onUpdateStatus(invoice.id, newStatus, undefined, deliveryNotesInput.trim());
      onOpenChange(false); 
    }
  };

  const handleConfirmCancellationWithReason = (reasonFromSubDialog?: string) => {
    if (invoice) {
      let finalDeliveryNotes = deliveryNotesInput.trim();
      if (reasonFromSubDialog) {
        finalDeliveryNotes = `${reasonFromSubDialog}. ${finalDeliveryNotes}`.trim();
        if (finalDeliveryNotes.endsWith('.')) finalDeliveryNotes = finalDeliveryNotes.slice(0,-1); // Avoid double period if notes were empty
      }

      onUpdateStatus(invoice.id, 'CANCELADA', reasonFromSubDialog, finalDeliveryNotes);
      setIsCancellationReasonSubDialogOpen(false);
      onOpenChange(false); 
    }
  };
  
  if (!invoice) return null;

  return (
    <>
      <Dialog open={isOpen && !isCancellationReasonSubDialogOpen} onOpenChange={(open) => {
        if(!open) resetAllStates();
        onOpenChange(open);
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <ScanLine className="h-6 w-6 text-primary" />
              Procesar Factura: {invoice.invoiceNumber} (Estado: {invoice.status})
            </DialogTitle>
            <DialogDescription>
                Cliente: {invoice.client?.name || invoice.supplierName}. Dirección: {invoice.address}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-grow overflow-y-auto space-y-4 sm:space-y-6 p-1 pr-2">
            <InvoiceDetailsView title="Detalles de Factura Asignada" data={invoice} variant="assigned" />
            
            <Separator />

            <div>
                <Label htmlFor="deliveryNotesTextarea" className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2">
                    <MessageSquareText className="h-5 w-5 text-primary"/>
                    Notas de Entrega / Incidencias
                </Label>
                <Textarea
                    id="deliveryNotesTextarea"
                    value={deliveryNotesInput}
                    onChange={(e) => setDeliveryNotesInput(e.target.value)}
                    placeholder="Ej: Cliente solicitó dejar en recepción. Paquete ligeramente abollado. Dirección no encontrada..."
                    rows={3}
                    className="mt-1"
                />
            </div>

            <Separator />

            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-primary"/>
                  Cambiar Estado de la Factura
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {invoice.status !== 'ENTREGADA' && (
                    <Button onClick={() => handleChangeStatus('ENTREGADA')} variant="default" className="bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle className="mr-2 h-4 w-4" /> Marcar como ENTREGADA
                    </Button>
                )}
                {invoice.status !== 'CANCELADA' && (
                    <Button onClick={() => handleChangeStatus('CANCELADA')} variant="destructive">
                    <XCircle className="mr-2 h-4 w-4" /> Marcar como CANCELADA
                    </Button>
                )}
                {(invoice.status === 'ENTREGADA' || invoice.status === 'CANCELADA') && (
                  <Button onClick={() => handleChangeStatus('LISTO_PARA_RUTA')} variant="outline">
                    <RotateCcw className="mr-2 h-4 w-4" /> Revertir a Listo para Ruta
                  </Button>
                )}
              </div>
              {invoice.status === 'CANCELADA' && invoice.cancellationReason && (
                 <div className="mt-3 text-sm text-muted-foreground p-2 border rounded-md bg-secondary/30">
                  <p><span className="font-medium">Razón de cancelación registrada:</span> {invoice.cancellationReason}</p>
                </div>
              )}
            </div>

            <Separator />
            
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary"/>
                  Subir Imagen de Factura (Opcional)
              </h3>
              
              <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />
              
              {imageDataUri && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-md font-semibold">Vista Previa de Imagen:</h4>
                  <div className="relative w-full max-w-md aspect-video border rounded-md overflow-hidden">
                    <Image src={imageDataUri} alt="Vista previa de factura" layout="fill" objectFit="contain" />
                  </div>
                  <Button variant="outline" size="sm" onClick={clearImageData} disabled={isLoading}>
                    <Trash2 className="mr-2 h-4 w-4" /> Quitar Imagen
                  </Button>
                </div>
              )}

              {imageDataUri && (
                <Button onClick={handleExtractData} disabled={isLoading || !imageDataUri} className="mt-4 w-full sm:w-auto">
                  {isLoading ? <LoadingIndicator text="Extrayendo..." /> : 'Extraer y Verificar Datos de Imagen'}
                </Button>
              )}
            </div>

            {isLoading && !extractedData && <LoadingIndicator text="Procesando..." />}
            
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {(extractedData || verificationResult) && !isLoading && !error && (
              <>
                <Separator />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3">Resultados de Verificación de Imagen</h3>
                  {extractedData && <InvoiceDetailsView title="Datos Extraídos de Imagen" data={extractedData} variant="extracted" />}
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
              <Button variant="outline" onClick={resetAllStates}>Cerrar</Button>
            </DialogClose>
            <Button onClick={() => {
                // This button effectively just closes if no specific save action is tied here,
                // or it could trigger a save of just the notes if needed.
                // For now, notes are saved with status changes.
                onOpenChange(false);
            }}>Hecho</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {invoice && (
        <CancellationReasonDialog
          isOpen={isCancellationReasonSubDialogOpen}
          onOpenChange={setIsCancellationReasonSubDialogOpen}
          invoiceIdentifier={invoice.invoiceNumber}
          onConfirm={handleConfirmCancellationWithReason}
        />
      )}
    </>
  );
}

