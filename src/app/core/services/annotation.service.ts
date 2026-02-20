import { Injectable } from '@angular/core';
import { Annotation } from '../models/annotation.model';

@Injectable({
  providedIn: 'root',
})
export class AnnotationService {
  private annotations: Annotation[] = [];
  private nextId = 1;
  private patchAnnotation(id: number, changes: Partial<Annotation>): void {
    this.annotations = this.annotations.map(a =>
      a.id === id ? { ...a, ...changes } : a,
    );
  }

  add(pageNumber: number, xPercent: number, yPercent: number, text: string): void {
    const annotation: Annotation = {
      id: this.nextId++,
      pageNumber,
      xPercent,
      yPercent,
      text: text.trim(),
    };

    this.annotations = [...this.annotations, annotation];
  }

  getByPage(pageNumber: number): Annotation[] {
    return this.annotations.filter(a => a.pageNumber === pageNumber);
  }

  getAll(): Annotation[] {
    return [...this.annotations];
  }

  updatePosition(id: number, xPercent: number, yPercent: number): void {
    this.patchAnnotation(id, { xPercent, yPercent });
  }

  move(id: number, pageNumber: number, xPercent: number, yPercent: number): void {
    this.patchAnnotation(id, { pageNumber, xPercent, yPercent });
  }

  delete(id: number): void {
    this.annotations = this.annotations.filter(a => a.id !== id);
  }
}