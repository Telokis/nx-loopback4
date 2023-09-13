import type { ExecutorContext } from "@nx/devkit";

export function getCwd(context: ExecutorContext) {
  return context.workspace.projects[context.projectName].root;
}
