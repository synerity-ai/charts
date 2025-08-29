import * as d3 from 'd3';
import { ChartConfig, ChartData, ScatterData, ScatterPlotOptions } from './types';

export class ScatterPlot {
  private container: HTMLElement;
  private data: ScatterData[];
  private options: ScatterPlotOptions;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private chartGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private tooltip!: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  private zoom!: d3.ZoomBehavior<SVGSVGElement, unknown>;
  private selectedPoints: Set<number> = new Set();
  private clusters: any[] = [];

  constructor(config: ChartConfig) {
    this.container = typeof config.container === 'string' 
      ? document.querySelector(config.container) as HTMLElement
      : config.container;
    
    if (!this.container) {
      throw new Error('Container element not found');
    }

    if (!Array.isArray(config.data) || config.data.length === 0 || !('x' in config.data[0])) {
      throw new Error('Scatter plot requires ScatterData[] format');
    }

    this.data = config.data as ScatterData[];
    this.options = this.getDefaultOptions(config.options as ScatterPlotOptions);
    
    this.init();
  }

  private getDefaultOptions(userOptions?: ScatterPlotOptions): ScatterPlotOptions {
    return {
      width: 600,
      height: 400,
      margin: { top: 20, right: 20, bottom: 60, left: 60 },
      colors: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
        '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
        '#EC4899', '#14B8A6', '#FBBF24', '#6366F1'
      ],
      animate: true,
      showGrid: true,
      showTrendLine: false,
      pointRadius: 6,
      pointOpacity: 0.7,
      // Enhanced defaults
      trendLine: {
        enabled: false,
        type: 'linear',
        color: '#EF4444',
        strokeWidth: 2,
        opacity: 0.8
      },
      clustering: {
        enabled: false,
        algorithm: 'kmeans',
        maxClusters: 5,
        showClusterBoundaries: false,
        clusterColors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
      },
      mapping: {
        sizeRange: [4, 12],
        colorScale: 'categorical'
      },
      selection: {
        enabled: false,
        type: 'rectangle',
        multipleSelection: true,
        selectionColor: '#3B82F6'
      },
      zoom: {
        enabled: false,
        minZoom: 0.5,
        maxZoom: 5,
        enablePan: true
      },
      tooltip: {
        enabled: true,
        showAllFields: true
      },
      animation: {
        duration: 800,
        easing: 'cubic',
        entranceDelay: 50
      },
      ...userOptions
    };
  }

  private init(): void {
    this.createSVG();
    this.createTooltip();
    this.setupZoom();
    this.render();
  }

  private createSVG(): void {
    d3.select(this.container).selectAll('*').remove();

    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${this.options.width!} ${this.options.height!}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('display', 'block');

    this.chartGroup = this.svg.append('g')
      .attr('transform', `translate(${this.options.margin!.left}, ${this.options.margin!.top})`);
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

  private setupZoom(): void {
    if (this.options.zoom?.enabled) {
      this.zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([this.options.zoom.minZoom, this.options.zoom.maxZoom])
        .on('zoom', (event) => {
          this.chartGroup.attr('transform', event.transform);
        });

      this.svg.call(this.zoom);
    }
  }

  private render(): void {
    if (!this.data || this.data.length === 0) {
      console.warn('No data available for scatter plot rendering');
      return;
    }

    const chartWidth = this.options.width! - this.options.margin!.left - this.options.margin!.right;
    const chartHeight = this.options.height! - this.options.margin!.top - this.options.margin!.bottom;

    this.chartGroup.selectAll('*').remove();

    // Create scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(this.data, d => d.x) as [number, number])
      .range([0, chartWidth])
      .nice();

    const yScale = d3.scaleLinear()
      .domain(d3.extent(this.data, d => d.y) as [number, number])
      .range([chartHeight, 0])
      .nice();

    // Create axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    // Add grid if enabled
    if (this.options.showGrid) {
      this.chartGroup.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0, ${chartHeight})`)
        .call(d3.axisBottom(xScale).tickSize(-chartHeight).tickFormat(() => ''));

      this.chartGroup.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(yScale).tickSize(-chartWidth).tickFormat(() => ''));
    }

    // Add axes
    this.chartGroup.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis);

    this.chartGroup.append('g')
      .attr('class', 'y-axis')
      .call(yAxis);

    // Perform clustering if enabled
    if (this.options.clustering?.enabled) {
      this.performClustering();
    }

    // Create points
    const points = this.chartGroup.selectAll('.point')
      .data(this.data)
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', d => this.getPointRadius(d))
      .attr('fill', (d, i) => this.getPointColor(d, i))
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
      .style('opacity', this.options.animate ? 0 : (this.options.pointOpacity || 0.7))
      .style('cursor', this.options.selection?.enabled ? 'pointer' : 'default');

    // Add hover effects
    if (this.options.tooltip?.enabled) {
      points
        .on('mouseenter', (event, d) => {
          const point = d3.select(event.currentTarget);
          point.transition()
            .duration(200)
            .attr('stroke-width', 2)
            .attr('stroke', '#000');

          const tooltipContent = this.options.tooltip?.format?.(d) || 
            this.formatTooltip(d);
          
          this.tooltip
            .style('opacity', 1)
            .html(tooltipContent)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseleave', (event, d) => {
          const point = d3.select(event.currentTarget);
          point.transition()
            .duration(200)
            .attr('stroke-width', 1)
            .attr('stroke', 'white');

          this.tooltip.style('opacity', 0);
        });
    }

    // Add selection functionality
    if (this.options.selection?.enabled) {
      this.setupSelection(points, xScale, yScale);
    }

    // Add trend line if enabled
    if (this.options.trendLine?.enabled) {
      this.renderTrendLine(xScale, yScale);
    }

    // Add cluster boundaries if enabled
    if (this.options.clustering?.enabled && this.options.clustering.showClusterBoundaries) {
      this.renderClusterBoundaries(xScale, yScale);
    }

    // Animate points
    if (this.options.animate) {
      points.transition()
        .delay((d, i) => i * (this.options.animation?.entranceDelay || 50))
        .duration(this.options.animation?.duration || 800)
        .ease(d3.easeCubicOut)
        .style('opacity', this.options.pointOpacity || 0.7);
    }
  }

  private getPointRadius(d: ScatterData): number {
    if (this.options.mapping?.sizeField && (d as any)[this.options.mapping.sizeField]) {
      const sizeValue = (d as any)[this.options.mapping.sizeField];
      const sizeRange = this.options.mapping.sizeRange || [4, 12];
      const sizeScale = d3.scaleLinear()
        .domain(d3.extent(this.data, (item: any) => item[this.options.mapping!.sizeField!]) as [number, number])
        .range(sizeRange);
      return sizeScale(sizeValue);
    }
    return this.options.pointRadius!;
  }

  private getPointColor(d: ScatterData, index: number): string {
    if (this.options.mapping?.colorField && (d as any)[this.options.mapping.colorField]) {
      const colorValue = (d as any)[this.options.mapping.colorField];
      if (this.options.mapping.colorScale === 'categorical') {
        const colorScale = d3.scaleOrdinal()
          .domain(Array.from(new Set(this.data.map((item: any) => item[this.options.mapping!.colorField!]))))
          .range(this.options.colors!);
        return colorScale(colorValue) as string;
      } else {
        const colorScale = d3.scaleSequential()
          .domain(d3.extent(this.data, (item: any) => item[this.options.mapping!.colorField!]) as [number, number])
          .interpolator(d3.interpolateViridis);
        return colorScale(colorValue) as string;
      }
    }
    
    // Use cluster colors if clustering is enabled
    if (this.options.clustering?.enabled && this.clusters.length > 0) {
      const clusterIndex = this.getClusterIndex(d);
      return this.options.clustering.clusterColors![clusterIndex % this.options.clustering.clusterColors!.length];
    }
    
    return this.options.colors![index % this.options.colors!.length];
  }

  private formatTooltip(d: ScatterData): string {
    let content = `<strong>${d.label || 'Point'}</strong><br>`;
    content += `X: ${d.x}<br>`;
    content += `Y: ${d.y}`;
    
    if (this.options.tooltip?.showAllFields) {
      Object.entries(d).forEach(([key, value]) => {
        if (key !== 'x' && key !== 'y' && key !== 'label') {
          content += `<br>${key}: ${value}`;
        }
      });
    }
    
    return content;
  }

  private performClustering(): void {
    // Simple k-means clustering implementation
    const k = this.options.clustering!.maxClusters!;
    const points = this.data.map(d => [d.x, d.y]);
    
    // Initialize centroids randomly
    let centroids: number[][] = [];
    for (let i = 0; i < k; i++) {
      const randomIndex = Math.floor(Math.random() * points.length);
      centroids.push([...points[randomIndex]]);
    }
    
    // Perform k-means
    let finalClusters: number[][] = [];
    for (let iteration = 0; iteration < 10; iteration++) {
      const clusters: number[][] = Array.from({ length: k }, () => []);
      
      // Assign points to nearest centroid
      points.forEach((point, index) => {
        let minDistance = Infinity;
        let clusterIndex = 0;
        
        centroids.forEach((centroid, i) => {
          const distance = Math.sqrt(
            Math.pow(point[0] - centroid[0], 2) + 
            Math.pow(point[1] - centroid[1], 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            clusterIndex = i;
          }
        });
        
        clusters[clusterIndex].push(index);
      });
      
      // Update centroids
      centroids = clusters.map(cluster => {
        if (cluster.length === 0) return [0, 0];
        const sumX = cluster.reduce((sum, index) => sum + points[index][0], 0);
        const sumY = cluster.reduce((sum, index) => sum + points[index][1], 0);
        return [sumX / cluster.length, sumY / cluster.length];
      });
      
      finalClusters = clusters;
    }
    
    this.clusters = finalClusters;
  }

  private getClusterIndex(d: ScatterData): number {
    for (let i = 0; i < this.clusters.length; i++) {
      if (this.clusters[i].includes(this.data.indexOf(d))) {
        return i;
      }
    }
    return 0;
  }

  private setupSelection(points: d3.Selection<SVGCircleElement, ScatterData, SVGGElement, unknown>, 
                        xScale: d3.ScaleLinear<number, number>, 
                        yScale: d3.ScaleLinear<number, number>): void {
    if (this.options.selection?.type === 'point') {
      points.on('click', (event, d) => {
        const pointIndex = this.data.indexOf(d);
        if (this.selectedPoints.has(pointIndex)) {
          this.selectedPoints.delete(pointIndex);
        } else {
          if (!this.options.selection?.multipleSelection) {
            this.selectedPoints.clear();
          }
          this.selectedPoints.add(pointIndex);
        }
        this.updateSelection(points);
      });
    } else if (this.options.selection?.type === 'rectangle') {
      // Rectangle selection implementation
      this.setupRectangleSelection(points, xScale, yScale);
    }
  }

  private setupRectangleSelection(points: d3.Selection<SVGCircleElement, ScatterData, SVGGElement, unknown>,
                                 xScale: d3.ScaleLinear<number, number>,
                                 yScale: d3.ScaleLinear<number, number>): void {
    let selectionRect: d3.Selection<SVGRectElement, unknown, null, undefined>;
    let startPoint: [number, number] | null = null;

    this.svg.on('mousedown', (event) => {
      if (event.target === this.svg.node()) {
        startPoint = d3.pointer(event);
        selectionRect = this.svg.append('rect')
          .attr('class', 'selection-rect')
          .attr('x', startPoint[0])
          .attr('y', startPoint[1])
          .attr('width', 0)
          .attr('height', 0)
          .attr('fill', this.options.selection?.selectionColor || '#3B82F6')
          .attr('opacity', 0.2)
          .attr('stroke', this.options.selection?.selectionColor || '#3B82F6')
          .attr('stroke-width', 1);
      }
    });

    this.svg.on('mousemove', (event) => {
      if (startPoint && selectionRect) {
        const currentPoint = d3.pointer(event);
        const x = Math.min(startPoint[0], currentPoint[0]);
        const y = Math.min(startPoint[1], currentPoint[1]);
        const width = Math.abs(currentPoint[0] - startPoint[0]);
        const height = Math.abs(currentPoint[1] - startPoint[1]);

        selectionRect
          .attr('x', x)
          .attr('y', y)
          .attr('width', width)
          .attr('height', height);
      }
    });

    this.svg.on('mouseup', () => {
      if (startPoint && selectionRect) {
        const rect = selectionRect.node();
        if (rect) {
          const rectBounds = rect.getBoundingClientRect();
          const containerBounds = this.container.getBoundingClientRect();
          
          this.selectedPoints.clear();
          points.each((d, i) => {
            const pointX = xScale(d.x) + this.options.margin!.left;
            const pointY = yScale(d.y) + this.options.margin!.top;
            
            if (pointX >= rectBounds.left - containerBounds.left &&
                pointX <= rectBounds.right - containerBounds.left &&
                pointY >= rectBounds.top - containerBounds.top &&
                pointY <= rectBounds.bottom - containerBounds.top) {
              this.selectedPoints.add(i);
            }
          });
          
          this.updateSelection(points);
        }
        
        selectionRect.remove();
        startPoint = null;
      }
    });
  }

  private updateSelection(points: d3.Selection<SVGCircleElement, ScatterData, SVGGElement, unknown>): void {
    points
      .attr('stroke-width', (d, i) => this.selectedPoints.has(i) ? 3 : 1)
      .attr('stroke', (d, i) => this.selectedPoints.has(i) ? 
        (this.options.selection?.selectionColor || '#3B82F6') : 'white');
  }

  private renderTrendLine(xScale: d3.ScaleLinear<number, number>, 
                         yScale: d3.ScaleLinear<number, number>): void {
    if (this.options.trendLine?.type === 'linear') {
      const line = d3.line<ScatterData>()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));

      // Calculate linear regression
      const n = this.data.length;
      const sumX = this.data.reduce((sum, d) => sum + d.x, 0);
      const sumY = this.data.reduce((sum, d) => sum + d.y, 0);
      const sumXY = this.data.reduce((sum, d) => sum + d.x * d.y, 0);
      const sumXX = this.data.reduce((sum, d) => sum + d.x * d.x, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      const xRange = d3.extent(this.data, d => d.x) as [number, number];
      const trendData = [
        { x: xRange[0], y: slope * xRange[0] + intercept },
        { x: xRange[1], y: slope * xRange[1] + intercept }
      ];

      this.chartGroup.append('line')
        .attr('x1', xScale(trendData[0].x))
        .attr('y1', yScale(trendData[0].y))
        .attr('x2', xScale(trendData[1].x))
        .attr('y2', yScale(trendData[1].y))
        .attr('stroke', this.options.trendLine?.color || '#EF4444')
        .attr('stroke-width', this.options.trendLine?.strokeWidth || 2)
        .attr('opacity', this.options.trendLine?.opacity || 0.8)
        .attr('stroke-dasharray', '5,5');
    }
  }

  private renderClusterBoundaries(xScale: d3.ScaleLinear<number, number>,
                                 yScale: d3.ScaleLinear<number, number>): void {
    // Simple convex hull for cluster boundaries
    this.clusters.forEach((cluster, clusterIndex) => {
      if (cluster.length > 2) {
        const clusterPoints = cluster.map((index: number) => [xScale(this.data[index].x), yScale(this.data[index].y)]);
        const hull = d3.polygonHull(clusterPoints as [number, number][]);
        
        if (hull) {
          this.chartGroup.append('path')
            .attr('d', `M ${hull.join(' L ')} Z`)
            .attr('fill', 'none')
            .attr('stroke', this.options.clustering?.clusterColors![clusterIndex % this.options.clustering!.clusterColors!.length] || '#3B82F6')
            .attr('stroke-width', 1)
            .attr('opacity', 0.5)
            .attr('stroke-dasharray', '3,3');
        }
      }
    });
  }

  // Public methods
  public update(newData: ScatterData[]): void {
    if (!newData || !Array.isArray(newData) || newData.length === 0) {
      console.warn('Invalid data provided to scatter plot update');
      return;
    }
    
    this.data = [...newData];
    this.selectedPoints.clear();
    this.clusters = [];
    this.render();
  }

  public resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;
    this.svg.attr('viewBox', `0 0 ${width} ${height}`);
    this.render();
  }

  public enableTrendLine(enabled: boolean): void {
    if (this.options.trendLine) {
      this.options.trendLine.enabled = enabled;
    }
    this.render();
  }

  public enableClustering(enabled: boolean): void {
    if (this.options.clustering) {
      this.options.clustering.enabled = enabled;
    }
    this.render();
  }

  public enableZoom(enabled: boolean): void {
    if (this.options.zoom) {
      this.options.zoom.enabled = enabled;
    }
    if (enabled && !this.zoom) {
      this.setupZoom();
    } else if (!enabled && this.zoom !== undefined) {
      this.svg.on('.zoom', null);
    }
  }

  public resetZoom(): void {
    if (this.zoom) {
      this.svg.transition().duration(300).call(this.zoom.transform, d3.zoomIdentity);
    }
  }

  public getSelectedPoints(): ScatterData[] {
    return Array.from(this.selectedPoints).map(index => this.data[index]);
  }

  public clearSelection(): void {
    this.selectedPoints.clear();
    this.render();
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
