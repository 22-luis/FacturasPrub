// @ts-nocheck
// disabling ts check for this file as it's a server action file which conflicts with the genkit flow file
// This is a temporary workaround and should be fixed in the future.
'use server';

import { extractInvoiceData as genAIExtractInvoiceData, type ExtractInvoiceDataInput, type ExtractInvoiceDataOutput } from '@/ai/flows/extract-invoice-data';

export async function extractInvoiceDataAction(input: ExtractInvoiceDataInput): Promise<ExtractInvoiceDataOutput> {
  try {
    const result = await genAIExtractInvoiceData(input);
    return result;
  } catch (error) {
    console.error("Error in extractInvoiceDataAction:", error);
    if (error instanceof Error) {
      // Check if the error message indicates a 503 or overload
      if (error.message.includes('503') || error.message.toLowerCase().includes('overloaded') || error.message.toLowerCase().includes('service unavailable')) {
        throw new Error(`The AI service is temporarily overloaded or unavailable. Please try again in a few moments. (Details: ${error.message})`);
      }
      throw new Error(`Failed to extract invoice data: ${error.message}`);
    }
    throw new Error("Failed to extract invoice data due to an unknown error.");
  }
}
