import {
  convertNxGenerator,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  logger,
  readNxJson,
  readProjectConfiguration,
  runTasksInSerial,
  Tree,
  updateProjectConfiguration,
} from "@nx/devkit";

import { SetupDockerGeneratorSchema } from "./schema";
import { join } from "path";

function normalizeOptions(
  tree: Tree,
  options: SetupDockerGeneratorSchema,
): SetupDockerGeneratorSchema {
  return {
    ...options,
    project: options.project ?? readNxJson(tree).defaultProject,
    targetName: options.targetName ?? "docker-build",
    buildTarget: options.buildTarget ?? "build",
    port: options.port ?? 3000,
  };
}

function addDocker(tree: Tree, options: SetupDockerGeneratorSchema) {
  const project = readProjectConfiguration(tree, options.project);
  if (!project || !options.targetName) {
    return;
  }

  if (tree.exists(joinPathFragments(project.root, "DockerFile"))) {
    logger.info(`Skipping setup since a Dockerfile already exists inside ${project.root}`);
  } else {
    const outputPath = project.targets[`${options.buildTarget}`]?.options.outputPath;
    generateFiles(tree, join(__dirname, "./files"), project.root, {
      ...options,
      tmpl: "",
      app: project.sourceRoot,
      buildLocation: outputPath,
      project: options.project,
    });
  }
}

export function updateProjectConfig(tree: Tree, options: SetupDockerGeneratorSchema) {
  const projectConfig = readProjectConfiguration(tree, options.project);

  projectConfig.targets[`${options.targetName}`] = {
    dependsOn: [`${options.buildTarget}`],
    command: `docker build -f ${joinPathFragments(projectConfig.root, "Dockerfile")} . -t ${
      options.project
    }`,
  };

  updateProjectConfiguration(tree, options.project, projectConfig);
}

export async function setupDockerGenerator(tree: Tree, setupOptions: SetupDockerGeneratorSchema) {
  const tasks: GeneratorCallback[] = [];
  const options = normalizeOptions(tree, setupOptions);
  // Should check if the node project exists
  addDocker(tree, options);
  updateProjectConfig(tree, options);

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(...tasks);
}

export default setupDockerGenerator;
export const setupDockerSchematic = convertNxGenerator(setupDockerGenerator);
