import { LoadingPlaceholder } from "@/components/molecules/loading-placeholder";

export default function ProtectedLoading() {
  return (
    <div className="page-content">
      <LoadingPlaceholder label="Loading your workspace" />
    </div>
  );
}
