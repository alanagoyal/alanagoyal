import SidebarContent from "./sidebar-content";
import SidebarHeader from "./sidebar-header";

export default function Sidebar({notes}: {notes: any[]}) {
    return (
        <aside className="w-64 border-r border-gray-700 p-5">
          <SidebarHeader />
          <SidebarContent notes={notes}/>
        </aside>
    )
}

