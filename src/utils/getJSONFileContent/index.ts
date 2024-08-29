import * as fs from 'fs';

/**
 * Считывает содержимое файла JSON
 */
export const getJSONFileContent = async (filePath: string) => {
  let fileContent;

  try {
    fileContent = await fs.readFileSync(filePath, { encoding: 'utf8' });
  } catch (error) {
    return false;
  }

  let fileContentJSON = null;

  if (fileContent.length) {
    try {
      fileContentJSON = JSON.parse(fileContent);
    } catch (error) {
      return false;
    }
  }

  return fileContentJSON;
};