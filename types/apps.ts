import { Position, Size } from "./window";

export type AppMobilePolicy =
  | {
      supported: true;
      showInFinderApplications?: boolean;
    }
  | {
      supported: false;
      shellFallbackAppId: string;
      directRouteRedirectTo: string;
      showInFinderApplications: false;
    };

export interface AppConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  provenance: {
    agent: string;
    circa: string;
  };
  accentColor: string;
  defaultPosition: Position;
  defaultSize: Size;
  minSize: Size;
  menuBarTitle: string;
  dockOrder?: number; // lower values appear first; unspecified apps retain registry order afterward
  dockIconScale?: number; // optical-size adjustment for assets whose artwork fills more of the canvas
  showOnDockByDefault?: boolean; // defaults to true if not specified
  showInFinderApplications?: boolean; // defaults to true if not specified
  mobile: AppMobilePolicy;
  multiWindow?: boolean; // defaults to false - allows multiple windows per app
  cascadeOffset?: number; // offset for cascading new windows (default 30)
}
