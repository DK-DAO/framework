import express, { RequestHandler } from 'express';
import { Validator } from './validator';
import { IMuxHandler, IMuxRequest, IMuxResponse } from './interfaces';
import { GetExpressInstance } from './express';
import FrameworkEvent from './event';

export class Mux {
  private static expressApp: express.Express = GetExpressInstance();

  private static muxMap: any[] = [];

  private static production: boolean = true;

  public static use(middleware: RequestHandler) {
    Mux.expressApp.use(middleware);
  }

  public static get<T>(url: string, validator: Validator | undefined, handler: IMuxHandler<T>) {
    Mux.muxMap.push({
      method: 'get',
      url,
      validator,
      handler,
    });
  }

  public static post<T>(url: string, validator: Validator | undefined, handler: IMuxHandler<T>) {
    Mux.muxMap.push({
      method: 'post',
      url,
      validator,
      handler,
    });
  }

  public static put<T>(url: string, validator: Validator | undefined, handler: IMuxHandler<T>) {
    Mux.muxMap.push({
      method: 'put',
      url,
      validator,
      handler,
    });
  }

  public static delete<T>(url: string, validator: Validator | undefined, handler: IMuxHandler<T>) {
    Mux.muxMap.push({
      method: 'delete',
      url,
      validator,
      handler,
    });
  }

  public static patch<T>(url: string, validator: Validator | undefined, handler: IMuxHandler<T>) {
    Mux.muxMap.push({
      method: 'patch',
      url,
      validator,
      handler,
    });
  }

  private static addHandler<T>(
    methodName: string,
    url: string,
    validator: Validator | undefined,
    handler: IMuxHandler<T>,
  ) {
    (Mux.expressApp as any)[methodName](url, async (req: IMuxRequest, res: IMuxResponse) => {
      let responseResult = null;
      try {
        let verifiedRequestData;
        if (validator instanceof Validator) {
          verifiedRequestData = validator.validateRequest(req);
        } else {
          verifiedRequestData = {
            body: {},
            params: {},
            query: {},
          };
        }
        const result = await handler(verifiedRequestData, req);
        responseResult = res.status(200).send(result);
      } catch (raisedError) {
        if (raisedError instanceof Error) {
          FrameworkEvent.emit('error', raisedError);
          responseResult = res.status(500).send({
            success: false,
            result: {
              message: raisedError.message,
              stack: Mux.production ? '' : raisedError.stack,
            },
          });
        } else {
          responseResult = res.status(500).send({
            success: false,
            result: {
              message: 'Unexpected error!',
              stack: '',
            },
          });
        }
      }
      return responseResult;
    });
  }

  public static init(port: number, host: string, production: boolean = true) {
    Mux.production = production;
    for (let i = 0; i < Mux.muxMap.length; i += 1) {
      const { method, url, validator, handler } = Mux.muxMap[i];
      Mux.addHandler(method, url, validator, handler);
    }
    Mux.expressApp.listen(port, host);
  }
}

export default Mux;
