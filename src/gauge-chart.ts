import * as d3 from 'd3';
import { ChartConfig, GaugeData, GaugeChartOptions } from './types';

export class GaugeChart {
  private container: HTMLElement;
  private data: GaugeData;
  private options: GaugeChartOptions;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private chartGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;

  constructor(config: ChartConfig) {
    this.container = typeof config.container === 'string' 
      ? document.querySelector(config.container) as HTMLElement
      : config.container;
    
    if (!this.container) {
      throw new Error('Container element not found');
    }

    this.data = config.data as GaugeData;
    this.options = this.getDefaultOptions(config.options as GaugeChartOptions);
    
    this.init();
  }

  private getDefaultOptions(userOptions?: GaugeChartOptions): GaugeChartOptions {
    return {
      width: 300,
      height: 300,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      colors: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
        '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
      ],
      animate: true,
      type: 'radial',
      min: 0,
      max: 100,
      thresholds: [
        { value: 25, color: '#EF4444' },
        { value: 50, color: '#F59E0B' },
        { value: 75, color: '#10B981' },
        { value: 100, color: '#3B82F6' }
      ],
      showValue: true,
      showLabel: true,
      arcWidth: 20,
      ...userOptions
    };
  }

  private init(): void {
    this.createSVG();
    this.render();
  }

  private createSVG(): void {
    // Clear existing content
    d3.select(this.container).selectAll('*').remove();

    // Create SVG
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${this.options.width!} ${this.options.height!}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('display', 'block');

    // Create chart group
    this.chartGroup = this.svg.append('g')
      .attr('transform', `translate(${this.options.width! / 2}, ${this.options.height! / 2})`);
  }

  private render(): void {
    if (!this.data) {
      console.warn('No data available for gauge chart rendering');
      return;
    }

    // Clear existing chart elements
    this.chartGroup.selectAll('*').remove();

    if (this.options.type === 'radial') {
      this.renderRadialGauge();
    } else {
      this.renderLinearGauge();
    }
  }

  private renderRadialGauge(): void {
    const radius = Math.min(this.options.width!, this.options.height!) / 2 - 40;
    const arcWidth = this.options.arcWidth!;

    // Create arc generator
    const arc = d3.arc()
      .innerRadius(radius - arcWidth)
      .outerRadius(radius)
      .startAngle((d: any) => d.startAngle)
      .endAngle((d: any) => d.endAngle);

    // Create background arc
    this.chartGroup.append('path')
      .datum({ startAngle: -Math.PI / 2, endAngle: Math.PI / 2 })
      .attr('class', 'gauge-background')
      .attr('d', arc as any)
      .attr('fill', '#E5E7EB');

    // Calculate value angle
    const valueAngle = this.getValueAngle();

    // Create value arc with proper data structure
    const valuePath = this.chartGroup.append('path')
      .datum({ startAngle: -Math.PI / 2, endAngle: -Math.PI / 2 })
      .attr('class', 'gauge-value')
      .attr('d', arc as any)
      .attr('fill', this.getValueColor())
      .style('opacity', this.options.animate ? 0 : 1);

    // Animate value arc if enabled
    if (this.options.animate) {
      valuePath.transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attrTween('d', (d: any) => {
          const interpolate = d3.interpolate(d.endAngle, valueAngle);
          return (t: number) => {
            d.endAngle = interpolate(t);
            return arc(d) || '';
          };
        })
        .style('opacity', 1);
    } else {
      valuePath
        .datum({ startAngle: -Math.PI / 2, endAngle: valueAngle })
        .attr('d', arc as any);
    }

    // Add center circle
    this.chartGroup.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', radius - arcWidth - 10)
      .attr('fill', 'white')
      .attr('stroke', '#E5E7EB')
      .attr('stroke-width', 2);

    // Add value text if enabled
    if (this.options.showValue) {
      this.chartGroup.append('text')
        .attr('class', 'gauge-value-text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('font-size', '24px')
        .attr('font-weight', 'bold')
        .attr('fill', '#374151')
        .style('opacity', this.options.animate ? 0 : 1)
        .text(this.data.value.toFixed(1));

      if (this.options.animate) {
        this.chartGroup.select('.gauge-value-text')
          .transition()
          .delay(500)
          .duration(500)
          .ease(d3.easeCubicOut)
          .style('opacity', 1);
      }
    }

    // Add label if enabled
    if (this.options.showLabel && this.data.label) {
      this.chartGroup.append('text')
        .attr('class', 'gauge-label')
        .attr('x', 0)
        .attr('y', radius + 30)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('font-weight', '500')
        .attr('fill', '#6B7280')
        .style('opacity', this.options.animate ? 0 : 1)
        .text(this.data.label);

      if (this.options.animate) {
        this.chartGroup.select('.gauge-label')
          .transition()
          .delay(700)
          .duration(300)
          .ease(d3.easeCubicOut)
          .style('opacity', 1);
      }
    }
  }

  private renderLinearGauge(): void {
    const width = this.options.width! - this.options.margin!.left - this.options.margin!.right;
    const height = this.options.height! - this.options.margin!.top - this.options.margin!.bottom;
    const gaugeHeight = this.options.arcWidth!;

    // Create scale
    const scale = d3.scaleLinear()
      .domain([this.options.min!, this.options.max!])
      .range([0, width]);

    // Create background bar
    this.chartGroup.append('rect')
      .attr('x', -width / 2)
      .attr('y', -gaugeHeight / 2)
      .attr('width', width)
      .attr('height', gaugeHeight)
      .attr('fill', '#E5E7EB')
      .attr('rx', gaugeHeight / 2)
      .attr('ry', gaugeHeight / 2);

    // Create value bar
    const valueWidth = scale(this.data.value);
    const valueBar = this.chartGroup.append('rect')
      .attr('x', -width / 2)
      .attr('y', -gaugeHeight / 2)
      .attr('width', 0)
      .attr('height', gaugeHeight)
      .attr('fill', this.getValueColor())
      .attr('rx', gaugeHeight / 2)
      .attr('ry', gaugeHeight / 2)
      .style('opacity', this.options.animate ? 0 : 1);

    // Animate value bar if enabled
    if (this.options.animate) {
      valueBar.transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr('width', valueWidth)
        .style('opacity', 1);
    } else {
      valueBar.attr('width', valueWidth);
    }

    // Add value text if enabled
    if (this.options.showValue) {
      this.chartGroup.append('text')
        .attr('class', 'gauge-value-text')
        .attr('x', 0)
        .attr('y', -gaugeHeight - 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '18px')
        .attr('font-weight', 'bold')
        .attr('fill', '#374151')
        .style('opacity', this.options.animate ? 0 : 1)
        .text(this.data.value.toFixed(1));

      if (this.options.animate) {
        this.chartGroup.select('.gauge-value-text')
          .transition()
          .delay(500)
          .duration(500)
          .ease(d3.easeCubicOut)
          .style('opacity', 1);
      }
    }

    // Add label if enabled
    if (this.options.showLabel && this.data.label) {
      this.chartGroup.append('text')
        .attr('class', 'gauge-label')
        .attr('x', 0)
        .attr('y', gaugeHeight + 20)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', '500')
        .attr('fill', '#6B7280')
        .style('opacity', this.options.animate ? 0 : 1)
        .text(this.data.label);

      if (this.options.animate) {
        this.chartGroup.select('.gauge-label')
          .transition()
          .delay(700)
          .duration(300)
          .ease(d3.easeCubicOut)
          .style('opacity', 1);
      }
    }
  }

  private getValueAngle(): number {
    const percentage = (this.data.value - this.options.min!) / (this.options.max! - this.options.min!);
    return -Math.PI / 2 + (percentage * Math.PI);
  }

  private getValueColor(): string {
    if (!this.options.thresholds || this.options.thresholds.length === 0) {
      return this.data.color || this.options.colors![0];
    }

    // Find the appropriate threshold color
    for (let i = this.options.thresholds.length - 1; i >= 0; i--) {
      if (this.data.value <= this.options.thresholds[i].value) {
        return this.options.thresholds[i].color;
      }
    }
    return this.options.thresholds[this.options.thresholds.length - 1].color;
  }

  public update(newData: GaugeData): void {
    if (!newData) {
      console.warn('Invalid data provided to gauge chart update');
      return;
    }
    
    this.data = { ...newData };
    this.render();
  }

  public resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;
    this.svg
      .attr('viewBox', `0 0 ${width} ${height}`);
    
    this.chartGroup.attr('transform', `translate(${width / 2}, ${height / 2})`);
    this.render();
  }

  public destroy(): void {
    if (this.svg) {
      this.svg.remove();
    }
    if (this.container) {
      d3.select(this.container).selectAll('*').remove();
    }
  }
}
