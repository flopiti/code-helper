import { readFileSync, writeFileSync, constants, PathLike } from "fs";
import fs, {access, mkdir} from "fs/promises";
import path from "path";

const projectPath =
  "/Users/nathanpieraut/projects/natetrystuff-api/natetrystuff";

const apiProjectPath = "/Users/nathanpieraut/projects/natetrystuff-api/natetrystuff";
const webProjectPath = "/Users/nathanpieraut/projects/natetrystuff-web"; 
const codeHelperPath = "/Users/nathanpieraut/projects/code-helper";
interface Options {
  description: "all" | "one";
}

export function buildRestCall(
  method: "GET" | "POST" | "DELETE",
  resource: string,
  options: Options,
  controllerFile: any,
): void {
  if (method === "GET" && options.description === "all") {
    //   addGetAllRequest(controllerFile, resource);
  }

  if (method === "GET" && options.description === "one") {
    addGetOneRequest(controllerFile, resource);
  }

  if (method === "POST" && options.description === "one") {
    //   addPostOneRequest(controllerFile, resource);
  }

  if (method === "DELETE" && options.description === "one") {
    //   addDeleteOneRequest(controllerFile, resource);
  }
}
export async function processResources() {
  try {
    const files = await getAllFiles(projectPath);
    const cleanedFiles = files.map((file) => file.replace(projectPath, ""));
    const uniqueFolders = [
      ...new Set(
        cleanedFiles
          .filter((file) => file.startsWith("/src/main/java/com/natetrystuff/"))
          .map((file) => {
            const match = file.match(
              /^\/src\/main\/java\/com\/natetrystuff\/([^\/]+)(\/|$)/,
            );
            return match ? match[1] : null;
          }),
      ),
    ]
      .filter(Boolean)
      .filter((value) => {
        const isFile = value.includes(".");
        if (isFile) {
          return false;
        }
        return true;
      });
    const resources = await Promise.all(
      uniqueFolders.map(async (folder) => {
        const resourceFiles = cleanedFiles.filter((file) =>
          file.startsWith(`/src/main/java/com/natetrystuff/${folder}/`),
        );
        const controllerFile = resourceFiles.find((file) =>
          file.endsWith("Controller.java"),
        );

        let restMethods: any = [];
        if (controllerFile) {
          const data = await fs.readFile(projectPath + controllerFile, "utf8");
          restMethods = data
            ?.match(/@[A-Za-z]+Mapping(\("[^"]*"\))?/g)
            ?.filter((restCall) => {
              if (restCall.includes("RequestMapping")) {
                return false;
              }
              return true;
            })
            .filter(Boolean);
        }

        const cleanResourcesFiles = resourceFiles.map((file) =>
            file.replace(`/src/main/java/com/natetrystuff/${folder}/`, ""),
        );
        return {
          name: folder,
          files: cleanResourcesFiles,
          restMethods: restMethods,
        };
      }),
    );
    return resources;
  } catch (error) {
    console.error("Error processing resources:", error);
  }
}

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

export async function createNewResource(resourceName: string, body: any) {
  try {
    const resourcePath = path.join(
      projectPath,
      "/src/main/java/com/natetrystuff/",
      resourceName,
    );

    try {
      await fs.access(resourcePath); // Try to access the directory to check if it exists
      console.log("Resource folder already exists at:", resourcePath);
    } catch {
      // If the directory does not exist, access will throw an error which we catch here to then create the directory
      await fs.mkdir(resourcePath, { recursive: true });
      console.log("New resource folder created at:", resourcePath);
      createObjectFile(resourcePath, resourceName, body);
      createRepositoryFile(resourcePath, resourceName);
      createServiceFile(resourcePath, resourceName);
      createControllerFile(resourcePath, resourceName);
    }
  } catch (error) {
    console.error("Error creating new resource folder:", error);
  }
}
export async function AddHasManyRelationshipBase(body: any) {
  const class1 = body.class1;
  const class2 = body.class2;
  const class1Path = `${projectPath}/src/main/java/com/natetrystuff/${class1}/${class1}.java`;
  const lineToAddNewProperty = findLineToAddNewProperty(class1Path);
  addToFile(
    class1Path,
    lineToAddNewProperty,
    `    
    @OneToMany
    @JoinColumn(name = "class1.toLowerCase()_id")
    \tprivate List<${class2}> ${class2.toLowerCase()}s;
    `,
  );
  createNewResource(class2, { propertieName: class1.toLowerCase() });
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

function addGetOneRequest(controllerFile: string, resource: string): void {
  const MOCK_CODE = `
        @GetMapping("/{id}")
        public ResponseEntity<${resource}> get${resource}ById(@PathVariable Long id) {
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
        }
    `;

  const CODE_READY = MOCK_CODE.replace("resource", resource);

  const lineToAdd = findLineToAddGetOneRequest(controllerFile);

  addToFile(`${projectPath}+${controllerFile}`, lineToAdd, CODE_READY);
}

function findLineToAddGetOneRequest(filePath: string): number {
  const fileContent = readFileSync(projectPath + filePath, "utf8");
  const lines = fileContent.split("\n");
  const pattern = "@PostMapping";

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(pattern)) {
      return i;
    }
  }
  return -1;
}

function addToFile(filePath: string, line: number, text: string): void {
  const fileContent = readFileSync(filePath, "utf8");
  const lines = fileContent.split("\n");
  lines.splice(line - 1, 0, text);

  const updatedContent = lines.join("\n");
  writeFileSync(filePath, updatedContent, "utf8");
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

async function createObjectFile(
  resourcePath: any,
  resourceName: any,
  body: any,
) {
  const content = `
package com.natetrystuff.${resourceName};

import lombok.Data;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
@Entity
@Data
public class ${resourceName} {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ${resourceName}Id;

    private String ${body.propertieName};
}
`;

  // The filename for the Java class
  const fileName = `${resourceName}.java`;
  // Full path where the file will be written
  const fullPath = path.join(resourcePath, fileName);

  try {
    await writeFileSync(fullPath, content, "utf8");
    console.log(`File created successfully at: ${fullPath}`);
  } catch (error) {
    console.error("Error creating Java file:", error);
  }
}

async function createServiceFile(resourcePath: any, resourceName: any) {
  const content = `
package com.natetrystuff.${resourceName};

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ${resourceName}Service {

    private final ${resourceName}Repository ${resourceName.toLowerCase()}Repository;

    public ${resourceName}Service(${resourceName}Repository ${resourceName.toLowerCase()}Repository) {
        this.${resourceName.toLowerCase()}Repository = ${resourceName.toLowerCase()}Repository;
    }

    public List<${resourceName}> listAll${resourceName}s() {
        return ${resourceName.toLowerCase()}Repository.findAll();
    }

    public ${resourceName} get${resourceName}ById(Long id) {
        return ${resourceName.toLowerCase()}Repository.findById(id).orElse(null);
    }

    public ${resourceName} create${resourceName}(${resourceName} ${resourceName.toLowerCase()}) {
        return ${resourceName.toLowerCase()}Repository.save(${resourceName.toLowerCase()});
    }

    public ${resourceName} update${resourceName}(Long id, ${resourceName} ${resourceName.toLowerCase()}Details) {
        ${resourceName} existing${resourceName} = ${resourceName.toLowerCase()}Repository.findById(id).orElse(null);
        if (existing${resourceName} != null) {
            existing${resourceName}.set${resourceName}Name(${resourceName.toLowerCase()}Details.get${resourceName}Name());
            return ${resourceName.toLowerCase()}Repository.save(existing${resourceName});
        }
        throw new RuntimeException("${resourceName} not found with id " + id);
    }

    public void delete${resourceName}(Long id) {
        ${resourceName.toLowerCase()}Repository.deleteById(id);
    }
}
`;

  const fileName = `${resourceName}Service.java`;
  const fullPath = path.join(resourcePath, fileName);

  try {
    await writeFileSync(fullPath, content, "utf8");
    console.log(`Service file created successfully at: ${fullPath}`);
  } catch (error) {
    console.error("Error creating service file:", error);
  }
}

async function createControllerFile(resourcePath: any, resourceName: any) {
  const content = `
package com.natetrystuff.${resourceName};

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/${resourceName.toLowerCase()}s")
public class ${resourceName}Controller {

    private final ${resourceName}Service ${resourceName.toLowerCase()}Service;

    public ${resourceName}Controller(${resourceName}Service ${resourceName.toLowerCase()}Service) {
        this.${resourceName.toLowerCase()}Service = ${resourceName.toLowerCase()}Service;
    }

    @GetMapping
    public List<${resourceName}> getAll${resourceName}s() {
        return ${resourceName.toLowerCase()}Service.listAll${resourceName}s();
    }

    @PostMapping
    public ResponseEntity<${resourceName}> add${resourceName}(@RequestBody ${resourceName} ${resourceName.toLowerCase()}) {
        ${resourceName} new${resourceName} = ${resourceName.toLowerCase()}Service.create${resourceName}(${resourceName.toLowerCase()});
        return new ResponseEntity<>(new${resourceName}, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<${resourceName}> get${resourceName}ById(@PathVariable Long id) {
        ${resourceName} ${resourceName.toLowerCase()} = ${resourceName.toLowerCase()}Service.get${resourceName}ById(id);
        if (${resourceName.toLowerCase()} != null) {
            return new ResponseEntity<>(${resourceName.toLowerCase()}, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<${resourceName}> update${resourceName}(@PathVariable Long id, @RequestBody ${resourceName} ${resourceName.toLowerCase()}Details) {
        try {
            ${resourceName} updated${resourceName} = ${resourceName.toLowerCase()}Service.update${resourceName}(id, ${resourceName.toLowerCase()}Details);
            return new ResponseEntity<>(updated${resourceName}, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete${resourceName}(@PathVariable Long id) {
        ${resourceName.toLowerCase()}Service.delete${resourceName}(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
`;

  const fileName = `${resourceName}Controller.java`;
  const fullPath = path.join(resourcePath, fileName);

  try {
    await writeFileSync(fullPath, content, "utf8");
    console.log(`Controller file created successfully at: ${fullPath}`);
  } catch (error) {
    console.error("Error creating controller file:", error);
  }
}

const findLineToAddNewProperty = (filePath: string): number => {
  const fileContent = readFileSync(filePath, "utf8");
  const lines = fileContent.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === "}") {
      return i;
    }
  }

  return -1;
};

async function createRepositoryFile(
  resourcePath: string,
  resourceName: string,
) {
  const content = `
package com.natetrystuff.${resourceName};

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ${resourceName}Repository extends JpaRepository<${resourceName}, Long> {
}
`;

  const fileName = `${resourceName}Repository.java`;
  const fullPath = path.join(resourcePath, fileName);

  try {
    await writeFileSync(fullPath, content, "utf8");
    console.log(`Repository file created successfully at: ${fullPath}`);
  } catch (error) {
    console.error("Error creating repository file:", error);
  }
}


export async function getAllFilesSpringBoot(dirPath: any) {
  const files = await getAllFiles(dirPath);
  const cleanedFiles = files.map((file) => file.replace(projectPath, ""));
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
  const cleanedFiles = files.map((file) => file.replace(projectPath, ""));
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