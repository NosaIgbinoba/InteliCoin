import React, { useState } from "react";
import axios from "axios";
import styled from 'styled-components';
import { motion } from 'framer-motion';
import TradeForm from "./TradeForm";
import './Arbitrage.css';

const ArbitrageContainer = styled.div`
  position: relative;
  z-index: 0; 
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

const ArbitrageInput = styled.input`
  width: 80%;
  padding: 0.8rem;
  background: rgba(15, 15, 35, 0.8);
  border: 1px solid var(--primary);
  border-radius: 8px;
  color: var(--light);
  font-family: var(--font-secondary);
  margin-bottom: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
  }

  &::placeholder {
    color: rgba(224, 224, 255, 0.5);
  }
`;

const ArbitrageButton = styled.button`
  padding: 0.8rem 1.5rem;
  background: linear-gradient(
    135deg,
    var(--primary) 0%,
    var(--accent) 100%
  );
  color: var(--dark);
  border: none;
  border-radius: 8px;
  font-family: var(--font-main);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--glow-small);
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
    background: linear-gradient(
      135deg,
      rgba(255,255,255,0.1) 0%,
      rgba(255,255,255,0.3) 100%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
  }
`;

const ArbitrageDetails = styled.div`
  margin-top: 1.5rem;
  background: rgba(15, 15, 35, 0.8);
  padding: 1.5rem;
  border-radius: 10px;
  border: 1px solid rgba(0, 240, 255, 0.1);
`;

const ProfitBadge = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== '$isPositive',
})`
  color: ${props => props.$isPositive ? '#4caf50' : '#f44336'};
  font-weight: bold;
`;

const PercentageDiff = styled.span`
  font-size: 0.8em;
  color: rgba(224, 224, 255, 0.7);
  margin-left: 0.5rem;
`;

const ErrorMessage = styled.p`
  color: #ff5252;
  margin-top: 1rem;
`;

const ToggleWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: var(--light);
`;

const ToggleInput = styled.input`
  appearance: none;
  width: 40px;
  height: 20px;
  background: ${props => (props.checked ? 'var(--accent)' : '#555')};
  border-radius: 20px;
  position: relative;
  cursor: pointer;
  outline: none;
  transition: background 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => (props.checked ? '22px' : '2px')};
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    transition: left 0.3s ease;
  }
`;

const Arbitrage = ({ setArbitrageOpportunity, setAIResponse, setArbitrageAnalysis, arbitrageAnalysis }) => {
  const [crypto, setCrypto] = useState("");
  const [arbitrage, setArbitrage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [simulateMode, setSimulateMode] = useState(false);

  const [walletBalance, setWalletBalance] = useState(1000);
  const [btcBalance, setBtcBalance] = useState(0);

  const checkArbitrage = async () => {
    if (!crypto.trim()) {
      setError("Please enter a cryptocurrency symbol");
      return;
    }

    setArbitrage(null);
    setArbitrageOpportunity(null);
    setArbitrageAnalysis(null);
    setError(null);
    setLoading(true);

    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/arbitrage?crypto=${crypto.toLowerCase()}`
      );

      if (response.data.arbitrage_opportunity) {
        const opportunity = response.data.arbitrage_opportunity;
        const coinbasePrice = parseFloat(response.data.coinbase_price) || 0;
        const cryptocomPrice = parseFloat(response.data.crypto_com_price) || 0;

        let profit = 0;
        let percentageDiff = 0;

        if (opportunity.buy_on === "Coinbase") {
          profit = cryptocomPrice - coinbasePrice;
          percentageDiff = (profit / coinbasePrice) * 100;
        } else {
          profit = coinbasePrice - cryptocomPrice;
          percentageDiff = (profit / cryptocomPrice) * 100;
        }

        const formattedData = {
          ...response.data,
          coinbase_price: coinbasePrice,
          crypto_com_price: cryptocomPrice,
          arbitrage_opportunity: {
            ...opportunity,
            buy_price: parseFloat(opportunity.buy_price) || coinbasePrice,
            sell_price: parseFloat(opportunity.sell_price) || cryptocomPrice,
            potential_profit: profit,
            percentage_diff: percentageDiff,
          },
        };

        setArbitrage(formattedData);
        setArbitrageOpportunity(formattedData);
        setArbitrageAnalysis(null);

        try {
          const aiResponse = await axios.post(
            "http://127.0.0.1:5000/get_trade_feedback",
            {
              tradeAmount: 1000,
              buyPrice: coinbasePrice,
              sellPrice: cryptocomPrice,
              exchangeBuy: opportunity.buy_on,
              exchangeSell: opportunity.sell_on,
              potentialProfit: profit,
              aggression: "moderate",
            }
          );
          setAIResponse(aiResponse.data.feedback || "No AI feedback available.");
        } catch (aiError) {
          console.error("AI Feedback Error:", aiError);
          setAIResponse("Could not get AI analysis at this time.");
        }
      } else {
        setArbitrage(null);
        setArbitrageOpportunity(null);
        setArbitrageAnalysis(response.data.analysis || null);
        setError(response.data.response || "No arbitrage opportunity found");
      }
    } catch (err) {
      console.error("Arbitrage Error:", err);
      setError(err.response?.data?.response || "Failed to fetch arbitrage data");
      setArbitrage(null);
      setArbitrageOpportunity(null);
      setArbitrageAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ArbitrageContainer>
      <h3>ARBITRAGE SCANNER</h3>
      
      <ToggleWrapper>
        <label htmlFor="simulateToggle">🔬 Simulate Mode</label>
        <ToggleInput
          id="simulateToggle"
          type="checkbox"
          checked={simulateMode}
          onChange={() => setSimulateMode(prev => !prev)}
        />
      </ToggleWrapper>

      <ArbitrageInput
        value={crypto}
        onChange={(e) => setCrypto(e.target.value.toUpperCase())}
        placeholder="Enter crypto symbol (BTC, ETH...)"
        onKeyPress={(e) => e.key === 'Enter' && checkArbitrage()}
      />
      <ArbitrageButton 
        onClick={checkArbitrage} 
        disabled={loading}
      >
        {loading ? "SCANNING..." : "FIND OPPORTUNITY"}
      </ArbitrageButton>

      {error && (!arbitrage || !arbitrage.arbitrage_opportunity) && (
        <ErrorMessage>
          <strong>{error}</strong>
          {arbitrageAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                marginTop: '1rem',
                fontSize: '0.95rem',
                color: '#ccc',
                textAlign: 'left',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid rgba(255, 100, 100, 0.2)'
              }}
            >
              <p>💡 <strong>Why:</strong> {arbitrageAnalysis.reason}</p>
              <p>📊 <strong>Max Price Difference:</strong> ${arbitrageAnalysis.max_price_difference}</p>
              <p>🌐 <strong>Price Stability:</strong> {arbitrageAnalysis.price_stability}</p>
              <p>🧠 <strong>Suggestion:</strong> {arbitrageAnalysis.suggestion}</p>
            </motion.div>
          )}
        </ErrorMessage>
      )}

      {arbitrage && arbitrage.arbitrage_opportunity && (
        <ArbitrageDetails>
          <p>🔹 BUY ON: {arbitrage.arbitrage_opportunity.buy_on} @ ${arbitrage.coinbase_price.toFixed(2)}</p>
          <p>🔹 SELL ON: {arbitrage.arbitrage_opportunity.sell_on} @ ${arbitrage.crypto_com_price.toFixed(2)}</p>
          <p>
            💰 PROFIT:{" "}
            <ProfitBadge $isPositive={arbitrage.arbitrage_opportunity.potential_profit > 0}>
              ${arbitrage.arbitrage_opportunity.potential_profit.toFixed(2)}
              {arbitrage.arbitrage_opportunity.percentage_diff > 0 && (
                <PercentageDiff>
                  ({arbitrage.arbitrage_opportunity.percentage_diff.toFixed(4)}%)
                </PercentageDiff>
              )}
            </ProfitBadge>
          </p>
          <p>🔍 CRYPTO: {simulateMode ? "BTC (demo only)" : (arbitrage?.crypto_symbol || "N/A")}</p>
          </ArbitrageDetails>
      )}

      {(simulateMode || (arbitrage && arbitrage.arbitrage_opportunity)) && (
        <TradeForm
          simulateMode={simulateMode}
          arbitrageOpportunity={arbitrage}
          arbitrageAnalysis={arbitrageAnalysis}
          walletBalance={walletBalance}
          setWalletBalance={setWalletBalance}
          setBtcBalance={setBtcBalance}
        />
      )}
    </ArbitrageContainer>
  );
};

export default Arbitrage;
