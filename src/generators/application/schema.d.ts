import type { ProjectNameAndRootFormat } from "@nx/devkit/src/generators/project-name-and-root-utils";

export interface ApplicationGeneratorSchema {
  name: string;
  directory?: string;
  projectNameAndRootFormat?: ProjectNameAndRootFormat;
  skipFormat?: boolean;
  skipPackageJson?: boolean;
  tags?: string;
  port?: number;
  docker?: boolean;
}
