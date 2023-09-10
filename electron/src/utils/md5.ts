import crypto from 'node:crypto';

export default (data: any) => {
  const hash = crypto.createHash('md5');
  return hash.update(data).digest('hex');
};
