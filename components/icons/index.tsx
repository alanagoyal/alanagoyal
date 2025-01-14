import {
  InfoIcon,
  PenSquare,
  Phone,
  Video,
  Smile,
  Search,
  ChevronLeft,
  Sun,
  Moon,
  X,
  PlusCircle,
  ChevronRight,
  Volume2,
  VolumeX,
  ArrowUp,
  ArrowDown,
  Trash2,
  Pin,
  PinOff,
} from "lucide-react";

type IconProps = React.HTMLAttributes<SVGElement> & {
  size?: number;
  strokeWidth?: number;
};

export const Icons = {
  new: ({ size = 16, ...props }: IconProps) => (
    <PenSquare className="text-muted-foreground" size={size} {...props} />
  ),
  phone: ({ size = 16, ...props }: IconProps) => (
    <Phone className="text-muted-foreground" size={size} {...props} />
  ),
  video: ({ size = 16, ...props }: IconProps) => (
    <Video className="text-muted-foreground" size={size} {...props} />
  ),
  smile: ({ size = 16, ...props }: IconProps) => (
    <Smile className="text-muted-foreground" size={size} {...props} />
  ),
  info: ({ size = 16, ...props }: IconProps) => (
    <InfoIcon className="text-muted-foreground" size={size} {...props} />
  ),
  search: ({ size = 16, ...props }: IconProps) => (
    <Search className="text-muted-foreground" size={size} {...props} />
  ),
  send: ({ size = 16, ...props }: IconProps) => (
    <PenSquare className="text-muted-foreground" size={size} {...props} />
  ),
  back: ({ size = 16, ...props }: IconProps) => (
    <ChevronLeft className="text-[#0A7CFF]" size={size} {...props} />
  ),
  sun: ({ size = 16, ...props }: IconProps) => (
    <Sun className="text-muted-foreground" size={size} {...props} />
  ),
  moon: ({ size = 16, ...props }: IconProps) => (
    <Moon className="text-muted-foreground" size={size} {...props} />
  ),
  silencedMoon: (props: IconProps) => (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z" />
    </svg>
  ),
  close: ({ size = 16, ...props }: IconProps) => (
    <X className="text-muted-foreground" size={size} {...props} />
  ),
  plus: ({ size = 16, ...props }: IconProps) => (
    <PlusCircle className="text-muted-foreground" size={size} {...props} />
  ),
  chevronRight: ({ size = 16, ...props }: IconProps) => (
    <ChevronRight className="text-muted-foreground" size={size} {...props} />
  ),
  volume2: ({ size = 16, ...props }: IconProps) => (
    <Volume2 className="text-muted-foreground" size={size} {...props} />
  ),
  volumeX: ({ size = 16, ...props }: IconProps) => (
    <VolumeX className="text-muted-foreground" size={size} {...props} />
  ),
  bell: ({ size = 16, ...props }: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground"
      {...props}
    >
      <path
        fill="currentColor"
        d="M4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326A1 1 0 0 0 4 17z"
      />
      <path fill="currentColor" d="M10.268 21a2 2 0 0 0 3.464 0" />
    </svg>
  ),
  bellOff: ({ size = 16, ...props }: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground"
      {...props}
    >
      <path
        fill="currentColor"
        d="M17 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 .258-1.742L17.5 17.5z"
      />
      <path
        fill="currentColor"
        d="M8.668 3.01A6 6 0 0 1 18 8c0 2.687.77 4.653 1.707 6.05L8.668 3.01z"
      />
      <path fill="currentColor" d="M10.268 21a2 2 0 0 0 3.464 0" />
      <path stroke="currentColor" d="m2 2 20 20" />
    </svg>
  ),
  trash: ({ size = 16, ...props }: IconProps) => (
    <Trash2 className="text-muted-foreground" size={size} {...props} />
  ),
  pin: ({ size = 16, ...props }: IconProps) => (
    <Pin className="text-muted-foreground" size={size} {...props} />
  ),
  pinOff: ({ size = 16, ...props }: IconProps) => (
    <PinOff className="text-muted-foreground" size={size} {...props} />
  ),
  arrowUp: ({ size = 16, strokeWidth = 2, ...props }: IconProps) => (
    <ArrowUp
      className="text-muted-foreground"
      size={size}
      strokeWidth={strokeWidth}
      {...props}
    />
  ),
  arrowDown: ({ size = 16, ...props }: IconProps) => (
    <ArrowDown className="text-muted-foreground" size={size} {...props} />
  ),
  spinner: ({ ...props }: IconProps) => (
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
