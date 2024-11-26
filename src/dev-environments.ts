import { exec, ChildProcess } from 'child_process';
import path from 'path';
import { getProjectPath } from './functions';

let apiProcess: ChildProcess | null = null;

export function startApi(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (apiProcess) {
        return reject(new Error('API is already running.'));
      }
      const projectPath = `${getProjectPath('natetrystuff-api')}/natetrystuff`;
      apiProcess = exec(
        'mvn spring-boot:run -Dspring-boot.run.profiles=local',
        { cwd: projectPath },
        (error, stdout, stderr) => {
          if (error) {
            console.error('Error starting API:', error);
            console.error('stderr:', stderr);
            apiProcess = null;
            return reject(error);
          }
          if (stderr) {
            console.error('stderr:', stderr);
          }
          console.log('stdout:', stdout);
          resolve('API started successfully.');
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

  export function compileApi(): Promise<string> {
    return new Promise((resolve, reject) => {
        const projectPath = `${getProjectPath('natetrystuff-api')}/natetrystuff`;
        exec(
            'mvn clean install',
            { cwd: projectPath },
            (error, stdout, stderr) => {
                if (error) {
                    console.error('Error compiling API:', error);
                    console.error('stderr:', stderr);
                    return reject(error);
                }
                if (stderr) {
                    console.error('stderr:', stderr);
                }
                console.log('stdout:', stdout);
                resolve('API compiled successfully.');
            }
        );
    });
}