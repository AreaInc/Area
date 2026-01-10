/**
 * Temporal Worker Entry Point
 *
 * This file starts the Temporal worker that executes workflows and activities.
 * The worker polls the Temporal server for tasks and executes them.
 */

import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './temporal/activities';
import { join } from 'path';

async function run() {
  // Get Temporal server address from environment
  const temporalAddress = process.env.TEMPORAL_ADDRESS || 'localhost:7233';

  console.log(`Connecting to Temporal server at ${temporalAddress}...`);

  // Create connection to Temporal server
  const connection = await NativeConnection.connect({
    address: temporalAddress,
  });

  console.log('Connected to Temporal server');

  // Define the task queue name
  const taskQueue = 'automation-workflows';

  // Create the worker
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

  // Run the worker
  await worker.run();
}

run().catch((err) => {
  console.error('Worker failed:', err);
  process.exit(1);
});
