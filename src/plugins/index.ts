export * from './logger';

export const sleeper = (ms: number): Promise<void> => {
  /* eslint no-promise-executor-return:0 */
  return new Promise((resolve) => setTimeout(resolve, ms));
};
