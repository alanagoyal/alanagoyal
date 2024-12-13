import { InfoIcon, PenSquare, Phone, Video, Smile, Loader, Search, ChevronLeft, Sun, Moon, X } from "lucide-react";

type IconProps = React.HTMLAttributes<SVGElement>

export const Icons = {
  new: (props: IconProps) => <PenSquare className="text-muted-foreground" size={16} {...props} />,
  phone: (props: IconProps) => <Phone className="text-muted-foreground" size={16} {...props} />,
  video: (props: IconProps) => <Video className="text-muted-foreground" size={16} {...props} />,
  smile: (props: IconProps) => <Smile className="text-muted-foreground" size={16} {...props} />,
  info: (props: IconProps) => <InfoIcon className="text-muted-foreground" size={16} {...props} />,
  search: (props: IconProps) => <Search className="text-muted-foreground" size={14} {...props} />,
  spinner: (props: IconProps) => (
    <Loader className="animate-spin text-muted-foreground" size={16} {...props} />
  ),
  send: (props: IconProps) => <PenSquare className="text-muted-foreground" size={16} {...props} />,
  back: (props: IconProps) => <ChevronLeft className="text-[#0A7CFF]" size={32} {...props} />,
  sun: (props: IconProps) => <Sun className="text-muted-foreground" size={16} {...props} />,
  moon: (props: IconProps) => <Moon className="text-muted-foreground" size={16} {...props} />,
  close: (props: IconProps) => <X className="text-muted-foreground" size={14} {...props} />
};