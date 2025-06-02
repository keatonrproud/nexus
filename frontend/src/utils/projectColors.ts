import type { Theme } from "@mui/material/styles";

// Exactly 15 distinct, unique colors - no duplicates
const UNIQUE_COLORS = [
  "#6366f1", // Indigo
  "#06b6d4", // Cyan
  "#ef4444", // Red
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#9c27b0", // Purple
  "#ff5722", // Deep Orange
  "#795548", // Brown
  "#e91e63", // Pink
  "#4caf50", // Green
  "#3f51b5", // Indigo (different shade)
  "#ff9800", // Orange
  "#607d8b", // Blue Grey
  "#8bc34a", // Light Green
  "#ffeb3b", // Yellow
];

// Interface for project color assignment
export interface ProjectColorOptions {
  /** List of projects to assign colors to */
  projects: Array<{ id: string; name?: string; [key: string]: any }>;
  /** Theme object for accessing palette colors */
  theme?: Theme;
}

/**
 * Generates a consistent color mapping for projects based on their IDs.
 * Each project gets a unique color that never changes.
 */
export const getProjectColors = (
  options: ProjectColorOptions,
): Record<string, string> => {
  const { projects } = options;

  // Sort projects by ID to ensure consistent color assignment
  const sortedProjects = [...projects].sort((a, b) => a.id.localeCompare(b.id));

  // Assign each project a unique color
  const colorMap: Record<string, string> = {};

  sortedProjects.forEach((project, index) => {
    // Each project gets a unique color from our 15-color palette
    colorMap[project.id] = UNIQUE_COLORS[index % UNIQUE_COLORS.length];
  });

  return colorMap;
};

/**
 * Gets the color for a specific project ID from the color mapping
 */
export const getProjectColor = (
  projectId: string,
  colorMap: Record<string, string>,
  fallback = "#9e9e9e",
): string => {
  return colorMap[projectId] || fallback;
};

/**
 * Creates a project color mapping sorted by project name for UI display purposes.
 * This is useful when you want colors to appear in alphabetical order in lists.
 */
export const getProjectColorsByName = (
  options: ProjectColorOptions,
): Record<string, string> => {
  const { projects, theme } = options;

  // Sort projects by name for UI display
  const sortedByName = [...projects].sort((a, b) => {
    const nameA = a.name || a.id;
    const nameB = b.name || b.id;
    return nameA.toLowerCase().localeCompare(nameB.toLowerCase());
  });

  // Use the same color assignment logic but with name-based sorting
  return getProjectColors({
    projects: sortedByName,
    theme,
  });
};
