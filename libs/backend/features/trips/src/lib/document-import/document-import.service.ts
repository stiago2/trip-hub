import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';

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

const EXTRACTION_PROMPT = `You are a travel document parser. Analyze this travel document (booking confirmation, ticket, itinerary, hotel reservation, etc.) and extract the key information.

Return ONLY a valid JSON object with this exact structure — no extra text, no markdown fences:

For a transport document (flight, train, bus, car rental):
{
  "type": "transport",
  "data": {
    "type": "FLIGHT" | "TRAIN" | "BUS" | "CAR",
    "fromLocation": "city or airport name",
    "toLocation": "city or airport name",
    "departureTime": "ISO 8601 datetime string (e.g. 2025-06-15T10:30:00)",
    "arrivalTime": "ISO 8601 datetime string",
    "price": number or null
  }
}

For an accommodation document (hotel, Airbnb, hostel booking):
{
  "type": "accommodation",
  "data": {
    "name": "hotel/property name",
    "checkIn": "ISO 8601 date string (e.g. 2025-06-15T14:00:00)",
    "checkOut": "ISO 8601 date string (e.g. 2025-06-18T11:00:00)",
    "address": "full address or null",
    "price": total price as number or null
  }
}

Rules:
- Use your best judgment on document type
- For times not explicitly mentioned: use 14:00 for hotel check-in, 11:00 for check-out
- If a year is missing, assume the nearest upcoming year
- price should be the total amount (number only, no currency symbol)
- Return ONLY the JSON, nothing else`;

@Injectable()
export class DocumentImportService {
  async extractFromDocument(
    fileBuffer: Buffer,
    mimetype: string,
    _originalName: string,
  ): Promise<ExtractionResult> {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      throw new InternalServerErrorException('AI service is not configured. Please set GEMINI_API_KEY.');
    }

    const supported = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!supported.includes(mimetype)) {
      throw new BadRequestException('Unsupported file type. Use PDF, JPG, or PNG.');
    }

    const base64 = fileBuffer.toString('base64');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    let raw: string;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: EXTRACTION_PROMPT },
              { inline_data: { mime_type: mimetype, data: base64 } },
            ],
          }],
        }),
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`${response.status} ${response.statusText}: ${err}`);
      }
      const json = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      raw = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
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
