import type {
  GeneratorCallback,
  ProjectConfiguration,
  TargetConfiguration,
  Tree,
} from "@nx/devkit";
import {
  convertNxGenerator,
  formatFiles,
  offsetFromRoot,
  generateFiles,
  joinPathFragments,
  addProjectConfiguration,
  updateJson,
  runTasksInSerial,
  detectPackageManager,
} from "@nx/devkit";
import { determineProjectNameAndRootOptions } from "@nx/devkit/src/generators/project-name-and-root-utils";
import { join } from "path";
import { initGenerator } from "../init/init.generator";
import type { ApplicationGeneratorSchema } from "./schema";
import { getRelativePathToRootTsConfig } from "@nx/js";
import { Linter, lintProjectGenerator } from "@nx/linter";
import { mapLintPattern } from "@nx/linter/src/generators/lint-project/lint-project";
import { setupDockerGenerator } from "../setup-docker/setup-docker.generator";
import { toPascalCase } from "../../utils/stringCase";

interface NormalizedSchema extends ApplicationGeneratorSchema {
  appProjectName: string;
  appProjectRoot: string;
  parsedTags: string[];
}

function getBuildConfig(
  project: ProjectConfiguration,
  options: NormalizedSchema,
): TargetConfiguration {
  return {
    executor: "@nx/js:tsc",
    outputs: ["{options.outputPath}"],
    options: {
      outputPath: joinPathFragments("dist", options.appProjectRoot),
      main: joinPathFragments(project.sourceRoot, "main.ts"),
      tsConfig: joinPathFragments(options.appProjectRoot, "tsconfig.app.json"),
      assets: [
        {
          glob: "**",
          input: joinPathFragments(options.appProjectRoot, "public"),
          output: "public",
        },
      ],
      clean: true,
    },
  };
}

function getServeConfig(options: NormalizedSchema): TargetConfiguration {
  return {
    executor: "@nx/js:node",
    options: {
      buildTarget: `${options.name}:build`,
      port: options.port,
      watch: false,
      inspect: false,
    },
  };
}

function getWatchConfig(options: NormalizedSchema): TargetConfiguration {
  return {
    executor: "@nx/js:node",
    options: {
      buildTarget: `${options.name}:build`,
      port: options.port,
      watch: true,
      inspect: false,
    },
  };
}

function addProject(tree: Tree, options: NormalizedSchema) {
  const project: ProjectConfiguration = {
    root: options.appProjectRoot,
    sourceRoot: joinPathFragments(options.appProjectRoot, "src"),
    projectType: "application",
    targets: {},
    tags: options.parsedTags,
  };

  project.targets.build = getBuildConfig(project, options);
  project.targets.serve = getServeConfig(options);
  project.targets.watch = getWatchConfig(options);

  addProjectConfiguration(tree, options.name, project, true);
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const packageManager = detectPackageManager();
  const pascalCasedName = toPascalCase(options.appProjectName);

  generateFiles(tree, join(__dirname, "./files"), options.appProjectRoot, {
    ...options,
    tmpl: "",
    name: options.name,
    root: options.appProjectRoot,
    offset: offsetFromRoot(options.appProjectRoot),
    rootTsConfigPath: getRelativePathToRootTsConfig(tree, options.appProjectRoot),
    packageManager,
    baseClassName: pascalCasedName,
    applicationClassName: `${pascalCasedName}Application`,
  });
}

function deleteFiles(tree: Tree, options: NormalizedSchema) {
  if (!options.docker) {
    tree.delete(joinPathFragments(options.appProjectRoot, "Dockerfile"));
    tree.delete(joinPathFragments(options.appProjectRoot, ".dockerignore"));
  }
}

function updateTsConfigOptions(tree: Tree, options: NormalizedSchema) {
  updateJson(tree, `${options.appProjectRoot}/tsconfig.json`, (json) => {
    return {
      ...json,
      compilerOptions: {
        ...json.compilerOptions,
        esModuleInterop: true,
      },
    };
  });
}

async function addLintingToApplication(
  tree: Tree,
  options: NormalizedSchema,
): Promise<GeneratorCallback> {
  const lintTask = await lintProjectGenerator(tree, {
    linter: Linter.EsLint,
    project: options.name,
    tsConfigPaths: [joinPathFragments(options.appProjectRoot, "tsconfig.app.json")],
    eslintFilePatterns: [mapLintPattern(options.appProjectRoot, "ts", false)],
    unitTestRunner: "none",
    skipFormat: true,
    setParserOptionsProject: false,
    rootProject: false,
  });

  return lintTask;
}

export async function applicationGenerator(tree: Tree, schema: ApplicationGeneratorSchema) {
  return await applicationGeneratorInternal(tree, {
    projectNameAndRootFormat: "derived",
    ...schema,
  });
}

export async function applicationGeneratorInternal(tree: Tree, schema: ApplicationGeneratorSchema) {
  const tasks: GeneratorCallback[] = [];
  const options = await normalizeOptions(tree, schema);

  tasks.push(await initGenerator(tree, { ...options, skipFormat: true }));

  addFiles(tree, options);
  deleteFiles(tree, options);
  addProject(tree, options);

  updateTsConfigOptions(tree, options);

  tasks.push(await addLintingToApplication(tree, options));

  if (options.docker) {
    const dockerTask = await setupDockerGenerator(tree, {
      ...options,
      project: options.name,
      skipFormat: true,
    });

    tasks.push(dockerTask);
  }

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(...tasks);
}

export default applicationGenerator;
export const applicationSchematic = convertNxGenerator(applicationGenerator);

async function normalizeOptions(
  host: Tree,
  options: ApplicationGeneratorSchema,
): Promise<NormalizedSchema> {
  const {
    projectName: appProjectName,
    projectRoot: appProjectRoot,
    projectNameAndRootFormat,
  } = await determineProjectNameAndRootOptions(host, {
    name: options.name,
    projectType: "application",
    directory: options.directory,
    projectNameAndRootFormat: options.projectNameAndRootFormat,
    callingGenerator: "nx-loopback4",
  });

  options.projectNameAndRootFormat = projectNameAndRootFormat;

  const parsedTags = options.tags ? options.tags.split(",").map((s) => s.trim()) : [];

  return {
    ...options,
    appProjectName,
    appProjectRoot,
    parsedTags,
    port: options.port ?? 3000,
    docker: options.docker ?? false,
  };
}
