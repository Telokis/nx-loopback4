import { addDependenciesToPackageJson, readJson, Tree } from "@nx/devkit";
import { nxLoopback4Version } from "../../utils/versions";
import initGenerator from "./init.generator";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";

describe("init", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it("should add dependencies", async () => {
    const existing = "existing";
    const existingVersion = "1.0.0";
    addDependenciesToPackageJson(
      tree,
      { "nx-loopback4": nxLoopback4Version, [existing]: existingVersion },
      { [existing]: existingVersion },
    );
    await initGenerator(tree, {});
    const packageJson = readJson(tree, "package.json");
    // add @loopback/core
    expect(packageJson.dependencies["@loopback/core"]).toBeDefined();
    // add tslib
    expect(packageJson.dependencies["tslib"]).toBeDefined();
    // move `nx-loopback4` to dev
    expect(packageJson.dependencies["nx-loopback4"]).toBeUndefined();
    expect(packageJson.devDependencies["nx-loopback4"]).toBeDefined();
    // keep existing packages
    expect(packageJson.devDependencies[existing]).toBeDefined();
    expect(packageJson.dependencies[existing]).toBeDefined();
  });
});
