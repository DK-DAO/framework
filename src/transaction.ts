import { Knex } from 'knex';
import { Connector } from './connector';

export class Transaction {
  private knexInstance: Knex;

  private transaction: Knex.Transaction | null = null;

  constructor(dbInstanceName: string = '__default__') {
    this.knexInstance = Connector.getInstance(dbInstanceName);
  }

  public static getInstance(dbInstanceName: string = '__default__'): Transaction {
    return new Transaction(dbInstanceName);
  }

  public async get(): Promise<Knex.Transaction> {
    if (this.transaction === null) {
      // Auto start if transaction wasn't started
      this.transaction = await this.knexInstance.transaction();
    }
    return this.transaction;
  }

  public async safeExec(callback: (tx: Knex.Transaction) => Promise<void>) {
    if (this.transaction === null) {
      throw new Error('Transaction was not started');
    }
    if (callback.constructor.name !== 'AsyncFunction') {
      throw new Error('Callback must be async function');
    }
    try {
      await callback(this.transaction);
      await this.commit();
    } catch (e) {
      // Rollback before
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
    throw new Error('Not able to rollback given transaction');
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
