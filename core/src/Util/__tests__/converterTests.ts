import 'jest';
import {
  encrypt,
  decrypt,
  extractBaseURL,
  insertStringatIndex,
  transformURLtoQueryComponentString,
} from '../Converter';

describe('test functions in converter.ts', () => {
  it('should encrypt and decrypt', () => {
    const encrypted = encrypt('encrypt this string', 'fwi');
    const decryptedString = decrypt(encrypted, 'fwi');
    expect(decryptedString).toEqual('encrypt this string');
  });

  it('should extract base url', () => {
    let baseUrl = extractBaseURL(
      'https://tst-cm.fwitest.net/cpweb1/?channel=4c0f2c46-9212-4c76-8e5a-aaf11ddf2979&_fwi_accessToken=token&_fwi_cloudCompanyId=44f90086-f673-479b-85bc-acebfb137be5'
    );
    expect(baseUrl).toEqual('https://tst-cm.fwitest.net/cpweb1/');

    baseUrl = extractBaseURL('rogueurl.com');
    expect(baseUrl).toEqual('');
  });

  it('should insert string at index', () => {
    let result = insertStringatIndex('fourinteractive', 'winds', 4);
    expect(result).toEqual('fourwindsinteractive');

    result = insertStringatIndex('windsinteractive', 'four', 0);
    expect(result).toEqual('fourwindsinteractive');

    result = insertStringatIndex('fourwind', 's', 8);
    expect(result).toEqual('fourwinds');

    expect(() => insertStringatIndex('fourwind', 's', 9)).toThrowError(
      'Source string: "fourwind" does not have an index at 9'
    );
    expect(() => insertStringatIndex('fourwind', 's', -1)).toThrowError(
      'Source string: "fourwind" does not have an index at -1'
    );
  });

  it('should get sign and db name from url', () => {
    const classicDeployResult = transformURLtoQueryComponentString(
      'https://tst-cm.fwitest.net/cpweb1/?sign=particle&client=qacloudtest1'
    );

    expect(classicDeployResult).toEqual('Sign: particle, Client: qacloudtest1');
    expect(transformURLtoQueryComponentString('bad_url')).toEqual('bad_url');
  });
});
