import Joi from 'joi';

export class MuxGraphQl {
  private static production: boolean = true;

  public static init(production: boolean = true) {
    MuxGraphQl.production = production;
  }

  public static handler(schema: Joi.ObjectSchema, resolver: (...params: any[]) => Promise<any>) {
    return (root: any, args: any, context: any, info: any) => {
      const validator = schema.validate(args);
      if (validator.error) {
        if (MuxGraphQl.production) {
          throw new Error('Invalid user input');
        }
        throw new Error(validator.error.message);
      }
      return resolver(root, validator.value, context, info);
    };
  }
}

export default MuxGraphQl;
