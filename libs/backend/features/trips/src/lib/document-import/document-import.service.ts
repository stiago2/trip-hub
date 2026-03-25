import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
import { createWorker } from 'tesseract.js';

export interface ExtractedTransport {
  type: 'transport';
  data: {
    type: 'FLIGHT' | 'TRAIN' | 'BUS' | 'CAR';
    fromLocation: string;
    toLocation: string;
    departureTime: string;
    arrivalTime: string;
    price?: number;
  };
}

export interface ExtractedAccommodation {
  type: 'accommodation';
  data: {
    name: string;
    checkIn: string;
    checkOut: string;
    address?: string;
    price?: number;
  };
}

export type ExtractionResult = ExtractedTransport | ExtractedAccommodation;

const EXTRACTION_PROMPT = (text: string) => `You are a travel document parser. The following is text extracted from a travel document (booking confirmation, ticket, hotel reservation, etc.).

Analyze the text and return ONLY a valid JSON object — no extra text, no markdown fences.

For a transport document (flight, train, bus, car rental):
{
  "type": "transport",
  "data": {
    "type": "FLIGHT" | "TRAIN" | "BUS" | "CAR",
    "fromLocation": "city or airport name",
    "toLocation": "city or airport name",
    "departureTime": "ISO 8601 datetime (e.g. 2025-06-15T10:30:00)",
    "arrivalTime": "ISO 8601 datetime",
    "price": number or null
  }
}

For an accommodation document (hotel, Airbnb, hostel):
{
  "type": "accommodation",
  "data": {
    "name": "hotel/property name",
    "checkIn": "ISO 8601 date (e.g. 2025-06-15T14:00:00)",
    "checkOut": "ISO 8601 date (e.g. 2025-06-18T11:00:00)",
    "address": "full address or null",
    "price": total price as number or null
  }
}

Rules:
- Use your best judgment on document type
- For times not mentioned: use 14:00 for hotel check-in, 11:00 for check-out
- If a year is missing, assume the nearest upcoming year
- price should be a number only (no currency symbol)
- Return ONLY the JSON, nothing else

Document text:
"""
${text}
"""`;

@Injectable()
export class DocumentImportService {
  async extractFromDocument(
    fileBuffer: Buffer,
    mimetype: string,
    _originalName: string,
  ): Promise<ExtractionResult> {
    const supported = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!supported.includes(mimetype)) {
      throw new BadRequestException('Unsupported file type. Use PDF, JPG, or PNG.');
    }

    // Step 1: Extract text from document
    let extractedText: string;
    try {
      if (mimetype === 'application/pdf') {
        const parsed = await pdfParse(fileBuffer);
        extractedText = parsed.text?.trim() ?? '';
      } else {
        const worker = await createWorker('eng');
        const { data } = await worker.recognize(fileBuffer);
        extractedText = data.text?.trim() ?? '';
        await worker.terminate();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new InternalServerErrorException(`Text extraction failed: ${msg}`);
    }

    if (!extractedText || extractedText.length < 20) {
      throw new BadRequestException('Could not extract readable text from this document.');
    }

    // Step 2: Send text to Groq for structured parsing
    const apiKey = process.env['GROQ_API_KEY'];
    if (!apiKey) {
      throw new InternalServerErrorException('AI service not configured. Please set GROQ_API_KEY.');
    }

    let raw: string;
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          max_tokens: 1024,
          temperature: 0,
          messages: [{ role: 'user', content: EXTRACTION_PROMPT(extractedText) }],
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`${response.status}: ${err}`);
      }

      const json = await response.json() as { choices?: { message?: { content?: string } }[] };
      raw = json.choices?.[0]?.message?.content?.trim() ?? '';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new InternalServerErrorException(`AI analysis failed: ${msg}`);
    }

    const jsonStr = raw.startsWith('```')
      ? raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      : raw;

    let parsed: ExtractionResult;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new BadRequestException('Document analysis returned unreadable data');
    }

    if (!parsed.type || !parsed.data) {
      throw new BadRequestException('Could not identify travel information in this document');
    }

    return parsed;
  }
}
