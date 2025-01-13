import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTrigger,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Recipient } from "@/types";
import { Fragment } from "react";

interface ContactDrawerProps {
  recipients: Array<Omit<Recipient, "id">>;
  onClose?: () => void;
  onUpdateName?: (name: string) => void;
  conversationName?: string;
  onAddContact?: () => void;
  onHideAlertsChange?: (hide: boolean) => void;
  hideAlerts?: boolean;
}

export function ContactDrawer({
  recipients,
  onClose,
  onUpdateName,
  conversationName,
  onAddContact,
  onHideAlertsChange,
  hideAlerts: initialHideAlerts = false,
}: ContactDrawerProps) {
  const [open, setOpen] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [chatName, setChatName] = useState(
    conversationName || recipients.map((r) => r.name).join(", ")
  );
  const [hideAlerts, setHideAlerts] = useState(initialHideAlerts);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatName(e.target.value);
  };

  const handleNameSave = () => {
    if (onUpdateName) {
      onUpdateName(chatName);
    }
    setIsEditing(false);
  };

  const recipientNames = recipients.map((r) => r.name).join(", ");

  const getOffset = (index: number, total: number) => {
    if (total === 1) return {};
    const yOffsets = [-4, 2, -2, 0];
    return {
      marginLeft: index === 0 ? "0px" : "-8px",
      transform: `translateY(${yOffsets[index]}px)`,
      zIndex: total - index,
    };
  };

  const handleHideAlertsChange = (checked: boolean) => {
    setHideAlerts(checked);
    onHideAlertsChange?.(checked);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          aria-label="View contact details"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[90vh] focus:outline-none bg-muted">
        <div className="mx-auto w-full">
          <DrawerTitle className="sr-only">
            Contact Information for {recipientNames}
          </DrawerTitle>
          <DrawerHeader className="flex justify-end items-center">
            <DrawerClose asChild>
              <Button
                variant="ghost"
                className="text-blue-500 text-lg font-medium hover:text-blue-600 hover:bg-transparent"
                onClick={onClose}
              >
                Done
              </Button>
            </DrawerClose>
          </DrawerHeader>

          <ScrollArea className="h-[calc(90vh-96px)]" bottomMargin="0" isMobile={true}>
            <DrawerDescription className="sr-only">
              Contact information and details for {recipientNames}
            </DrawerDescription>

            <div className="flex flex-col items-center mb-2 p-4">
              <div className="flex px-4 mb-2">
                {recipients.slice(0, 4).map((recipient, index) => (
                  <div
                    key={recipient.name}
                    className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0"
                    style={getOffset(index, Math.min(recipients.length, 4))}
                  >
                    {recipient.avatar ? (
                      <img
                        src={recipient.avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300 dark:from-gray-400 dark:via-gray-500 dark:to-gray-400 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-10 pointer-events-none" />
                        <span className="relative text-white text-xl font-medium">
                          {recipient.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center">
                {isEditing ? (
                  <input
                    type="text"
                    value={chatName}
                    onChange={handleNameChange}
                    className="text-2xl text-center font-semibold py-2 max-w-sm border-b border-gray-200 focus:outline-none focus:border-blue-500"
                    autoFocus
                    onBlur={handleNameSave}
                    onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                  />
                ) : (
                  <h2 className="text-2xl text-center font-semibold py-2 max-w-sm min-h-[40px] flex items-center justify-center border-b border-transparent">
                    {chatName}
                  </h2>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-500 text-sm font-medium hover:text-blue-600 mt-2"
                >
                  Change Name
                </button>
              </div>
            </div>

            <div className="px-8 bg-background rounded-lg mx-4">
              {recipients.map((recipient) => (
                <Fragment key={recipient.name}>
                  <div
                    className="flex items-center justify-between py-4 border-t first:border-t-0 cursor-pointer"
                    onClick={() =>
                      recipient.bio &&
                      setExpandedUser(
                        expandedUser === recipient.name ? null : recipient.name
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {recipient.avatar ? (
                          <img
                            src={recipient.avatar}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300">
                            <span className="text-white text-sm font-medium">
                              {recipient.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{recipient.name}</div>
                        {recipient.title && (
                          <div className="text-sm text-gray-500">
                            {recipient.title}
                          </div>
                        )}
                      </div>
                    </div>
                    {recipient.bio && (
                      <ChevronRight
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          expandedUser === recipient.name ? "rotate-90" : ""
                        }`}
                      />
                    )}
                  </div>
                  {expandedUser === recipient.name && recipient.bio && (
                    <div className="pl-13 pr-4 pb-4 text-sm text-gray-600">
                      {recipient.bio}
                    </div>
                  )}
                </Fragment>
              ))}
              
              {/* Add Contact Button */}
              <div className="py-4 border-t">
                <button 
                  className="w-full flex items-center gap-3 text-blue-500 hover:bg-transparent hover:text-blue-600 justify-start"
                  onClick={() => {
                    setOpen(false);
                    if (onAddContact) {
                      onAddContact();
                    }
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-2xl text-blue-500">+</span>
                  </div>
                  <span className="font-medium text-base">Add Contact</span>
                </button>
              </div>
            </div>

            {/* Hide Alerts Toggle */}
            <div className="px-4 py-4">
              <div className="w-full py-3 px-4 bg-background rounded-lg flex justify-between items-center">
                <span className="text-foreground">Hide Alerts</span>
                <Switch
                  checked={hideAlerts}
                  onCheckedChange={handleHideAlertsChange}
                  aria-label="Toggle alerts"
                />
              </div>
            </div>
          </ScrollArea>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
