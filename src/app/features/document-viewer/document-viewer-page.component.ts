import {
  Component,
  ElementRef,
  HostListener,
  QueryList,
  ViewChildren,
  inject,
} from '@angular/core';
import { CommonModule, NgIf, NgForOf, AsyncPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Observable, of, switchMap, catchError, tap } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { DocumentService } from '../../core/services/document.service';
import { DocumentInfo } from '../../core/models/document.models';
import { AnnotationService } from '../../core/services/annotation.service';
import { Annotation } from '../../core/models/annotation.model';

@Component({
  standalone: true,
  selector: 'app-document-viewer-page',
  imports: [
    CommonModule,
    NgIf,
    NgForOf,
    AsyncPipe,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './document-viewer-page.component.html',
  styleUrls: ['./document-viewer-page.component.scss'],
})
export class DocumentViewerPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly documentService = inject(DocumentService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly annotationService = inject(AnnotationService);

  hasError = false;
  zoom = 1;
  readonly baseWidth = 900;

  currentDocumentId = '1';
  currentDocument: DocumentInfo | null = null;

  @ViewChildren('pageContainer')
  pageContainers!: QueryList<ElementRef<HTMLDivElement>>;

  draggingAnnotation: Annotation | null = null;
  dragClientX = 0;
  dragClientY = 0;

  document$: Observable<DocumentInfo | null> = this.route.paramMap.pipe(
    switchMap(params => {
      const id = params.get('id') ?? '1';
      this.hasError = false;
      this.currentDocumentId = id;

      return this.documentService.getDocumentById(id);
    }),
    tap(doc => {
      this.currentDocument = doc;
    }),
    catchError(() => {
      this.hasError = true;
      this.currentDocument = null;
      return of(null);
    }),
  );

  goHome(): void {
    this.router.navigate(['/documents', '1']);
  }

  goBack(): void {
    this.location.back();
  }

  zoomIn(): void {
    this.zoom = Math.min(this.zoom + 0.1, 3);
  }

  zoomOut(): void {
    this.zoom = Math.max(this.zoom - 0.1, 0.3);
  }

  onPageClick(event: MouseEvent, pageNumber: number): void {
    if (this.draggingAnnotation) {
      return;
    }

    const text = prompt('Введите текст аннотации');
    if (!text || !text.trim()) {
      return;
    }

    const container = this.getPageContainer(pageNumber);
    if (!container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    this.annotationService.add(pageNumber, xPercent, yPercent, text);
  }

  annotationsByPage(pageNumber: number): Annotation[] {
    return this.annotationService.getByPage(pageNumber);
  }

  onAnnotationMouseDown(event: MouseEvent, annotation: Annotation): void {
    event.stopPropagation();
    this.draggingAnnotation = annotation;
    this.dragClientX = event.clientX;
    this.dragClientY = event.clientY;
  }

  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(event: MouseEvent): void {
    if (!this.draggingAnnotation) {
      return;
    }

    this.dragClientX = event.clientX;
    this.dragClientY = event.clientY;

    const target = this.getPageContainerAtPoint(event.clientX, event.clientY);
    if (!target) {
      return;
    }

    const { container, pageNumber } = target;
    const rect = container.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let xPercent = (x / rect.width) * 100;
    let yPercent = (y / rect.height) * 100;

    xPercent = this.clamp(xPercent, 0, 100);
    yPercent = this.clamp(yPercent, 0, 100);

    this.annotationService.move(
      this.draggingAnnotation.id,
      pageNumber,
      xPercent,
      yPercent,
    );

    // не мутируем локальный объект, стейт обновляется через сервис
  }

  @HostListener('document:mouseup')
  onDocumentMouseUp(): void {
    this.draggingAnnotation = null;
  }

  deleteAnnotation(id: number): void {
    this.annotationService.delete(id);

    if (this.draggingAnnotation?.id === id) {
      this.draggingAnnotation = null;
    }
  }

  private getPageContainerAtPoint(
    clientX: number,
    clientY: number,
  ): { container: HTMLDivElement; pageNumber: number } | null {
    const arr = this.pageContainers?.toArray() ?? [];

    for (let index = 0; index < arr.length; index++) {
      const elRef = arr[index];
      const el = elRef.nativeElement;
      const rect = el.getBoundingClientRect();

      const insideX = clientX >= rect.left && clientX <= rect.right;
      const insideY = clientY >= rect.top && clientY <= rect.bottom;

      if (insideX && insideY) {
        return {
          container: el,
          pageNumber: index + 1,
        };
      }
    }

    return null;
  }

  private getPageContainer(pageNumber: number): HTMLDivElement | null {
    const arr = this.pageContainers?.toArray() ?? [];
    const elRef = arr[pageNumber - 1];
    return elRef?.nativeElement ?? null;
  }

  onSave(): void {
    console.log('Документ сохранён:', {
      documentId: this.currentDocumentId,
      documentName: this.currentDocument?.name,
      annotations: this.annotationService.getAll(),
    });
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}