import * as d3 from 'd3';
import { ChartConfig, BubbleData, BubbleChartOptions } from './types';

export class BubbleChart {
  private container: HTMLElement;
  private data: BubbleData[];
  private options: BubbleChartOptions;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private chartGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private xScale!: d3.ScaleLinear<number, number>;
  private yScale!: d3.ScaleLinear<number, number>;
  private rScale!: d3.ScaleLinear<number, number>;

  constructor(config: ChartConfig) {
    this.container = typeof config.container === 'string' 
      ? document.querySelector(config.container) as HTMLElement
      : config.container;
    
    if (!this.container) {
      throw new Error('Container element not found');
    }

    this.data = config.data as BubbleData[];
    this.options = this.getDefaultOptions(config.options as BubbleChartOptions);
    
    this.init();
  }

  private getDefaultOptions(userOptions?: BubbleChartOptions): BubbleChartOptions {
    return {
      width: 600,
      height: 400,
      margin: { top: 20, right: 20, bottom: 40, left: 60 },
      colors: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
        '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
      ],
      animate: true,
      showGrid: true,
      showLabels: true,
      minRadius: 5,
      maxRadius: 30,
      opacity: 0.7,
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

    // Create X scale
    const xExtent = d3.extent(this.data, d => d.x) as [number, number];
    this.xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([0, chartWidth])
      .nice();

    // Create Y scale
    const yExtent = d3.extent(this.data, d => d.y) as [number, number];
    this.yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([chartHeight, 0])
      .nice();

    // Create radius scale
    const rExtent = d3.extent(this.data, d => d.r) as [number, number];
    this.rScale = d3.scaleLinear()
      .domain(rExtent)
      .range([this.options.minRadius!, this.options.maxRadius!]);
  }

  private render(): void {
    if (!this.data || this.data.length === 0) {
      console.warn('No data available for bubble chart rendering');
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

    // Add bubbles
    this.addBubbles();

    // Add labels if enabled
    if (this.options.showLabels) {
      this.addLabels();
    }
  }

  private addGrid(): void {
    const chartWidth = this.options.width! - this.options.margin!.left - this.options.margin!.right;
    const chartHeight = this.options.height! - this.options.margin!.top - this.options.margin!.bottom;

    // Vertical grid lines
    this.chartGroup.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(this.yScale)
        .tickSize(-chartWidth)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3);

    // Horizontal grid lines
    this.chartGroup.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(this.xScale)
        .tickSize(-chartHeight)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3);
  }

  private addAxes(): void {
    const chartWidth = this.options.width! - this.options.margin!.left - this.options.margin!.right;
    const chartHeight = this.options.height! - this.options.margin!.top - this.options.margin!.bottom;

    // X-axis
    this.chartGroup.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(this.xScale));

    // Y-axis
    this.chartGroup.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(this.yScale));
  }

  private addBubbles(): void {
    const bubbles = this.chartGroup.selectAll('.bubble')
      .data(this.data)
      .enter()
      .append('circle')
      .attr('class', 'bubble')
      .attr('cx', d => this.xScale(d.x)!)
      .attr('cy', d => this.yScale(d.y)!)
      .attr('r', 0) // Start with radius 0 for animation
      .attr('fill', (d, i) => d.color || this.options.colors![i % this.options.colors!.length])
      .attr('opacity', this.options.opacity || 0.7)
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('opacity', this.options.animate ? 0 : 1);

    // Animate bubbles if enabled
    if (this.options.animate) {
      bubbles.transition()
        .delay((d, i) => i * 100)
        .duration(800)
        .ease(d3.easeCubicOut)
        .attr('r', d => this.rScale(d.r)!)
        .style('opacity', 1);
    } else {
      bubbles.attr('r', d => this.rScale(d.r)!);
    }

    // Add hover effects
    bubbles
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('opacity', 1)
          .attr('stroke-width', 3);
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .attr('opacity', 0.7)
          .attr('stroke-width', 2);
      });
  }

  private addLabels(): void {
    const labels = this.chartGroup.selectAll('.bubble-label')
      .data(this.data)
      .enter()
      .append('text')
      .attr('class', 'bubble-label')
      .attr('x', d => this.xScale(d.x)!)
      .attr('y', d => this.yScale(d.y)!)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '10px')
      .attr('font-weight', '500')
      .attr('fill', '#374151')
      .style('pointer-events', 'none')
      .style('opacity', this.options.animate ? 0 : 1)
      .text(d => d.label || d.r.toString());

    // Animate labels if enabled
    if (this.options.animate) {
      labels.transition()
        .delay((d, i) => i * 100 + 400)
        .duration(300)
        .ease(d3.easeCubicOut)
        .style('opacity', 1);
    }
  }

  public update(newData: BubbleData[]): void {
    if (!newData || !Array.isArray(newData) || newData.length === 0) {
      console.warn('Invalid data provided to bubble chart update');
      return;
    }
    
    this.data = [...newData];
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
