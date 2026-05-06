import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import LicenseInspector from "@/components/LicenseInspector";

// biome-ignore lint/style/noNonNullAssertion:
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LicenseInspector />
  </StrictMode>,
);
