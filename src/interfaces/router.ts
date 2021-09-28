import express from 'express';
import { IResponse } from './response';
import { IRequestData } from './schema';

export interface IRouterRecord {
  method: string;
  path: string;
  handle: string;
}

export interface IMuxRequest extends express.Request {}

export interface IMuxResponse extends express.Response {}

export interface IMuxHandler<T> {
  (requestData: IRequestData, req?: IMuxRequest): Promise<IResponse<T>>;
}
