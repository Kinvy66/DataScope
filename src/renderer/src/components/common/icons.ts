export type IconName =
  | 'home'
  | 'database'
  | 'activity'
  | 'chartLine'
  | 'chartBar'
  | 'pin'
  | 'zap'
  | 'listTodo'
  | 'fileText'
  | 'folder'
  | 'settings'
  | 'folderPlus'
  | 'folderOpen'
  | 'save'
  | 'copy'
  | 'close'
  | 'download'
  | 'sun'
  | 'moon'
  | 'zoomIn'
  | 'zoomOut'
  | 'maximize'
  | 'unfold'
  | 'crosshair'
  | 'x'
  | 'plus'
  | 'trash'
  | 'pencil'
  | 'refresh'
  | 'play'
  | 'pause'
  | 'square'
  | 'plug'
  | 'power'
  | 'shield'
  | 'rotateCcw'
  | 'hardDrive'
  | 'check'
  | 'checkSquare'
  | 'eraser'
  | 'arrowUp'
  | 'arrowDown'
  | 'filter'

export type IconNode =
  | { t: 'path'; d: string }
  | { t: 'circle'; cx: number; cy: number; r: number }
  | { t: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { t: 'polyline'; points: string }
  | { t: 'polygon'; points: string }
  | { t: 'rect'; x: number; y: number; w: number; h: number; rx?: number }

export const iconGraphics: Record<IconName, IconNode[]> = {
  home: [
    { t: 'rect', x: 3, y: 3, w: 7, h: 9, rx: 1 },
    { t: 'rect', x: 14, y: 3, w: 7, h: 5, rx: 1 },
    { t: 'rect', x: 14, y: 12, w: 7, h: 9, rx: 1 },
    { t: 'rect', x: 3, y: 16, w: 7, h: 5, rx: 1 }
  ],
  database: [
    { t: 'ellipse', cx: 12, cy: 5, rx: 9, ry: 3 },
    { t: 'path', d: 'M3 5V19A9 3 0 0 0 21 19V5' },
    { t: 'path', d: 'M3 12A9 3 0 0 0 21 12' }
  ],
  activity: [{ t: 'path', d: 'M22 12h-4l-3 9L9 3l-3 9H2' }],
  chartLine: [
    { t: 'path', d: 'M3 3v18h18' },
    { t: 'path', d: 'm19 9-5 5-4-4-3 3' }
  ],
  chartBar: [
    { t: 'path', d: 'M3 3v18h18' },
    { t: 'path', d: 'M7 16v-3' },
    { t: 'path', d: 'M12 16V8' },
    { t: 'path', d: 'M17 16v-6' }
  ],
  pin: [
    { t: 'path', d: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z' },
    { t: 'circle', cx: 12, cy: 10, r: 3 }
  ],
  zap: [{ t: 'polygon', points: '13 2 3 14 12 14 11 22 21 10 12 10 13 2' }],
  listTodo: [
    { t: 'rect', x: 3, y: 5, w: 6, h: 6, rx: 1 },
    { t: 'path', d: 'm3 17 2 2 4-4' },
    { t: 'path', d: 'M13 6h8' },
    { t: 'path', d: 'M13 12h8' },
    { t: 'path', d: 'M13 18h8' }
  ],
  fileText: [
    { t: 'path', d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z' },
    { t: 'path', d: 'M14 2v4a2 2 0 0 0 2 2h4' },
    { t: 'path', d: 'M10 13H8' },
    { t: 'path', d: 'M16 13H8' },
    { t: 'path', d: 'M16 17H8' }
  ],
  folder: [
    {
      t: 'path',
      d: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9l-.81-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'
    }
  ],
  settings: [
    {
      t: 'path',
      d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z'
    },
    { t: 'circle', cx: 12, cy: 12, r: 3 }
  ],
  folderPlus: [
    {
      t: 'path',
      d: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9l-.81-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'
    },
    { t: 'path', d: 'M12 10v6' },
    { t: 'path', d: 'M9 13h6' }
  ],
  folderOpen: [
    {
      t: 'path',
      d: 'm6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2'
    }
  ],
  save: [
    { t: 'path', d: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z' },
    { t: 'polyline', points: '17 21 17 13 7 13 7 21' },
    { t: 'polyline', points: '7 3 7 8 15 8' }
  ],
  copy: [
    { t: 'rect', x: 8, y: 8, w: 14, h: 14, rx: 2 },
    { t: 'path', d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' }
  ],
  close: [
    { t: 'circle', cx: 12, cy: 12, r: 10 },
    { t: 'path', d: 'm15 9-6 6' },
    { t: 'path', d: 'm9 9 6 6' }
  ],
  download: [
    { t: 'path', d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' },
    { t: 'polyline', points: '7 10 12 15 17 10' },
    { t: 'line', x1: 12, y1: 15, x2: 12, y2: 3 }
  ],
  sun: [
    { t: 'circle', cx: 12, cy: 12, r: 4 },
    { t: 'path', d: 'M12 2v2' },
    { t: 'path', d: 'M12 20v2' },
    { t: 'path', d: 'm4.93 4.93 1.41 1.41' },
    { t: 'path', d: 'm17.66 17.66 1.41 1.41' },
    { t: 'path', d: 'M2 12h2' },
    { t: 'path', d: 'M20 12h2' },
    { t: 'path', d: 'm4.93 19.07 1.41-1.41' },
    { t: 'path', d: 'm17.66 6.34 1.41-1.41' }
  ],
  moon: [{ t: 'path', d: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z' }],
  zoomIn: [
    { t: 'circle', cx: 11, cy: 11, r: 8 },
    { t: 'line', x1: 21, y1: 21, x2: 16.65, y2: 16.65 },
    { t: 'line', x1: 11, y1: 8, x2: 11, y2: 14 },
    { t: 'line', x1: 8, y1: 11, x2: 14, y2: 11 }
  ],
  zoomOut: [
    { t: 'circle', cx: 11, cy: 11, r: 8 },
    { t: 'line', x1: 21, y1: 21, x2: 16.65, y2: 16.65 },
    { t: 'line', x1: 8, y1: 11, x2: 14, y2: 11 }
  ],
  maximize: [
    { t: 'path', d: 'M8 3H5a2 2 0 0 0-2 2v3' },
    { t: 'path', d: 'M21 8V5a2 2 0 0 0-2-2h-3' },
    { t: 'path', d: 'M3 16v3a2 2 0 0 0 2 2h3' },
    { t: 'path', d: 'M16 21h3a2 2 0 0 0 2-2v-3' }
  ],
  unfold: [
    { t: 'path', d: 'm7 15 5 5 5-5' },
    { t: 'path', d: 'm7 9 5-5 5 5' }
  ],
  crosshair: [
    { t: 'circle', cx: 12, cy: 12, r: 10 },
    { t: 'line', x1: 22, y1: 12, x2: 18, y2: 12 },
    { t: 'line', x1: 6, y1: 12, x2: 2, y2: 12 },
    { t: 'line', x1: 12, y1: 6, x2: 12, y2: 2 },
    { t: 'line', x1: 12, y1: 22, x2: 12, y2: 18 }
  ],
  x: [
    { t: 'path', d: 'M18 6 6 18' },
    { t: 'path', d: 'm6 6 12 12' }
  ],
  plus: [
    { t: 'path', d: 'M5 12h14' },
    { t: 'path', d: 'M12 5v14' }
  ],
  trash: [
    { t: 'path', d: 'M3 6h18' },
    { t: 'path', d: 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' },
    { t: 'path', d: 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' }
  ],
  pencil: [{ t: 'path', d: 'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z' }],
  refresh: [
    { t: 'path', d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' },
    { t: 'path', d: 'M21 3v5h-5' },
    { t: 'path', d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' },
    { t: 'path', d: 'M8 16H3v5' }
  ],
  play: [{ t: 'polygon', points: '6 3 20 12 6 21 6 3' }],
  pause: [
    { t: 'rect', x: 6, y: 4, w: 4, h: 16, rx: 1 },
    { t: 'rect', x: 14, y: 4, w: 4, h: 16, rx: 1 }
  ],
  square: [{ t: 'rect', x: 3, y: 3, w: 18, h: 18, rx: 2 }],
  plug: [
    { t: 'path', d: 'M12 22v-5' },
    { t: 'path', d: 'M9 8V2' },
    { t: 'path', d: 'M15 8V2' },
    { t: 'path', d: 'M18 8v5a6 6 0 0 1-12 0V8Z' }
  ],
  power: [
    { t: 'path', d: 'M12 2v10' },
    { t: 'path', d: 'M18.4 6.6a9 9 0 1 1-12.77.04' }
  ],
  shield: [{ t: 'path', d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10' }],
  rotateCcw: [
    { t: 'path', d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' },
    { t: 'path', d: 'M3 3v5h5' }
  ],
  hardDrive: [
    { t: 'path', d: 'M6 2h12l4 6v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8Z' },
    { t: 'path', d: 'M22 8H2' },
    { t: 'path', d: 'M6 16h.01' },
    { t: 'path', d: 'M10 16h.01' }
  ],
  check: [{ t: 'path', d: 'M20 6 9 17l-5-5' }],
  checkSquare: [
    { t: 'rect', x: 3, y: 3, w: 18, h: 18, rx: 2 },
    { t: 'path', d: 'm9 12 2 2 4-4' }
  ],
  eraser: [
    {
      t: 'path',
      d: 'm7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21'
    },
    { t: 'path', d: 'M22 21H7' },
    { t: 'path', d: 'm5 11 9 9' }
  ],
  arrowUp: [
    { t: 'path', d: 'm5 12 7-7 7 7' },
    { t: 'path', d: 'M12 19V5' }
  ],
  arrowDown: [
    { t: 'path', d: 'M12 5v14' },
    { t: 'path', d: 'm19 12-7 7-7-7' }
  ],
  filter: [{ t: 'polygon', points: '22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3' }]
}
