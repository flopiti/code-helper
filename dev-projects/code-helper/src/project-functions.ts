/** 
* This file includes functions related to project path determination and management.
*/
import path from "path";
import { getAllFiles } from './filesystem-functions';

function getProjectPath(project: string): string {
  let projectPath;
  switch (project) {
    case 'natetrystuff-api':
      projectPath = process.env.API_PROJECT_PATH || '';
      break;
    case 'natetrystuff-web':
      projectPath = process.env.WEB_PROJECT_PATH || '';
      break;
    case 'code-helper':
      projectPath = process.env.CODE_HELPER_PATH || '';
      break;
    default:
      projectPath = `${process.env.DIR_PATH}/${project}`;
      break;
  }
  return projectPath;
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
    if (files.find((file) => file.endsWith('next.config.mjs'))){
      return 'next-js';
    }
    if (files.find((file) => file.endsWith('package.json'))){
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
