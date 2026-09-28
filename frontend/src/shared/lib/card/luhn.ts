export const passesLuhn = (digits: string): boolean => {
  if (!/^\d+$/.test(digits)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < digits.length; index += 1) {
    let digit = Number(digits[digits.length - 1 - index]);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }

  return sum % 10 === 0;
};
