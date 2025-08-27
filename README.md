# @synerity/charts

A comprehensive, framework-agnostic chart library built with D3 and Tailwind CSS. Supports multiple chart types with beautiful animations and export functionality.

## 🚀 Quick Start

### Installation

```bash
npm install @synerity/charts
```

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="chart" class="w-full h-96"></div>
  
  <script type="module">
    import { BarChart } from '@synerity/charts';
    
    const data = [
      { label: 'Q1', value: 120 },
      { label: 'Q2', value: 180 },
      { label: 'Q3', value: 150 },
      { label: 'Q4', value: 220 }
    ];

    new BarChart({
      container: '#chart',
      data: data
    });
  </script>
</body>
</html>
```

## 📊 Chart Types

### Bar Chart
```javascript
import { BarChart } from '@synerity/charts';

new BarChart({
  container: '#bar-chart',
  data: [
    { label: 'Q1', value: 120, color: '#3B82F6' },
    { label: 'Q2', value: 180, color: '#10B981' }
  ],
  options: {
    animate: true,
    showValues: true,
    showGrid: true,
    barPadding: 0.1,
    borderRadius: 4
  }
});
```

### Line Chart
```javascript
import { LineChart } from '@synerity/charts';

new LineChart({
  container: '#line-chart',
  data: [
    { label: 'Jan', value: 65, color: '#3B82F6' },
    { label: 'Feb', value: 78, color: '#10B981' }
  ],
  options: {
    animate: true,
    showPoints: true,
    showGrid: true,
    curveType: 'monotoneX',
    strokeWidth: 2
  }
});
```

### Pie Chart
```javascript
import { PieChart } from '@synerity/charts';

new PieChart({
  container: '#pie-chart',
  data: [
    { label: 'Desktop', value: 45, color: '#3B82F6' },
    { label: 'Mobile', value: 35, color: '#10B981' }
  ],
  options: {
    animate: true,
    showLabels: true,
    showValues: true,
    innerRadius: 0,
    outerRadius: 150
  }
});
```

### Scatter Plot
```javascript
import { ScatterPlot } from '@synerity/charts';

new ScatterPlot({
  container: '#scatter-plot',
  data: [
    { x: 10, y: 20, label: 'Point 1', color: '#3B82F6' },
    { x: 20, y: 35, label: 'Point 2', color: '#10B981' }
  ],
  options: {
    animate: true,
    showGrid: true,
    showTrendLine: true,
    pointRadius: 6,
    pointOpacity: 0.7
  }
});
```

## 📤 Export Functionality

### Export Manager
```javascript
import { ExportManager } from '@synerity/charts';

const exportManager = new ExportManager(container);

// Export as PNG
const pngBlob = await exportManager.exportPNG({
  format: 'png',
  width: 800,
  height: 600,
  quality: 0.9
});

// Export as SVG
const svgString = await exportManager.exportSVG({
  format: 'svg',
  includeStyles: true
});

// Export as PDF (requires jsPDF)
const pdfBlob = await exportManager.exportPDF({
  format: 'pdf',
  title: 'Chart Export',
  author: 'Synerity Charts'
});

// Export data as CSV
const csvString = exportManager.exportCSV(data, 'chart-data.csv');

// Export data as JSON
const jsonString = exportManager.exportJSON(data, 'chart-data.json');
```

## 🛠️ Development

### Build the Library
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### Testing
```bash
npm test
npm run test:coverage
```

### Demos
- Open `demo.html` for basic bar chart demo
- Open `demo-all-charts.html` for comprehensive demo with all chart types and export functionality

## ✨ Features

### Chart Types
- 🎯 **Bar Charts**: Animated bars with customizable styling
- 📈 **Line Charts**: Smooth curves with data points
- 🥧 **Pie Charts**: Interactive slices with labels
- 🔵 **Scatter Plots**: Data points with trend lines

### Export Formats
- 🖼️ **PNG**: High-resolution image export
- 🎨 **SVG**: Vector graphics with embedded styles
- 📄 **PDF**: Document export with metadata
- 📊 **CSV**: Data export with headers
- 📋 **JSON**: Structured data export

### Core Features
- 🎨 **Beautiful Design**: Tailwind CSS color palette
- 📊 **Framework Agnostic**: Works with any JavaScript framework
- ⚡ **Lightweight**: Only depends on D3.js
- 🎭 **Customizable**: Extensive options for styling
- 📱 **Responsive**: Built-in responsive design
- 🎯 **TypeScript**: Full TypeScript support
- 🎬 **Animations**: Smooth transitions and effects
- 🔄 **Data Updates**: Real-time data updates with proper cleanup

## 📚 API Reference

### Chart Configuration
```typescript
interface ChartConfig {
  container: string | HTMLElement;
  data: ChartData[] | ScatterData[];
  options?: BarChartOptions | LineChartOptions | PieChartOptions | ScatterPlotOptions;
}
```

### Data Types
```typescript
interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface ScatterData {
  x: number;
  y: number;
  label?: string;
  color?: string;
}
```

### Export Configuration
```typescript
interface ExportConfig {
  format: 'png' | 'svg' | 'pdf';
  filename?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  quality?: number;
}
```

## 🎯 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📄 License

MIT License - see LICENSE file for details.
