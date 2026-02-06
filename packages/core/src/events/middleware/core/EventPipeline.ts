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
    // Compile middleware chain into single function with error handling
    const chain = this.middlewares.reduceRight(
      (next, middleware) => (e: GridEvent) => {
        try {
          const result = middleware(e);
          // If middleware cancels the event, stop processing
          if (result === null) {
            return null;
          }
          // Continue with next middleware
          return next(result);
        } catch (error) {
          // Log error but continue processing with original event
          console.error('Middleware error:', error);
          // Continue with next middleware using the same event
          return next(e);
        }
      },
      (e: GridEvent) => e
    );

    this.compiled = chain;
    this.isDirty = false;
  }
}