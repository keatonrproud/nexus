import { Layout } from "@/components/common";
import React, { Suspense } from "react";
import { PageSkeleton } from "./PageSkeleton";

interface RouteLoadingWrapperProps {
  children: React.ReactNode;
  skeletonVariant?: "dashboard" | "project-board" | "analytics" | "default";
  withLayout?: boolean;
}

export const RouteLoadingWrapper: React.FC<RouteLoadingWrapperProps> = ({
  children,
  skeletonVariant = "default",
  withLayout = true,
}) => {
  const fallback = <PageSkeleton variant={skeletonVariant} />;

  const content = <Suspense fallback={fallback}>{children}</Suspense>;

  if (withLayout) {
    return <Layout>{content}</Layout>;
  }

  return content;
};
