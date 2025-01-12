import { InfoIcon, PenSquare, Phone, Video, Smile, Search, ChevronLeft, Sun, Moon, X, PlusCircle } from "lucide-react";

type IconProps = React.HTMLAttributes<SVGElement>

export const Icons = {
  new: (props: IconProps) => <PenSquare className="text-muted-foreground" size={16} {...props} />,
  phone: (props: IconProps) => <Phone className="text-muted-foreground" size={16} {...props} />,
  video: (props: IconProps) => <Video className="text-muted-foreground" size={16} {...props} />,
  smile: (props: IconProps) => <Smile className="text-muted-foreground" size={16} {...props} />,
  info: (props: IconProps) => <InfoIcon className="text-muted-foreground" size={16} {...props} />,
  search: (props: IconProps) => <Search className="text-muted-foreground" size={14} {...props} />,
  send: (props: IconProps) => <PenSquare className="text-muted-foreground" size={16} {...props} />,
  back: (props: IconProps) => <ChevronLeft className="text-[#0A7CFF]" size={32} {...props} />,
  sun: (props: IconProps) => <Sun className="text-muted-foreground" size={16} {...props} />,
  moon: (props: IconProps) => <Moon className="text-muted-foreground" size={16} {...props} />,
  close: (props: IconProps) => <X className="text-muted-foreground" size={14} {...props} />,
  plus: (props: IconProps) => <PlusCircle className="text-muted-foreground" size={16} {...props} />,
  spinner: (props: IconProps) => (
    <svg
      className="spinner"
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
};