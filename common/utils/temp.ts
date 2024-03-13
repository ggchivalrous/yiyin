export const matchFields = (str: string, matcher = /\{([A-Za-z0-9]+)\}/ig) => {
  if (!str) return null;

  const matchList = str.match(matcher);
  if (!matchList) return null;

  const fields: Record<string, {
    temp: string
    field: string
  }> = {};

  for (const match of matchList) {
    const field = match.substring(1, match.length - 1);
    if (field) {
      fields[field] = {
        temp: match,
        field,
      };
    }
  }

  return fields;
};

export const matchAnyStrFields = (str: string) => {
  if (!str) return null;

  const matchList = str.match(/\{([\u4e00-\u9fa5a-zA-Z0-9]+)\}/ig);
  if (!matchList) return null;

  const fields: Record<string, {
    temp: string
    field: string
  }> = {};

  for (const match of matchList) {
    const field = match.substring(1, match.length - 1);
    if (field) {
      fields[field] = {
        temp: match,
        field,
      };
    }
  }

  return fields;
};
