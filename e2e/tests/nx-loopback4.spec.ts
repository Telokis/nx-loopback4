import { execSync } from "child_process";
import { join, dirname } from "path";
import { mkdirSync, rmSync, statSync, writeFileSync } from "fs";

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
