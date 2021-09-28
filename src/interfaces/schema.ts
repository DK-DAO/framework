export interface IRequestData {
  body: any;
  query: any;
  params: any;
  any?: any;
}

export interface IPostProcessMethod {
  (v: any): any;
}

export interface IValidateMethod {
  (v: any): boolean;
}

export type TLocation = 'body' | 'query' | 'params' | 'any';

export type TType = 'string' | 'integer' | 'float' | 'array' | 'boolean' | 'object';

export interface IKeyValue {
  [key: string]: any;
}

export interface IValidatedData {
  query: IKeyValue;
  body: IKeyValue;
  params: IKeyValue;
}

export interface IField {
  location: TLocation;
  name: string;
  require?: boolean;
  type: TType;
  enums?: any[];
  validator?: IValidateMethod;
  message?: string;
  defaultValue?: any;
  postProcess?: IPostProcessMethod;
}
