export const createCryptoPayment = async ({ orderId, amount }) => {
  // In real production you'd integrate:
  // - Coinbase Commerce
  // - NowPayments
  // - Binance Pay

  const walletAddress = "0xYOUR_DEMO_WALLET_ADDRESS";

  return {
    orderId,
    amount,
    currency: "USDT (TRC20)",
    walletAddress,
    status: "pending",
  };
};