// EventPipeline.ts

export interface GridEvent {
  type: string;
  payload?: any;
}

export type EventMiddleware = (event: GridEvent) => GridEvent | null;

export class EventPipeline {
  private middlewares: EventMiddleware[] = [];
  private compiled: EventMiddleware | null = null;
  private isDirty = true;

  use(middleware: EventMiddleware): () => void {
    this.middlewares.push(middleware);
    this.isDirty = true;
    return () => this.remove(middleware);
  }

  process(event: GridEvent): GridEvent | null {
    if (this.isDirty) {
      this.compile();
    }
    return this.compiled!(event);
  }

  private remove(middleware: EventMiddleware): void {
    const index = this.middlewares.indexOf(middleware);
    if (index !== -1) {
      this.middlewares.splice(index, 1);
      this.isDirty = true;
    }
  }

  private compile(): void {
    // Compile middleware chain into single function
    const chain = this.middlewares.reduceRight(
      (next, middleware) => (e: GridEvent) => {
        const result = middleware(e);
        return result === null ? null : next(result);
      },
      (e: GridEvent) => e
    );

    this.compiled = chain;
    this.isDirty = false;
  }
}