import { ChartData, ScatterData } from './types';

export interface ExportConfig {
  format: 'png' | 'svg' | 'pdf';
  filename?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  quality?: number;
}

export interface PNGExportConfig extends ExportConfig {
  format: 'png';
  quality?: number; // 0-1
}

export interface SVGExportConfig extends ExportConfig {
  format: 'svg';
  includeStyles?: boolean;
}

export interface PDFExportConfig extends ExportConfig {
  format: 'pdf';
  title?: string;
  author?: string;
  subject?: string;
}

export class ExportManager {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Export chart as PNG image
   */
  async exportPNG(config: PNGExportConfig): Promise<Blob> {
    const { width = 800, height = 600, backgroundColor = 'white', quality = 0.9 } = config;
    
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Get SVG content
    const svgElement = this.container.querySelector('svg');
    if (!svgElement) {
      throw new Error('No SVG element found in container');
    }

    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create image from SVG
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Calculate scaling to fit canvas
        const svgRect = svgElement.getBoundingClientRect();
        const scaleX = width / svgRect.width;
        const scaleY = height / svgRect.height;
        const scale = Math.min(scaleX, scaleY);

        const scaledWidth = svgRect.width * scale;
        const scaledHeight = svgRect.height * scale;
        const offsetX = (width - scaledWidth) / 2;
        const offsetY = (height - scaledHeight) / 2;

        // Draw image on canvas
        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create PNG blob'));
          }
        }, 'image/png', quality);

        // Cleanup
        URL.revokeObjectURL(svgUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        reject(new Error('Failed to load SVG as image'));
      };
      img.src = svgUrl;
    });
  }

  /**
   * Export chart as SVG
   */
  async exportSVG(config: SVGExportConfig): Promise<string> {
    const { includeStyles = true } = config;
    
    const svgElement = this.container.querySelector('svg');
    if (!svgElement) {
      throw new Error('No SVG element found in container');
    }

    // Clone the SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    
    if (includeStyles) {
      // Include computed styles
      const styles = this.getComputedStyles();
      const styleElement = document.createElement('style');
      styleElement.textContent = styles;
      clonedSvg.insertBefore(styleElement, clonedSvg.firstChild);
    }

    return new XMLSerializer().serializeToString(clonedSvg);
  }

  /**
   * Export chart as PDF (requires jsPDF library)
   */
  async exportPDF(config: PDFExportConfig): Promise<Blob> {
    const { width = 800, height = 600, title = 'Chart Export', author = 'Synerity Charts' } = config;
    
    // Check if jsPDF is available
    if (typeof window.jsPDF === 'undefined') {
      throw new Error('jsPDF library not found. Please include jsPDF in your project.');
    }

    // First export as PNG
    const pngBlob = await this.exportPNG({ format: 'png', width, height });
    const pngUrl = URL.createObjectURL(pngBlob);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Create PDF
          const pdf = new window.jsPDF('landscape', 'mm', 'a4');
          
          // Add metadata
          pdf.setProperties({
            title,
            author,
            subject: 'Chart Export',
            creator: 'Synerity Charts'
          });

          // Calculate dimensions to fit on page
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const imgAspectRatio = img.width / img.height;
          const pageAspectRatio = pageWidth / pageHeight;

          let imgWidth, imgHeight;
          if (imgAspectRatio > pageAspectRatio) {
            imgWidth = pageWidth - 20;
            imgHeight = imgWidth / imgAspectRatio;
          } else {
            imgHeight = pageHeight - 20;
            imgWidth = imgHeight * imgAspectRatio;
          }

          const x = (pageWidth - imgWidth) / 2;
          const y = (pageHeight - imgHeight) / 2;

          // Add image to PDF
          pdf.addImage(img, 'PNG', x, y, imgWidth, imgHeight);

          // Generate PDF blob
          const pdfBlob = pdf.output('blob');
          resolve(pdfBlob);

          // Cleanup
          URL.revokeObjectURL(pngUrl);
        } catch (error) {
          URL.revokeObjectURL(pngUrl);
          reject(error);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(pngUrl);
        reject(new Error('Failed to load PNG image for PDF'));
      };
      img.src = pngUrl;
    });
  }

  /**
   * Export data as CSV
   */
  exportCSV(data: ChartData[] | ScatterData[], filename?: string): string {
    let csvContent = '';
    
    if (data.length === 0) {
      return csvContent;
    }

    // Determine data type and create headers
    const isScatterData = 'x' in data[0];
    
    if (isScatterData) {
      const scatterData = data as ScatterData[];
      csvContent = 'X,Y,Label,Color\n';
      scatterData.forEach(d => {
        csvContent += `${d.x},${d.y},${d.label || ''},${d.color || ''}\n`;
      });
    } else {
      const chartData = data as ChartData[];
      csvContent = 'Label,Value,Color\n';
      chartData.forEach(d => {
        csvContent += `${d.label},${d.value},${d.color || ''}\n`;
      });
    }

    // Trigger download if filename provided
    if (filename) {
      this.downloadFile(csvContent, filename, 'text/csv');
    }

    return csvContent;
  }

  /**
   * Export data as JSON
   */
  exportJSON(data: ChartData[] | ScatterData[], filename?: string): string {
    const jsonContent = JSON.stringify(data, null, 2);
    
    if (filename) {
      this.downloadFile(jsonContent, filename, 'application/json');
    }

    return jsonContent;
  }

  /**
   * Download file to user's device
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Get computed styles for SVG export
   */
  private getComputedStyles(): string {
    const styles: string[] = [];
    
    // Add common chart styles
    styles.push(`
      .bar { fill: currentColor; }
      .line { fill: none; stroke: currentColor; }
      .point { fill: currentColor; }
      .slice { fill: currentColor; }
      .grid line { stroke: #E5E7EB; stroke-width: 1; stroke-dasharray: 3,3; }
      .x-axis line, .y-axis line { stroke: #D1D5DB; stroke-width: 1; }
      .x-axis path, .y-axis path { stroke: #D1D5DB; stroke-width: 1; }
      .text-sm { font-size: 0.875rem; }
      .font-medium { font-weight: 500; }
      .fill-gray-600 { fill: #4B5563; }
      .fill-gray-700 { fill: #374151; }
    `);

    return styles.join('\n');
  }
}

// Add jsPDF to window type
declare global {
  interface Window {
    jsPDF: any;
  }
}
