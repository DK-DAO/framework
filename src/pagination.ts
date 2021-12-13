import { Knex } from 'knex';
import { IPagination, IRecordList } from './interfaces';
import { Validator } from './validator';

export class Pagination {
  public static async countTotal(knexQuery: Knex.QueryBuilder<any, any>): Promise<number> {
    const totalResult = await knexQuery.clone().clearSelect().count('* as total').first();
    return typeof totalResult === 'undefined' || !totalResult.total ? 0 : totalResult.total;
  }

  public static async pagination<T>(
    knexQuery: Knex.QueryBuilder<any, any>,
    pagination: IPagination,
  ): Promise<IRecordList<T>> {
    const total = await Pagination.countTotal(knexQuery);
    const query = knexQuery.clone();
    const { order, offset, limit } = pagination;
    // Set offset
    if (Number.isInteger(offset)) {
      query.offset(offset);
    }
    // Set limit
    if (Number.isInteger(limit)) {
      query.limit(limit);
    }
    // Set order
    if (order && Array.isArray(order) && order.length > 0) {
      query.orderBy(order);
    }
    return {
      total,
      offset,
      limit,
      order,
      records: <T[]>await query,
    };
  }

  public static getPaginationValidator(offset: number = 0, limit: number = 20): Validator {
    return new Validator(
      {
        name: 'limit',
        location: 'query',
        type: 'integer',
        defaultValue: limit,
        validator: (v: number) => Number.isInteger(v) && v <= 1000,
        message: 'Invalid limit number',
      },
      {
        name: 'offset',
        location: 'query',
        type: 'integer',
        defaultValue: offset,
        validator: (v: number) => Number.isInteger(v),
        message: 'Invalid offset number',
      },
      {
        name: 'order',
        location: 'query',
        type: 'array',
        defaultValue: [],
        validator: (v: any[]) =>
          Array.isArray(v) &&
          v.every(
            (e: any) =>
              typeof e === 'object' &&
              e.column &&
              e.order &&
              ['asc', 'desc'].includes(e.order) &&
              /[a-z0-9_.]{2,64}/gi.test(e.column),
          ),
        message: 'Invalid order type or column too long',
      },
    );
  }
}

export default Pagination;
