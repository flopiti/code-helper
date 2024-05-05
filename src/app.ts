import fs from 'fs/promises';
import path from 'path';

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

        console.log('All Resources:', JSON.stringify(resources, null, 2));
    } catch (error) {
        console.error('Error processing resources:', error);
    }
}

const projectPath = '/Users/nathanpieraut/projects/natetrystuff-api/natetrystuff';
processResources(projectPath);
