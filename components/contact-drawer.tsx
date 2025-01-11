import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTrigger,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer"
import { ChevronRight } from "lucide-react"
import { Recipient } from "@/types"
import { Fragment } from "react"

interface ContactDrawerProps {
  recipients: Array<Omit<Recipient, 'id'>>
  onClose?: () => void
}

export function ContactDrawer({ recipients, onClose }: ContactDrawerProps) {
  const [open, setOpen] = useState(false)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  
  const recipientNames = recipients.map(r => r.name).join(", ")

  const getOffset = (index: number, total: number) => {
    if (total === 1) return {};
    const yOffsets = [-4, 2, -2, 0];
    return {
      marginLeft: index === 0 ? "0px" : "-8px",
      transform: `translateY(${yOffsets[index]}px)`,
      zIndex: total - index,
    };
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
      <DrawerContent className="h-[90vh] focus:outline-none">
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
          
          <DrawerDescription className="sr-only">
            Contact information and details for {recipientNames}
          </DrawerDescription>

          <div className="flex flex-col items-center mb-4 p-4">
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
            <h2 className="text-2xl text-center font-semibold py-4 max-w-sm">{recipientNames}</h2>
          </div>

          <div className="px-8">
            {recipients.map((recipient) => (
              <Fragment key={recipient.name}>
                <div 
                  className="flex items-center justify-between py-4 border-t first:border-t-0 cursor-pointer"
                  onClick={() => recipient.bio && setExpandedUser(expandedUser === recipient.name ? null : recipient.name)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
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
                        <div className="text-sm text-gray-500">{recipient.title}</div>
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
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
