import {
  addDependenciesToPackageJson,
  convertNxGenerator,
  formatFiles,
  removeDependenciesFromPackageJson,
  Tree,
} from "@nx/devkit";
import { initGenerator as nodeInitGenerator } from "@nx/node";
import { tslibVersion } from "@nx/node/src/utils/versions";
import {
  nxLoopback4Version,
  loopbackBootVersion,
  loopbackCoreVersion,
  loopbackRepositoryVersion,
  loopbackRestVersion,
  loopbackRestExplorerVersion,
  loopbackServiceProxyVersion,
  loopbackBuildVersion,
  loopbackEslintConfigVersion,
  loopbackTestlabVersion,
} from "../../utils/versions";
import type { InitGeneratorSchema } from "./schema";

function updateDependencies(tree: Tree) {
  removeDependenciesFromPackageJson(tree, ["nx-loopback4"], []);

  return addDependenciesToPackageJson(
    tree,
    {
      "@loopback/boot": loopbackBootVersion,
      "@loopback/core": loopbackCoreVersion,
      "@loopback/repository": loopbackRepositoryVersion,
      "@loopback/rest": loopbackRestVersion,
      "@loopback/rest-explorer": loopbackRestExplorerVersion,
      "@loopback/service-proxy": loopbackServiceProxyVersion,
      tslib: tslibVersion,
    },
    {
      "@loopback/build": loopbackBuildVersion,
      "@loopback/eslint-config": loopbackEslintConfigVersion,
      "@loopback/testlab": loopbackTestlabVersion,
      "nx-loopback4": nxLoopback4Version,
    },
  );
}

export async function initGenerator(tree: Tree, schema: InitGeneratorSchema) {
  const initTask = await nodeInitGenerator(tree, {
    ...schema,
    unitTestRunner: "none",
    skipFormat: true,
  });
  const installTask = updateDependencies(tree);
  if (!schema.skipFormat) {
    await formatFiles(tree);
  }

  return async () => {
    await initTask();
    await installTask();
  };
}

export default initGenerator;
export const initSchematic = convertNxGenerator(initGenerator);
