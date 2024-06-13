import { readFileSync, writeFileSync, constants, PathLike } from "fs";
import fs, { access, mkdir } from "fs/promises";
import path from "path";

const apiProjectPath = "/Users/nathanpieraut/projects/natetrystuff-api/natetrystuff";
const webProjectPath = "/Users/nathanpieraut/projects/natetrystuff-web";
const codeHelperPath = "/Users/nathanpieraut/projects/code-helper";

export async function getProjectsInPath() {
  const dirPath = '/Users/nathanpieraut/projects/';
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const projects = entries.filter(entry => entry.isDirectory()).map(dir => dir.name);
  const projectDetails = await Promise.all(projects.map(async project => {
    const projectType = await getProjectType(path.join(dirPath, project));
    return {
      name: project,
      path: path.join(dirPath, project),
      type: projectType
    };
  }));
  return projectDetails;
}

const getProjectType = async (projectPath: string) => {
  const files = await getAllFiles(projectPath);

  const pomFile = files.find(file => file.endsWith('pom.xml'));
  if (pomFile) {
    const data = await fs.readFile(pomFile, 'utf-8');
    if (data.includes('spring-boot-starter-parent')) {
      return 'spring-boot';
    }
  }
  if(files.find(file => file.endsWith('next.config.mjs'))) {
    return 'next-js';
  }
  if((files.find(file => file.endsWith('package.json')))){
    return 'node-js';
  }
}

export async function replaceCode(project: string, files: any[]): Promise<string | null> {
  let projectPath;
  switch(project) {
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
      throw new Error('Unknown project');
  }
  const allFiles = await getAllFiles(projectPath);

  files = await Promise.all(files.map(async (file) => {
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
      localFilePath
    };
  }));

  if (files && files.length > 0) {
    for (const file of files) {
      await fs.writeFile(file.localFilePath, file.code, 'utf-8');
    }
    return "Files updated successfully";
  } else {
    return null;
  }
}

async function ensureDirectoryExists(directoryPath: PathLike) {
  try {
    await access(directoryPath);
  } catch (error) {
    await mkdir(directoryPath, { recursive: true });
  }
}

export async function getFileContent(fileName: string, project: string): Promise<string | null> {
  let projectPath;
  switch(project) {
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
      throw new Error('Unknown project');
  }
  const allFiles = await getAllFiles(projectPath);
  const filePath = allFiles?.find(file => file.includes(fileName));
  return filePath ? await fs.readFile(filePath, 'utf-8') : null;
}

export async function getAllFiles(dirPath: any, arrayOfFiles: any[] = []) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (let entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' || entry.name === '.github') {
      arrayOfFiles = await getAllFiles(fullPath, arrayOfFiles);
    } else if (!entry.name.startsWith('.') || entry.name.startsWith('.env') && entry.name !== 'node_modules') {
      arrayOfFiles.push(fullPath);
    }
  }
  return arrayOfFiles;
}

export async function getAllFilesSpringBoot(dirPath: any) {
  const files = await getAllFiles(dirPath);
  const cleanedFiles = files.map((file) => file.replace(apiProjectPath, ""));
  const selectedFiles = [
    ...cleanedFiles
      .filter((file) => file.startsWith("/src/main/java/com/natetrystuff/"))
      .map((file) => {
        const match = file.match(
          /^\/src\/main\/java\/com\/natetrystuff\/([^\/]+)(\/|$)/,
        );
        return match ? file : null;
      }),
  ]
  .filter(Boolean);
  return selectedFiles.map(file => path.basename(file));
}

export async function getAllFilesNextJs(dirPath: any) {
  const files = await getAllFiles(dirPath);
  const cleanedFiles = files.map((file) => file.replace(webProjectPath, ""));
  const selectedFiles = [
    ...cleanedFiles
  ]
  .filter(Boolean);
  return selectedFiles.map(file => {
    const parts = file.split(path.sep);
    if (parts.length >= 3) {
      return path.join(parts[parts.length - 3], parts[parts.length - 2], parts[parts.length - 1]);
    } else {
      return '';
    }
  });
}