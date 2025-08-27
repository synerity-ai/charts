import * as d3 from 'd3';
import { ChartConfig, SankeyData, SankeyOptions } from './types';

export class SankeyChart {
  private container: HTMLElement;
  private data: SankeyData;
  private options: SankeyOptions;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private chartGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;

  constructor(config: ChartConfig) {
    this.container = typeof config.container === 'string' 
      ? document.querySelector(config.container) as HTMLElement
      : config.container;
    
    if (!this.container) {
      throw new Error('Container element not found');
    }

    this.data = config.data as SankeyData;
    this.options = this.getDefaultOptions(config.options as SankeyOptions);
    
    this.init();
  }

  private getDefaultOptions(userOptions?: SankeyOptions): SankeyOptions {
    return {
      width: 800,
      height: 600,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      colors: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
        '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
      ],
      animate: true,
      nodeWidth: 20,
      nodePadding: 10,
      linkOpacity: 0.3,
      showValues: true,
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
    if (!this.data || !this.data.nodes || !this.data.links) {
      console.warn('Invalid data available for Sankey chart rendering');
      return;
    }

    // Clear existing chart elements
    this.chartGroup.selectAll('*').remove();

    const chartWidth = this.options.width! - this.options.margin!.left - this.options.margin!.right;
    const chartHeight = this.options.height! - this.options.margin!.top - this.options.margin!.bottom;

    // Create a simple Sankey-like layout
    this.createSankeyLayout(chartWidth, chartHeight);
  }

  private createSankeyLayout(width: number, height: number): void {
    const { nodes, links } = this.data;
    
    // Create node map for easy lookup
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    
    // Calculate node positions
    const sourceNodes = new Set(links.map(link => link.source));
    const targetNodes = new Set(links.map(link => link.target));
    
    // Separate source and target nodes
    const sources = nodes.filter(node => sourceNodes.has(node.id) && !targetNodes.has(node.id));
    const targets = nodes.filter(node => targetNodes.has(node.id) && !sourceNodes.has(node.id));
    const intermediates = nodes.filter(node => sourceNodes.has(node.id) && targetNodes.has(node.id));
    
    // Position nodes in columns
    const columnWidth = width / 3;
    const nodeHeight = height / Math.max(sources.length, targets.length, intermediates.length || 1);
    
    // Position source nodes
    sources.forEach((node, i) => {
      node.x = 0;
      node.y = i * nodeHeight + nodeHeight / 2;
    });
    
    // Position intermediate nodes
    intermediates.forEach((node, i) => {
      node.x = columnWidth;
      node.y = i * nodeHeight + nodeHeight / 2;
    });
    
    // Position target nodes
    targets.forEach((node, i) => {
      node.x = columnWidth * 2;
      node.y = i * nodeHeight + nodeHeight / 2;
    });
    
    // Create color scale
    const colorScale = d3.scaleOrdinal()
      .domain(nodes.map(n => n.id))
      .range(this.options.colors!);
    
    // Draw links
    const linkGroup = this.chartGroup.append('g').attr('class', 'links');
    
    links.forEach(link => {
      const sourceNode = nodeMap.get(link.source);
      const targetNode = nodeMap.get(link.target);
      
      if (sourceNode && targetNode) {
        const linkPath = this.createLinkPath(sourceNode, targetNode);
        
        linkGroup.append('path')
          .datum(link)
          .attr('d', linkPath)
          .attr('fill', 'none')
          .attr('stroke', link.color || colorScale(link.source) as string)
          .attr('stroke-width', Math.max(1, link.value / 10))
          .attr('opacity', this.options.linkOpacity || 0.3)
          .attr('stroke-linecap', 'round');
      }
    });
    
    // Draw nodes
    const nodeGroup = this.chartGroup.append('g').attr('class', 'nodes');
    
    nodes.forEach(node => {
      const nodeElement = nodeGroup.append('g')
        .attr('class', 'node')
        .attr('transform', `translate(${node.x}, ${node.y})`);
      
      // Node rectangle
      nodeElement.append('rect')
        .attr('width', this.options.nodeWidth || 20)
        .attr('height', 30)
        .attr('x', -(this.options.nodeWidth || 20) / 2)
        .attr('y', -15)
        .attr('fill', node.color || colorScale(node.id) as string)
        .attr('rx', 4)
        .attr('ry', 4);
      
      // Node label
      nodeElement.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('font-size', '12px')
        .attr('fill', '#FFFFFF')
        .attr('font-weight', 'bold')
        .text(node.name);
      
      // Show values if enabled
      if (this.options.showValues) {
        const totalValue = links
          .filter(l => l.source === node.id || l.target === node.id)
          .reduce((sum, l) => sum + l.value, 0);
        
        nodeElement.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '1.5em')
          .attr('font-size', '10px')
          .attr('fill', '#6B7280')
          .text(totalValue.toLocaleString());
      }
    });
  }

  private createLinkPath(source: any, target: any): string {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    
    // Create a curved path
    const midX = source.x + dx / 2;
    
    return `M ${source.x} ${source.y} 
            C ${midX} ${source.y} 
              ${midX} ${target.y} 
              ${target.x} ${target.y}`;
  }

  public update(newData: SankeyData): void {
    if (!newData || !newData.nodes || !newData.links) {
      console.warn('Invalid data provided to Sankey chart update');
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
