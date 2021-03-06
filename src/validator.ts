import express from 'express';

import { IField, IValidatedData, IKeyValue, TLocation } from './interfaces';

function fieldsToMap(fields: IField[]): { [key: string]: IField } {
  const fieldMap: any = {};
  for (let i = 0; i < fields.length; i += 1) {
    const field = fields[i];
    fieldMap[`${field.location}-${field.name}`] = field;
  }
  return fieldMap;
}

function mapToFields(mapOfFields: { [key: string]: IField }): IField[] {
  return Object.entries(mapOfFields).map((v: [string, IField]) => v[1]);
}

export class Validator {
  private fields: IField[];

  constructor(...fields: IField[]) {
    this.fields = fields;
  }

  public getFields(): IField[] {
    return this.fields;
  }

  public merge(target: Validator): Validator {
    const currentMap = fieldsToMap(this.fields);
    const targetMap = fieldsToMap(target.getFields());
    const cachedMap = { ...targetMap, ...currentMap };
    return new Validator(...mapToFields(cachedMap));
  }

  private static string(val: any): string {
    return val.toString();
  }

  private static integer(val: any): number {
    return Number.parseInt(val, 10);
  }

  private static float(val: any): number {
    return Number.parseFloat(val);
  }

  private static object(val: any): any {
    return typeof val === 'string' ? JSON.parse(val) : val;
  }

  private static array(val: any): any[] {
    return typeof val === 'string' ? JSON.parse(val) : val;
  }

  private static boolean(val: any): boolean {
    return val === 'true' || val === true;
  }

  public validateRequest(req: express.Request): IValidatedData {
    return {
      body: this.validateObject(req.body || {}, 'body'),
      query: this.validateObject(req.query || {}, 'query'),
      params: this.validateObject(req.params || {}, 'params'),
    };
  }

  public validate(object: any) {
    return this.validateObject(object);
  }

  private validateObject(object: any, location: TLocation = 'any'): IKeyValue {
    const result: IKeyValue = {};
    let fields: IField[] = [];
    if (['body', 'query', 'params'].includes(location)) {
      fields = this.fields.filter((e) => e.location === location);
    } else {
      fields = this.fields;
    }
    for (let i = 0; i < fields.length; i += 1) {
      const { name, require, type, validator, message, enums, defaultValue, postProcess } = fields[i];
      if (typeof object[name] !== 'undefined') {
        // Basic parse value
        const value = Validator[type](object[name]);
        // Check value with defined validator
        if (typeof validator === 'function' && !validator(value)) {
          throw new Error(`Field ${name} : ${message || 'does not satisfy validator'}`);
        }
        // Check value is in enums
        if (enums && Array.isArray(enums) && !enums.includes(value)) {
          throw new RangeError(`Field ${name} need to be in range ${enums}`);
        }
        // Assign value to validated result
        if (typeof postProcess === 'function') {
          result[name] = postProcess(value);
        } else {
          result[name] = value;
        }
      } else if (typeof defaultValue !== 'undefined') {
        // Field is required and have defaultValue
        result[name] = defaultValue;
      } else if (require && typeof defaultValue === 'undefined') {
        // Field is required but don't have value or defaultValue
        throw new Error(`Field ${name} is required`);
      }
    }
    return result;
  }
}

export default Validator;
