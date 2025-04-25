import React, { useState, useEffect } from "react";
import axios from "axios";
import styled from 'styled-components';

const TradeContainer = styled.div`
+ position: relative;
+ z-index: 0;
  background: rgba(20, 20, 40, 0.7);
  border-radius: 15px;
  padding: 2rem;
  border: 1px solid var(--primary);
  box-shadow: var(--glow);
  max-width: 500px;
  margin: 2rem auto;
  text-align: center;
  backdrop-filter: blur(5px);
`;


const TradeInput = styled.input`
  width: 80%;
  padding: 0.8rem;
  background: rgba(15, 15, 35, 0.8);
  border: 1px solid var(--primary);
  border-radius: 8px;
  color: var(--light);
  font-family: var(--font-secondary);
  margin: 1rem 0;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
  }
`;

const TradeButton = styled.button`
  padding: 0.8rem 1.5rem;
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  color: var(--dark);
  border: none;
  border-radius: 8px;
  font-family: var(--font-main);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--glow-small);
  margin: 0.5rem;
  position: relative;
  overflow: hidden;
  z-index: 1;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--glow);
    &::after {
      opacity: 1;
    }
  }

  &:disabled {
    background: rgba(100, 100, 120, 0.5);
    color: rgba(224, 224, 255, 0.5);
    cursor: not-allowed;
    box-shadow: none;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.3) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
  }
`;

const StatusMessage = styled.p`
  color: ${props => props.type === 'error' ? '#ff5252' : '#4caf50'};
  margin-top: 1rem;
`;

const WarningMessage = styled.p`
  color: #ffa726;
  margin: -0.5rem 0 0.5rem 0;
  font-size: 0.9rem;
`;

const TradeForm = ({
  arbitrageOpportunity,
  walletBalance,
  setWalletBalance,
  setBtcBalance,
  arbitrageAnalysis,
  simulateMode
}) => {
  const [tradeAmount, setTradeAmount] = useState("");
  const [status, setStatus] = useState({ message: null, type: null });
  const [loading, setLoading] = useState(false);
  const [fees, setFees] = useState({ exchange: {}, network: {} });

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/fees")
      .then(res => {
        setFees({
          exchange: res.data.exchange_fees,
          network: res.data.network_fees
        });
      })
      .catch(err => {
        console.error("Failed to fetch fees:", err);
      });
  }, []);

  const getNetSimulatedProfit = (amountOverride = null) => {
    const usd = amountOverride !== null ? amountOverride : parseFloat(tradeAmount);
    if (isNaN(usd) || usd <= 0) return 0;

    const buyPrice = arbitrageOpportunity?.coinbase_price || 30000;
    const sellPrice = arbitrageOpportunity?.crypto_com_price || 30400;
    const buyExchange = arbitrageOpportunity?.arbitrage_opportunity?.buy_on || "Coinbase";
    const sellExchange = arbitrageOpportunity?.arbitrage_opportunity?.sell_on || "Crypto.com";
    const crypto = arbitrageOpportunity?.crypto_symbol || "BTC";

    const buyFeePct = fees.exchange[buyExchange] || 0.005;
    const sellFeePct = fees.exchange[sellExchange] || 0.005;
    const networkFee = fees.network[crypto] || 5;

    const btc = usd / buyPrice;
    const grossProfit = btc * (sellPrice - buyPrice);
    const buyFee = usd * buyFeePct;
    const sellFee = (btc * sellPrice) * sellFeePct;

    const netProfit = grossProfit - buyFee - sellFee - (2 * networkFee);
    return netProfit;
  };

  const isBelowMinProfit = () => {
    if (!arbitrageAnalysis?.minimum_required_profit) return false;
    return getNetSimulatedProfit() < arbitrageAnalysis.minimum_required_profit;
  };

  const getMinimumTradeToBreakEven = () => {
    const buyPrice = arbitrageOpportunity?.coinbase_price || 30000;
    const sellPrice = arbitrageOpportunity?.crypto_com_price || 30400;
    const spread = sellPrice - buyPrice;
    if (spread <= 0) return null;

    for (let usd = 10; usd <= 10000; usd += 10) {
      const profit = getNetSimulatedProfit(usd);
      if (profit > 0) return usd;
    }

    return null;
  };

  const executeTrade = async () => {
    const usd = parseFloat(tradeAmount);
    if (!tradeAmount || isNaN(usd) || usd <= 0) {
      setStatus({ message: "Please enter a valid trade amount", type: "error" });
      return;
    }

    if (simulateMode) {
      const simulatedNetProfit = getNetSimulatedProfit().toFixed(2);
      setStatus({
        message: `🧪 Simulated trade: Estimated net profit after fees: $${simulatedNetProfit}`,
        type: "success"
      });
      return;
    }

    if (!arbitrageOpportunity) {
      setStatus({ message: "No arbitrage opportunity selected", type: "error" });
      return;
    }

    if (usd > walletBalance) {
      setStatus({
        message: `Insufficient funds. Your balance is $${walletBalance.toFixed(2)}`,
        type: "error"
      });
      return;
    }

    setLoading(true);
    setStatus({ message: "Processing trade...", type: "info" });

    try {
      const { coinbase_price, crypto_com_price, arbitrage_opportunity } = arbitrageOpportunity;
      const tradeBTC = usd / coinbase_price;
      const potentialProfit = tradeBTC * (crypto_com_price - coinbase_price);

      const tradeDetails = {
        buy_from: arbitrage_opportunity.buy_on,
        sell_to: arbitrage_opportunity.sell_on,
        tradeAmount: usd,
        tradeBTC,
        potentialProfit
      };

      const response = await axios.post("http://127.0.0.1:5000/execute_trade", tradeDetails);

      if (response.data.status === "success") {
        setWalletBalance(response.data.new_balance);
        setBtcBalance(response.data.btc_balance);
        setStatus({ message: `Trade successful! Profit: $${response.data.profit.toFixed(2)}`, type: "success" });
      } else {
        setWalletBalance(response.data.new_balance);
        setStatus({
          message: response.data.message || "Trade partially completed",
          type: response.data.status === "partial" ? "warning" : "error"
        });
      }
    } catch (error) {
      setStatus({ message: error.response?.data?.message || "Failed to execute trade", type: "error" });
    } finally {
      setLoading(false);
      setTradeAmount("");
    }
  };

  return (
    <TradeContainer>
      <h3>{simulateMode ? "SIMULATE TRADE" : "EXECUTE TRADE"} (USD)</h3>

      <TradeInput
        value={tradeAmount}
        onChange={(e) => setTradeAmount(e.target.value)}
        placeholder="Amount to invest"
        type="number"
        min="0"
        step="0.01"
        disabled={!simulateMode && (!arbitrageOpportunity || loading)}
      />

      {simulateMode && (
        <WarningMessage>
          🧪 Simulate any amount — even without a live opportunity!
        </WarningMessage>
      )}

      {Object.keys(fees.exchange).length > 0 && (
        <WarningMessage>
          💡 Minimum suggested trade to break even: {
            getMinimumTradeToBreakEven() !== null
              ? `$${getMinimumTradeToBreakEven()}`
              : "not profitable"
          }
        </WarningMessage>
      )}

      {isBelowMinProfit() && (
        <WarningMessage>
          ⚠️ Your estimated profit may not cover transaction fees.
        </WarningMessage>
      )}

      <TradeButton
        onClick={executeTrade}
        disabled={!simulateMode && (!arbitrageOpportunity || loading)}
      >
        {loading
          ? (simulateMode ? "SIMULATING..." : "PROCESSING...")
          : (simulateMode ? "SIMULATE" : "EXECUTE TRADE")}
      </TradeButton>

      {status.message && (
        <StatusMessage type={status.type}>
          {status.message}
        </StatusMessage>
      )}
    </TradeContainer>
  );
};

export default TradeForm;
