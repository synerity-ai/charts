import * as d3 from 'd3';
import { ChartConfig, ChartData, ScatterData, PieChartOptions } from './types';

export class PieChart {
  private container: HTMLElement;
  private data: ChartData[];
  private options: PieChartOptions;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private chartGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private legendGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private tooltip!: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  private explodedSlices: Set<number> = new Set();

  constructor(config: ChartConfig) {
    this.container = typeof config.container === 'string' 
      ? document.querySelector(config.container) as HTMLElement
      : config.container;
    
    if (!this.container) {
      throw new Error('Container element not found');
    }

    // Ensure data is ChartData[] for pie chart
    if (!Array.isArray(config.data) || config.data.length === 0 || !('label' in config.data[0])) {
      throw new Error('Pie chart requires ChartData[] format');
    }

    this.data = config.data as ChartData[];
    this.options = this.getDefaultOptions(config.options as PieChartOptions);
    
    this.init();
  }

  private getDefaultOptions(userOptions?: PieChartOptions): PieChartOptions {
    return {
      width: 600,
      height: 400,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      colors: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
        '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
        '#EC4899', '#14B8A6', '#FBBF24', '#6366F1'
      ],
      animate: true,
      showLabels: true,
      showValues: true,
      innerRadius: 0,
      outerRadius: 150,
      labelRadius: 180,
      // Enhanced defaults
      variant: 'pie',
      labels: {
        enabled: true,
        position: 'outside',
        format: '{label}: {value}',
        fontSize: 12,
        fontWeight: '500'
      },
      animation: {
        duration: 800,
        easing: 'cubic',
        explodeOnClick: true,
        entranceDelay: 100
      },
      legend: {
        interactive: true,
        position: 'right',
        showValues: true,
        showPercentages: true
      },
      interactivity: {
        hoverEffects: true,
        clickToExplode: true,
        tooltipEnabled: true,
        tooltipFormat: (data: ChartData) => 
          `${data.label}: ${data.value.toLocaleString()} (${((data.value / this.data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%)`
      },
      ...userOptions
    };
  }

  private init(): void {
    this.createSVG();
    this.createTooltip();
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
    const centerX = this.options.width! / 2;
    const centerY = this.options.height! / 2;
    
    this.chartGroup = this.svg.append('g')
      .attr('transform', `translate(${centerX}, ${centerY})`);

    // Create legend group
    this.legendGroup = this.svg.append('g')
      .attr('class', 'legend');
  }

  private createTooltip(): void {
    this.tooltip = d3.select(this.container)
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 1000);
  }

  private render(): void {
    if (!this.data || this.data.length === 0) {
      console.warn('No data available for pie chart rendering');
      return;
    }

    const totalValue = this.data.reduce((sum, d) => sum + d.value, 0);
    if (totalValue <= 0) {
      console.error('Total value is zero or negative, cannot render pie chart');
      return;
    }

    // Clear existing elements
    this.chartGroup.selectAll('*').remove();
    this.legendGroup.selectAll('*').remove();

    // Create pie generator
    const pie = d3.pie<ChartData>()
      .value((d: ChartData) => d.value)
      .sort(null);

    const pieData = pie(this.data);

    // Create arc generators
    const arc = d3.arc<d3.PieArcDatum<ChartData>>()
      .innerRadius(this.options.variant === 'donut' ? this.options.innerRadius! : 0)
      .outerRadius(this.options.outerRadius!);

    const labelArc = d3.arc<d3.PieArcDatum<ChartData>>()
      .innerRadius(this.options.labelRadius!)
      .outerRadius(this.options.labelRadius!);

    // Create slices
    const slices = this.chartGroup.selectAll('.slice')
      .data(pieData)
      .enter()
      .append('path')
      .attr('class', 'slice')
      .attr('d', (d) => {
        const path = arc(d);
        return path || '';
      })
      .attr('fill', (d, i) => this.data[i].color || this.options.colors![i % this.options.colors!.length])
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('opacity', this.options.animate ? 0 : 1)
      .style('cursor', this.options.interactivity?.clickToExplode ? 'pointer' : 'default');

    // Add hover effects
    if (this.options.interactivity?.hoverEffects) {
      slices
        .on('mouseenter', (event, d) => {
          const slice = d3.select(event.currentTarget);
          slice.transition()
            .duration(200)
            .attr('stroke-width', 3)
            .attr('stroke', '#000');

          if (this.options.interactivity?.tooltipEnabled) {
            const tooltipContent = this.options.interactivity.tooltipFormat?.(this.data[d.index]) || 
              `${this.data[d.index].label}: ${this.data[d.index].value}`;
            
            this.tooltip
              .style('opacity', 1)
              .html(tooltipContent)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 10) + 'px');
          }
        })
        .on('mouseleave', (event, d) => {
          const slice = d3.select(event.currentTarget);
          slice.transition()
            .duration(200)
            .attr('stroke-width', 2)
            .attr('stroke', 'white');

          this.tooltip.style('opacity', 0);
        });
    }

    // Add click to explode
    if (this.options.interactivity?.clickToExplode) {
      slices.on('click', (event, d) => {
        const sliceIndex = d.index;
        if (this.explodedSlices.has(sliceIndex)) {
          this.explodedSlices.delete(sliceIndex);
        } else {
          this.explodedSlices.add(sliceIndex);
        }
        this.updateSlicePositions(pieData, arc);
      });
    }

    // Add labels
    if (this.options.labels?.enabled) {
      this.renderLabels(pieData, labelArc);
    }

    // Add legend
    if (this.options.legend) {
      this.renderLegend();
    }

    // Animate slices
    if (this.options.animate) {
      slices.transition()
        .delay((d, i) => i * (this.options.animation?.entranceDelay || 100))
        .duration(this.options.animation?.duration || 800)
        .ease(d3.easeCubicOut)
        .style('opacity', 1);
    }
  }

  private renderLabels(pieData: d3.PieArcDatum<ChartData>[], labelArc: d3.Arc<any, d3.PieArcDatum<ChartData>>): void {
    const labels = this.chartGroup.selectAll('.label')
      .data(pieData)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('transform', (d) => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', `${this.options.labels?.fontSize || 12}px`)
      .style('font-weight', this.options.labels?.fontWeight || '500')
      .style('fill', '#374151')
      .style('opacity', this.options.animate ? 0 : 1)
      .text((d, i) => {
        const data = this.data[i];
        const percentage = ((data.value / this.data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1);
        return this.options.labels?.format
          ?.replace('{label}', data.label)
          ?.replace('{value}', data.value.toLocaleString())
          ?.replace('{percentage}', percentage) || data.label;
      });

    if (this.options.animate) {
      labels.transition()
        .delay((d, i) => i * (this.options.animation?.entranceDelay || 100) + 400)
        .duration(300)
        .style('opacity', 1);
    }
  }

  private renderLegend(): void {
    const legendData = this.data.map((d, i) => ({
      label: d.label,
      value: d.value,
      color: d.color || this.options.colors![i % this.options.colors!.length],
      percentage: ((d.value / this.data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)
    }));

    const legendPosition = this.options.legend?.position || 'right';
    const legendWidth = 200;
    const legendHeight = legendData.length * 25;
    let legendX = 0, legendY = 0;

    // Position legend
    switch (legendPosition) {
      case 'right':
        legendX = this.options.width! / 2 + this.options.outerRadius! + 20;
        legendY = this.options.height! / 2 - legendHeight / 2;
        break;
      case 'left':
        legendX = this.options.width! / 2 - this.options.outerRadius! - legendWidth - 20;
        legendY = this.options.height! / 2 - legendHeight / 2;
        break;
      case 'top':
        legendX = this.options.width! / 2 - legendWidth / 2;
        legendY = 20;
        break;
      case 'bottom':
        legendX = this.options.width! / 2 - legendWidth / 2;
        legendY = this.options.height! - legendHeight - 20;
        break;
    }

    this.legendGroup.attr('transform', `translate(${legendX}, ${legendY})`);

    const legendItems = this.legendGroup.selectAll('.legend-item')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`)
      .style('cursor', this.options.legend?.interactive ? 'pointer' : 'default');

    // Legend color boxes
    legendItems.append('rect')
      .attr('width', 16)
      .attr('height', 16)
      .attr('fill', d => d.color)
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1)
      .attr('rx', 2);

    // Legend labels
    legendItems.append('text')
      .attr('x', 24)
      .attr('y', 12)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('fill', '#374151')
      .text(d => {
        let text = d.label;
        if (this.options.legend?.showValues) {
          text += `: ${d.value.toLocaleString()}`;
        }
        if (this.options.legend?.showPercentages) {
          text += ` (${d.percentage}%)`;
        }
        return text;
      });

    // Interactive legend
    if (this.options.legend?.interactive) {
      legendItems
        .on('mouseenter', (event, d) => {
          const legendItem = d3.select(event.currentTarget);
          legendItem.select('rect')
            .transition()
            .duration(200)
            .attr('stroke-width', 2)
            .attr('stroke', '#000');
        })
        .on('mouseleave', (event, d) => {
          const legendItem = d3.select(event.currentTarget);
          legendItem.select('rect')
            .transition()
            .duration(200)
            .attr('stroke-width', 1)
            .attr('stroke', '#e5e7eb');
        });
    }
  }

  private updateSlicePositions(pieData: d3.PieArcDatum<ChartData>[], arc: d3.Arc<any, d3.PieArcDatum<ChartData>>): void {
    const explodeOffset = 10;
    
    this.chartGroup.selectAll('.slice')
      .transition()
      .duration(300)
      .ease(d3.easeCubicOut)
      .attr('d', (d: any) => {
        if (this.explodedSlices.has(d.index)) {
          const centroid = arc.centroid(d);
          const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
          const x = centroid[0] + Math.cos(midAngle) * explodeOffset;
          const y = centroid[1] + Math.sin(midAngle) * explodeOffset;
          
          return arc(d);
        }
        return arc(d);
      });
  }

  // Public methods
  public update(newData: ChartData[]): void {
    if (!newData || !Array.isArray(newData) || newData.length === 0) {
      console.warn('Invalid data provided to pie chart update');
      return;
    }
    
    this.data = [...newData];
    this.explodedSlices.clear();
    this.render();
  }

  public resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;
    this.svg
      .attr('viewBox', `0 0 ${width} ${height}`);
    
    this.render();
  }

  public setVariant(variant: 'pie' | 'donut'): void {
    this.options.variant = variant;
    this.render();
  }

  public setInnerRadius(radius: number): void {
    this.options.innerRadius = radius;
    this.render();
  }

  public enableAnimation(enabled: boolean): void {
    this.options.animate = enabled;
  }

  public setAnimationDuration(duration: number): void {
    if (this.options.animation) {
      this.options.animation.duration = duration;
    }
  }

  public enableTooltip(enabled: boolean): void {
    if (this.options.interactivity) {
      this.options.interactivity.tooltipEnabled = enabled;
    }
  }

  public setTooltipFormat(format: (data: ChartData) => string): void {
    if (this.options.interactivity) {
      this.options.interactivity.tooltipFormat = format;
    }
  }

  public destroy(): void {
    if (this.svg) {
      this.svg.remove();
    }
    if (this.tooltip) {
      this.tooltip.remove();
    }
    if (this.container) {
      d3.select(this.container).selectAll('*').remove();
    }
  }
}
