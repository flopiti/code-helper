import { execAsync, getProjectPath } from "./functions";
import { promises as fs } from 'fs';
import path from 'path';
import fg from 'fast-glob';

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
        console.log('Switched and pulled from main'); 
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

export async function getAllMainFiles(project: string): Promise<string[]> {
    await switchAndPullMain(project);

    const projectPath = getProjectPath(project);
    const gitignorePath = path.join(projectPath, '.gitignore');
    let gitignorePatterns: string[] = [];

    console.log(gitignorePath);

    try {
        const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
        gitignorePatterns = gitignoreContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'));
    } catch (error) {
        console.warn(`.gitignore file not found or could not be read: ${error instanceof Error ? error.message : error}`);
    }

    console.log(gitignorePatterns);

    try {
        const files: string[] = await fg('**/*', {
            cwd: projectPath,
            ignore: gitignorePatterns.map(pattern => pattern.startsWith('/') ? pattern.slice(1) : pattern),
            onlyFiles: true,
            followSymbolicLinks: false,
            deep: 10,
            dot: true
        });
        const allFiles = files.map((file: string) => path.join(projectPath, file));
        console.log(allFiles);
        return allFiles;
    } catch (error) {
        throw new Error(`Failed to retrieve files: ${error instanceof Error ? error.message : error}`);
    }
}




