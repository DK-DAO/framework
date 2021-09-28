import { Knex } from 'knex';
import { ModelMySQL } from './model-mysql';
import { IPagination, IResponse, IModelCondition } from './interfaces';
import { Pagination } from './pagination';

export class ModelMysqlBasic<T> extends ModelMySQL {
  protected basicQuery?(): Knex.QueryBuilder;

  // eslint-disable-next-line class-methods-use-this
  protected attachConditions(ik: Knex.QueryBuilder, conditions?: IModelCondition<T>[]): Knex.QueryBuilder {
    if (typeof conditions !== 'undefined' && Array.isArray(conditions) && conditions.length > 0) {
      for (let i = 0; i < conditions.length; i += 1) {
        const { field, operator, value } = conditions[i];
        if (operator) {
          ik.where(field as string, operator, value);
        } else {
          ik.where(field as string, value);
        }
      }
    }
    return ik;
  }

  public async create(data: Partial<T>): Promise<T | undefined> {
    await this.getDefaultKnex().insert(data);
    if (typeof this.basicQuery === 'undefined') {
      throw Error('Basic query was undefined');
    }
    return this.basicQuery().whereRaw('`id`=LAST_INSERT_ID()').first();
  }

  public async update(data: Partial<T>, conditions?: IModelCondition<T>[]) {
    await this.attachConditions(this.getDefaultKnex().update(data), conditions);
  }

  public async forceUpdate(data: Partial<T>, conditions?: IModelCondition<T>[]) {
    if (typeof this.basicQuery === 'undefined') {
      throw Error('Basic query was undefined');
    }
    const [record] = await this.attachConditions(this.basicQuery(), conditions).limit(1);
    if (typeof record === 'undefined' || typeof conditions === 'undefined') {
      await this.create(data);
    } else {
      await this.update(data, conditions);
    }
  }

  public async get(conditions?: IModelCondition<T>[]): Promise<T[]> {
    if (typeof this.basicQuery === 'undefined') {
      throw Error('Basic query was undefined');
    }
    return this.attachConditions(this.basicQuery(), conditions);
  }

  public async isExist(key: keyof T, value: any): Promise<boolean> {
    const [result] = await this.getDefaultKnex().count({ count: '*', as: 'total' }).where(key, value);
    return result && result.total > 0;
  }

  public async isNotExist(key: keyof T, value: any): Promise<boolean> {
    return !(await this.isExist(key, value));
  }

  /**
   * Get list of records by simple conditions
   */
  // eslint-disable-next-line class-methods-use-this
  protected async getListByCondition<V>(
    query: Knex.QueryBuilder,
    pagination: IPagination = { offset: 0, limit: 20, order: [] },
  ): Promise<IResponse<V>> {
    return {
      success: true,
      result: await Pagination.pagination<V>(query, pagination),
    };
  }
}

export default ModelMysqlBasic;
