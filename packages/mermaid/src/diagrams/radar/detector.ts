import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

import manifest from './manifest.json' assert { type: 'json' };

const detector: DiagramDetector = (txt) => {
  return /^\s*radar-chart-beta/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./diagram.js');
  return { id: manifest.id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id: manifest.id,
  detector,
  loader,
};

export default plugin;
