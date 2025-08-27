import { GaugeChart } from '../src/gauge-chart';
import { GaugeData, GaugeChartOptions } from '../src/types';

describe('GaugeChart', () => {
  let container: HTMLElement;
  let gaugeChart: GaugeChart;

  beforeEach(() => {
    // Create a test container
    container = document.createElement('div');
    container.style.width = '300px';
    container.style.height = '300px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (gaugeChart) {
      gaugeChart.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('should create a gauge chart without errors', () => {
    const data: GaugeData = {
      value: 75,
      min: 0,
      max: 100,
      label: 'Test Gauge'
    };

    const options: GaugeChartOptions = {
      width: 300,
      height: 300,
      type: 'radial',
      animate: false
    };

    expect(() => {
      gaugeChart = new GaugeChart({
        container: container,
        data: data,
        options: options
      });
    }).not.toThrow();
  });

  it('should handle animation without arc flag errors', () => {
    const data: GaugeData = {
      value: 50,
      min: 0,
      max: 100,
      label: 'Animated Gauge'
    };

    const options: GaugeChartOptions = {
      width: 300,
      height: 300,
      type: 'radial',
      animate: true
    };

    expect(() => {
      gaugeChart = new GaugeChart({
        container: container,
        data: data,
        options: options
      });
    }).not.toThrow();

    // Wait for animation to complete
    return new Promise(resolve => setTimeout(resolve, 1500));
  });

  it('should update gauge value without errors', () => {
    const data: GaugeData = {
      value: 25,
      min: 0,
      max: 100,
      label: 'Update Test'
    };

    gaugeChart = new GaugeChart({
      container: container,
      data: data,
      options: { animate: false }
    });

    const newData: GaugeData = {
      value: 75,
      min: 0,
      max: 100,
      label: 'Updated Gauge'
    };

    expect(() => {
      gaugeChart.update(newData);
    }).not.toThrow();
  });

  it('should handle linear gauge type', () => {
    const data: GaugeData = {
      value: 60,
      min: 0,
      max: 100,
      label: 'Linear Gauge'
    };

    const options: GaugeChartOptions = {
      width: 300,
      height: 100,
      type: 'linear',
      animate: false
    };

    expect(() => {
      gaugeChart = new GaugeChart({
        container: container,
        data: data,
        options: options
      });
    }).not.toThrow();
  });

  it('should handle edge case values', () => {
    const data: GaugeData = {
      value: 0,
      min: 0,
      max: 100,
      label: 'Edge Case'
    };

    expect(() => {
      gaugeChart = new GaugeChart({
        container: container,
        data: data,
        options: { animate: false }
      });
    }).not.toThrow();

    // Test max value
    const maxData: GaugeData = {
      value: 100,
      min: 0,
      max: 100,
      label: 'Max Value'
    };

    expect(() => {
      gaugeChart.update(maxData);
    }).not.toThrow();
  });
});
