export type Metric = { label: string; value?: number | string; unit?: string };
export type PanelData = { title: string; items: Metric[] };
