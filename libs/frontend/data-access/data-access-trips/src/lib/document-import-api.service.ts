import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = '/api';

export interface ExtractedTransportData {
  type: 'FLIGHT' | 'TRAIN' | 'BUS' | 'CAR';
  fromLocation: string;
  toLocation: string;
  departureTime: string;
  arrivalTime: string;
  price?: number | null;
}

export interface ExtractedAccommodationData {
  name: string;
  checkIn: string;
  checkOut: string;
  address?: string | null;
  price?: number | null;
}

export interface TransportExtractionResult {
  type: 'transport';
  data: ExtractedTransportData;
}

export interface AccommodationExtractionResult {
  type: 'accommodation';
  data: ExtractedAccommodationData;
}

export type DocumentExtractionResult = TransportExtractionResult | AccommodationExtractionResult;

@Injectable({ providedIn: 'root' })
export class DocumentImportApiService {
  private readonly http = inject(HttpClient);

  importDocument(tripId: string, file: File): Observable<DocumentExtractionResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<DocumentExtractionResult>(
      `${API}/trips/${tripId}/import-document`,
      formData,
    );
  }
}
