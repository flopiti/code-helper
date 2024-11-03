import { readFileSync, writeFileSync, constants, PathLike, Dirent } from "fs";
import fs, { access, mkdir, stat } from "fs/promises";
import path from "path";
import { config } from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import { dir } from "console";

config();

const apiProjectPath = process.env.API_PROJECT_PATH || '';
const webProjectPath = process.env.WEB_PROJECT_PATH || '';
const codeHelperPath = process.env.CODE_HELPER_PATH || '';

const execAsync = promisify(exec);

// Other existing code...

export async function addVectors(vectors: any[]) {
  try {
    const pc = new Pinecone({ apiKey: '24353792-dce7-4d9b-820f-9d30202e3669' });
    const index = pc.index('quickstart');
    await index.namespace('ns1').upsert(vectors);
  } catch (error) {
    console.error('Error adding vectors:', error);
    throw error;
  }
}

// Other existing functions...
