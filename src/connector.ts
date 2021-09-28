import knex, { Knex } from 'knex';
import { EventEmitter } from 'events';
import { URL } from 'url';

export class Connector {
  private static dbInstance: { [key: string]: Knex<any, any[]> } = {};

  private static pingLock: boolean = false;

  public static pingEvent: EventEmitter;

  public static connect(dbConfig: Knex.Config, instanceName: string = '__default__'): Knex<any, any[]> {
    if (!Connector.dbInstance[instanceName]) {
      Connector.dbInstance[instanceName] = knex(dbConfig);
    }
    return Connector.getInstance(instanceName);
  }

  public static parseURL(inputURL: string): Knex.Config {
    const myURL = new URL(inputURL);
    return {
      client: myURL.protocol.replace(/[:]/gi, ''),
      connection: {
        host: myURL.hostname,
        port: parseInt(myURL.port, 10),
        user: myURL.username,
        password: myURL.password,
        database: myURL.pathname.replace(/[/\s]/gi, ''),
      },
    };
  }

  public static connectByUrl(inputURL: string, instanceName: string = '__default__'): Knex<any, any[]> {
    return Connector.connect(Connector.parseURL(inputURL), instanceName);
  }

  public static getInstance(instanceName: string = '__default__'): Knex<any, any[]> {
    return Connector.dbInstance[instanceName];
  }

  public static startPing(interval: number = 300000) {
    if (!Connector.pingLock) {
      Connector.pingEvent = new EventEmitter();
      // Handle unexpected error
      Connector.pingEvent.on('error', (e: Error) => {
        process.stdout.write(`Unknown error occurred: ${e.message}\n`);
      });
      setInterval(() => {
        const instanceNames = Object.keys(Connector.dbInstance);
        instanceNames.forEach((instanceName: string) => {
          Connector.ping(instanceName).then(
            (result: any) => {
              Connector.pingEvent.emit('ping', instanceName, result);
            },
            (error: any) => {
              Connector.pingEvent.emit('error', instanceName, error);
            },
          );
        });
      }, interval);
      // No more new instance of ping
      Connector.pingLock = true;
    }
  }

  private static async ping(instance: string): Promise<string | undefined> {
    const k: Knex<any, any[]> = Connector.getInstance(instance);
    const executeSuccess = await k.select(k.raw('NOW() AS `pingAt`'));
    return executeSuccess.pop();
  }
}

export default Connector;
