import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { Tree, readProjectConfiguration } from "@nx/devkit";

import { applicationGenerator } from "./application.generator";
import { ApplicationGeneratorSchema } from "./schema";

describe("application generator", () => {
  let tree: Tree;
  const baseOptions: ApplicationGeneratorSchema = {
    name: "test",
  };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it("should run successfully", async () => {
    await applicationGenerator(tree, baseOptions);
    const config = readProjectConfiguration(tree, baseOptions.name);
    expect(config).toBeDefined();
    expect(tree.children(".")).toMatchInlineSnapshot(`
      [
        ".prettierrc",
        "package.json",
        "nx.json",
        "tsconfig.base.json",
        ".prettierignore",
        "test",
        ".eslintrc.json",
        ".eslintignore",
      ]
    `);
    expect(tree.children("test")).toMatchInlineSnapshot(`
      [
        "public",
        "src",
        "tsconfig.app.json",
        "tsconfig.json",
        "project.json",
        ".eslintrc.json",
      ]
    `);
  });

  describe("Docker config", () => {
    it("should run successfully with docker set to false", async () => {
      const options = { ...baseOptions, docker: false };

      await applicationGenerator(tree, options);
      const config = readProjectConfiguration(tree, options.name);

      expect(config).toBeDefined();
      expect(tree.exists(`${options.name}/Dockerfile`)).toBeFalsy();
      expect(tree.exists(`${options.name}/.dockerignore`)).toBeFalsy();
    });

    it("should run successfully with docker set to true", async () => {
      const options = { ...baseOptions, docker: true };

      await applicationGenerator(tree, options);
      const config = readProjectConfiguration(tree, options.name);

      expect(config).toBeDefined();
      expect(tree.exists(`${options.name}/Dockerfile`)).toBeTruthy();
      expect(tree.exists(`${options.name}/.dockerignore`)).toBeTruthy();
    });
  });
});
