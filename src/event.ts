import { EventEmitter } from 'events';
import Singleton from './singleton';

export const FrameworkEvent = Singleton('fw-event', EventEmitter);

if (FrameworkEvent.listenerCount('error') === 0) {
  FrameworkEvent.on('error', (e: Error) => {
    process.stdout.write(`Unknown error occurred: ${e.message}\n`);
  });
}

export default FrameworkEvent;
