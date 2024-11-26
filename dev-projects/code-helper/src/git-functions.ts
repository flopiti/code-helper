/** 
* This file includes all functions related to Git operations.
*/
import { promisify } from 'util';
import { exec } from 'child_process';
import path from "path";

const execAsync = promisify(exec);

export async function getGitHeadRef(projectPath: string): Promise<string> {
  try {
    const headFilePath = path.join(projectPath, '.git', 'HEAD');
    const headFileContent = await fs.readFile(headFilePath, 'utf-8');

    if (headFileContent.startsWith('ref: ')) {
      const refPath = headFileContent.slice(5).trim();
      const branchName = path.basename(refPath);
      return branchName;
    } else {
      const commitHash = headFileContent.trim();
      return commitHash;
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`Git HEAD file not found in the project path: ${projectPath}`);
    } else {
      throw error;
    }
  }
}

export async function getGitDiff(project: string): Promise<string> {
  console.log('we are getting the git diff');
  try {
    const projectPath = getProjectPath(project);
    console.log(`projectPath: ${projectPath}`);
    const { stdout, stderr } = await execAsync('git diff', { cwd: projectPath });

    console.log(`stdout: ${stdout}`);
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

export async function sendIt(project: string, commitMessage: string, branchName: string): Promise<void> {
  console.log('Starting the git push process');
  console.log(`Project: ${project}`);
  console.log(`Commit Message: ${commitMessage}`);
  console.log(`Branch: ${branchName}`);
  try {
    const projectPath = getProjectPath(project);
    console.log(`Project path resolved to: ${projectPath}`);

    console.log('Executing git add .');
    const addResult = await execAsync('git add .', { cwd: projectPath });
    console.log(`git add output: ${addResult.stdout}`);

    console.log(`Executing git commit -m "${commitMessage}"`);
    const commitResult = await execAsync(`git commit -m "${commitMessage}"`, { cwd: projectPath });
    console.log(`git commit output: ${commitResult.stdout}`);

    console.log(`Executing git push origin ${branchName}`);
    const pushResult = await execAsync(`git push origin ${branchName}`, { cwd: projectPath });
    console.log(`git push output: ${pushResult.stdout}`);

    console.log('Changes successfully added, committed, and pushed');
  } catch (error: any) {
    console.error(`Error during git push process: ${error.message}`);
    throw new Error(`Failed to send changes: ${error.message}`);
  }
}

export async function switchAndPullMain(project: string): Promise<void> {
  console.log('we are switching and pulling main');
  try {
    const projectPath = getProjectPath(project);
    console.log(`projectPath: ${projectPath}`);
    await execAsync('git switch main', { cwd: projectPath });
    await execAsync('git pull origin main', { cwd: projectPath });
    console.log('Switched to main and pulled the latest updates');
  } catch (error: any) {
    throw new Error(`Failed to switch or pull from main: ${error.message}`);
  }
}

export async function checkoutNewBranch(project: string, branchName: string): Promise<void> {
  console.log(`Creating and switching to a new branch: ${branchName}`);
  try {
    const projectPath = getProjectPath(project);
    console.log(`projectPath: ${projectPath}`);
    await execAsync(`git checkout -b ${branchName}`, { cwd: projectPath });
    console.log(`Created and switched to new branch: ${branchName}`);
  } catch (error: any) {
    throw new Error(`Failed to create new branch: ${branchName}, error: ${error.message}`);
  }
}
