/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
import cluster, { Worker } from 'cluster';
import EventEmitter from 'events';

export interface IApplicationPayload {
  name: string;
  payload: string;
  [key: string]: string;
}

export class ClusterApplication extends EventEmitter {
  private workerStorage: Map<string, IApplicationPayload> = new Map();

  private workerMap: Map<number, IApplicationPayload> = new Map();

  private shutdown: boolean = false;

  private autoRestart: boolean = true;

  constructor(restartPolicy: boolean = true) {
    super();
    this.autoRestart = restartPolicy;
  }

  public add(environment: IApplicationPayload): ClusterApplication {
    if (cluster.isMaster) {
      this.emit('new', environment);
    }

    this.workerStorage.set(environment.name, environment);
    return this;
  }

  private restartWorker(pid: number, e?: IApplicationPayload) {
    if (pid < 0 && typeof e !== 'undefined') {
      const curWorker = cluster.fork(e);
      if (typeof curWorker.process.pid !== 'undefined') {
        this.workerMap.set(curWorker.process.pid, e);
      } else {
        this.emit('error', new Error('ClusterApplication::restartWorker() invalid process id'));
      }
      return;
    }
    if (this.workerMap.has(pid)) {
      const environment = this.workerMap.get(pid);
      if (environment) {
        const curWorker = cluster.fork(environment);
        if (typeof curWorker.process.pid !== 'undefined') {
          this.workerMap.set(curWorker.process.pid, environment);
          this.emit('restart', curWorker.process.pid, environment);
          this.workerMap.delete(pid);
        } else {
          this.emit('error', new Error('ClusterApplication::restartWorker() invalid process id'));
        }
        return;
      }
    }
    this.emit('error', new Error('Pid or payload is invalid'));
  }

  private startWorkers() {
    this.workerStorage.forEach((e: IApplicationPayload) => {
      this.restartWorker(-1, e);
    });
  }

  public start() {
    if (cluster.isMaster) {
      this.startWorkers();

      cluster.on('exit', (worker: Worker) => {
        if (!this.shutdown && this.autoRestart) {
          if (typeof worker.process.pid !== 'undefined') {
            this.restartWorker(worker.process.pid);
          } else {
            this.emit('error', new Error('ClusterApplication::start() invalid process id'));
          }
        }
      });

      const handler = (signal: string) => {
        this.emit('exit', signal);
        this.shutdown = true;
        const workerList = Object.values(cluster.workers);
        for (let i = 0; i < workerList.length; i += 1) {
          const worker = workerList[i];
          if (typeof worker !== 'undefined') {
            worker.kill(signal);
          }
        }
        setInterval(() => {
          let isAllDead = true;
          for (let i = 0; i < workerList.length; i += 1) {
            const worker = workerList[i];
            if (typeof worker !== 'undefined') {
              isAllDead &&= worker.isDead();
            }
          }
          if (isAllDead) {
            process.exit(0);
          }
        }, 1000);
      };

      process.on('SIGTERM', handler);
      process.on('SIGINT', handler);
    } else {
      const { payload } = process.env;
      require(payload || '');
    }
  }
}

export default ClusterApplication;
