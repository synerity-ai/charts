import * as d3 from 'd3';
import { ChartConfig, TreemapData, TreemapOptions } from './types';

export class TreemapChart {
  private container: HTMLElement;
  private data: TreemapData;
  private options: TreemapOptions;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private chartGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;

  constructor(config: ChartConfig) {
    this.container = typeof config.container === 'string' 
      ? document.querySelector(config.container) as HTMLElement
      : config.container;
    
    if (!this.container) {
      throw new Error('Container element not found');
    }

    // Handle both array and single object formats for backward compatibility
    if (Array.isArray(config.data)) {
      this.data = config.data[0] as TreemapData;
    } else {
      this.data = config.data as unknown as TreemapData;
    }
    this.options = this.getDefaultOptions(config.options as TreemapOptions);
    
    this.init();
  }

  private getDefaultOptions(userOptions?: TreemapOptions): TreemapOptions {
    return {
      width: 600,
      height: 400,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      colors: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
        '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
      ],
      animate: true,
      showLabels: true,
      showValues: true,
      padding: 2,
      borderWidth: 1,
      borderColor: '#E5E7EB',
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
      .attr('transform', `translate(${this.options.margin!.left}, ${this.options.margin!.top})`);
  }

  private render(): void {
    if (!this.data) {
      console.warn('No data available for treemap chart rendering');
      return;
    }

    // Clear existing chart elements
    this.chartGroup.selectAll('*').remove();

    const chartWidth = this.options.width! - this.options.margin!.left - this.options.margin!.right;
    const chartHeight = this.options.height! - this.options.margin!.top - this.options.margin!.bottom;

    // Create treemap layout
    const treemap = d3.treemap<TreemapData>()
      .size([chartWidth, chartHeight])
      .padding(this.options.padding || 2)
      .paddingOuter(this.options.padding || 2);

    // Create hierarchy
    const root = d3.hierarchy(this.data)
      .sum(d => d.value)
      .sort((a, b) => b.value! - a.value!);

    // Generate treemap layout
    treemap(root);

    // Add rectangles
    this.addRectangles(root);
  }

  private addRectangles(node: d3.HierarchyNode<TreemapData>): void {
    const nodes = node.descendants().slice(1) as d3.HierarchyRectangularNode<TreemapData>[]; // Skip root node

    const rectangles = this.chartGroup.selectAll('.treemap-rect')
      .data(nodes)
      .enter()
      .append('rect')
      .attr('class', 'treemap-rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', (d, i) => {
        if (d.data.color) return d.data.color;
        return this.options.colors![i % this.options.colors!.length];
      })
      .attr('stroke', this.options.borderColor || '#E5E7EB')
      .attr('stroke-width', this.options.borderWidth || 1)
      .style('opacity', this.options.animate ? 0 : 1);

    // Animate rectangles if enabled
    if (this.options.animate) {
      rectangles.transition()
        .delay((d, i) => i * 50)
        .duration(500)
        .ease(d3.easeCubicOut)
        .style('opacity', 1);
    }

    // Add hover effects
    rectangles
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke-width', 2)
          .attr('stroke', '#374151');
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .attr('stroke-width', 1)
          .attr('stroke', '#E5E7EB');
      });

    // Add labels if enabled
    if (this.options.showLabels) {
      this.addLabels(nodes);
    }

    // Add values if enabled
    if (this.options.showValues) {
      this.addValues(nodes);
    }
  }

  private addLabels(nodes: d3.HierarchyRectangularNode<TreemapData>[]): void {
    const labels = this.chartGroup.selectAll('.treemap-label')
      .data(nodes)
      .enter()
      .append('text')
      .attr('class', 'treemap-label')
      .attr('x', d => d.x0 + (d.x1 - d.x0) / 2)
      .attr('y', d => d.y0 + (d.y1 - d.y0) / 2)
      .attr('text-anchor', 'middle')
      .attr('dy', this.options.showValues ? '-0.5em' : '0.35em')
      .attr('font-size', d => this.getFontSize(d))
      .attr('font-weight', '500')
      .attr('fill', '#FFFFFF')
      .style('pointer-events', 'none')
      .style('opacity', this.options.animate ? 0 : 1)
      .text(d => d.data.name);

    // Animate labels if enabled
    if (this.options.animate) {
      labels.transition()
        .delay((d, i) => i * 50 + 200)
        .duration(300)
        .ease(d3.easeCubicOut)
        .style('opacity', 1);
    }
  }

  private addValues(nodes: d3.HierarchyRectangularNode<TreemapData>[]): void {
    const values = this.chartGroup.selectAll('.treemap-value')
      .data(nodes)
      .enter()
      .append('text')
      .attr('class', 'treemap-value')
      .attr('x', d => d.x0 + (d.x1 - d.x0) / 2)
      .attr('y', d => d.y0 + (d.y1 - d.y0) / 2)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.5em')
      .attr('font-size', d => Math.max(8, this.getFontSize(d) - 2))
      .attr('font-weight', '400')
      .attr('fill', '#FFFFFF')
      .style('pointer-events', 'none')
      .style('opacity', this.options.animate ? 0 : 1)
      .text(d => d.value!.toLocaleString());

    // Animate values if enabled
    if (this.options.animate) {
      values.transition()
        .delay((d, i) => i * 50 + 300)
        .duration(300)
        .ease(d3.easeCubicOut)
        .style('opacity', 1);
    }
  }

  private getFontSize(node: d3.HierarchyRectangularNode<TreemapData>): number {
    const area = (node.x1 - node.x0) * (node.y1 - node.y0);
    const minArea = 100; // Minimum area for readable text
    const maxArea = 10000; // Maximum area for large text
    
    if (area < minArea) return 8;
    if (area > maxArea) return 16;
    
    // Linear interpolation between min and max font sizes
    const ratio = (area - minArea) / (maxArea - minArea);
    return 8 + ratio * 8;
  }

  public update(newData: TreemapData): void {
    if (!newData) {
      console.warn('Invalid data provided to treemap chart update');
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
