import * as d3 from 'd3';
import { ChartConfig, ChartData, ScatterData, ScatterPlotOptions } from './types';

export class ScatterPlot {
  private container: HTMLElement;
  private data: ScatterData[];
  private options: ScatterPlotOptions;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private chartGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;

  constructor(config: ChartConfig) {
    this.container = typeof config.container === 'string' 
      ? document.querySelector(config.container) as HTMLElement
      : config.container;
    
    if (!this.container) {
      throw new Error('Container element not found');
    }

    // Ensure data is ScatterData[] for scatter plot
    // Type checking for scatter plot data
    if (!Array.isArray(config.data) || config.data.length === 0 || !('x' in config.data[0])) {
      throw new Error('Scatter plot requires ScatterData[] format');
    }

    this.data = config.data as ScatterData[];
    this.options = this.getDefaultOptions(config.options as ScatterPlotOptions);
    
    this.init();
  }

  private isScatterData(data: ChartData[] | ScatterData[]): data is ScatterData[] {
    return data.length > 0 && 'x' in data[0] && 'y' in data[0];
  }

  private getDefaultOptions(userOptions?: ScatterPlotOptions): ScatterPlotOptions {
    return {
      width: 600,
      height: 400,
      margin: { top: 20, right: 20, bottom: 60, left: 60 },
      colors: [
        '#3B82F6', // blue-500
        '#10B981', // emerald-500
        '#F59E0B', // amber-500
        '#EF4444', // red-500
        '#8B5CF6', // violet-500
        '#06B6D4', // cyan-500
        '#84CC16', // lime-500
        '#F97316', // orange-500
      ],
      animate: true,
      showGrid: true,
      showTrendLine: false,
      pointRadius: 6,
      pointOpacity: 0.7,
      ...userOptions
    };
  }

  private init(): void {
    this.createSVG();
    this.render();
  }

  private createSVG(): void {
    console.log('Creating Scatter Plot SVG...');
    // Clear existing content completely
    d3.select(this.container).selectAll('*').remove();

    // Create SVG
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', this.options.width!)
      .attr('height', this.options.height!)
      .attr('class', 'w-full h-full');

    // Create chart group
    this.chartGroup = this.svg.append('g')
      .attr('transform', `translate(${this.options.margin!.left}, ${this.options.margin!.top})`);
    
    console.log('Scatter Plot SVG created successfully');
  }

  private render(): void {
    // Ensure we have valid data
    if (!this.data || this.data.length === 0) {
      console.warn('No data available for scatter plot rendering');
      return;
    }

    console.log('Rendering scatter plot with data:', this.data);

    const chartWidth = this.options.width! - this.options.margin!.left - this.options.margin!.right;
    const chartHeight = this.options.height! - this.options.margin!.top - this.options.margin!.bottom;

    // Clear all existing chart elements
    console.log('Clearing existing scatter plot elements...');
    this.chartGroup.selectAll('*').remove();

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([d3.min(this.data, (d: ScatterData) => d.x) || 0, d3.max(this.data, (d: ScatterData) => d.x) || 0])
      .range([0, chartWidth])
      .nice();

    const yScale = d3.scaleLinear()
      .domain([d3.min(this.data, (d: ScatterData) => d.y) || 0, d3.max(this.data, (d: ScatterData) => d.y) || 0])
      .range([chartHeight, 0])
      .nice();

    // Add grid lines if enabled
    if (this.options.showGrid) {
      // X-axis grid
      this.chartGroup.append('g')
        .attr('class', 'grid-x')
        .call(d3.axisBottom(xScale)
          .tickSize(-chartHeight)
          .tickFormat(() => '')
        )
        .selectAll('line')
        .attr('stroke', '#E5E7EB')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3');

      // Y-axis grid
      this.chartGroup.append('g')
        .attr('class', 'grid-y')
        .call(d3.axisLeft(yScale)
          .tickSize(-chartWidth)
          .tickFormat(() => '')
        )
        .selectAll('line')
        .attr('stroke', '#E5E7EB')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3');
    }

    // Add trend line if enabled
    if (this.options.showTrendLine) {
      const trendLine = this.calculateTrendLine();
      if (trendLine) {
        this.chartGroup.append('line')
          .attr('class', 'trend-line')
          .attr('x1', xScale(trendLine.x1))
          .attr('y1', yScale(trendLine.y1))
          .attr('x2', xScale(trendLine.x2))
          .attr('y2', yScale(trendLine.y2))
          .attr('stroke', '#6B7280')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5')
          .style('opacity', this.options.animate ? 0 : 1)
          .transition()
          .delay(500)
          .duration(800)
          .style('opacity', 1);
      }
    }

    // Create scatter points
    const points = this.chartGroup.selectAll('.point')
      .data(this.data)
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('cx', (d: ScatterData) => xScale(d.x))
      .attr('cy', (d: ScatterData) => yScale(d.y))
      .attr('r', this.options.pointRadius!)
      .attr('fill', (d: ScatterData, i: number) => d.color || this.options.colors![i % this.options.colors!.length])
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('opacity', this.options.animate ? 0 : this.options.pointOpacity!);

    // Animate points if enabled
    if (this.options.animate) {
      points.transition()
        .delay((d, i) => i * 50)
        .duration(300)
        .ease(d3.easeCubicOut)
        .style('opacity', this.options.pointOpacity!);
    }

    // Add axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    this.chartGroup.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('class', 'text-sm fill-gray-600')
      .style('text-anchor', 'middle');

    this.chartGroup.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .attr('class', 'text-sm fill-gray-600');

    // Style axes
    this.chartGroup.selectAll('.x-axis line, .y-axis line')
      .attr('stroke', '#D1D5DB')
      .attr('stroke-width', 1);

    this.chartGroup.selectAll('.x-axis path, .y-axis path')
      .attr('stroke', '#D1D5DB')
      .attr('stroke-width', 1);
  }

  private calculateTrendLine(): { x1: number; y1: number; x2: number; y2: number } | null {
    if (this.data.length < 2) return null;

    const n = this.data.length;
    const sumX = this.data.reduce((sum, d) => sum + d.x, 0);
    const sumY = this.data.reduce((sum, d) => sum + d.y, 0);
    const sumXY = this.data.reduce((sum, d) => sum + d.x * d.y, 0);
    const sumXX = this.data.reduce((sum, d) => sum + d.x * d.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const minX = d3.min(this.data, d => d.x) || 0;
    const maxX = d3.max(this.data, d => d.x) || 0;

    return {
      x1: minX,
      y1: slope * minX + intercept,
      x2: maxX,
      y2: slope * maxX + intercept
    };
  }

  public update(newData: ScatterData[]): void {
    // Validate the new data
    if (!newData || !Array.isArray(newData) || newData.length === 0) {
      console.warn('Invalid data provided to scatter plot update');
      return;
    }
    
    console.log('Updating scatter plot with new data:', newData);
    this.data = [...newData]; // Create a copy to avoid reference issues
    this.render();
  }

  public resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;
    this.svg
      .attr('width', width)
      .attr('height', height);
    this.render();
  }

  public destroy(): void {
    console.log('Destroying scatter plot...');
    if (this.svg) {
      this.svg.remove();
    }
    // Also clear the container to ensure no leftover elements
    if (this.container) {
      d3.select(this.container).selectAll('*').remove();
    }
    console.log('Scatter plot destroyed');
  }
}
