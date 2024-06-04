import { readFileSync, writeFileSync, constants, PathLike } from "fs";
import fs, {access, mkdir} from "fs/promises";
import path from "path";

const apiProjectPath = "/Users/nathanpieraut/projects/natetrystuff-api/natetrystuff";
const webProjectPath = "/Users/nathanpieraut/projects/natetrystuff-web"; 
const codeHelperPath = "/Users/nathanpieraut/projects/code-helper";




export async function getProjectsInPath() {
  const dirPath = '/Users/nathanpieraut/projects/';
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const projects = entries.filter(entry => entry.isDirectory()).map(dir => dir.name);
  const projectDetails = await Promise.all(projects.map(async project => {
    const projectType = await getProjectType(dirPath + project);

    return {
      name: project,
      path: dirPath + project,
      type: projectType
    }
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



export async function replaceCode( project:string, files:any[]): Promise<string | null> {
  let allFiles:any;
  if(project === 'natetrystuff-api') {
    allFiles = await getAllFiles(apiProjectPath);
  }
  if(project === 'natetrystuff-web') {
    allFiles = await getAllFiles(webProjectPath);
  }
  if(project === 'code-helper') {
    allFiles = await getAllFiles("/Users/nathanpieraut/projects/code-helper");
  }


  files = await Promise.all(files.map(
     async (file:any)=>{
      let localFilePath = allFiles.find((f:any)=>f.includes(file.fileName));
      if(!localFilePath) {
        // create the file
        if(project === 'natetrystuff-api') {

          
        }
        if(project === 'natetrystuff-web') {
          //create a new that file with the web project path and the file name
          const fullPath = path.join(webProjectPath, file.fileName);

          const directoryPath = path.dirname(fullPath);
          console.log('Directory path:', directoryPath);
          async function ensureDirectoryExists(directoryPath: PathLike) {
            try {
              await access(directoryPath);
              console.log('Directory exists:', directoryPath);
            } catch (error) {
              console.log('Directory does not exist, creating:', directoryPath);
              await mkdir(directoryPath, { recursive: true });
              console.log('Directory created:', directoryPath);
            }
          }
          await ensureDirectoryExists(directoryPath);
          console.log("Creating file:", fullPath);
          fs.writeFile(fullPath, '', { encoding: 'utf8' });
          localFilePath = fullPath;
        }
        if(project === 'code-helper') {

        }

      }
      return {
        ...file,
        localFilePath
      }
    }
  ));

  if (files && files.length > 0) {
    for (const file of files) {
      // console.log("Reading file:", file);
      await fs.writeFile(file.localFilePath, file.code, 'utf-8');
    }
    return "Files updated successfully";
  } else {
    return null;
  }
}

export async function getFileContent(fileName: string, project:string): Promise<string | null> {
  // console.log("Getting file content for:", fileName);
  let allFiles;
  if(project === 'natetrystuff-api') {
    allFiles = await getAllFiles(apiProjectPath);
  }
  if(project === 'natetrystuff-web') {
    allFiles = await getAllFiles(webProjectPath);
  }
  if(project === 'code-helper') {
    allFiles = await getAllFiles(codeHelperPath);
  }
  const filePath = allFiles?.find(file => file.includes(fileName));
  if (filePath) {
    console.log("Reading file:", filePath)
    return await fs.readFile(filePath, 'utf-8');
  } else {
    return null;
  }
}




export async function getAllFiles(dirPath: any, arrayOfFiles: any[] = []) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (let entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' || entry.name === '.github') {
      arrayOfFiles = await getAllFiles(fullPath, arrayOfFiles);
    } else if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
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
    ,
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