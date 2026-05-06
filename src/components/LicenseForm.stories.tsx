import { LICENSE_PRESETS } from "@/lib/defaultLicense";
import type { EagleLicense } from "@/types/license";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { LicenseForm } from "./LicenseForm";

const meta = {
  title: "Components/LicenseForm",
  component: LicenseForm,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof LicenseForm>;

export default meta;

type Story = StoryObj<typeof meta>;

const activeLicense = LICENSE_PRESETS.find(
  (preset) => preset.key === "cc-by-4.0",
)?.build();

function ControlledLicenseForm({
  initialLicense,
}: {
  initialLicense: EagleLicense;
}) {
  const [license, setLicense] = useState(initialLicense);

  return <LicenseForm value={license} onChange={setLicense} />;
}

export const Default: Story = {
  args: {
    value: activeLicense ?? LICENSE_PRESETS[0].build(),
    onChange: () => {},
  },
  render: (args) => (
    <div className="mx-auto max-w-3xl">
      <ControlledLicenseForm initialLicense={args.value} />
    </div>
  ),
};
