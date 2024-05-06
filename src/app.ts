import fs from 'fs/promises';
import path from 'path';
import { readFileSync, writeFileSync } from 'fs';
import express from 'express';
const app = express();
app.use(express.json()); 

app.get('/add-request', (req, res) => {
      processResources(projectPath).then((resources:any) => {
        console.log('All Resources:', JSON.stringify(resources, null, 2));
        buildRestCall('GET', resources[0].name, { description: 'one' }, resources[0].files[1])
        });
  res.status(200).json({ message: 'received' });
});


app.post('/create-new-resource/:id', (req, res) => {
    const id = req.params.id;
    console.log(req.body)
    createNewResource(projectPath, id, req.body.data);
    res.status(200).json({ message: 'received' });
}
);

const PORT = process.env.PORT || 1234;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

async function getAllFiles(dirPath:any, arrayOfFiles : any[]= []) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (let entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            arrayOfFiles = await getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    }
    return arrayOfFiles;
}

async function processResources(projectPath:any) {
    try {
        const files = await getAllFiles(projectPath);
        const cleanedFiles = files.map((file) => file.replace(projectPath, ''));
        const uniqueFolders = [...new Set(cleanedFiles
            .filter(file => file.startsWith('/src/main/java/com/natetrystuff/'))
            .map(file => {
                const match = file.match(/^\/src\/main\/java\/com\/natetrystuff\/([^\/]+)(\/|$)/);
                return match ? match[1] : null;
            })

        )].filter(Boolean).filter((value)=>{
        const isFile = value.includes('.');
        if(isFile){
            return false;
        }
        return true;
    });

        const resources = await Promise.all(uniqueFolders.map(async folder => {
            const resourceFiles = cleanedFiles.filter(file => file.startsWith(`/src/main/java/com/natetrystuff/${folder}/`));
            const controllerFile = resourceFiles.find(file => file.endsWith('Controller.java'));

            let restMethods :any =[];
            if (controllerFile) {
                const data = await fs.readFile(projectPath + controllerFile, 'utf8');
                restMethods = data?.match(/@[A-Za-z]+Mapping(\("[^"]*"\))?/g)?.filter(restCall => {
                    if(restCall.includes('RequestMapping')){
                        console.log('removing', restCall)
                        return false;
                    }
                    return true;
                })
                .filter(Boolean);
            }

            return {
                name: folder,
                files: resourceFiles,
                restMethods: restMethods
            };
        }));
        return resources;
        console.log('All Resources:', JSON.stringify(resources, null, 2));
    } catch (error) {
        console.error('Error processing resources:', error);
    }
}
async function createObjectFile(resourcePath:any, resourceName:any, body:any) {
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
        await writeFileSync(fullPath, content, 'utf8');
        console.log(`File created successfully at: ${fullPath}`);
    } catch (error) {
        console.error('Error creating Java file:', error);
    }
}


async function createNewResource(projectPath: string, resourceName: string, body:any) {
    try {
        console.log('here')
        const resourcePath = path.join(projectPath, '/src/main/java/com/natetrystuff/', resourceName);
        
        try {
            await fs.access(resourcePath);  // Try to access the directory to check if it exists
            console.log('Resource folder already exists at:', resourcePath);
        } catch {
            // If the directory does not exist, access will throw an error which we catch here to then create the directory
            await fs.mkdir(resourcePath, { recursive: true });
            console.log('New resource folder created at:', resourcePath);
            createObjectFile(resourcePath, resourceName, body);
        }
        
    } catch (error) {
        console.error('Error creating new resource folder:', error);
    }
}


interface Options {
    description: 'all' | 'one';
  }
  
function buildRestCall(method: 'GET' | 'POST' | 'DELETE', resource: string, options: Options, controllerFile:any): void {
  
    if (method === 'GET' && options.description === 'all') {
    //   addGetAllRequest(controllerFile, resource);
    }
  
    if (method === 'GET' && options.description === 'one') {
      addGetOneRequest(controllerFile, resource);
    }
  
    if (method === 'POST' && options.description === 'one') {
    //   addPostOneRequest(controllerFile, resource);
    }
  
    if (method === 'DELETE' && options.description === 'one') {
    //   addDeleteOneRequest(controllerFile, resource);
    }
  }
  
function addGetOneRequest(controllerFile: string, resource: string): void {
const MOCK_CODE = `
    @GetMapping("/{id}")
    public ResponseEntity<${resource}> get${resource}ById(@PathVariable Long id) {
    return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }
`;

console.log(resource)
const CODE_READY = MOCK_CODE.replace('resource', resource);

console.log('CODE_READY:', CODE_READY);

console.log('Controller File:', controllerFile)
const lineToAdd = findLineToAddGetOneRequest(controllerFile);
console.log('Line to add:', lineToAdd);

addToFile(controllerFile, lineToAdd, CODE_READY);


}

function findLineToAddGetOneRequest(filePath: string): number {
  const fileContent = readFileSync(projectPath+filePath, 'utf8');
  const lines = fileContent.split('\n');
  const pattern = '@PostMapping';

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(pattern)) {
      return i; 
    }
  }
  return -1;
}

function addToFile(filePath: string, line: number, text: string): void {
    const fileContent = readFileSync(projectPath+filePath, 'utf8');
    const lines = fileContent.split('\n');
  
    // Adjust for 0-indexed array; insert the new content just before the specified line
    lines.splice(line - 1, 0, text);
  
    // Join the array back into a single string with new lines and write it back to the file
    const updatedContent = lines.join('\n');
    writeFileSync(projectPath+filePath, updatedContent, 'utf8');
  }

  const projectPath = '/Users/nathanpieraut/projects/natetrystuff-api/natetrystuff';
