import { Star } from "lucide-react";
import { Badge } from "./ui/badge";
import { format } from 'date-fns';

const currentDate = format(new Date(), 'M/d/yy');

export default function SidebarHeader() {
  return (
    <>
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-lg font-bold">Pinned</h1>
        <Star className="text-yellow-500" />
      </div>
      <ul>
        <li className="flex items-center justify-between mb-4">
          <span>{currentDate}</span>
          <Badge variant="secondary">priority</Badge>
        </li>
        <li className="mb-4">Today</li>
      </ul>
    </>
  );
}
