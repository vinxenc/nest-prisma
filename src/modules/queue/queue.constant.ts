import { JobsOptions } from 'bullmq';

export const jobOptions: JobsOptions = {
  removeOnComplete: {
    age: 3600 * 24 * 30,
    count: 10000,
  },
  removeOnFail: {
    age: 3600 * 24 * 30,
    count: 10000,
  },
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
};
