import Joi from 'joi';

export class MuxGraphQl {
  private static production: boolean = true;

  public static initGraphQl(production: boolean = true) {
    MuxGraphQl.production = production;
  }

  public static resolver(schema: Joi.ObjectSchema, handler: (...params: any[]) => Promise<any>) {
    return (root: any, args: any, context: any, info: any) => {
      const validator = schema.validate(args);
      if (validator.error) {
        const errorString = `${validator.error.name}: ${validator.error.message}`;
        if (MuxGraphQl.production) {
          throw new Error(errorString);
        }
        throw new Error(`${errorString} in ${validator.error.stack}`);
      }
      return handler(root, validator.value, context, info);
    };
  }
}

export default MuxGraphQl;
