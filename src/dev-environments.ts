import { exec, ChildProcess } from 'child_process';
import path from 'path';
import { getProjectPath } from './functions';

let apiProcess: ChildProcess | null = null;

export function startApi(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (apiProcess) {
      return reject(new Error('API is already running.'));
    }
    const projectPath = getProjectPath('natetrystuff-api');
    apiProcess = exec(
      'mvn spring-boot:run -Dspring-boot.run.profiles=local',
      { cwd: projectPath },
      (error, stdout, stderr) => {
        if (error) {
          apiProcess = null;
          return reject(error);
        }
        resolve(stdout ? stdout : stderr);
      }
    );
    resolve('API started successfully.');
  });
}

export function stopApi(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!apiProcess) {
      return reject(new Error('API is not running.'));
    }
    apiProcess.kill('SIGTERM');
    apiProcess = null;
    resolve('API stopped successfully.');
  });
}

export function checkApiStatus(): string {
  return apiProcess ? 'API is running.' : 'API is not running.';
}
