import { Injectable } from '@nestjs/common';
import { fork } from 'node:child_process';
import * as path from 'path';

@Injectable()
export class ChildProcessService {
  async getPrice(code: string): Promise<number> {
    const processPath = path.resolve(`${__dirname}/childs/stock-price.child`);

    return new Promise((resolve, reject) => {
      const child = fork(processPath);
      child.on('message', (result: number) => {
        // child.kill('SIGINT');
        resolve(result);
      });

      child.on('error', (error: Error) => {
        reject(error);
      });

      child.send(code);
    });
  }
}
