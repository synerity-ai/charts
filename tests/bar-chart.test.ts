import { BarChart } from '../src/bar-chart';
import { ChartData, BarChartOptions } from '../src/types';

describe('BarChart', () => {
  let container: HTMLElement;
  let chart: BarChart;
  let mockData: ChartData[];

  beforeEach(() => {
    // Create a mock container
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Mock data
    mockData = [
      { label: 'Q1', value: 120, color: '#3B82F6' },
      { label: 'Q2', value: 180, color: '#10B981' },
      { label: 'Q3', value: 150, color: '#F59E0B' },
      { label: 'Q4', value: 220, color: '#EF4444' }
    ];
  });

  afterEach(() => {
    if (chart) {
      chart.destroy();
    }
    document.body.removeChild(container);
  });

  describe('Constructor', () => {
    it('should create a BarChart instance with valid config', () => {
      expect(() => {
        chart = new BarChart({
          container: container,
          data: mockData
        });
      }).not.toThrow();

      expect(chart).toBeInstanceOf(BarChart);
    });

    it('should create a BarChart instance with string container selector', () => {
      expect(() => {
        chart = new BarChart({
          container: '#test-container',
          data: mockData
        });
      }).not.toThrow();

      expect(chart).toBeInstanceOf(BarChart);
    });

    it('should throw error when container is not found', () => {
      expect(() => {
        new BarChart({
          container: '#non-existent',
          data: mockData
        });
      }).toThrow('Container element not found');
    });

    it('should use default options when none provided', () => {
      chart = new BarChart({
        container: container,
        data: mockData
      });

      expect(chart).toBeInstanceOf(BarChart);
    });

    it('should merge custom options with defaults', () => {
      const customOptions: BarChartOptions = {
        width: 800,
        height: 500,
        animate: false,
        showValues: false
      };

      chart = new BarChart({
        container: container,
        data: mockData,
        options: customOptions
      });

      expect(chart).toBeInstanceOf(BarChart);
    });
  });

  describe('Data Updates', () => {
    beforeEach(() => {
      chart = new BarChart({
        container: container,
        data: mockData
      });
    });

    it('should update chart with new data', () => {
      const newData: ChartData[] = [
        { label: 'A', value: 50, color: '#FF0000' },
        { label: 'B', value: 75, color: '#00FF00' }
      ];

      expect(() => {
        chart.update(newData);
      }).not.toThrow();
    });

    it('should handle empty data array', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      chart.update([]);
      
      expect(consoleSpy).toHaveBeenCalledWith('Invalid data provided to chart update');
      consoleSpy.mockRestore();
    });

    it('should handle null data', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      chart.update(null as any);
      
      expect(consoleSpy).toHaveBeenCalledWith('Invalid data provided to chart update');
      consoleSpy.mockRestore();
    });

    it('should handle undefined data', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      chart.update(undefined as any);
      
      expect(consoleSpy).toHaveBeenCalledWith('Invalid data provided to chart update');
      consoleSpy.mockRestore();
    });
  });

  describe('Resize', () => {
    beforeEach(() => {
      chart = new BarChart({
        container: container,
        data: mockData
      });
    });

    it('should resize chart with new dimensions', () => {
      expect(() => {
        chart.resize(800, 600);
      }).not.toThrow();
    });

    it('should handle zero dimensions', () => {
      expect(() => {
        chart.resize(0, 0);
      }).not.toThrow();
    });
  });

  describe('Destroy', () => {
    beforeEach(() => {
      chart = new BarChart({
        container: container,
        data: mockData
      });
    });

    it('should destroy chart and clean up', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      expect(() => {
        chart.destroy();
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Destroying chart...');
      expect(consoleSpy).toHaveBeenCalledWith('Chart destroyed');
      
      consoleSpy.mockRestore();
    });

    it('should handle multiple destroy calls', () => {
      expect(() => {
        chart.destroy();
        chart.destroy();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing container element', () => {
      const invalidContainer = document.createElement('div');
      document.body.removeChild(container);

      expect(() => {
        new BarChart({
          container: invalidContainer,
          data: mockData
        });
      }).toThrow('Container element not found');
    });

    it('should handle invalid data during initialization', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      chart = new BarChart({
        container: container,
        data: []
      });

      expect(consoleSpy).toHaveBeenCalledWith('No data available for chart rendering');
      consoleSpy.mockRestore();
    });
  });

  describe('Options Validation', () => {
    it('should handle negative dimensions', () => {
      const options: BarChartOptions = {
        width: -100,
        height: -50
      };

      expect(() => {
        chart = new BarChart({
          container: container,
          data: mockData,
          options
        });
      }).not.toThrow();
    });

    it('should handle custom colors array', () => {
      const options: BarChartOptions = {
        colors: ['#FF0000', '#00FF00', '#0000FF']
      };

      expect(() => {
        chart = new BarChart({
          container: container,
          data: mockData,
          options
        });
      }).not.toThrow();
    });

    it('should handle empty colors array', () => {
      const options: BarChartOptions = {
        colors: []
      };

      expect(() => {
        chart = new BarChart({
          container: container,
          data: mockData,
          options
        });
      }).not.toThrow();
    });
  });
});
