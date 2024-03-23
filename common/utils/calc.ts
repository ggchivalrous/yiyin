export const roundDecimalPlaces = (n: number, place = 0) => {
  const multiplier = 10 ** place;
  const adjustedNumber = n * multiplier;
  const roundedNumber = Math.round(adjustedNumber) / multiplier;
  return roundedNumber;
};
