"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFilesNextJs = exports.getAllFilesSpringBoot = exports.getAllFiles = exports.getGitHeadRef = exports.getFileContent = exports.replaceCode = exports.getProjectsInPath = void 0;
const promises_1 = __importStar(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const apiProjectPath = process.env.API_PROJECT_PATH || '';
const webProjectPath = process.env.WEB_PROJECT_PATH || '';
const codeHelperPath = process.env.CODE_HELPER_PATH || '';
async function getProjectsInPath(dirPath) {
    try {
        const entries = await promises_1.default.readdir(dirPath, { withFileTypes: true });
        const projects = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
        const projectDetails = await Promise.all(projects.map(async (project) => {
            const projectType = await getProjectType(path_1.default.join(dirPath, project));
            return {
                name: project,
                path: path_1.default.join(dirPath, project),
                type: projectType
            };
        }));
        return projectDetails;
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`Directory not found: ${dirPath}`);
        }
        else {
            throw error;
        }
    }
}
exports.getProjectsInPath = getProjectsInPath;
const getProjectType = async (projectPath) => {
    try {
        const files = await getAllFiles(projectPath);
        const pomFile = files.find(file => file.endsWith('pom.xml'));
        if (pomFile) {
            const data = await promises_1.default.readFile(pomFile, 'utf-8');
            if (data.includes('spring-boot-starter-parent')) {
                return 'spring-boot';
            }
        }
        if (files.find(file => file.endsWith('next.config.mjs'))) {
            return 'next-js';
        }
        if (files.find(file => file.endsWith('package.json'))) {
            return 'node-js';
        }
        return 'unknown';
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`File not found: ${projectPath}`);
        }
        else {
            throw error;
        }
    }
};
async function replaceCode(project, files) {
    try {
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
        const allFiles = await getAllFiles(projectPath);
        files = await Promise.all(files.map(async (file) => {
            let localFilePath = allFiles.find((f) => f.includes(file.fileName));
            if (!localFilePath) {
                const fullPath = path_1.default.join(projectPath, file.fileName);
                const directoryPath = path_1.default.dirname(fullPath);
                await ensureDirectoryExists(directoryPath);
                await promises_1.default.writeFile(fullPath, '', { encoding: 'utf8' });
                localFilePath = fullPath;
            }
            return {
                ...file,
                localFilePath
            };
        }));
        if (files && files.length > 0) {
            for (const file of files) {
                await promises_1.default.writeFile(file.localFilePath, file.code, 'utf-8');
            }
            return "Files updated successfully";
        }
        else {
            return null;
        }
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`File or directory not found during file processing.`);
        }
        else {
            throw error;
        }
    }
}
exports.replaceCode = replaceCode;
async function ensureDirectoryExists(directoryPath) {
    try {
        await (0, promises_1.access)(directoryPath);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            await (0, promises_1.mkdir)(directoryPath, { recursive: true });
        }
        else {
            throw error; // Re-throw all other errors to be handled elsewhere
        }
    }
}
async function getFileContent(fileName, project) {
    try {
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
        const allFiles = await getAllFiles(projectPath);
        const filePath = allFiles === null || allFiles === void 0 ? void 0 : allFiles.find(file => file.includes(fileName));
        return filePath ? await promises_1.default.readFile(filePath, 'utf-8') : null;
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`Requested file not found: ${fileName}`);
        }
        else {
            throw error;
        }
    }
}
exports.getFileContent = getFileContent;
async function getGitHeadRef(projectPath) {
    try {
        const headFilePath = path_1.default.join(projectPath, '.git', 'HEAD');
        const headFileContent = await promises_1.default.readFile(headFilePath, 'utf-8');
        if (headFileContent.startsWith('ref: ')) {
            const refPath = headFileContent.slice(5).trim(); // Remove 'ref: ' and trim whitespace
            const branchName = path_1.default.basename(refPath); // Get the branch name
            return branchName;
        }
        else {
            const commitHash = headFileContent.trim();
            return commitHash;
        }
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`Git HEAD file not found in the project path: ${projectPath}`);
        }
        else {
            throw error;
        }
    }
}
exports.getGitHeadRef = getGitHeadRef;
async function getAllFiles(dirPath, arrayOfFiles = []) {
    try {
        const entries = await promises_1.default.readdir(dirPath, { withFileTypes: true });
        for (let entry of entries) {
            const fullPath = path_1.default.join(dirPath, entry.name);
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' || entry.name === '.github') {
                arrayOfFiles = await getAllFiles(fullPath, arrayOfFiles);
            }
            else if (!entry.name.startsWith('.') || entry.name.startsWith('.env') && entry.name !== 'node_modules') {
                arrayOfFiles.push(fullPath);
            }
        }
        return arrayOfFiles;
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`Directory not found during file recursion: ${dirPath}`);
        }
        else {
            throw error;
        }
    }
}
exports.getAllFiles = getAllFiles;
async function getAllFilesSpringBoot(dirPath) {
    console.log('dirPath:', dirPath);
    const files = await getAllFiles(dirPath);
    console.log('files:', files);
    console.log(apiProjectPath);
    const cleanedFiles = files.map((file) => file.replace(apiProjectPath, ""));
    console.log('cleanedFiles:', cleanedFiles);
    return [
        ...cleanedFiles
            .filter((file) => file.startsWith("/natetrystuff/src/main/java/com/natetrystuff/"))
            .map((file) => {
            const match = file.match(/^\/natetrystuff\/src\/main\/java\/com\/natetrystuff\/([^\/]+)(\/|$)/);
            return match ? file : null;
        }),
    ]
        .filter(Boolean);
}
exports.getAllFilesSpringBoot = getAllFilesSpringBoot;
async function getAllFilesNextJs(dirPath) {
    const files = await getAllFiles(dirPath);
    const cleanedFiles = files.map((file) => file.replace(webProjectPath, ""));
    const selectedFiles = [
        ...cleanedFiles
    ]
        .filter(Boolean);
    return selectedFiles.map(file => {
        const parts = file.split(path_1.default.sep);
        if (parts.length >= 3) {
            return path_1.default.join(parts[parts.length - 3], parts[parts.length - 2], parts[parts.length - 1]);
        }
        else {
            return '';
        }
    });
}
exports.getAllFilesNextJs = getAllFilesNextJs;
