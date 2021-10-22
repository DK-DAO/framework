export interface IModelCondition<T> {
  field: keyof T;
  operator?: '>' | '<' | '<=' | '>=';
  value: string | number | boolean;
}

export enum EModelLock {
  write = 'WRITE',
  read = 'READ',
}
