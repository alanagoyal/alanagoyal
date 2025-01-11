import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
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
      <DrawerContent className="h-[98vh] focus:outline-none">
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader className="flex justify-between items-center px-4">
            <div className="w-16"></div>
            <DrawerTitle className="text-lg font-normal">
              {recipients.length} {recipients.length === 1 ? "Person" : "People"}
            </DrawerTitle>
            <DrawerClose asChild>
              <Button 
                variant="ghost" 
                className="text-blue-500 hover:text-blue-600 hover:bg-transparent"
                onClick={onClose}
              >
                Done
              </Button>
            </DrawerClose>
          </DrawerHeader>
          
          <DrawerDescription className="sr-only">
            Contact information and details for {recipientNames}
          </DrawerDescription>

          <div className="flex flex-col items-center mb-8">
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
            <h2 className="p-4 text-xl text-center font-semibold">{recipientNames}</h2>
            <div className="p-4 w-full">
              {recipients.map((recipient) => (
                <Fragment key={recipient.name}>
                  {(recipient.bio || recipient.title) && (
                    <div 
                      className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-4"
                      tabIndex={0}
                    >
                      {recipient.title && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {recipient.title}
                        </p>
                      )}
                      {recipient.bio && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {recipient.bio}
                        </p>
                      )}
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
