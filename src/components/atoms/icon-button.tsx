import type { ComponentProps } from "react";
import { Button, type ButtonProps } from "./button";
import { UiIcon } from "./icons/ui-icon";

type IconButtonProps = Omit<ButtonProps, "aria-label" | "children" | "title"> & {
  icon: ComponentProps<typeof UiIcon>["name"];
  label: string;
};

export function IconButton({
  icon,
  label,
  className = "",
  variant = "ghost",
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <Button
      {...props}
      aria-label={label}
      title={label}
      className={`icon-button ${className}`.trim()}
      type={type}
      variant={variant}
    >
      <UiIcon name={icon} />
    </Button>
  );
}
