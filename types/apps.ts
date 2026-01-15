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
}
