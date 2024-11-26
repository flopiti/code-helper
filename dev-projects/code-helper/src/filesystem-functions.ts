/** 
* This file includes all functions related to filesystem operations.
*/
import fs, { access, mkdir } from "fs/promises";
import path from "path";

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