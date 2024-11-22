import { InfoIcon, PenSquare, Phone, Video, Smile, Loader, Search } from "lucide-react";

type IconProps = React.HTMLAttributes<SVGElement>

export const Icons = {
  new: (props: IconProps) => <PenSquare className="text-muted-foreground" size={16} {...props} />,
  phone: (props: IconProps) => <Phone className="text-muted-foreground" size={16} {...props} />,
  video: (props: IconProps) => <Video className="text-muted-foreground" size={16} {...props} />,
  smile: (props: IconProps) => <Smile className="text-muted-foreground" size={16} {...props} />,
  info: (props: IconProps) => <InfoIcon className="text-muted-foreground" size={16} {...props} />,
  search: (props: IconProps) => <Search className="text-muted-foreground" size={16} {...props} />,
  spinner: (props: IconProps) => (
    <Loader className="animate-spin text-muted-foreground" size={16} {...props} />
  ),
};