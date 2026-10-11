import type { Metadata } from "next";
import ApplyFlow from "./apply-flow";

export const metadata: Metadata = {
  title: "Apply | TEDxCITBengaluru",
  description: "Apply to join the TEDxCITBengaluru organising team.",
};

export default function JoinUsPage() {
  return <ApplyFlow />;
}
