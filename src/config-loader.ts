import fs from 'fs';
import { parse } from 'dotenv';
import { Validator } from './validator';
import { Obj } from './utilities';

export class ConfigLoader {
  private envs: any;

  constructor(filepath: string, validators?: Validator) {
    if (fs.existsSync(filepath)) {
      // If file is exist load from file
      this.envs = Obj.objToCamelCase(parse(fs.readFileSync(filepath)));
    } else {
      // Otherwise load from process.env
      this.envs = Obj.objToCamelCase(process.env);
    }
    if (typeof validators !== 'undefined') {
      this.envs = validators.validate(this.envs);
    }
  }

  public getConfig<T>(): T {
    return this.envs;
  }
}

export default ConfigLoader;
