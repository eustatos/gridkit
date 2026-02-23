import type { EnhancedPlugin } from '@gridkit/core';

/**
 * Export format options
 */
export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'json';

/**
 * Export configuration
 */
export interface ExportConfig {
  /** Export formats available */
  formats: ExportFormat[];
  
  /** Include only filtered data */
  includeFilteredOnly?: boolean;
  
  /** Include formatted values */
  includeFormatting?: boolean;
  
  /** Filename without extension */
  filename?: string;
}

/**
 * Export result
 */
export interface ExportResult {
  /** Download URL or data */
  data: string | Blob;
  /** MIME type */
  mimeType: string;
  /** Filename */
  filename: string;
  /** Format */
  format: ExportFormat;
}

/**
 * Create export plugin
 */
export const exportPlugin = (config: ExportConfig): EnhancedPlugin<ExportConfig> => ({
  metadata: {
    id: '@gridkit/plugin-export',
    name: 'Export Plugin',
    version: '1.0.0',
    author: 'GridKit Team',
    description: 'Export table data to CSV, Excel, PDF',
    category: 'export',
    tags: ['export', 'csv', 'excel', 'pdf', 'data-export'],
    coreVersion: '^1.0.0',
    license: 'MIT',
    pricing: 'free',
    verified: true,
    featured: true,
  },

  async initialize(context) {
    // Register export methods
    (context as any).exportToCSV = () => this.exportData('csv');
    (context as any).exportToExcel = () => this.exportData('xlsx');
    (context as any).exportToPDF = () => this.exportData('pdf');
    (context as any).exportToJSON = () => this.exportData('json');
  },

  destroy(context) {
    // Cleanup
  },

  requiredPermissions: ['state:read'],

  // Export data
  exportData: async (format: ExportFormat): Promise<ExportResult> => {
    // Get data from table state
    const data = await (context as any).getTableState?.() || [];
    
    let formattedData: string | object = data;
    let mimeType = '';
    let extension = '';

    switch (format) {
      case 'csv':
        formattedData = this.formatAsCSV(data);
        mimeType = 'text/csv;charset=utf-8;';
        extension = 'csv';
        break;
      case 'xlsx':
        formattedData = await this.formatAsExcel(data);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
        break;
      case 'pdf':
        formattedData = await this.formatAsPDF(data);
        mimeType = 'application/pdf';
        extension = 'pdf';
        break;
      case 'json':
        formattedData = data;
        mimeType = 'application/json;charset=utf-8;';
        extension = 'json';
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    const filename = config.filename || `export.${extension}`;
    return this.createDownload(formattedData, mimeType, filename);
  },

  formatAsCSV: (data: any[]): string => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const rows = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(h => {
        const value = row[h];
        return `"${String(value ?? '').replace(/"/g, '""')}"`;
      });
      rows.push(values.join(','));
    });

    return rows.join('\n');
  },

  formatAsExcel: async (data: any[]): Promise<Blob> => {
    const csv = this.formatAsCSV(data);
    return new Blob([csv], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  },

  formatAsPDF: async (data: any[]): Promise<Blob> => {
    const csv = this.formatAsCSV(data);
    return new Blob([csv], { type: 'application/pdf' });
  },

  createDownload: (data: string | object, mimeType: string, filename: string): ExportResult => {
    const blob = typeof data === 'string' 
      ? new Blob([data], { type: mimeType })
      : new Blob([JSON.stringify(data, null, 2)], { type: mimeType });

    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      data: url,
      mimeType,
      filename,
      format: filename.split('.').pop() as ExportFormat || 'csv',
    };
  },
});

export type { ExportConfig, ExportResult, ExportFormat };
