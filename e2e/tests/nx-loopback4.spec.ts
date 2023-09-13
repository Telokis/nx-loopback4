import { execSync } from "child_process";
import { join, dirname } from "path";
import { mkdirSync, rmSync, statSync, writeFileSync, readdirSync } from "fs";

describe("nx-loopback4", () => {
  let projectDirectory: string;

  beforeAll(() => {
    projectDirectory = createTestProject();

    // The plugin has been built and published to a local registry in the jest globalSetup
    // Install the plugin built with the latest source code into the test repo
    execSync(`npm install nx-loopback4@e2e`, {
      cwd: projectDirectory,
      stdio: "inherit",
      env: process.env,
    });
  });

  afterAll(() => {
    // Cleanup the test project
    // rmSync(projectDirectory, {
    //   recursive: true,
    //   force: true,
    // });
  });

  it("should be installed", () => {
    // npm ls will fail if the package is not installed properly
    const output = execSync("npm ls nx-loopback4", {
      cwd: projectDirectory,
    });

    expect(output.toString("utf-8").includes("-- nx-loopback4@")).toBeTruthy();
  });

  it("should create a default application", () => {
    // npm ls will fail if the package is not installed properly
    execSync("npx nx generate nx-loopback4:application myTest", {
      cwd: projectDirectory,
    });

    expect(statSync(join(projectDirectory, "apps/my-test/project.json")).isFile()).toBeTruthy();

    expect(readdirSync(join(projectDirectory, "apps/my-test"))).toMatchInlineSnapshot(`
      [
        ".eslintrc.json",
        "project.json",
        "public",
        "src",
        "tsconfig.app.json",
        "tsconfig.json",
        "__tests__",
      ]
    `);
    expect(readdirSync(join(projectDirectory, "apps/my-test/src"))).toMatchInlineSnapshot(`
      [
        "application.ts",
        "controllers",
        "datasources",
        "main.ts",
        "migrate.ts",
        "models",
        "openapi-spec.ts",
        "repositories",
        "sequence.ts",
      ]
    `);
    expect(readdirSync(join(projectDirectory, "apps/my-test/public"))).toMatchInlineSnapshot(`
      [
        "index.html",
      ]
    `);
    expect(readdirSync(join(projectDirectory, "apps/my-test/src/controllers")))
      .toMatchInlineSnapshot(`
      [
        "index.ts",
        "ping.controller.ts",
        "README.md",
      ]
    `);
  });

  it("should build the default application", () => {
    // npm ls will fail if the package is not installed properly
    execSync("npx nx run myTest:build", {
      cwd: projectDirectory,
    });

    expect(statSync(join(projectDirectory, "dist/apps/my-test")).isDirectory()).toBeTruthy();

    expect(readdirSync(join(projectDirectory, "dist/apps/my-test"))).toMatchInlineSnapshot(`
      [
        "package.json",
        "public",
        "src",
        "tsconfig.tsbuildinfo",
      ]
    `);
    expect(readdirSync(join(projectDirectory, "dist/apps/my-test/src"))).toMatchInlineSnapshot(`
      [
        "application.d.ts",
        "application.js",
        "application.js.map",
        "controllers",
        "main.d.ts",
        "main.js",
        "main.js.map",
        "migrate.d.ts",
        "migrate.js",
        "migrate.js.map",
        "openapi-spec.d.ts",
        "openapi-spec.js",
        "openapi-spec.js.map",
        "sequence.d.ts",
        "sequence.js",
        "sequence.js.map",
      ]
    `);
    expect(readdirSync(join(projectDirectory, "dist/apps/my-test/public"))).toMatchInlineSnapshot(`
      [
        "index.html",
      ]
    `);
    expect(readdirSync(join(projectDirectory, "dist/apps/my-test/src/controllers")))
      .toMatchInlineSnapshot(`
      [
        "index.d.ts",
        "index.js",
        "index.js.map",
        "ping.controller.d.ts",
        "ping.controller.js",
        "ping.controller.js.map",
      ]
    `);
  });
});

/**
 * Creates a test project with create-nx-workspace and installs the plugin
 * @returns The directory where the test project was created
 */
function createTestProject() {
  const projectName = "test-project";
  const projectDirectory = join(__dirname, "..", "tmp", projectName);

  // Ensure projectDirectory is empty
  rmSync(projectDirectory, {
    recursive: true,
    force: true,
  });
  mkdirSync(dirname(projectDirectory), {
    recursive: true,
  });

  execSync(
    `npx --yes create-nx-workspace@latest ${projectName} --preset apps --no-nxCloud --no-interactive`,
    {
      cwd: dirname(projectDirectory),
      stdio: "inherit",
      env: process.env,
    },
  );

  // Update nx configuration to use apps and libs directories
  const nxJsonPath = join(projectDirectory, "nx.json");
  const content = require(nxJsonPath); // eslint-disable-line

  writeFileSync(
    nxJsonPath,
    JSON.stringify(
      {
        ...content,
        workspaceLayout: {
          projectNameAndRootFormat: "derived",
          appsDir: "apps",
          libsDir: "libs",
        },
      },
      null,
      2,
    ),
  );

  console.log(`Created test project in "${projectDirectory}"`);

  return projectDirectory;
}
