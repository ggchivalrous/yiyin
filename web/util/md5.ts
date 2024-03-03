export function md5(input: string): string {
  const rotateLeft = (x: number, n: number) => (x << n) | (x >>> (32 - n));
  const addUnsigned = (x: number, y: number) => (x + y) >>> 0;

  const hexChars = '0123456789abcdef';

  const str2binl = (str: string): number[] => {
    const bin: number[] = [];
    const mask = (1 << 8) - 1;
    for (let i = 0; i < str.length * 8; i += 8) {
      bin[i >> 5] |= (str.charCodeAt(i / 8) & mask) << (i % 32);
    }
    return bin;
  };

  const binl2hex = (binarray: number[]): string => {
    let str = '';
    for (let i = 0; i < binarray.length * 4; i++) {
      str += hexChars.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xF)
              + hexChars.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xF);
    }
    return str;
  };

  const binlMD5 = (x: number[], len: number): number[] => {
    x[len >> 5] |= 0x80 << (len % 32);
    x[(((len + 64) >>> 9) << 4) + 14] = len;

    let a = 0x67452301;
    let b = 0xefcdab89;
    let c = 0x98badcfe;
    let d = 0x10325476;

    for (let i = 0; i < x.length; i += 16) {
      const olda = a;
      const oldb = b;
      const oldc = c;
      const oldd = d;

      a = FF(a, b, c, d, x[i + 0], 7, -680876936);
      d = FF(d, a, b, c, x[i + 1], 12, -389564586);
      c = FF(c, d, a, b, x[i + 2], 17, 606105819);
      b = FF(b, c, d, a, x[i + 3], 22, -1044525330);
      a = FF(a, b, c, d, x[i + 4], 7, -176418897);
      d = FF(d, a, b, c, x[i + 5], 12, 1200080426);
      c = FF(c, d, a, b, x[i + 6], 17, -1473231341);
      b = FF(b, c, d, a, x[i + 7], 22, -45705983);
      a = FF(a, b, c, d, x[i + 8], 7, 1770035416);
      d = FF(d, a, b, c, x[i + 9], 12, -1958414417);
      c = FF(c, d, a, b, x[i + 10], 17, -42063);
      b = FF(b, c, d, a, x[i + 11], 22, -1990404162);
      a = FF(a, b, c, d, x[i + 12], 7, 1804603682);
      d = FF(d, a, b, c, x[i + 13], 12, -40341101);
      c = FF(c, d, a, b, x[i + 14], 17, -1502002290);
      b = FF(b, c, d, a, x[i + 15], 22, 1236535329);

      a = GG(a, b, c, d, x[i + 1], 5, -165796510);
      d = GG(d, a, b, c, x[i + 6], 9, -1069501632);
      c = GG(c, d, a, b, x[i + 11], 14, 643717713);
      b = GG(b, c, d, a, x[i + 0], 20, -373897302);
      a = GG(a, b, c, d, x[i + 5], 5, -701558691);
      d = GG(d, a, b, c, x[i + 10], 9, 38016083);
      c = GG(c, d, a, b, x[i + 15], 14, -660478335);
      b = GG(b, c, d, a, x[i + 4], 20, -405537848);
      a = GG(a, b, c, d, x[i + 9], 5, 568446438);
      d = GG(d, a, b, c, x[i + 14], 9, -1019803690);
      c = GG(c, d, a, b, x[i + 3], 14, -187363961);
      b = GG(b, c, d, a, x[i + 8], 20, 1163531501);
      a = GG(a, b, c, d, x[i + 13], 5, -1444681467);
      d = GG(d, a, b, c, x[i + 2], 9, -51403784);
      c = GG(c, d, a, b, x[i + 7], 14, 1735328473);
      b = GG(b, c, d, a, x[i + 12], 20, -1926607734);

      a = HH(a, b, c, d, x[i + 5], 4, -378558);
      d = HH(d, a, b, c, x[i + 8], 11, -2022574463);
      c = HH(c, d, a, b, x[i + 11], 16, 1839030562);
      b = HH(b, c, d, a, x[i + 14], 23, -35309556);
      a = HH(a, b, c, d, x[i + 1], 4, -1530992060);
      d = HH(d, a, b, c, x[i + 4], 11, 1272893353);
      c = HH(c, d, a, b, x[i + 7], 16, -155497632);
      b = HH(b, c, d, a, x[i + 10], 23, -1094730640);
      a = HH(a, b, c, d, x[i + 13], 4, 681279174);
      d = HH(d, a, b, c, x[i + 0], 11, -358537222);
      c = HH(c, d, a, b, x[i + 3], 16, -722521979);
      b = HH(b, c, d, a, x[i + 6], 23, 76029189);
      a = HH(a, b, c, d, x[i + 9], 4, -640364487);
      d = HH(d, a, b, c, x[i + 12], 11, -421815835);
      c = HH(c, d, a, b, x[i + 15], 16, 530742520);
      b = HH(b, c, d, a, x[i + 2], 23, -995338651);

      a = II(a, b, c, d, x[i + 0], 6, -198630844);
      d = II(d, a, b, c, x[i + 7], 10, 1126891415);
      c = II(c, d, a, b, x[i + 14], 15, -1416354905);
      b = II(b, c, d, a, x[i + 5], 21, -57434055);
      a = II(a, b, c, d, x[i + 12], 6, 1700485571);
      d = II(d, a, b, c, x[i + 3], 10, -1894986606);
      c = II(c, d, a, b, x[i + 10], 15, -1051523);
      b = II(b, c, d, a, x[i + 1], 21, -2054922799);
      a = II(a, b, c, d, x[i + 8], 6, 1873313359);
      d = II(d, a, b, c, x[i + 15], 10, -30611744);
      c = II(c, d, a, b, x[i + 6], 15, -1560198380);
      b = II(b, c, d, a, x[i + 13], 21, 1309151649);
      a = II(a, b, c, d, x[i + 4], 6, -145523070);
      d = II(d, a, b, c, x[i + 11], 10, -1120210379);
      c = II(c, d, a, b, x[i + 2], 15, 718787259);
      b = II(b, c, d, a, x[i + 9], 21, -343485551);

      a = addUnsigned(a, olda);
      b = addUnsigned(b, oldb);
      c = addUnsigned(c, oldc);
      d = addUnsigned(d, oldd);
    }
    return [a, b, c, d];
  };

  const F = (x: number, y: number, z: number) => (x & y) | (~x & z);
  const G = (x: number, y: number, z: number) => (x & z) | (y & ~z);
  const H = (x: number, y: number, z: number) => x ^ y ^ z;
  const I = (x: number, y: number, z: number) => y ^ (x | ~z);

  const FF = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), t));
    return addUnsigned(rotateLeft(a, s), b);
  };

  const GG = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), t));
    return addUnsigned(rotateLeft(a, s), b);
  };

  const HH = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), t));
    return addUnsigned(rotateLeft(a, s), b);
  };

  const II = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), t));
    return addUnsigned(rotateLeft(a, s), b);
  };

  const x = str2binl(input);
  const [a, b, c, d] = binlMD5(x, input.length * 8);
  return binl2hex([a, b, c, d]);
}
