export interface SetupDockerGeneratorSchema {
  project?: string;
  targetName?: string;
  buildTarget?: string;
  skipFormat?: boolean;
  port?: number;
}
