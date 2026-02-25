/**
 * Compression module exports
 * Provides configurable history compression strategies for Time Travel
 */

export type {
  CompressionStrategyConfig,
  CompressionStrategy,
  CompressionMetadata,
} from "../types";

export { BaseCompressionStrategy, NoCompressionStrategy } from "./strategy";

export type { TimeBasedCompressionConfig } from "./time-based";
export { TimeBasedCompression } from "./time-based";

export type { SizeBasedCompressionConfig } from "./size-based";
export { SizeBasedCompression } from "./size-based";

export type { SignificanceBasedCompressionConfig } from "./significance-based";
export { SignificanceBasedCompression, compareSnapshots } from "./significance-based";

export type {
  CompressionFactoryConfig,
  CompressionStrategyType,
} from "./factory";
export { CompressionFactory } from "./factory";
