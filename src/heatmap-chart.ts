import * as d3 from 'd3';
import { ChartConfig, HeatmapData, HeatmapOptions } from './types';

export class HeatmapChart {
  private container: HTMLElement;
  private data: HeatmapData[];
  private options: HeatmapOptions;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private chartGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private xScale!: d3.ScaleBand<string>;
  private yScale!: d3.ScaleBand<string>;
  private colorScale!: d3.ScaleSequential<string, never>;

  constructor(config: ChartConfig) {
    this.container = typeof config.container === 'string' 
      ? document.querySelector(config.container) as HTMLElement
      : config.container;
    
    if (!this.container) {
      throw new Error('Container element not found');
    }

    this.data = config.data as HeatmapData[];
    this.options = this.getDefaultOptions(config.options as HeatmapOptions);
    
    this.init();
  }

  private getDefaultOptions(userOptions?: HeatmapOptions): HeatmapOptions {
    return {
      width: 600,
      height: 400,
      margin: { top: 20, right: 20, bottom: 40, left: 60 },
      colors: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
        '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
      ],
      animate: true,
      showValues: true,
      colorScale: 'sequential',
      colorDomain: undefined,
      cellPadding: 2,
      showAxis: true,
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

    // Get unique x and y values
    const xValues = [...new Set(this.data.map(d => d.x.toString()))];
    const yValues = [...new Set(this.data.map(d => d.y.toString()))];

    // Create X scale
    this.xScale = d3.scaleBand()
      .domain(xValues)
      .range([0, chartWidth])
      .padding(0.1);

    // Create Y scale
    this.yScale = d3.scaleBand()
      .domain(yValues)
      .range([0, chartHeight])
      .padding(0.1);

    // Create color scale
    this.createColorScale();
  }

  private createColorScale(): void {
    const values = this.data.map(d => d.value);
    const minValue = d3.min(values)!;
    const maxValue = d3.max(values)!;

    if (this.options.colorScale === 'sequential') {
      this.colorScale = d3.scaleSequential()
        .domain(this.options.colorDomain || [minValue, maxValue])
        .interpolator(d3.interpolateBlues);
    } else if (this.options.colorScale === 'diverging') {
      this.colorScale = d3.scaleSequential()
        .domain(this.options.colorDomain || [minValue, maxValue])
        .interpolator(d3.interpolateRdBu);
    } else if (this.options.colorScale === 'categorical') {
      // For categorical, use a different color scheme
      this.colorScale = d3.scaleSequential()
        .domain(this.options.colorDomain || [minValue, maxValue])
        .interpolator(d3.interpolateViridis);
    } else {
      // Default to sequential
      this.colorScale = d3.scaleSequential()
        .domain([minValue, maxValue])
        .interpolator(d3.interpolateBlues);
    }
  }

  private render(): void {
    if (!this.data || this.data.length === 0) {
      console.warn('No data available for heatmap chart rendering');
      return;
    }

    // Clear existing chart elements
    this.chartGroup.selectAll('*').remove();

    // Add axes if enabled
    if (this.options.showAxis) {
      this.addAxes();
    }

    // Add cells
    this.addCells();
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

  private addCells(): void {
    const cellWidth = this.xScale.bandwidth() - this.options.cellPadding!;
    const cellHeight = this.yScale.bandwidth() - this.options.cellPadding!;

    const cells = this.chartGroup.selectAll('.cell')
      .data(this.data)
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', d => this.xScale(d.x.toString())! + this.options.cellPadding! / 2)
      .attr('y', d => this.yScale(d.y.toString())! + this.options.cellPadding! / 2)
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .attr('fill', d => {
        const color = this.colorScale(d.value);
        return typeof color === 'string' ? color : '#000000';
      })
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
      .style('opacity', this.options.animate ? 0 : 1);

    // Animate cells if enabled
    if (this.options.animate) {
      cells.transition()
        .delay((d, i) => i * 20)
        .duration(300)
        .ease(d3.easeCubicOut)
        .style('opacity', 1);
    }

    // Add hover effects
    cells
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke-width', 2)
          .attr('stroke', '#374151');
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .attr('stroke-width', 1)
          .attr('stroke', 'white');
      });

    // Add value labels if enabled
    if (this.options.showValues) {
      this.addValueLabels(cells);
    }
  }

  private addValueLabels(cells: d3.Selection<SVGRectElement, HeatmapData, SVGGElement, unknown>): void {
    const labels = this.chartGroup.selectAll('.cell-label')
      .data(this.data)
      .enter()
      .append('text')
      .attr('class', 'cell-label')
      .attr('x', d => this.xScale(d.x.toString())! + this.xScale.bandwidth() / 2)
      .attr('y', d => this.yScale(d.y.toString())! + this.yScale.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '10px')
      .attr('font-weight', '500')
      .attr('fill', d => {
        const color = this.colorScale(d.value);
        const colorStr = typeof color === 'string' ? color : '#000000';
        return this.getContrastColor(colorStr);
      })
      .style('pointer-events', 'none')
      .style('opacity', this.options.animate ? 0 : 1)
      .text(d => d.value.toFixed(1));

    // Animate labels if enabled
    if (this.options.animate) {
      labels.transition()
        .delay((d, i) => i * 20 + 200)
        .duration(200)
        .ease(d3.easeCubicOut)
        .style('opacity', 1);
    }
  }

  private getContrastColor(backgroundColor: string): string {
    // Simple contrast calculation - for better results, use a proper color contrast library
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  }

  public update(newData: HeatmapData[], newOptions?: HeatmapOptions): void {
    if (!newData || !Array.isArray(newData) || newData.length === 0) {
      console.warn('Invalid data provided to heatmap chart update');
      return;
    }
    
    this.data = [...newData];
    
    // Update options if provided
    if (newOptions) {
      this.options = { ...this.options, ...newOptions };
    }
    
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
