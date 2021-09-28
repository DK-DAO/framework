export interface IModelCondition<T> {
  field: keyof T;
  operator?: '>' | '<' | '<=' | '>=';
  value: string | number;
}

export enum EModelLock {
  write = 'WRITE',
  read = 'READ',
}
