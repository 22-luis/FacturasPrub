// @ts-nocheck
// disabling ts check for this file as it's a server action file which conflicts with the genkit flow file
// This is a temporary workaround and should be fixed in the future.
'use server';

import { extractInvoiceData as genAIExtractInvoiceData, type ExtractInvoiceDataInput, type ExtractInvoiceDataOutput } from '@/ai/flows/extract-invoice-data';

export async function extractInvoiceDataAction(input: ExtractInvoiceDataInput): Promise<ExtractInvoiceDataOutput> {
  try {
    // The Genkit flow expects photoDataUri in the input.
    // Ensure the input object structure matches { photoDataUri: 'data:...' }
    const result = await genAIExtractInvoiceData(input);
    return result;
  } catch (error) {
    console.error("Error in extractInvoiceDataAction:", error);
    // It's better to throw a more specific error or an error object that client can parse if needed
    if (error instanceof Error) {
      throw new Error(`Failed to extract invoice data: ${error.message}`);
    }
    throw new Error("Failed to extract invoice data due to an unknown error.");
  }
}
