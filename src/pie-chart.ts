import * as d3 from 'd3';
import { ChartConfig, ChartData, ScatterData, PieChartOptions } from './types';

export class PieChart {
  private container: HTMLElement;
  private data: ChartData[];
  private options: PieChartOptions;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private chartGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;

  constructor(config: ChartConfig) {
    this.container = typeof config.container === 'string' 
      ? document.querySelector(config.container) as HTMLElement
      : config.container;
    
    if (!this.container) {
      throw new Error('Container element not found');
    }

    // Ensure data is ChartData[] for pie chart
    // Type checking for pie chart data
    if (!Array.isArray(config.data) || config.data.length === 0 || !('label' in config.data[0])) {
      throw new Error('Pie chart requires ChartData[] format');
    }

    this.data = config.data as ChartData[];
    this.options = this.getDefaultOptions(config.options as PieChartOptions);
    
    this.init();
  }

  private isChartData(data: ChartData[] | ScatterData[]): data is ChartData[] {
    return data.length > 0 && 'value' in data[0];
  }

  private getDefaultOptions(userOptions?: PieChartOptions): PieChartOptions {
    return {
      width: 600,
      height: 400,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
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
      showLabels: true,
      showValues: true,
      innerRadius: 0,
      outerRadius: 150,
      labelRadius: 180,
      ...userOptions
    };
  }

  private init(): void {
    this.createSVG();
    this.render();
  }

  private createSVG(): void {
    console.log('Creating Pie Chart SVG...');
    // Clear existing content completely
    d3.select(this.container).selectAll('*').remove();

    // Create SVG
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${this.options.width!} ${this.options.height!}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('display', 'block');

    console.log('SVG created with dimensions:', {
      width: this.options.width,
      height: this.options.height,
      containerWidth: this.container.offsetWidth,
      containerHeight: this.container.offsetHeight
    });

    // Create chart group
    const centerX = this.options.width! / 2;
    const centerY = this.options.height! / 2;
    
    this.chartGroup = this.svg.append('g')
      .attr('transform', `translate(${centerX}, ${centerY})`);
    
    console.log('Chart center position:', { centerX, centerY });
    
    console.log('Chart group positioned at:', {
      x: this.options.width! / 2,
      y: this.options.height! / 2
    });
    console.log('Pie Chart SVG created successfully');
  }

  private render(): void {
    // Ensure we have valid data
    if (!this.data || this.data.length === 0) {
      console.warn('No data available for pie chart rendering');
      return;
    }

    console.log('Rendering pie chart with data:', this.data);

    // Validate data values
    const totalValue = this.data.reduce((sum, d) => sum + d.value, 0);
    console.log('Total value:', totalValue);
    
    if (totalValue <= 0) {
      console.error('Total value is zero or negative, cannot render pie chart');
      return;
    }

    // Clear all existing chart elements
    console.log('Clearing existing pie chart elements...');
    this.chartGroup.selectAll('*').remove();

    // Create pie generator
    const pie = d3.pie<ChartData>()
      .value((d: ChartData) => d.value)
      .sort(null);

    const pieData = pie(this.data);

    // Create arc generator
    const arc = d3.arc<d3.PieArcDatum<ChartData>>()
      .innerRadius(this.options.innerRadius!)
      .outerRadius(this.options.outerRadius!);

    const labelArc = d3.arc<d3.PieArcDatum<ChartData>>()
      .innerRadius(this.options.labelRadius!)
      .outerRadius(this.options.labelRadius!);

    // Test arc generation with sample data
    if (pieData.length > 0) {
      const testArc = arc(pieData[0]);
      console.log('Test arc path:', testArc);
      console.log('Test arc centroid:', arc.centroid(pieData[0]));
    }

    console.log('Arc configuration:', {
      innerRadius: this.options.innerRadius,
      outerRadius: this.options.outerRadius,
      labelRadius: this.options.labelRadius
    });
    console.log('Pie data:', pieData);

    // Create pie slices
    const slices = this.chartGroup.selectAll('.slice')
      .data(pieData)
      .enter()
      .append('path')
      .attr('class', 'slice')
      .attr('d', (d) => {
        const path = arc(d);
        console.log('Arc path for slice:', path);
        if (!path) {
          console.error('Arc path is null/undefined for data:', d);
          return '';
        }
        return path;
      })
      .attr('fill', (d, i) => this.data[i].color || this.options.colors![i % this.options.colors!.length])
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('opacity', this.options.animate ? 0 : 1);

    // Add a simple circle to test SVG rendering
    this.chartGroup.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 50)
      .attr('fill', 'blue')
      .attr('opacity', 0.5);

    console.log('Created slices:', slices.size());
    console.log('Sample slice path:', slices.nodes()[0]?.getAttribute('d'));

    // Animate slices if enabled
    if (this.options.animate) {
      slices.transition()
        .delay((d, i) => i * 100)
        .duration(800)
        .ease(d3.easeCubicOut)
        .style('opacity', 1);
    }

    // Add labels if enabled
    if (this.options.showLabels) {
      const labels = this.chartGroup.selectAll('.label')
        .data(pieData)
        .enter()
        .append('text')
        .attr('class', 'label text-sm font-medium fill-gray-700')
        .attr('transform', (d) => `translate(${labelArc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .text((d, i) => this.data[i].label)
        .style('opacity', this.options.animate ? 0 : 1);

      // Animate labels if enabled
      if (this.options.animate) {
        labels.transition()
          .delay((d, i) => i * 100 + 400)
          .duration(300)
          .style('opacity', 1);
      }
    }

    // Add values if enabled
    if (this.options.showValues) {
      const values = this.chartGroup.selectAll('.value')
        .data(pieData)
        .enter()
        .append('text')
        .attr('class', 'value text-xs font-medium fill-gray-600')
        .attr('transform', (d) => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .text((d, i) => this.data[i].value.toLocaleString())
        .style('opacity', this.options.animate ? 0 : 1);

      // Animate values if enabled
      if (this.options.animate) {
        values.transition()
          .delay((d, i) => i * 100 + 600)
          .duration(300)
          .style('opacity', 1);
      }
    }
  }

  public update(newData: ChartData[]): void {
    // Validate the new data
    if (!newData || !Array.isArray(newData) || newData.length === 0) {
      console.warn('Invalid data provided to pie chart update');
      return;
    }
    
    console.log('Updating pie chart with new data:', newData);
    this.data = [...newData]; // Create a copy to avoid reference issues
    this.render();
  }

  public resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;
    this.svg
      .attr('width', width)
      .attr('height', height);
    
    // Update chart group position
    this.chartGroup.attr('transform', `translate(${width / 2}, ${height / 2})`);
    this.render();
  }

  public destroy(): void {
    console.log('Destroying pie chart...');
    if (this.svg) {
      this.svg.remove();
    }
    // Also clear the container to ensure no leftover elements
    if (this.container) {
      d3.select(this.container).selectAll('*').remove();
    }
    console.log('Pie chart destroyed');
  }
}
