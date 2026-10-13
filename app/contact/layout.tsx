import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Scramble — Start a conversation",
  description:
    "Tell us about your business and what you're looking to achieve. We usually reply within one working day.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
