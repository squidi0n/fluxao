export { AIJobProcessor } from './ai.jobs';
export { ModerationJobProcessor } from './moderation.jobs';
export { NewsletterJobProcessor } from './newsletter.jobs';
export { ModerationWorker } from './workers/moderation.worker';

export interface QueueJob {
  id: string;
  type: string;
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export class QueueManager {
  static jobs: QueueJob[] = [];
  
  static addJob(job: Omit<QueueJob, 'id' | 'createdAt' | 'updatedAt'>) {
    const newJob: QueueJob = {
      ...job,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.jobs.push(newJob);
    return newJob;
  }

  static getJobs() {
    return this.jobs;
  }

  static getJob(id: string) {
    return this.jobs.find(job => job.id === id);
  }
}