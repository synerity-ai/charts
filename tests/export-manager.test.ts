import { ExportManager } from '../src/export-manager';
import { ChartData, ScatterData } from '../src/types';

describe('ExportManager', () => {
  let container: HTMLElement;
  let exportManager: ExportManager;
  let mockChartData: ChartData[];
  let mockScatterData: ScatterData[];

  beforeEach(() => {
    // Create a mock container with SVG
    container = document.createElement('div');
    container.id = 'test-container';
    
    // Create mock SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '600');
    svg.setAttribute('height', '400');
    container.appendChild(svg);
    
    document.body.appendChild(container);
    exportManager = new ExportManager(container);

    // Mock data
    mockChartData = [
      { label: 'Q1', value: 120, color: '#3B82F6' },
      { label: 'Q2', value: 180, color: '#10B981' },
      { label: 'Q3', value: 150, color: '#F59E0B' }
    ];

    mockScatterData = [
      { x: 10, y: 20, label: 'Point 1', color: '#3B82F6' },
      { x: 30, y: 40, label: 'Point 2', color: '#10B981' },
      { x: 50, y: 60, label: 'Point 3', color: '#F59E0B' }
    ];
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Constructor', () => {
    it('should create an ExportManager instance', () => {
      expect(exportManager).toBeInstanceOf(ExportManager);
    });

    it('should accept container element', () => {
      const manager = new ExportManager(container);
      expect(manager).toBeInstanceOf(ExportManager);
    });
  });

  describe('PNG Export', () => {
    it('should export chart as PNG', async () => {
      const result = await exportManager.exportPNG({
        format: 'png',
        width: 800,
        height: 600
      });

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('image/png');
    });

    it('should export with custom quality', async () => {
      const result = await exportManager.exportPNG({
        format: 'png',
        quality: 0.8
      });

      expect(result).toBeInstanceOf(Blob);
    });

    it('should export with custom background color', async () => {
      const result = await exportManager.exportPNG({
        format: 'png',
        backgroundColor: '#f0f0f0'
      });

      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle missing SVG element', async () => {
      const emptyContainer = document.createElement('div');
      const manager = new ExportManager(emptyContainer);

      await expect(manager.exportPNG({
        format: 'png'
      })).rejects.toThrow('No SVG element found in container');
    });
  });

  describe('SVG Export', () => {
    it('should export chart as SVG', async () => {
      const result = await exportManager.exportSVG({
        format: 'svg'
      });

      expect(typeof result).toBe('string');
      expect(result).toContain('<svg');
    });

    it('should export SVG with styles included', async () => {
      const result = await exportManager.exportSVG({
        format: 'svg',
        includeStyles: true
      });

      expect(typeof result).toBe('string');
      expect(result).toContain('<svg');
    });

    it('should export SVG without styles', async () => {
      const result = await exportManager.exportSVG({
        format: 'svg',
        includeStyles: false
      });

      expect(typeof result).toBe('string');
      expect(result).toContain('<svg');
    });

    it('should handle missing SVG element', async () => {
      const emptyContainer = document.createElement('div');
      const manager = new ExportManager(emptyContainer);

      await expect(manager.exportSVG({
        format: 'svg'
      })).rejects.toThrow('No SVG element found in container');
    });
  });

  describe('PDF Export', () => {
    beforeEach(() => {
      // Mock jsPDF
      (window as any).jsPDF = jest.fn().mockImplementation(() => ({
        setProperties: jest.fn(),
        internal: {
          pageSize: {
            getWidth: jest.fn(() => 297),
            getHeight: jest.fn(() => 210)
          }
        },
        addImage: jest.fn(),
        output: jest.fn(() => new Blob(['mock-pdf'], { type: 'application/pdf' }))
      }));
    });

    it('should export chart as PDF', async () => {
      const result = await exportManager.exportPDF({
        format: 'pdf',
        title: 'Test Chart',
        author: 'Test Author'
      });

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/pdf');
    });

    it('should handle missing jsPDF library', async () => {
      delete (window as any).jsPDF;

      await expect(exportManager.exportPDF({
        format: 'pdf'
      })).rejects.toThrow('jsPDF library not found');
    });
  });

  describe('CSV Export', () => {
    it('should export chart data as CSV', () => {
      const result = exportManager.exportCSV(mockChartData);

      expect(typeof result).toBe('string');
      expect(result).toContain('Label,Value,Color');
      expect(result).toContain('Q1,120,#3B82F6');
      expect(result).toContain('Q2,180,#10B981');
      expect(result).toContain('Q3,150,#F59E0B');
    });

    it('should export scatter data as CSV', () => {
      const result = exportManager.exportCSV(mockScatterData);

      expect(typeof result).toBe('string');
      expect(result).toContain('X,Y,Label,Color');
      expect(result).toContain('10,20,Point 1,#3B82F6');
      expect(result).toContain('30,40,Point 2,#10B981');
      expect(result).toContain('50,60,Point 3,#F59E0B');
    });

    it('should handle empty data array', () => {
      const result = exportManager.exportCSV([]);

      expect(typeof result).toBe('string');
      expect(result).toBe('');
    });

    it('should trigger download when filename provided', () => {
      const mockClick = jest.fn();
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();

      // Mock DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: mockClick
      };

      document.createElement = jest.fn(() => mockLink as any);
      document.body.appendChild = mockAppendChild;
      document.body.removeChild = mockRemoveChild;

      exportManager.exportCSV(mockChartData, 'test-chart.csv');

      expect(mockClick).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
    });
  });

  describe('JSON Export', () => {
    it('should export chart data as JSON', () => {
      const result = exportManager.exportJSON(mockChartData);

      expect(typeof result).toBe('string');
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(mockChartData);
    });

    it('should export scatter data as JSON', () => {
      const result = exportManager.exportJSON(mockScatterData);

      expect(typeof result).toBe('string');
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(mockScatterData);
    });

    it('should trigger download when filename provided', () => {
      const mockClick = jest.fn();
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();

      // Mock DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: mockClick
      };

      document.createElement = jest.fn(() => mockLink as any);
      document.body.appendChild = mockAppendChild;
      document.body.removeChild = mockRemoveChild;

      exportManager.exportJSON(mockChartData, 'test-chart.json');

      expect(mockClick).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
    });
  });

  describe('Error Handling', () => {
    it('should handle canvas context not available', async () => {
      const mockGetContext = jest.fn(() => null);
      HTMLCanvasElement.prototype.getContext = mockGetContext;

      await expect(exportManager.exportPNG({
        format: 'png'
      })).rejects.toThrow('Canvas context not available');
    });

    it('should handle canvas toBlob failure', async () => {
      HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
        callback(null);
      });

      await expect(exportManager.exportPNG({
        format: 'png'
      })).rejects.toThrow('Failed to create PNG blob');
    });

    it('should handle image load error', async () => {
      // Mock Image to trigger error
      global.Image = class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src: string = '';
        width: number = 100;
        height: number = 100;
      };

      const img = new Image();
      img.onerror = () => {
        if (img.onerror) img.onerror();
      };

      await expect(exportManager.exportPNG({
        format: 'png'
      })).rejects.toThrow('Failed to load SVG as image');
    });
  });
});
