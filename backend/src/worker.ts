import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './temporal/activities';
import { join } from 'path';

async function run() {
  const temporalAddress = process.env.TEMPORAL_ADDRESS || 'localhost:7233';

  console.log(`Connecting to Temporal server at ${temporalAddress}...`);

  const connection = await NativeConnection.connect({
    address: temporalAddress,
  });

  console.log('Connected to Temporal server');

  const taskQueue = 'automation-workflows';

  const worker = await Worker.create({
    connection,
    namespace: 'default',
    taskQueue,
    workflowsPath: require.resolve('./temporal/workflows/automation.workflow'),
    activities,
    maxConcurrentActivityTaskExecutions: 10,
    maxConcurrentWorkflowTaskExecutions: 10,
  });

  console.log(`Temporal worker started on task queue: ${taskQueue}`);
  console.log('Listening for workflow tasks...');

  await worker.run();
}

run().catch((err) => {
  console.error('Worker failed:', err);
  process.exit(1);
});
