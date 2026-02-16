export interface MessagesNotificationPayload {
  id: string;
  conversationId: string;
  sender: string;
  title: string;
  body: string;
  type: "message" | "reaction";
}
