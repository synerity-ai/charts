import * as d3 from 'd3';
import { ChartConfig, NumberCardData, NumberCardOptions } from './types';

export class NumberCards {
  private container: HTMLElement;
  private data: NumberCardData[];
  private options: NumberCardOptions;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private chartGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;

  constructor(config: ChartConfig) {
    this.container = typeof config.container === 'string' 
      ? document.querySelector(config.container) as HTMLElement
      : config.container;
    
    if (!this.container) {
      throw new Error('Container element not found');
    }

    this.data = config.data as NumberCardData[];
    this.options = this.getDefaultOptions(config.options as NumberCardOptions);
    
    this.init();
  }

  private getDefaultOptions(userOptions?: NumberCardOptions): NumberCardOptions {
    return {
      width: 800,
      height: 200,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      colors: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
        '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
      ],
      animate: true,
      showChange: true,
      showIcon: true,
      formatValue: (value: number) => value.toLocaleString(),
      formatChange: (change: number) => `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
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
    if (!this.data || this.data.length === 0) {
      console.warn('No data available for number cards rendering');
      return;
    }

    // Clear existing chart elements
    this.chartGroup.selectAll('*').remove();

    const chartWidth = this.options.width! - this.options.margin!.left - this.options.margin!.right;
    const chartHeight = this.options.height! - this.options.margin!.top - this.options.margin!.bottom;

    // Calculate card dimensions
    const cardWidth = chartWidth / this.data.length - 20;
    const cardHeight = chartHeight - 20;

    // Add cards
    this.addCards(cardWidth, cardHeight);
  }

  private addCards(cardWidth: number, cardHeight: number): void {
    const cards = this.chartGroup.selectAll('.number-card')
      .data(this.data)
      .enter()
      .append('g')
      .attr('class', 'number-card')
      .attr('transform', (d, i) => `translate(${i * (cardWidth + 20)}, 0)`)
      .style('opacity', this.options.animate ? 0 : 1);

    // Add card backgrounds
    cards.append('rect')
      .attr('width', cardWidth)
      .attr('height', cardHeight)
      .attr('fill', 'white')
      .attr('stroke', '#E5E7EB')
      .attr('stroke-width', 1)
      .attr('rx', 8)
      .attr('ry', 8);

    // Add icons if enabled
    if (this.options.showIcon) {
      this.addIcons(cards, cardWidth, cardHeight);
    }

    // Add titles
    this.addTitles(cards, cardWidth, cardHeight);

    // Add values
    this.addValues(cards, cardWidth, cardHeight);

    // Add change indicators if enabled
    if (this.options.showChange) {
      this.addChangeIndicators(cards, cardWidth, cardHeight);
    }

    // Animate cards if enabled
    if (this.options.animate) {
      cards.transition()
        .delay((d, i) => i * 100)
        .duration(500)
        .ease(d3.easeCubicOut)
        .style('opacity', 1);
    }
  }

  private addIcons(cards: d3.Selection<SVGGElement, NumberCardData, SVGGElement, unknown>, cardWidth: number, cardHeight: number): void {
    cards.append('circle')
      .attr('cx', 20)
      .attr('cy', 20)
      .attr('r', 16)
      .attr('fill', (d, i) => d.color || this.options.colors![i % this.options.colors!.length])
      .attr('opacity', 0.1);

    cards.append('text')
      .attr('x', 20)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '12px')
      .attr('fill', (d, i) => d.color || this.options.colors![i % this.options.colors!.length])
      .text(d => d.icon || '📊');
  }

  private addTitles(cards: d3.Selection<SVGGElement, NumberCardData, SVGGElement, unknown>, cardWidth: number, cardHeight: number): void {
    cards.append('text')
      .attr('class', 'card-title')
      .attr('x', this.options.showIcon ? 50 : 20)
      .attr('y', 25)
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', '#6B7280')
      .text(d => d.title);
  }

  private addValues(cards: d3.Selection<SVGGElement, NumberCardData, SVGGElement, unknown>, cardWidth: number, cardHeight: number): void {
    cards.append('text')
      .attr('class', 'card-value')
      .attr('x', 20)
      .attr('y', cardHeight / 2 + 10)
      .attr('font-size', '24px')
      .attr('font-weight', 'bold')
      .attr('fill', '#374151')
      .text(d => this.options.formatValue!(d.value));
  }

  private addChangeIndicators(cards: d3.Selection<SVGGElement, NumberCardData, SVGGElement, unknown>, cardWidth: number, cardHeight: number): void {
    const changeGroups = cards.append('g')
      .attr('class', 'change-indicator')
      .attr('transform', (d, i) => `translate(${cardWidth - 80}, ${cardHeight - 30})`);

    // Add change arrows
    changeGroups.append('path')
      .attr('d', d => {
        if (!d.change) return '';
        return d.change >= 0 
          ? 'M 0 10 L 5 0 L 10 10' // Up arrow
          : 'M 0 0 L 5 10 L 10 0'; // Down arrow
      })
      .attr('stroke', d => this.getChangeColor(d))
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .style('opacity', d => d.change ? 1 : 0);

    // Add change text
    changeGroups.append('text')
      .attr('x', 15)
      .attr('y', 8)
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', d => this.getChangeColor(d))
      .style('opacity', d => d.change ? 1 : 0)
      .text(d => d.change ? this.options.formatChange!(d.change) : '');
  }

  private getChangeColor(data: NumberCardData): string {
    if (!data.change) return '#6B7280';
    
    switch (data.changeType) {
      case 'increase':
        return '#10B981';
      case 'decrease':
        return '#EF4444';
      case 'neutral':
        return '#6B7280';
      default:
        return data.change >= 0 ? '#10B981' : '#EF4444';
    }
  }

  public update(newData: NumberCardData[]): void {
    if (!newData || !Array.isArray(newData) || newData.length === 0) {
      console.warn('Invalid data provided to number cards update');
      return;
    }
    
    this.data = [...newData];
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
