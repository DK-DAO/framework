/* eslint-disable no-await-in-loop */
import { Knex } from 'knex';
import { Connector } from './connector';

export type TTransactionCallback = (tx: Knex.Transaction) => Promise<void>;

export type TErrorCallback = (error: Error) => Promise<void>;

export class Transaction {
  private knexInstance: Knex;

  private transactionProvider: Knex.TransactionProvider;

  private transaction: Knex.Transaction | null = null;

  private stack: TTransactionCallback[] = [];

  private errorStack: TErrorCallback[] = [];

  constructor(dbInstanceName: string = '__default__') {
    this.knexInstance = Connector.getInstance(dbInstanceName);
    this.transactionProvider = this.knexInstance.transactionProvider();
  }

  public static getInstance(dbInstanceName: string = '__default__'): Transaction {
    return new Transaction(dbInstanceName);
  }

  public async get(): Promise<Knex.Transaction> {
    if (this.transaction === null) {
      // Auto start if transaction wasn't started
      this.transaction = await this.transactionProvider();
    }
    return this.transaction;
  }

  public process(proc: TTransactionCallback): Transaction {
    if (proc.constructor.name !== 'AsyncFunction') {
      throw new Error('Callback must be async function');
    }
    this.stack.push(proc);
    return this;
  }

  public catch(errorProc: TErrorCallback): Transaction {
    if (errorProc.constructor.name !== 'AsyncFunction') {
      throw new Error('Error callback must be async function');
    }
    this.errorStack.push(errorProc);
    return this;
  }

  public async exec() {
    try {
      this.transaction = await this.get();
      for (let i = 0; i < this.stack.length; i += 1) {
        await this.stack[i](this.transaction);
      }
      await this.commit();
    } catch (e) {
      for (let i = 0; i < this.stack.length; i += 1) {
        await this.errorStack[i](e as Error);
      }
      await this.rollback();
      throw e;
    }
  }

  public async rollback(): Promise<boolean> {
    if (this.transaction === null) {
      throw new Error('Transaction was not started');
    }
    await this.transaction.rollback();
    if (this.transaction.isCompleted()) {
      this.transaction = null;
      return true;
    }
    throw new Error('Not able to rollback transaction');
  }

  public async commit(): Promise<boolean> {
    if (this.transaction === null) {
      throw new Error('Transaction was not started');
    }
    await this.transaction.commit();
    if (this.transaction.isCompleted()) {
      this.transaction = null;
      return true;
    }
    throw new Error('Not able to commit transaction');
  }
}

export default Transaction;
