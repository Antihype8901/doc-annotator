import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DocumentInfo } from '../models/document.models';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private readonly documentsBasePath = 'assets/documents';
  private readonly assetsBasePath = 'assets';

  constructor(private readonly http: HttpClient) {}

  getDocumentById(id: string): Observable<DocumentInfo> {
    const url = `${this.documentsBasePath}/${id}.json`;

    return this.http.get<DocumentInfo>(url).pipe(
      map((doc) => ({
        ...doc,
        pages: doc.pages.map((page) => ({
          ...page,
          imageUrl: `${this.assetsBasePath}/${page.imageUrl}`,
        })),
      })),
    );
  }
}