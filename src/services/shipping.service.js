export const calculateShipping = (items, location = "NG") => {
  // simple rule-based shipping logic

  const base = 5; // base fee

  const itemCount = items?.length || 0;

  let fee = base + itemCount * 2;

  // Nigeria local discount
  if (location === "NG") {
    fee = fee * 0.7;
  }

  return Math.round(fee);
};