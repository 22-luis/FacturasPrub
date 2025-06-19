
'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CancellationReasonDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceIdentifier: string;
  onConfirm: (reason?: string) => void;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export function CancellationReasonDialog({
  isOpen,
  onOpenChange,
  invoiceIdentifier,
  onConfirm,
}: CancellationReasonDialogProps) {
  const [providedReason, setProvidedReason] = useState<'yes' | 'no' | undefined>(undefined);
  const [reasonText, setReasonText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechApiSupported, setSpeechApiSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setSpeechApiSupported(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setProvidedReason(undefined);
      setReasonText('');
      setIsListening(false);
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    }
    // Cleanup recognition on component unmount or when dialog closes
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
        setIsListening(false);
      }
    };
  }, [isOpen]);

  const handleToggleListen = () => {
    if (!speechApiSupported) {
      toast({
        variant: 'destructive',
        title: 'Error de Compatibilidad',
        description: 'Tu navegador no soporta la entrada de voz.',
      });
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) {
        setSpeechApiSupported(false); 
        toast({ variant: 'destructive', title: 'Error', description: 'API de reconocimiento de voz no encontrada.' });
        return;
      }
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false; 
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
             setReasonText((prevText) => prevText + (prevText ? " " : "") + finalTranscript.trim());
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        let errorMsg = 'Ocurrió un error con el reconocimiento de voz.';
        if (event.error === 'no-speech') {
          errorMsg = 'No se detectó voz. Inténtalo de nuevo.';
        } else if (event.error === 'audio-capture') {
          errorMsg = 'Problema al capturar audio. Revisa tu micrófono.';
        } else if (event.error === 'not-allowed') {
          errorMsg = 'Permiso para usar el micrófono denegado.';
        } else if (event.error === 'network') {
          errorMsg = 'Error de red con el servicio de reconocimiento de voz. Revisa tu conexión o inténtalo más tarde.';
        }
        toast({ variant: 'destructive', title: 'Error de Voz', description: errorMsg });
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error starting recognition:", e);
        toast({variant: 'destructive', title: 'Error', description: 'No se pudo iniciar el reconocimiento de voz.'})
        setIsListening(false);
      }
    }
  };

  const handleConfirm = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop(); 
    }
    if (providedReason === 'yes') {
      onConfirm(reasonText.trim() || undefined);
    } else {
      onConfirm(undefined);
    }
    onOpenChange(false);
  };
  
  const handleDialogClose = () => {
    if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Razón de Cancelación</DialogTitle>
          <DialogDescription>
            Para la factura <span className="font-semibold">{invoiceIdentifier}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <Label className="mb-2 block">¿El cliente proporcionó una razón para la cancelación?</Label>
            <RadioGroup
              value={providedReason}
              onValueChange={(value: 'yes' | 'no') => setProvidedReason(value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="reason-yes" />
                <Label htmlFor="reason-yes">Sí</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="reason-no" />
                <Label htmlFor="reason-no">No</Label>
              </div>
            </RadioGroup>
          </div>

          {providedReason === 'yes' && (
            <div>
              <Label htmlFor="cancellationReasonText">Motivo de la cancelación:</Label>
              <div className="relative">
                <Textarea
                  id="cancellationReasonText"
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  placeholder="Escribe el motivo aquí o usa el micrófono..."
                  rows={3}
                  className="pr-12" 
                />
                {speechApiSupported ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleListen}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                    aria-label={isListening ? "Detener grabación" : "Grabar motivo por voz"}
                  >
                    {isListening ? <MicOff className="h-5 w-5 text-destructive" /> : <Mic className="h-5 w-5" />}
                  </Button>
                ) : (
                  <div 
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    title="Entrada de voz no soportada por tu navegador"
                  >
                    <MicOff className="h-5 w-5 text-muted-foreground opacity-50" />
                  </div>
                )}
              </div>
            </div>
          )}
          {!speechApiSupported && providedReason === 'yes' && (
             <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded-md border border-yellow-200">
                <AlertTriangle className="h-5 w-5 flex-shrink-0"/>
                <span>La entrada de voz no es compatible con tu navegador. Por favor, escribe el motivo.</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={handleDialogClose}>
              Volver
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm} disabled={providedReason === undefined || (providedReason === 'yes' && !reasonText.trim())}>
            Confirmar Cancelación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
