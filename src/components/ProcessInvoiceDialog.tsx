
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
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
import { AlertTriangle, BadgeCheck, ScanLine, CheckCircle, XCircle, RotateCcw, Camera, Upload, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import type { AssignedInvoice, ExtractedInvoiceDetails, VerificationResult, InvoiceStatus } from '@/lib/types';
import { extractInvoiceDataAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

import { FileUpload } from './FileUpload';
import { InvoiceDetailsView } from './InvoiceDetailsView';
import { VerificationResultView } from './VerificationResultView';
import { LoadingIndicator } from './LoadingIndicator';
import { CancellationReasonDialog } from './CancellationReasonDialog';

interface ProcessInvoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: AssignedInvoice | null;
  onUpdateStatus: (invoiceId: string, newStatus: InvoiceStatus, cancellationReason?: string) => void;
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); 
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const [isCameraInitializing, setIsCameraInitializing] = useState(false);


  const resetAllStates = useCallback(() => {
    setUploadedFile(null);
    setImageDataUri(null);
    setExtractedData(null);
    setVerificationResult(null);
    setIsLoading(false);
    setError(null);
    setIsCancellationReasonSubDialogOpen(false);
    
    setShowCamera(false);
    setHasCameraPermission(null);
    setIsCapturingPhoto(false);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setAvailableCameras([]);
    setSelectedDeviceId(undefined);
    setIsCameraInitializing(false);
  }, [cameraStream]);

  useEffect(() => {
    if (!isOpen || !invoice) {
      resetAllStates();
    }
  }, [isOpen, invoice, resetAllStates]);

  // Effect to enumerate devices and set initial selection when camera view is activated
  useEffect(() => {
    if (showCamera && availableCameras.length === 0) { // Only run if showing camera and devices not yet enumerated
      const initCameraDevices = async () => {
        setIsCameraInitializing(true);
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            throw new Error("Media devices API not available.");
          }
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          setAvailableCameras(videoDevices);

          if (videoDevices.length > 0) {
            let initialDeviceId = videoDevices[0].deviceId; 
            const rearCamera = videoDevices.find(device =>
              device.label.toLowerCase().includes('back') ||
              device.label.toLowerCase().includes('rear') ||
              device.label.toLowerCase().includes('environment')
            );
            if (rearCamera) {
              initialDeviceId = rearCamera.deviceId;
            }
            setSelectedDeviceId(initialDeviceId); // This will trigger the stream effect
          } else {
            setHasCameraPermission(false);
            toast({ variant: "destructive", title: "No Se Encontraron Cámaras", description: "No se encontraron dispositivos de entrada de video." });
          }
        } catch (err: any) {
          console.error("Error enumerating devices:", err);
          setHasCameraPermission(false);
          toast({ variant: "destructive", title: "Error de Cámara", description: err.message || "No se pudieron listar los dispositivos de cámara." });
        } finally {
          setIsCameraInitializing(false);
        }
      };
      initCameraDevices();
    }
  }, [showCamera, toast, availableCameras.length]);

  // Effect to start/switch stream when selectedDeviceId or showCamera changes
  useEffect(() => {
    let currentStreamInstance: MediaStream | null = null;

    if (showCamera && selectedDeviceId && !isCameraInitializing) {
      const getStream = async () => {
        if (cameraStream) { 
          cameraStream.getTracks().forEach(track => track.stop());
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: selectedDeviceId } }
          });
          currentStreamInstance = stream;
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasCameraPermission(true);
        } catch (err: any) {
          console.error('Error accessing specific camera:', err);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Acceso a Cámara Denegado',
            description: err.message || 'Habilita los permisos de cámara o selecciona otra cámara.',
          });
        }
      };
      getStream();
    }

    return () => {
      if (currentStreamInstance) {
        currentStreamInstance.getTracks().forEach(track => track.stop());
      } else if (cameraStream && !showCamera) { // Ensure cleanup if showCamera becomes false
         cameraStream.getTracks().forEach(track => track.stop());
         setCameraStream(null);
      }
    };
  }, [showCamera, selectedDeviceId, isCameraInitializing, toast, cameraStream]);


  const handleFileSelectForUpload = (file: File | null, dataUrl: string | null) => {
    setUploadedFile(file);
    setImageDataUri(dataUrl);
    setExtractedData(null); 
    setVerificationResult(null);
    setError(null);
    // If switching from camera to upload, ensure camera is off and related states are reset
    if (showCamera) setShowCamera(false); 
    // setSelectedDeviceId(undefined); // This will be handled by showCamera=false effect
    // setAvailableCameras([]);
  };

  const handleTakePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !hasCameraPermission) {
      toast({ variant: 'destructive', title: 'Error de Cámara', description: 'Cámara no disponible o sin permisos.' });
      return;
    }
    setIsCapturingPhoto(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImageDataUri(dataUrl);
        setUploadedFile(null); 
        setExtractedData(null);
        setVerificationResult(null);
        setError(null);
        setShowCamera(false); 
        toast({ title: 'Foto Capturada', description: 'Imagen lista para extracción.' });
      } else {
        throw new Error('Failed to get canvas context');
      }
    } catch (e: any) {
      setError(e.message || 'Error al capturar la foto.');
      toast({ variant: 'destructive', title: 'Error de Captura', description: e.message || 'No se pudo capturar la foto.' });
    } finally {
      setIsCapturingPhoto(false);
    }
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
      setIsCancellationReasonSubDialogOpen(true);
    } else {
      onUpdateStatus(invoice.id, newStatus);
      onOpenChange(false); 
    }
  };

  const handleConfirmCancellationWithReason = (reason?: string) => {
    if (invoice) {
      onUpdateStatus(invoice.id, 'CANCELADA', reason);
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
              {invoice.status === 'CANCELADA' && invoice.cancellationReason && (
                 <div className="mt-3 text-sm text-muted-foreground p-2 border rounded-md bg-secondary/30">
                  <p><span className="font-medium">Motivo de cancelación:</span> {invoice.cancellationReason}</p>
                </div>
              )}
            </div>

            <Separator />
            
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  {showCamera ? <Camera className="h-5 w-5 text-primary"/> : <Upload className="h-5 w-5 text-primary"/>}
                  Capturar o Subir Imagen de Factura (Opcional)
              </h3>

              <div className="flex gap-2 mb-4">
                <Button variant={showCamera ? "outline" : "default"} onClick={() => { setShowCamera(false); setImageDataUri(null); setExtractedData(null); setVerificationResult(null); setUploadedFile(null); /* Camera states reset by setShowCamera effect */ }}>
                  <Upload className="mr-2 h-4 w-4" /> Subir Archivo
                </Button>
                <Button variant={showCamera ? "default" : "outline"} onClick={() => { setShowCamera(true); setImageDataUri(null); setExtractedData(null); setVerificationResult(null); setUploadedFile(null); /* Camera states reset by setShowCamera effect */ }}>
                  <Camera className="mr-2 h-4 w-4" /> Tomar Foto
                </Button>
              </div>

              {showCamera ? (
                <div className="space-y-4">
                  {isCameraInitializing && <LoadingIndicator text="Iniciando cámara..." />}
                  
                  {!isCameraInitializing && availableCameras.length > 1 && (
                    <div className="my-2">
                      <Label htmlFor="camera-select" className="mb-1 block text-sm font-medium">Seleccionar Cámara:</Label>
                      <Select
                        value={selectedDeviceId}
                        onValueChange={(deviceId) => setSelectedDeviceId(deviceId)}
                        disabled={isLoading || isCapturingPhoto}
                      >
                        <SelectTrigger id="camera-select" className="w-full sm:w-[300px]">
                          <SelectValue placeholder="Selecciona una cámara" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCameras.map((device, index) => (
                            <SelectItem key={device.deviceId} value={device.deviceId}>
                              {device.label || `Cámara ${index + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                  
                  {hasCameraPermission === false && !isCameraInitializing && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Permiso de Cámara Denegado o Sin Cámaras</AlertTitle>
                      <AlertDescription>
                        Verifica los permisos de cámara en tu navegador o asegúrate de tener una cámara conectada.
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button 
                    onClick={handleTakePhoto} 
                    disabled={!hasCameraPermission || isCapturingPhoto || isLoading || isCameraInitializing || !cameraStream} 
                    className="w-full sm:w-auto"
                  >
                    {isCapturingPhoto ? <LoadingIndicator text="Capturando..." /> : <> <Camera className="mr-2 h-4 w-4" /> Capturar Foto </>}
                  </Button>
                </div>
              ) : (
                <FileUpload onFileSelect={handleFileSelectForUpload} disabled={isLoading || isCapturingPhoto} />
              )}
              
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {imageDataUri && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-md font-semibold">Vista Previa de Imagen:</h4>
                  <div className="relative w-full max-w-md aspect-video border rounded-md overflow-hidden">
                    <Image src={imageDataUri} alt="Vista previa de factura" layout="fill" objectFit="contain" />
                  </div>
                  <Button variant="outline" size="sm" onClick={clearImageData} disabled={isLoading || isCapturingPhoto}>
                    <Trash2 className="mr-2 h-4 w-4" /> Quitar Imagen
                  </Button>
                </div>
              )}

              {imageDataUri && (
                <Button onClick={handleExtractData} disabled={isLoading || isCapturingPhoto || !imageDataUri} className="mt-4 w-full sm:w-auto">
                  {isLoading ? <LoadingIndicator text="Extrayendo..." /> : 'Extraer y Verificar Datos'}
                </Button>
              )}
            </div>

            {isLoading && !extractedData && <LoadingIndicator text="Extrayendo y verificando datos..." />}
            
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
              <Button variant="outline" onClick={resetAllStates}>Cerrar</Button>
            </DialogClose>
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

