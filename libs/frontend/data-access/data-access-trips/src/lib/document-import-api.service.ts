import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DocumentExtractionResult,
  ExtractedTransportData,
  ExtractedAccommodationData,
  TransportExtractionResult,
  AccommodationExtractionResult,
} from '@org/util-types';

const API = '/api';

export type {
  DocumentExtractionResult,
  ExtractedTransportData,
  ExtractedAccommodationData,
  TransportExtractionResult,
  AccommodationExtractionResult,
};

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
