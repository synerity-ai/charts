import * as d3 from 'd3';
import { ChartConfig, ChartData, AreaChartOptions } from './types';

export class AreaChart {
  private container: HTMLElement;
  private data: ChartData[];
  private options: AreaChartOptions;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private chartGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private xScale!: d3.ScaleBand<string>;
  private yScale!: d3.ScaleLinear<number, number>;
  private areaGenerator!: d3.Area<ChartData>;
  private lineGenerator!: d3.Line<ChartData>;

  constructor(config: ChartConfig) {
    this.container = typeof config.container === 'string' 
      ? document.querySelector(config.container) as HTMLElement
      : config.container;
    
    if (!this.container) {
      throw new Error('Container element not found');
    }

    this.data = config.data as ChartData[];
    this.options = this.getDefaultOptions(config.options as AreaChartOptions);
    
    this.init();
  }

  private getDefaultOptions(userOptions?: AreaChartOptions): AreaChartOptions {
    return {
      width: 600,
      height: 400,
      margin: { top: 20, right: 20, bottom: 40, left: 60 },
      colors: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
        '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
      ],
      animate: true,
      type: 'standard',
      showPoints: true,
      showGrid: true,
      curveType: 'monotoneX',
      strokeWidth: 2,
      pointRadius: 4,
      areaOpacity: 0.3,
      ...userOptions
    };
  }

  private init(): void {
    this.createSVG();
    this.createScales();
    this.createGenerators();
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
    this.xScale = d3.scaleBand()
      .domain(this.data.map(d => d.label))
      .range([0, chartWidth])
      .padding(0.1);

    // Create Y scale
    const maxValue = d3.max(this.data, d => d.value)!;
    this.yScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([chartHeight, 0]);
  }

  private createGenerators(): void {
    const curve = this.getCurveFunction();

    // Create area generator
    this.areaGenerator = d3.area<ChartData>()
      .x(d => this.xScale(d.label)! + this.xScale.bandwidth() / 2)
      .y0(this.yScale(0)!)
      .y1(d => this.yScale(d.value)!)
      .curve(curve);

    // Create line generator
    this.lineGenerator = d3.line<ChartData>()
      .x(d => this.xScale(d.label)! + this.xScale.bandwidth() / 2)
      .y(d => this.yScale(d.value)!)
      .curve(curve);
  }

  private getCurveFunction(): d3.CurveFactory {
    switch (this.options.curveType) {
      case 'linear': return d3.curveLinear;
      case 'step': return d3.curveStep;
      case 'stepAfter': return d3.curveStepAfter;
      case 'stepBefore': return d3.curveStepBefore;
      case 'basis': return d3.curveBasis;
      case 'cardinal': return d3.curveCardinal;
      case 'catmullRom': return d3.curveCatmullRom;
      case 'monotoneX':
      default: return d3.curveMonotoneX;
    }
  }

  private render(): void {
    if (!this.data || this.data.length === 0) {
      console.warn('No data available for area chart rendering');
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

    // Add area
    this.addArea();

    // Add line
    this.addLine();

    // Add points if enabled
    if (this.options.showPoints) {
      this.addPoints();
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

  private addArea(): void {
    const area = this.chartGroup.append('path')
      .datum(this.data)
      .attr('class', 'area')
      .attr('fill', this.options.colors![0])
      .attr('opacity', this.options.areaOpacity || 0.3)
      .style('opacity', this.options.animate ? 0 : 1);

    if (this.options.animate) {
      area.transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .style('opacity', 1);
    }

    // Set the area path
    area.attr('d', this.areaGenerator);
  }

  private addLine(): void {
    const line = this.chartGroup.append('path')
      .datum(this.data)
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', this.options.colors![0])
      .attr('stroke-width', this.options.strokeWidth || 2)
      .style('opacity', this.options.animate ? 0 : 1);

    if (this.options.animate) {
      line.transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .style('opacity', 1);
    }

    // Set the line path
    line.attr('d', this.lineGenerator);
  }

  private addPoints(): void {
    const points = this.chartGroup.selectAll('.point')
      .data(this.data)
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('cx', d => this.xScale(d.label)! + this.xScale.bandwidth() / 2)
      .attr('cy', d => this.yScale(d.value)!)
      .attr('r', this.options.pointRadius || 4)
      .attr('fill', this.options.colors![0])
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('opacity', this.options.animate ? 0 : 1);

    if (this.options.animate) {
      points.transition()
        .delay((d, i) => i * 100)
        .duration(300)
        .ease(d3.easeCubicOut)
        .style('opacity', 1);
    }
  }

  public update(newData: ChartData[]): void {
    if (!newData || !Array.isArray(newData) || newData.length === 0) {
      console.warn('Invalid data provided to area chart update');
      return;
    }
    
    this.data = [...newData];
    this.createScales();
    this.createGenerators();
    this.render();
  }

  public resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;
    this.svg
      .attr('viewBox', `0 0 ${width} ${height}`);
    
    this.createScales();
    this.createGenerators();
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
