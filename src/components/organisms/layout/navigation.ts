import { LayoutDashboardIcon } from "@/components/atoms/icons/layout-dashboard-icon";
import { StethoscopeIcon } from "@/components/atoms/icons/stethoscope-icon";
import { UsersIcon } from "@/components/atoms/icons/users-icon";

export const navigation = [
  { label: "Dashboard", href: "/dashboard", Icon: LayoutDashboardIcon },
  { label: "Doctors", href: "/doctors", Icon: StethoscopeIcon },
  { label: "Patients", href: "/patients", Icon: UsersIcon },
];
