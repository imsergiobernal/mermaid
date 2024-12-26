import * as configApi from '../../config.js';
import defaultConfig from '../../defaultConfig.js';
import type { SVGGroup } from '../../diagram-api/types.js';
import { getThemeVariables } from '../../themes/theme-default.js';
import { cleanAndMerge } from '../../utils.js';
import { sanitizeText } from '../common/common.js';
import {
  clear as commonClear,
  getAccDescription,
  getAccTitle,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
import { RadarChartBuilder } from './chartBuilder/index.js';
import type {
  DrawableElem,
  SimplePlotDataType,
  RadarChartConfig,
  RadarChartData,
  RadarChartThemeConfig,
} from './chartBuilder/interfaces.js';
import { isBandAxisData, isLinearAxisData } from './chartBuilder/interfaces.js';

let plotIndex = 0;

let tmpSVGGroup: SVGGroup;

let radarChartConfig: RadarChartConfig = getChartDefaultConfig();
let xyChartThemeConfig: RadarChartThemeConfig = getChartDefaultThemeConfig();
let xyChartData: RadarChartData = getChartDefaultData();
let plotColorPalette = xyChartThemeConfig.plotColorPalette.split(',').map((color) => color.trim());
let hasSetXAxis = false;
let hasSetYAxis = false;

interface NormalTextType {
  type: 'text';
  text: string;
}

function getChartDefaultThemeConfig(): RadarChartThemeConfig {
  const defaultThemeVariables = getThemeVariables();
  const config = configApi.getConfig();
  return cleanAndMerge(defaultThemeVariables.xyChart, config.themeVariables.xyChart);
}
function getChartDefaultConfig(): RadarChartConfig {
  const config = configApi.getConfig();
  return cleanAndMerge<RadarChartConfig>(
    defaultConfig.xyChart as RadarChartConfig,
    config.xyChart as RadarChartConfig
  );
}

function getChartDefaultData(): RadarChartData {
  return {
    yAxis: {
      type: 'linear',
      title: '',
      min: Infinity,
      max: -Infinity,
    },
    xAxis: {
      type: 'band',
      title: '',
      categories: [],
    },
    title: '',
    plots: [],
  };
}

function textSanitizer(text: string) {
  const config = configApi.getConfig();
  return sanitizeText(text.trim(), config);
}

function setTmpSVGG(SVGG: SVGGroup) {
  tmpSVGGroup = SVGG;
}
function setOrientation(orientation: string) {
  if (orientation === 'horizontal') {
    radarChartConfig.chartOrientation = 'horizontal';
  } else {
    radarChartConfig.chartOrientation = 'vertical';
  }
}
function setXAxisTitle(title: NormalTextType) {
  xyChartData.xAxis.title = textSanitizer(title.text);
}
function setXAxisRangeData(min: number, max: number) {
  xyChartData.xAxis = { type: 'linear', title: xyChartData.xAxis.title, min, max };
  hasSetXAxis = true;
}
function setXAxisBand(categories: NormalTextType[]) {
  xyChartData.xAxis = {
    type: 'band',
    title: xyChartData.xAxis.title,
    categories: categories.map((c) => textSanitizer(c.text)),
  };
  hasSetXAxis = true;
}
function setYAxisTitle(title: NormalTextType) {
  xyChartData.yAxis.title = textSanitizer(title.text);
}
function setYAxisRangeData(min: number, max: number) {
  xyChartData.yAxis = { type: 'linear', title: xyChartData.yAxis.title, min, max };
  hasSetYAxis = true;
}

// this function does not set `hasSetYAxis` as there can be multiple data so we should calculate the range accordingly
function setYAxisRangeFromPlotData(data: number[]) {
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const prevMinValue = isLinearAxisData(xyChartData.yAxis) ? xyChartData.yAxis.min : Infinity;
  const prevMaxValue = isLinearAxisData(xyChartData.yAxis) ? xyChartData.yAxis.max : -Infinity;
  xyChartData.yAxis = {
    type: 'linear',
    title: xyChartData.yAxis.title,
    min: Math.min(prevMinValue, minValue),
    max: Math.max(prevMaxValue, maxValue),
  };
}

function transformDataWithoutCategory(data: number[]): SimplePlotDataType {
  let retData: SimplePlotDataType = [];
  if (data.length === 0) {
    return retData;
  }
  if (!hasSetXAxis) {
    const prevMinValue = isLinearAxisData(xyChartData.xAxis) ? xyChartData.xAxis.min : Infinity;
    const prevMaxValue = isLinearAxisData(xyChartData.xAxis) ? xyChartData.xAxis.max : -Infinity;
    setXAxisRangeData(Math.min(prevMinValue, 1), Math.max(prevMaxValue, data.length));
  }
  if (!hasSetYAxis) {
    setYAxisRangeFromPlotData(data);
  }

  if (isBandAxisData(xyChartData.xAxis)) {
    retData = xyChartData.xAxis.categories.map((c, i) => [c, data[i]]);
  }

  if (isLinearAxisData(xyChartData.xAxis)) {
    const min = xyChartData.xAxis.min;
    const max = xyChartData.xAxis.max;
    const step = (max - min) / (data.length - 1);
    const categories: string[] = [];
    for (let i = min; i <= max; i += step) {
      categories.push(`${i}`);
    }
    retData = categories.map((c, i) => [c, data[i]]);
  }

  return retData;
}

function getPlotColorFromPalette(plotIndex: number): string {
  return plotColorPalette[plotIndex === 0 ? 0 : plotIndex % plotColorPalette.length];
}

function setLineData(title: NormalTextType, data: number[]) {
  const plotData = transformDataWithoutCategory(data);
  xyChartData.plots.push({
    type: 'line',
    strokeFill: getPlotColorFromPalette(plotIndex),
    strokeWidth: 2,
    data: plotData,
  });
  plotIndex++;
}

function setBarData(title: NormalTextType, data: number[]) {
  const plotData = transformDataWithoutCategory(data);
  xyChartData.plots.push({
    type: 'bar',
    fill: getPlotColorFromPalette(plotIndex),
    data: plotData,
  });
  plotIndex++;
}

function getDrawableElem(): DrawableElem[] {
  if (xyChartData.plots.length === 0) {
    throw Error('No Plot to render, please provide a plot with some data');
  }
  xyChartData.title = getDiagramTitle();
  return RadarChartBuilder.build(radarChartConfig, xyChartData, xyChartThemeConfig, tmpSVGGroup);
}

function getChartThemeConfig() {
  return xyChartThemeConfig;
}

function getChartConfig() {
  return radarChartConfig;
}

const clear = function () {
  commonClear();
  plotIndex = 0;
  radarChartConfig = getChartDefaultConfig();
  xyChartData = getChartDefaultData();
  xyChartThemeConfig = getChartDefaultThemeConfig();
  plotColorPalette = xyChartThemeConfig.plotColorPalette.split(',').map((color) => color.trim());
  hasSetXAxis = false;
  hasSetYAxis = false;
};

export default {
  getDrawableElem,
  clear,
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
  setOrientation,
  setXAxisTitle,
  setXAxisRangeData,
  setXAxisBand,
  setYAxisTitle,
  setYAxisRangeData,
  setLineData,
  setBarData,
  setTmpSVGG,
  getChartThemeConfig,
  getChartConfig,
};
