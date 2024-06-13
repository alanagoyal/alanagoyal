import SidebarContent from "./sidebar-content";
import SidebarHeader from "./sidebar-header";

export default function Sidebar() {
    return (
        <aside className="w-64 border-r border-gray-700 p-5">
          <SidebarHeader />
          <SidebarContent />
        </aside>
    )
}

