import { fork } from 'node:child_process';
import * as path from 'path';

const processPath = path.resolve(__dirname + "/stock-price.processor");
const child = fork(processPath);

child.on('message', (result) => {
  console.log(`Fibonacci: ${result}`);
});

child.send('FPT');