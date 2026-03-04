import { Position, Size } from "./window";

export interface AppMobilePolicy {
  supported?: boolean; // defaults to true
  shellFallbackAppId?: string; // fallback app when unsupported on mobile
  directRouteRedirectTo?: string; // defaults to "/"
  showInFinderApplications?: boolean; // defaults to true
}

export interface AppConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  accentColor: string;
  defaultPosition: Position;
  defaultSize: Size;
  minSize: Size;
  menuBarTitle: string;
  showOnDockByDefault?: boolean; // defaults to true if not specified
  showInFinderApplications?: boolean; // defaults to true if not specified
  mobile?: AppMobilePolicy;
  multiWindow?: boolean; // defaults to false - allows multiple windows per app
  cascadeOffset?: number; // offset for cascading new windows (default 30)
}
