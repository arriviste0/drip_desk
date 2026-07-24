/** Format a number with Indian digit grouping and a ₹ prefix (e.g. 1234567 -> ₹12,34,567). */
export function formatINR(value: number): string {
  const digits = Math.round(value).toString();
  const lastThree = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const grouped = rest
    ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree;
  return '₹' + grouped;
}
