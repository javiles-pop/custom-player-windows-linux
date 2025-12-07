import 'jest';
import { isValidURLFormat, semverIsGreater, pluralize, isValidIPV4 } from '../StringValidator';

describe('test functions in string validator', () => {
  it('check if string url is valid', () => {
    expect(
      isValidURLFormat(
        'https://tst-cm.fwitest.net/cpweb1/?channel=4c0f2c46-9212-4c76-8e5a-aaf11ddf2979&_fwi_accessToken=token&_fwi_cloudCompanyId=44f90086-f673-479b-85bc-acebfb137be5'
      )
    ).toBe(true);
    expect(isValidURLFormat('https://tst-cm.fwitest.net/cpweb1/?sign=particle&client=qacloudtest1')).toBe(true);
    expect(isValidURLFormat('http://tst-cm.fwitest.net/cpweb1')).toBe(true);

    expect(isValidURLFormat('htt://tst-cm.fwitest.net')).toBe(false);
    expect(isValidURLFormat('http/tst-cm.fwitest.net')).toBe(false);
    expect(isValidURLFormat('https://fakeurl')).toBe(false);
  });

  it('check if new version is available', () => {
    expect(semverIsGreater('2.0.1', '2.1.0')).toBe(true);
    expect(semverIsGreater('2.5.1', '2.5.4')).toBe(true);

    expect(semverIsGreater('2.4.1', '2.3.2')).toBe(false);
  });

  it('pluralize string', () => {
    expect(pluralize('timer', 3)).toEqual('timers');
    expect(pluralize('timer', 1)).toEqual('timer');
  });

  describe('isValidIPV4', () => {
    it('returns true for valid IPv4 addresses', () => {
      expect(isValidIPV4('192.168.1.1')).toBe(true);
      expect(isValidIPV4('0.0.0.0')).toBe(true);
      expect(isValidIPV4('255.255.255.255')).toBe(true);
      expect(isValidIPV4('127.0.0.1')).toBe(true);
    });

    it('returns false for invalid IPv4 addresses', () => {
      expect(isValidIPV4('256.256.256.256')).toBe(false);
      expect(isValidIPV4('192.168.1')).toBe(false);
      expect(isValidIPV4('abc.def.ghi.jkl')).toBe(false);
      expect(isValidIPV4('')).toBe(false);
    });
  });
});
