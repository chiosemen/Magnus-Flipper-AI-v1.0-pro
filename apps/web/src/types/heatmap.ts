/**
 * Heatmap Visualization Types
 * 
 * Types for conversion path heatmap data visualization.
 */

export interface HeatmapNode {
  id: string; // Page path
  weight: number; // Visit frequency
  label: string; // Display name
}

export interface HeatmapEdge {
  source: string; // Source page path
  target: string; // Target page path
  weight: number; // Transition frequency
}

export interface DropOffPoint {
  page: string; // Page where users dropped off
  count: number; // Number of drop-offs
  rate: number; // Drop-off rate (0-1)
}

export interface HeatmapData {
  nodes: HeatmapNode[];
  edges: HeatmapEdge[];
  dropOffs: DropOffPoint[];
  conversionRate: number; // Overall conversion rate (0-1)
  totalSessions: number;
  totalEvents: number;
}

