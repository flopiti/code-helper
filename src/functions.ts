import { readFileSync, writeFileSync, constants, PathLike, Dirent } from "fs";
import fs, { access, mkdir, stat } from "fs/promises";
import path from "path";
import { config } from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

config();

const apiProjectPath = process.env.API_PROJECT_PATH || '';
const webProjectPath = process.env.WEB_PROJECT_PATH || '';
const codeHelperPath = process.env.CODE_HELPER_PATH || '';

const execAsync = promisify(exec);

function getProjectPath(project: string): string {
  let projectPath;
  switch (project) {
    case 'natetrystuff-api':
      projectPath = apiProjectPath;
      break;
    case 'natetrystuff-web':
      projectPath = webProjectPath;
      break;
    case 'code-helper':
      projectPath = codeHelperPath;
      break;
    default:
      projectPath = `${process.env.DIR_PATH}/${project}`;
      break;
  }
  return projectPath;
}

// New function to get all file descriptions by counting FEAT and DESC comments
export async function getAllFileDescriptions() {
  try {
    const dirPath = process.env.DIR_PATH;
    if (!dirPath) {
      throw new Error('Environment variable DIR_PATH is not set');
    }

    const allFiles = await getAllFiles(dirPath);
    const fileDescriptions = [];

    for (const filename of allFiles) {
      const content = await fs.readFile(filename, 'utf-8');

      const featComments = (content.match(/\/\/FEAT/g) || []).length;
      const descComments = (content.match(/\/\/DESC/g) || []).length;

      fileDescriptions.push({
        id: path.basename(filename, path.extname(filename)),
        fileName: path.basename(filename),
        FEAT: featComments,
        DESC: descComments
      });
    }

    return fileDescriptions;
  } catch (error) {
    console.error('Error processing file descriptions:', error);
    throw error;
  }
}

export async function getProjectsInPath(dirPath: string) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const projects = entries
      .filter((entry: Dirent) => entry.isDirectory())
      .map((entry: Dirent) => entry.name);

    const projectDetails = await Promise.all(
      projects.map(async (project) => {
        const projectType = await getProjectType(path.join(dirPath, project));
        return {
          name: project,
          path: path.join(dirPath, project),
          type: projectType,
        };
      })
    );
    return projectDetails;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`Directory not found: ${dirPath}`);
    } else {
      throw error;
    }
  }
}

const getProjectType = async (projectPath: string) => {
  try {
    const files = await getAllFiles(projectPath);
    const pomFile = files.find((file) => file.endsWith('pom.xml'));
    if (pomFile) {
      const data = await fs.readFile(pomFile, 'utf-8');
      if (data.includes('spring-boot-starter-parent')) {
        return 'spring-boot';
      }
    }
    if (files.find((file) => file.endsWith('next.config.mjs')));
      return 'next-js';
    }
    if (files.find((file) => file.endsWith('package.json')));
      return 'node-js';
    }
    return 'unknown';
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${projectPath}`);
    } else {
      throw error;
    }
  }
};

export async function replaceCode(project: string, files: any[]): Promise<string | null> {
  try {
    const projectPath = getProjectPath(project);
    const allFiles = await getAllFiles(projectPath);
    files = await Promise.all(
      files.map(async (file) => {
        let localFilePath = allFiles.find((f: any) => f.includes(file.fileName));
        if (!localFilePath) {
          const fullPath = path.join(projectPath, file.fileName);
          const directoryPath = path.dirname(fullPath);
          await ensureDirectoryExists(directoryPath);
          await fs.writeFile(fullPath, '', { encoding: 'utf8' });
          localFilePath = fullPath;
        }
        return {
          ...file,
          localFilePath,
        };
      })
    );
    if (files && files.length > 0) {
      for (const file of files) {
        await fs.writeFile(file.localFilePath, file.code, 'utf-8');
      }
      return 'Files updated successfully';
    } else {
      return null;
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`File or directory not found during file processing.`);
    } else {
      throw error;
    }
  }
}

async function ensureDirectoryExists(directoryPath: PathLike) {
  try {
    await access(directoryPath);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await mkdir(directoryPath, { recursive: true });
    } else {
      throw error;
    }
  }
}

export async function getFileContent(fileName: string, project: string): Promise<string | null> {
  try {
    const projectPath = getProjectPath(project);
    const allFiles = await getAllFiles(projectPath);
    const filePath = allFiles?.find((file) => file.includes(fileName));
    return filePath ? await fs.readFile(filePath, 'utf-8') : null;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`Requested file not found: ${fileName}`);
    } else {
      throw error;
    }
  }
}

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

export async function getAllFiles(dirPath: any, arrayOfFiles: any[] = []) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (let entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (
        entry.isDirectory() &&
        (!entry.name.startsWith('.') && entry.name !== 'node_modules') ||
        entry.name === '.github'
      ) {
        arrayOfFiles = await getAllFiles(fullPath, arrayOfFiles);
      } else if (
        (!entry.name.startsWith('.') || entry.name.startsWith('.env')) &&
        entry.name !== 'node_modules'
      ) {
        arrayOfFiles.push(fullPath);
      }
    }
    return arrayOfFiles;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`Directory not found during file recursion: ${dirPath}`);
    } else {
      throw error;
    }
  }
}

export async function getAllFilesSpringBoot(dirPath: any) {
  const files = await getAllFiles(dirPath);
  const cleanedFiles = files.map((file) => file.replace(apiProjectPath, ''));
  return [
    ...cleanedFiles
      .filter((file) => file.startsWith('/natetrystuff/src/main/java/com/natetrystuff/'))
      .map((file) => {
        const match = file.match(
          /^\/natetrystuff\/src\/main\/java\/com\/natetrystuff\/([^\/]+)(\/|$)/
        );
        return match ? file : null;
      }),
  ].filter(Boolean);
}

export async function getAllFilesNextJs(dirPath: any) {
  const files = await getAllFiles(dirPath);
  const cleanedFiles = files.map((file) => file.replace(webProjectPath, ''));
  const selectedFiles = [...cleanedFiles].filter(Boolean);
  return selectedFiles;
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
  console.log('we are adding, committing, and pushing changes');
  try {
    const projectPath = getProjectPath(project);
    console.log(`projectPath: ${projectPath}`);
    await execAsync('git add .', { cwd: projectPath });
    await execAsync(`git commit -m "${commitMessage}"`, { cwd: projectPath });
    await execAsync(`git push origin ${branchName}`, { cwd: projectPath });
    console.log('Changes added, committed, and pushed successfully');
  } catch (error: any) {
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

export async function findDescComments(dirPath: string) {
  try {
    const allFiles = await getAllFiles(dirPath);
    const descCommentsFiles: { filename: string, comment: string }[] = [];

    for (let file of allFiles) {
      const fileContents = await fs.readFile(file, 'utf-8');
      const lines = fileContents.split('\n');
      for (let line of lines) {
        const commentIndex = line.indexOf('//DESC:');
        if (commentIndex !== -1) {
          const comment = line.substring(commentIndex + 7).trim();

          // Cleaning filename based on project type
          let cleanedFileName = file;
          if (dirPath.includes('spring-boot')) {
            cleanedFileName = file.replace(apiProjectPath, '');
          } else if (dirPath.includes('next-js') || dirPath.includes('node-js')) {
            cleanedFileName = file.replace(webProjectPath, '');
          }

          descCommentsFiles.push({ filename: cleanedFileName, comment });
        }
      }
    }

    return descCommentsFiles;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`Error finding files or comments in: ${dirPath}, error: ${error.message}`);
    } else {
      throw error;
    }
  }
}
