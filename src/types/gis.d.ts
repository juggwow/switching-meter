// src/types/pea-meter-details.ts (หรือชื่ออื่นที่เหมาะสม)

/**
 * Represents the type of geographic data.
 */
export type EsriGeometryType =
  | "esriGeometryPoint"
  | "esriGeometryPolyline"
  | "esriGeometryPolygon";

/**
 * Represents the type of a field in Esri data.
 */
export type EsriFieldType =
  | "esriFieldTypeInteger"
  | "esriFieldTypeSmallInteger"
  | "esriFieldTypeString"
  | "esriFieldTypeDate"
  | "esriFieldTypeSingle"
  | "esriFieldTypeDouble"
  | "esriFieldTypeOID"
  | "esriFieldTypeGlobalID"
  | "esriFieldTypeGeometry"
  | "esriFieldTypeBlob"
  | "esriFieldTypeRaster"
  | "esriFieldTypeGUID"
  | "esriFieldTypeXML";

/**
 * Represents the spatial reference system.
 */
export interface EsriSpatialReference {
  wkid: number;
  latestWkid: number;
}

/**
 * Represents the definition of a field in the Esri data.
 */
export interface EsriField {
  name: string;
  type: EsriFieldType;
  alias: string;
  length?: number; // Optional as it's not present for all types (e.g., Double)
}

/**
 * Represents the geometry of a feature (in this case, a Point).
 */
export interface EsriPointGeometry {
  x: number;
  y: number;
}

/**
 * Represents the attributes of a Meter detail feature.
 * Keys are the full field names, values are the actual data.
 */
export interface PeaMeterDetailAttributes {
  "PEA.DS_GroupMeter_Detail.PHASEDESIGNATION": string | null;//
  "PEA.DS_LowVoltageMeter.SUBTYPECODE": number | null;//
  "PEA.DS_LowVoltageMeter.PHASEDESIGNATION": number | null;//
  "PEA.METER_DETAIL.CODE": string | null;//
  "PEA.METER_DETAIL.PREFIX": string | null;//
  "PEA.METER_DETAIL.CUSTOMERNAME": string | null;//
  "PEA.METER_DETAIL.CUSTOMERSIRNAME": string | null;//
  "PEA.METER_DETAIL.ADDRESSNO": string | null;//
  "PEA.METER_DETAIL.ROOMNO": string | null; //
  "PEA.METER_DETAIL.FLOORNO": string | null; //
  "PEA.METER_DETAIL.MOO": string | null; //
  "PEA.METER_DETAIL.STREET": string | null;//
  "PEA.METER_DETAIL.TUMBOL": string | null;//
  "PEA.METER_DETAIL.AMPHOE": string | null;//
  "PEA.METER_DETAIL.CHANGWAT": string | null;//
  "PEA.METER_DETAIL.POSTCODE": string | null;//
  "PEA.METER_DETAIL.VILLAGEBUILDING": string | null; //
  "PEA.METER_DETAIL.TROK": string | null;//
  "PEA.METER_DETAIL.SOI": string | null;//
  "PEA.METER_DETAIL.METERTYPE": string | null;//
  "PEA.METER_DETAIL.CA": string | null;
  "PEA.METER_DETAIL.KWATTHOURS": number | null; // esriFieldTypeDouble maps to number
  "PEA.METER_DETAIL.CURRDATE": number | null; // esriFieldTypeDate often comes as a Unix timestamp in milliseconds
  "PEA.METER_DETAIL.MATERIALNUMBER": string | null; //
  "PEA.METER_DETAIL.USERTYPE": string | null;
  // Add other attributes if your data includes them
}

/**
 * Represents a single feature (e.g., a Meter) with its attributes and geometry.
 */
export interface EsriFeature {
  attributes: PeaMeterDetailAttributes;
  geometry: EsriPointGeometry;
}

/**
 * Represents the root object of the Esri-like JSON response for Meter details.
 */
export interface PeaMeterDetailsResponse {
  displayFieldName: string;
  fieldAliases: { [key: string]: string }; // Dictionary for field aliases
  geometryType: EsriGeometryType;
  spatialReference: EsriSpatialReference;
  fields: EsriField[];
  features: EsriFeature[];
}
