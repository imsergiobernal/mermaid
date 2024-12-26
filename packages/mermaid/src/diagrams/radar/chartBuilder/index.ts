import type { SVGGroup } from '../../../diagram-api/types.js';
import type { DrawableElem, RadarChartConfig, RadarChartData, RadarChartThemeConfig } from './interfaces.js';
import { Orchestrator } from './orchestrator.js';

export class RadarChartBuilder {
  public static build(
    config: RadarChartConfig,
    chartData: RadarChartData,
    chartThemeConfig: RadarChartThemeConfig,
    tmpSVGGroup: SVGGroup
  ): DrawableElem[] {
    const orchestrator = new Orchestrator(config, chartData, chartThemeConfig, tmpSVGGroup);
    return orchestrator.getDrawableElement();
  }
}
