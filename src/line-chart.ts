import * as d3 from 'd3';
import { ChartConfig, ChartData, ScatterData, LineChartOptions, MultiLineChartData, LineSeriesData } from './types';

export class LineChart {
  private container: HTMLElement;
  private data: ChartData[] | MultiLineChartData;
  private options: LineChartOptions;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private chartGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;

  constructor(config: ChartConfig) {
    this.container = typeof config.container === 'string' 
      ? document.querySelector(config.container) as HTMLElement
      : config.container;
    
    if (!this.container) {
      throw new Error('Container element not found');
    }

    // Support both single line (ChartData[]) and multi-line (MultiLineChartData) formats
    if (Array.isArray(config.data)) {
      if (config.data.length === 0 || !('label' in config.data[0])) {
        throw new Error('Line chart requires ChartData[] format');
      }
      this.data = config.data as ChartData[];
    } else {
      // Multi-line format
      if (!config.data || !('series' in config.data) || !('labels' in config.data)) {
        throw new Error('Multi-line chart requires MultiLineChartData format with series and labels');
      }
      this.data = config.data as unknown as MultiLineChartData;
    }

    this.options = this.getDefaultOptions(config.options as LineChartOptions);
    
    this.init();
  }

  private isChartData(data: ChartData[] | ScatterData[]): data is ChartData[] {
    return data.length > 0 && 'value' in data[0];
  }

  private getDefaultOptions(userOptions?: LineChartOptions): LineChartOptions {
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
      showPoints: true,
      showGrid: true,
      curveType: 'monotoneX',
      strokeWidth: 2,
      pointRadius: 4,
      ...userOptions
    };
  }

  private init(): void {
    this.createSVG();
    this.render();
  }

  private createSVG(): void {
    console.log('Creating Line Chart SVG...');
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
    
    console.log('Line Chart SVG created successfully');
  }

  private render(): void {
    // Ensure we have valid data
    if (!this.data) {
      console.warn('No data available for line chart rendering');
      return;
    }

    console.log('Rendering line chart with data:', this.data);

    const chartWidth = this.options.width! - this.options.margin!.left - this.options.margin!.right;
    const chartHeight = this.options.height! - this.options.margin!.top - this.options.margin!.bottom;

    // Clear all existing chart elements
    console.log('Clearing existing line chart elements...');
    this.chartGroup.selectAll('*').remove();

    // Determine if this is single line or multi-line
    const isMultiLine = !Array.isArray(this.data) && 'series' in this.data;
    
    if (isMultiLine) {
      this.renderMultiLine(chartWidth, chartHeight);
    } else {
      this.renderSingleLine(chartWidth, chartHeight);
    }
  }

  private renderSingleLine(chartWidth: number, chartHeight: number): void {
    const singleData = this.data as ChartData[];

    // Create scales
    const xScale = d3.scalePoint()
      .domain(singleData.map((d: ChartData) => d.label))
      .range([0, chartWidth])
      .padding(0.5);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(singleData, (d: ChartData) => d.value) || 0])
      .range([chartHeight, 0]);

    // Add grid lines if enabled
    if (this.options.showGrid) {
      this.chartGroup.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(yScale)
          .tickSize(-chartWidth)
          .tickFormat(() => '')
        )
        .selectAll('line')
        .attr('stroke', '#E5E7EB')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3');
    }

    // Create line generator
    const line = d3.line<ChartData>()
      .x((d: ChartData) => xScale(d.label)!)
      .y((d: ChartData) => yScale(d.value))
      .curve(this.getCurveFunction());

    // Create the line path
    const linePath = this.chartGroup.append('path')
      .datum(singleData)
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', this.options.colors![0])
      .attr('stroke-width', this.options.strokeWidth!)
      .attr('d', line);

    // Animate line if enabled
    if (this.options.animate) {
      const totalLength = linePath.node()?.getTotalLength() || 0;
      linePath
        .attr('stroke-dasharray', totalLength)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0);
    }

    // Add data points if enabled
    if (this.options.showPoints) {
      const points = this.chartGroup.selectAll('.point')
        .data(singleData)
        .enter()
        .append('circle')
        .attr('class', 'point')
        .attr('cx', (d: ChartData) => xScale(d.label)!)
        .attr('cy', (d: ChartData) => yScale(d.value))
        .attr('r', this.options.pointRadius!)
        .attr('fill', this.options.colors![0])
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .style('opacity', this.options.animate ? 0 : 1);

      // Animate points if enabled
      if (this.options.animate) {
        points.transition()
          .delay((d, i) => i * 100)
          .duration(300)
          .style('opacity', 1);
      }
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

  private renderMultiLine(chartWidth: number, chartHeight: number): void {
    const multiData = this.data as MultiLineChartData;
    const series = multiData.series;
    const labels = multiData.labels;

    // Create scales
    const xScale = d3.scalePoint()
      .domain(labels)
      .range([0, chartWidth])
      .padding(0.5);

    // Find the maximum value across all series
    const maxValue = d3.max(series.flatMap((s: LineSeriesData) => s.data.map((d: ChartData) => d.value))) || 0;
    const yScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([chartHeight, 0]);

    // Add grid lines if enabled
    if (this.options.showGrid) {
      this.chartGroup.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(yScale)
          .tickSize(-chartWidth)
          .tickFormat(() => '')
        )
        .selectAll('line')
        .attr('stroke', '#E5E7EB')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3');
    }

    // Create line generator
    const line = d3.line<ChartData>()
      .x((d: ChartData) => xScale(d.label)!)
      .y((d: ChartData) => yScale(d.value))
      .curve(this.getCurveFunction());

    // Create lines for each series
    series.forEach((seriesData: LineSeriesData, index: number) => {
      const color = seriesData.color || this.options.colors![index % this.options.colors!.length];
      
      // Create the line path
      const linePath = this.chartGroup.append('path')
        .datum(seriesData.data)
        .attr('class', `line-series-${index}`)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', this.options.strokeWidth!)
        .attr('d', line);

      // Animate line if enabled
      if (this.options.animate) {
        const totalLength = linePath.node()?.getTotalLength() || 0;
        linePath
          .attr('stroke-dasharray', totalLength)
          .attr('stroke-dashoffset', totalLength)
          .transition()
          .delay(index * 200)
          .duration(1000)
          .ease(d3.easeCubicOut)
          .attr('stroke-dashoffset', 0);
      }

              // Add data points if enabled
        if (this.options.showPoints) {
          const points = this.chartGroup.selectAll(`.point-series-${index}`)
            .data(seriesData.data)
            .enter()
            .append('circle')
            .attr('class', `point-series-${index}`)
            .attr('cx', (d: any) => xScale(d.label)!)
            .attr('cy', (d: any) => yScale(d.value))
            .attr('r', this.options.pointRadius!)
            .attr('fill', color)
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .style('opacity', this.options.animate ? 0 : 1);

        // Animate points if enabled
        if (this.options.animate) {
          points.transition()
            .delay((d, i) => index * 200 + i * 100)
            .duration(300)
            .style('opacity', 1);
        }
      }
    });

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

    // Add legend if enabled
    if (this.options.showLegend) {
      this.addLegend(series, chartWidth, chartHeight);
    }
  }

  private addLegend(series: LineSeriesData[], chartWidth: number, chartHeight: number): void {
    const legendGroup = this.chartGroup.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${chartWidth - 100}, 10)`);

    const legendItems = legendGroup.selectAll('.legend-item')
      .data(series)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`);

    // Add legend lines
    legendItems.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 20)
      .attr('y2', 0)
      .attr('stroke', (d, i) => d.color || this.options.colors![i % this.options.colors!.length])
      .attr('stroke-width', 2);

    // Add legend text
    legendItems.append('text')
      .attr('x', 25)
      .attr('y', 4)
      .attr('class', 'text-sm fill-gray-700')
      .text(d => d.name);
  }

  private getCurveFunction(): d3.CurveFactory {
    switch (this.options.curveType) {
      case 'linear':
        return d3.curveLinear;
      case 'step':
        return d3.curveStep;
      case 'stepAfter':
        return d3.curveStepAfter;
      case 'stepBefore':
        return d3.curveStepBefore;
      case 'basis':
        return d3.curveBasis;
      case 'cardinal':
        return d3.curveCardinal;
      case 'catmullRom':
        return d3.curveCatmullRom;
      case 'monotoneX':
      default:
        return d3.curveMonotoneX;
    }
  }

  public update(newData: ChartData[] | MultiLineChartData): void {
    // Validate the new data
    if (!newData) {
      console.warn('Invalid data provided to line chart update');
      return;
    }
    
    console.log('Updating line chart with new data:', newData);
    this.data = newData; // Create a copy to avoid reference issues
    this.render();
  }

  public updateOptions(newOptions: Partial<LineChartOptions>): void {
    console.log('Updating line chart options:', newOptions);
    
    // Update the options
    this.options = { ...this.options, ...newOptions };
    
    // Re-render the chart with new options
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
    console.log('Destroying line chart...');
    if (this.svg) {
      this.svg.remove();
    }
    // Also clear the container to ensure no leftover elements
    if (this.container) {
      d3.select(this.container).selectAll('*').remove();
    }
    console.log('Line chart destroyed');
  }
}
