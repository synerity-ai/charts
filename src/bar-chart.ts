import * as d3 from 'd3';
import { ChartConfig, ChartData, BarChartOptions } from './types';

export class BarChart {
  private container: HTMLElement;
  private data: ChartData[];
  private options: BarChartOptions;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private chartGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private xScale!: d3.ScaleBand<string>;
  private yScale!: d3.ScaleLinear<number, number>;

  constructor(config: ChartConfig) {
    this.container = typeof config.container === 'string' 
      ? document.querySelector(config.container) as HTMLElement
      : config.container;
    
    if (!this.container) {
      throw new Error('Container element not found');
    }

    this.data = config.data as ChartData[];
    this.options = this.getDefaultOptions(config.options as BarChartOptions);
    
    this.init();
  }

  private getDefaultOptions(userOptions?: BarChartOptions): BarChartOptions {
    return {
      width: 600,
      height: 400,
      margin: { top: 20, right: 20, bottom: 40, left: 60 },
      colors: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
        '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
      ],
      animate: true,
      orientation: 'vertical',
      type: 'standard',
      showValues: true,
      showGrid: true,
      barPadding: 0.1,
      borderRadius: 4,
      groupPadding: 0.1,
      categoryPadding: 0.2,
      ...userOptions
    };
  }

  private init(): void {
    this.createSVG();
    this.createScales();
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
      .attr('transform', `translate(${this.options.margin!.left}, ${this.options.margin!.top})`);
  }

  private createScales(): void {
    const chartWidth = this.options.width! - this.options.margin!.left - this.options.margin!.right;
    const chartHeight = this.options.height! - this.options.margin!.top - this.options.margin!.bottom;

    // Always use band scale for categories and linear scale for values
    this.xScale = d3.scaleBand()
      .domain(this.data.map(d => d.label))
      .range([0, chartWidth])
      .padding(this.options.barPadding!);

    this.yScale = d3.scaleLinear()
      .domain([0, d3.max(this.data, d => d.value)!])
      .range([chartHeight, 0]);
  }

  private render(): void {
    if (!this.data || this.data.length === 0) {
      console.warn('No data available for bar chart rendering');
      return;
    }

    // Clear existing chart elements
    this.chartGroup.selectAll('*').remove();

    // Add grid if enabled
    if (this.options.showGrid) {
      this.addGrid();
    }

    // Add axes
    this.addAxes();

    // Add bars
    this.addBars();
  }

  private addGrid(): void {
    const chartWidth = this.options.width! - this.options.margin!.left - this.options.margin!.right;
    const chartHeight = this.options.height! - this.options.margin!.top - this.options.margin!.bottom;

    // Remove existing grid
    this.chartGroup.selectAll('.grid').remove();

    // Only add grid if showGrid is enabled
    if (this.options.showGrid) {
      // Vertical grid lines
      this.chartGroup.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(this.yScale)
          .tickSize(-chartWidth)
          .tickFormat(() => '')
        )
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0.3);
    }
  }

  private addAxes(): void {
    const chartWidth = this.options.width! - this.options.margin!.left - this.options.margin!.right;
    const chartHeight = this.options.height! - this.options.margin!.top - this.options.margin!.bottom;

    // Remove existing axes
    this.chartGroup.selectAll('.x-axis').remove();
    this.chartGroup.selectAll('.y-axis').remove();

    // X-axis (bottom)
    this.chartGroup.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(this.xScale));

    // Y-axis (left)
    this.chartGroup.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(this.yScale));
  }

  private addBars(): void {
    // Use D3's enter/update/exit pattern for proper data binding
    const bars = this.chartGroup.selectAll('.bar')
      .data(this.data, (d: any) => d.label); // Use label as key for data binding

    // Remove old bars
    bars.exit().remove();

    // Add new bars
    const barsEnter = bars.enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('fill', (d, i) => d.color || this.options.colors![i % this.options.colors!.length])
      .style('opacity', this.options.animate ? 0 : 1);

    // Merge enter and update selections
    const barsUpdate = barsEnter.merge(bars as any);

    // Set attributes for all bars
    barsUpdate
      .attr('x', d => this.xScale(d.label)!)
      .attr('y', this.yScale(0)!)
      .attr('width', this.xScale.bandwidth())
      .attr('height', 0)
      .attr('rx', this.options.borderRadius || 0)
      .attr('ry', this.options.borderRadius || 0)
      .attr('fill', (d, i) => d.color || this.options.colors![i % this.options.colors!.length]);

    // Animate bars if enabled
    if (this.options.animate) {
      barsUpdate.transition()
        .delay((d, i) => i * 100)
        .duration(800)
        .ease(d3.easeCubicOut)
        .attr('y', d => this.yScale(d.value)!)
        .attr('height', d => this.yScale(0)! - this.yScale(d.value)!)
        .style('opacity', 1);
    } else {
      // Set final positions without animation
      barsUpdate
        .attr('y', d => this.yScale(d.value)!)
        .attr('height', d => this.yScale(0)! - this.yScale(d.value)!);
    }

    // Handle value labels based on showValues option
    if (this.options.showValues) {
      this.addValueLabels(barsUpdate);
    } else {
      // Remove all value labels if showValues is false
      this.chartGroup.selectAll('.value-label').remove();
    }
  }

  private addValueLabels(bars: d3.Selection<SVGRectElement, ChartData, SVGGElement, unknown>): void {
    // Use D3's enter/update/exit pattern for proper data binding
    const labels = this.chartGroup.selectAll('.value-label')
      .data(this.data, (d: any) => d.label); // Use label as key for data binding

    // Remove old labels
    labels.exit().remove();

    // Add new labels
    const labelsEnter = labels.enter()
      .append('text')
      .attr('class', 'value-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', '#374151')
      .style('opacity', this.options.animate ? 0 : 1);

    // Merge enter and update selections
    const labelsUpdate = labelsEnter.merge(labels as any);

    // Set attributes for all labels
    labelsUpdate
      .attr('x', d => this.xScale(d.label)! + this.xScale.bandwidth() / 2)
      .attr('y', d => this.yScale(d.value)! - 5)
      .text(d => d.value.toLocaleString());

    // Animate labels if enabled
    if (this.options.animate) {
      labelsUpdate.transition()
        .delay((d, i) => i * 100 + 400)
        .duration(300)
        .style('opacity', 1);
    }
  }

  public update(newData: ChartData[]): void {
    if (!newData || !Array.isArray(newData) || newData.length === 0) {
      console.warn('Invalid data provided to bar chart update');
      return;
    }
    
    this.data = [...newData];
    this.createScales();
    this.render();
  }

  public updateData(newData: ChartData[]): void {
    if (!newData || !Array.isArray(newData) || newData.length === 0) {
      console.warn('Invalid data provided to bar chart update');
      return;
    }
    
    this.data = [...newData];
    this.createScales();
    this.render();
  }

  public updateOptions(newOptions: Partial<BarChartOptions>): void {
    console.log('Updating chart options:', newOptions);
    this.options = { ...this.options, ...newOptions };
    console.log('New options:', this.options);
    this.createScales();
    this.render();
  }

  public resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;
    this.svg
      .attr('viewBox', `0 0 ${width} ${height}`);
    
    this.createScales();
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
