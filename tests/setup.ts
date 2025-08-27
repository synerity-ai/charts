// Test setup file
import '@testing-library/jest-dom';

// Mock D3 for testing
jest.mock('d3', () => ({
  select: jest.fn(() => ({
    selectAll: jest.fn(() => ({
      remove: jest.fn(),
      data: jest.fn(() => ({
        enter: jest.fn(() => ({
          append: jest.fn(() => ({
            attr: jest.fn(() => ({
              style: jest.fn(() => ({
                transition: jest.fn(() => ({
                  duration: jest.fn(() => ({
                    ease: jest.fn(() => ({
                      attr: jest.fn(),
                      style: jest.fn(),
                    })),
                  })),
                })),
              })),
            })),
          })),
        })),
      })),
    })),
    append: jest.fn(() => ({
      attr: jest.fn(() => ({
        append: jest.fn(() => ({
          attr: jest.fn(),
        })),
      })),
    })),
  })),
  scaleBand: jest.fn(() => ({
    domain: jest.fn(() => ({
      range: jest.fn(() => ({
        padding: jest.fn(),
        bandwidth: jest.fn(() => 50),
      })),
    })),
  })),
  scaleLinear: jest.fn(() => ({
    domain: jest.fn(() => ({
      range: jest.fn(() => ({
        nice: jest.fn(),
      })),
    })),
  })),
  scalePoint: jest.fn(() => ({
    domain: jest.fn(() => ({
      range: jest.fn(() => ({
        padding: jest.fn(),
      })),
    })),
  })),
  max: jest.fn(() => 100),
  min: jest.fn(() => 0),
  pie: jest.fn(() => ({
    value: jest.fn(() => ({
      sort: jest.fn(),
    })),
  })),
  arc: jest.fn(() => ({
    innerRadius: jest.fn(() => ({
      outerRadius: jest.fn(() => ({
        centroid: jest.fn(() => [0, 0]),
      })),
    })),
  })),
  line: jest.fn(() => ({
    x: jest.fn(() => ({
      y: jest.fn(() => ({
        curve: jest.fn(),
      })),
    })),
  })),
  axisBottom: jest.fn(() => ({
    tickSize: jest.fn(() => ({
      tickFormat: jest.fn(() => ({
        selectAll: jest.fn(() => ({
          attr: jest.fn(),
        })),
      })),
    })),
    call: jest.fn(() => ({
      selectAll: jest.fn(() => ({
        attr: jest.fn(() => ({
          style: jest.fn(),
        })),
      })),
    })),
  })),
  axisLeft: jest.fn(() => ({
    tickSize: jest.fn(() => ({
      tickFormat: jest.fn(() => ({
        selectAll: jest.fn(() => ({
          attr: jest.fn(),
        })),
      })),
    })),
    call: jest.fn(() => ({
      selectAll: jest.fn(() => ({
        attr: jest.fn(() => ({
          style: jest.fn(),
        })),
      })),
    })),
  })),
  easeCubicOut: jest.fn(),
  curveLinear: jest.fn(),
  curveStep: jest.fn(),
  curveStepAfter: jest.fn(),
  curveStepBefore: jest.fn(),
  curveBasis: jest.fn(),
  curveCardinal: jest.fn(),
  curveCatmullRom: jest.fn(),
  curveMonotoneX: jest.fn(),
}));

// Mock window methods
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'mock-url'),
    revokeObjectURL: jest.fn(),
  },
});

Object.defineProperty(window, 'XMLSerializer', {
  value: {
    serializeToString: jest.fn(() => '<svg></svg>'),
  },
});

// Mock canvas
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillStyle: '',
  fillRect: jest.fn(),
  drawImage: jest.fn(),
})) as any;

HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
  callback(new Blob(['mock-png'], { type: 'image/png' }));
});

// Mock Image
(global as any).Image = class {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src: string = '';
  width: number = 100;
  height: number = 100;
};
