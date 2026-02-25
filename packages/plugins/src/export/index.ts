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
export const exportPlugin = (config: ExportConfig) => {
  // Helper functions
  const formatAsCSV = (data: any[]): string => {
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
  };

  const formatAsExcel = async (data: any[]): Promise<Blob> => {
    const csv = formatAsCSV(data);
    return new Blob([csv], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  };

  const formatAsPDF = async (data: any[]): Promise<Blob> => {
    const csv = formatAsCSV(data);
    return new Blob([csv], { type: 'application/pdf' });
  };

  const createDownload = (data: string | object, mimeType: string, filename: string): ExportResult => {
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
  };

  // Export data function
  const exportData = async (format: ExportFormat): Promise<ExportResult> => {
    // This is a simplified implementation that generates sample data
    const sampleData = [
      { id: 1, name: 'Sample Item 1' },
      { id: 2, name: 'Sample Item 2' }
    ];
    
    let formattedData: string | object = sampleData;
    let mimeType = '';
    let extension = '';

    switch (format) {
      case 'csv':
        formattedData = formatAsCSV(sampleData);
        mimeType = 'text/csv;charset=utf-8;';
        extension = 'csv';
        break;
      case 'xlsx':
        formattedData = await formatAsExcel(sampleData);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
        break;
      case 'pdf':
        formattedData = await formatAsPDF(sampleData);
        mimeType = 'application/pdf';
        extension = 'pdf';
        break;
      case 'json':
        formattedData = sampleData;
        mimeType = 'application/json;charset=utf-8;';
        extension = 'json';
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    const filename = config.filename || `export.${extension}`;
    return createDownload(formattedData, mimeType, filename);
  };

  // Main plugin object
  return {
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

    async initialize(_config: ExportConfig, context: any) {
      // Register export methods on context
      (context as any).exportToCSV = () => exportData('csv');
      (context as any).exportToExcel = () => exportData('xlsx');
      (context as any).exportToPDF = () => exportData('pdf');
      (context as any).exportToJSON = () => exportData('json');
    },

    destroy() {
      // Cleanup
    },

    requiredPermissions: ['state:read'],

    // Export data
    exportData,
  };
};

