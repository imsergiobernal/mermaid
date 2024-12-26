import type { DiagramDefinition } from '../../diagram-api/types.js';
// @ts-ignore: Jison doesn't support types.
import parser from './parser/radar-chart.jison';
import db from './db.js';
import renderer from './renderer.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
};
