import { execAsync, getProjectPath } from "./functions";

export async function sendIt(project: string, commitMessage: string, branchName: string): Promise<void> {
    try {
      const projectPath = getProjectPath(project);
      await execAsync('git add .', { cwd: projectPath });
      await execAsync(`git commit -m "${commitMessage}"`, { cwd: projectPath });
      await execAsync(`git push origin ${branchName}`, { cwd: projectPath });
    } catch (error: any) {
      console.error(`Error during git push process: ${error.message}`);
      throw new Error(`Failed to send changes: ${error.message}`);
    }
  }

  export async function checkoutNewBranch(project: string, branchName: string): Promise<void> {
    try {
      const projectPath = getProjectPath(project);
      await execAsync(`git checkout -b ${branchName}`, { cwd: projectPath });
    } catch (error: any) {
      throw new Error(`Failed to create new branch: ${branchName}, error: ${error.message}`);
    }
  }

  export async function switchAndPullMain(project: string): Promise<void> {
    try {
      const projectPath = getProjectPath(project);
      await execAsync('git switch main', { cwd: projectPath });
      await execAsync('git pull origin main', { cwd: projectPath });
    } catch (error: any) {
      throw new Error(`Failed to switch or pull from main: ${error.message}`);
    }
  }

export async function getGitDiff(project: string): Promise<string> {
    try {
      const projectPath = getProjectPath(project);
      const { stdout, stderr } = await execAsync('git diff', { cwd: projectPath });
      if (stderr) {
        throw new Error(`Git diff error: ${stderr}`);
      }
      return stdout;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`Git not found or not installed on the system.`);
      } else {
        throw new Error(`Failed to get git diff: ${error.message}`);
      }
    }
  }