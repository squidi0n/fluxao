import { ModerationJobProcessor } from '../moderation.jobs';

export class ModerationWorker {
  static async processJob(job: any) {
    switch (job.type) {
      case 'moderate_comment':
        return await ModerationJobProcessor.moderateComment(job.data);
      case 'bulk_moderate':
        return await ModerationJobProcessor.bulkModerate(job.data);
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }
}

export default ModerationWorker;