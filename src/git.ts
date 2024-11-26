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