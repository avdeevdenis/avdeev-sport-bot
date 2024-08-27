import * as fs from 'fs';

export const saveFileContent = async (savedDataFilePath: string, fileContentJSON: Object) => {
  await fs.writeFileSync(savedDataFilePath, JSON.stringify(fileContentJSON), { encoding: 'utf8' });
};