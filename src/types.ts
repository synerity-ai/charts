export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export interface LineSeriesData {
  name: string;
  data: ChartData[];
  color?: string;
}

export interface MultiLineChartData {
  series: LineSeriesData[];
  labels: string[];
}

export interface ScatterData {
  x: number;
  y: number;
  label?: string;
  color?: string;
}

export interface BubbleData {
  x: number;
  y: number;
  r: number; // radius/size
  label?: string;
  color?: string;
}

export interface HeatmapData {
  x: string | number;
  y: string | number;
  value: number;
  color?: string;
}

export interface TreemapData {
  name: string;
  value: number;
  children?: TreemapData[];
  color?: string;
}

export interface SankeyNode {
  id: string;
  name: string;
  color?: string;
  x?: number;
  y?: number;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  color?: string;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface GaugeData {
  value: number;
  min: number;
  max: number;
  label?: string;
  color?: string;
}

export interface NumberCardData {
  title: string;
  value: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: string;
  color?: string;
}

// Base options interface
export interface BaseChartOptions {
  width?: number;
  height?: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  colors?: string[];
  animate?: boolean;
}

export interface BarChartOptions extends BaseChartOptions {
  orientation?: 'horizontal' | 'vertical';
  type?: 'standard' | 'grouped' | 'stacked' | 'normalized';
  showValues?: boolean;
  showGrid?: boolean;
  barPadding?: number;
  borderRadius?: number;
  groupPadding?: number;
  categoryPadding?: number;
}

export interface LineChartOptions extends BaseChartOptions {
  showPoints?: boolean;
  showGrid?: boolean;
  curveType?: 'linear' | 'step' | 'stepAfter' | 'stepBefore' | 'basis' | 'cardinal' | 'catmullRom' | 'monotoneX';
  strokeWidth?: number;
  pointRadius?: number;
  showArea?: boolean;
  areaOpacity?: number;
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  multiLine?: boolean;
}

export interface AreaChartOptions extends BaseChartOptions {
  type?: 'standard' | 'stacked' | 'normalized';
  showPoints?: boolean;
  showGrid?: boolean;
  curveType?: 'linear' | 'step' | 'stepAfter' | 'stepBefore' | 'basis' | 'cardinal' | 'catmullRom' | 'monotoneX';
  strokeWidth?: number;
  pointRadius?: number;
  areaOpacity?: number;
}

export interface PieChartOptions extends BaseChartOptions {
  type?: 'standard' | 'donut';
  showLabels?: boolean;
  showValues?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  labelRadius?: number;
  explode?: boolean;
  explodeOffset?: number;
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
}

export interface BubbleChartOptions extends BaseChartOptions {
  showGrid?: boolean;
  showLabels?: boolean;
  minRadius?: number;
  maxRadius?: number;
  opacity?: number;
}

export interface GaugeChartOptions extends BaseChartOptions {
  type?: 'radial' | 'linear';
  min?: number;
  max?: number;
  thresholds?: Array<{
    value: number;
    color: string;
  }>;
  showValue?: boolean;
  showLabel?: boolean;
  arcWidth?: number;
}

export interface HeatmapOptions extends BaseChartOptions {
  showValues?: boolean;
  colorScale?: 'sequential' | 'diverging' | 'categorical';
  colorDomain?: [number, number];
  cellPadding?: number;
  showAxis?: boolean;
}

export interface TreemapOptions extends BaseChartOptions {
  showLabels?: boolean;
  showValues?: boolean;
  padding?: number;
  borderWidth?: number;
  borderColor?: string;
}

export interface NumberCardOptions extends BaseChartOptions {
  showChange?: boolean;
  showIcon?: boolean;
  formatValue?: (value: number) => string;
  formatChange?: (change: number) => string;
}

export interface SankeyOptions extends BaseChartOptions {
  nodeWidth?: number;
  nodePadding?: number;
  linkOpacity?: number;
  showValues?: boolean;
}

export interface ScatterPlotOptions extends BaseChartOptions {
  showGrid?: boolean;
  showTrendLine?: boolean;
  pointRadius?: number;
  pointOpacity?: number;
}

export interface ChartConfig {
  container: string | HTMLElement;
  data: ChartData[] | MultiLineChartData | ScatterData[] | BubbleData[] | HeatmapData[] | TreemapData[] | SankeyData | GaugeData | NumberCardData[];
  options?: BarChartOptions | LineChartOptions | AreaChartOptions | PieChartOptions | BubbleChartOptions | GaugeChartOptions | HeatmapOptions | TreemapOptions | NumberCardOptions | SankeyOptions | ScatterPlotOptions;
}
