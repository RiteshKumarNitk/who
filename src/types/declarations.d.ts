declare module "next-pwa" {
  import type { NextConfig } from "next";
  function withPWA(config: {
    dest: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
  }): (nextConfig: NextConfig) => NextConfig;
  export default withPWA;
}

declare module "bcryptjs" {
  export function hash(s: string, salt: number | string): Promise<string>;
  export function compare(s: string, hash: string): Promise<boolean>;
  export function genSaltSync(rounds?: number): string;
  export function hashSync(s: string, salt: number | string): string;
  export function compareSync(s: string, hash: string): boolean;
}

declare module "geojson" {
  export interface Geometry {
    type: string;
    coordinates: any;
  }
  export interface Feature<T = Geometry, P = Record<string, any>> {
    type: "Feature";
    geometry: T;
    properties: P;
  }
  export interface FeatureCollection<T = Geometry, P = Record<string, any>> {
    type: "FeatureCollection";
    features: Feature<T, P>[];
  }
  export type Point = Geometry & { type: "Point"; coordinates: [number, number] };
  export type Polygon = Geometry & { type: "Polygon"; coordinates: [number, number][][] };
  export type MultiPolygon = Geometry & { type: "MultiPolygon"; coordinates: [number, number][][][] };
}
