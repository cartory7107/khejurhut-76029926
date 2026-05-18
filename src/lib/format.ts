export const bdt = (n: number) =>
  `৳${new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(n)}`;
