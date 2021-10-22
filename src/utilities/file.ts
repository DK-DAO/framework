import fs from 'fs';
import path from 'path';

export class File {
  public static getRootFolder(startSearch: string = __dirname): string {
    const parts = startSearch.split(path.sep);
    const candidate = [];
    for (let i = parts.length; i > 1; i -= 1) {
      const curPath = parts.slice(0, i).join(path.sep);
      const result = fs.readdirSync(curPath);
      if (result.includes('package.json')) {
        candidate.push(curPath);
      }
    }
    return candidate.pop() || '';
  }
}

export default File;
