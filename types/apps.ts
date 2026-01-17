import { Position, Size } from "./window";

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
  multiWindow?: boolean; // defaults to false - allows multiple windows per app
  cascadeOffset?: number; // offset for cascading new windows (default 30)
}
