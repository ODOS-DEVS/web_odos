export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  date: string;
};

export const notifications: NotificationItem[] = [
  {
    id: "email-verified",
    title: "Email verified successfully",
    description: "Your account is now fully verified and ready for secure shopping.",
    date: "1 Nov",
  },
  {
    id: "account-ready",
    title: "Your account is ready",
    description: "You can now browse, place orders, and manage everything from your profile.",
    date: "1 Nov",
  },
];
