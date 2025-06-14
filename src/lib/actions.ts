'use server';

import { extractInvoiceData as genAIExtractInvoiceData, type ExtractInvoiceDataInput, type ExtractInvoiceDataOutput } from '@/ai/flows/extract-invoice-data';

export async function extractInvoiceDataAction(input: ExtractInvoiceDataInput): Promise<ExtractInvoiceDataOutput> {
  try {
    const result = await genAIExtractInvoiceData(input);
    return result;
  } catch (error) {
    console.error("Error in extractInvoiceDataAction:", error);
    if (error instanceof Error) {
      // Check if the error message indicates a 503/502 or overload/gateway issue
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('503') || errorMessage.includes('overloaded') || errorMessage.includes('service unavailable') || errorMessage.includes('502') || errorMessage.includes('bad gateway')) {
        throw new Error(`The AI service is temporarily experiencing issues (e.g., overloaded or bad gateway). Please try again in a few moments. (Details: ${error.message})`);
      }
      throw new Error(`Failed to extract invoice data: ${error.message}`);
    }
    throw new Error("Failed to extract invoice data due to an unknown error.");
  }
}
