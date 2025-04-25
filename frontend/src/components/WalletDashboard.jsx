import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Wallet from './Wallet';
import CoinCard from './CoinCard';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';
import BuyCryptoModal from './BuyCryptoModal';
import TransactionsTable from './TransactionsTable';
import axios from 'axios';
import { toast } from 'react-toastify';

const DashboardWrapper = styled.div`
  background: rgba(10, 10, 20, 0.8);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 0 30px rgba(0, 240, 255, 0.1);
  backdrop-filter: blur(10px);
  color: var(--light);
`;

const BalanceSummary = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 2rem;
`;

const BalanceItem = styled.div`
  flex: 1;
  min-width: 220px;
  margin-right: 2rem;

  h4 {
    font-size: 0.9rem;
    color: #aaa;
    margin-bottom: 0.3rem;
  }

  p {
    font-size: 1.5rem;
    color: white;
    font-weight: bold;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid var(--primary);
  color: var(--light);
  font-size: 0.75rem;
  font-family: var(--font-secondary);
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--primary);
    color: var(--dark);
  }
`;

const CoinGrid = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: space-between;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(10, 10, 20, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

const ModalContent = styled.div`
  background: #111828;
  border-radius: 12px;
  padding: 2rem;
  max-width: 900px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
`;

const CloseButton = styled.button`
  background: transparent;
  color: #ff0066;
  font-size: 1.2rem;
  border: none;
  cursor: pointer;
  margin-bottom: 1rem;
  float: right;
`;

const WalletDashboard = ({
  walletBalance,
  walletAssets,
  setWalletBalance,
  onReloadWallet,
  setIsLoggedIn
}) => {
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [coinPrices, setCoinPrices] = useState({});
  const [coinChanges, setCoinChanges] = useState({});

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const res = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,litecoin,solana&vs_currencies=usd&include_24hr_change=true');
      const data = res.data;

      setCoinPrices({
        BTC: data.bitcoin.usd,
        ETH: data.ethereum.usd,
        LTC: data.litecoin.usd,
        SOL: data.solana.usd
      });

      setCoinChanges({
        BTC: parseFloat(data.bitcoin.usd_24h_change).toFixed(2),
        ETH: parseFloat(data.ethereum.usd_24h_change).toFixed(2),
        LTC: parseFloat(data.litecoin.usd_24h_change).toFixed(2),
        SOL: parseFloat(data.solana.usd_24h_change).toFixed(2)
      });
    } catch (err) {
      console.error("Failed to fetch live prices", err);
    }
  };

  const handleAuthError = (err) => {
    const msg = err.response?.data?.msg;
    if (msg === "Token has expired") {
      toast.error("Session expired. Please log in again.");
      localStorage.removeItem("token");
      setTimeout(() => setIsLoggedIn(false), 1000);
    } else {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    }
  };

  const handleDeposit = async (amount) => {
    try {
      const res = await axios.post('http://127.0.0.1:5000/deposit', { amount }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        toast.success(`Deposited $${amount.toFixed(2)} successfully!`);
        onReloadWallet();
      } else {
        toast.error(res.data.message || 'Deposit failed');
      }
    } catch (err) {
      handleAuthError(err);
    }
  };

  const handleWithdraw = async (amount) => {
    if (amount > walletBalance) {
      toast.warn("Insufficient balance");
      return;
    }
    try {
      const res = await axios.post('http://127.0.0.1:5000/withdraw', { amount }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        toast.success(`Withdrew $${amount.toFixed(2)} successfully!`);
        onReloadWallet();
      } else {
        toast.error(res.data.message || 'Withdrawal failed');
      }
    } catch (err) {
      handleAuthError(err);
    }
  };

  const getName = (symbol) => {
    switch (symbol) {
      case "BTC": return "Bitcoin";
      case "ETH": return "Ethereum";
      case "LTC": return "Litecoin";
      case "SOL": return "Solana";
      default: return symbol;
    }
  };

  const holdingsValue = Object.entries(walletAssets || {}).reduce((sum, [symbol, amount]) => {
    const price = coinPrices?.[symbol] || 0;
    return sum + (parseFloat(amount) * price);
  }, 0);

  const total = walletBalance + holdingsValue;

  return (
    <DashboardWrapper>
      <BalanceSummary>
        <BalanceItem>
          <h4>Fiat Balance</h4>
          <p>${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</p>
          <ActionButtons>
            <ActionButton onClick={() => setShowDeposit(true)}>Deposit</ActionButton>
            <ActionButton onClick={() => setShowWithdraw(true)}>Withdraw</ActionButton>
            <ActionButton onClick={() => setShowBuy(true)}>Buy</ActionButton>
            <ActionButton onClick={() => setShowTransactions(true)}>Transactions</ActionButton>
          </ActionButtons>
        </BalanceItem>

        <BalanceItem>
          <h4>Holdings Value</h4>
          <p>${holdingsValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</p>
        </BalanceItem>

        <BalanceItem>
          <h4>Total Balance</h4>
          <p>${total.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</p>
        </BalanceItem>
      </BalanceSummary>

      <CoinGrid>
        {["BTC", "ETH", "LTC", "SOL"].map((symbol) => {
          const amount = parseFloat(walletAssets?.[symbol]) || 0;
          const price = parseFloat(coinPrices?.[symbol]) || 0;
          const change = parseFloat(coinChanges?.[symbol]) || 0;
          const color = change >= 0 ? "#00ff88" : "#ff3366";

          return (
            <CoinCard
              key={symbol}
              name={getName(symbol)}
              symbol={symbol}
              price={price}
              change={change}
              color={color}
              trend={change >= 0 ? "up" : "down"}
              amount={amount}
            />
          );
        })}
      </CoinGrid>

      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} onConfirm={handleDeposit} />}
      {showWithdraw && <WithdrawModal onClose={() => setShowWithdraw(false)} onConfirm={handleWithdraw} />}
      {showBuy && <BuyCryptoModal onClose={() => setShowBuy(false)} onReloadWallet={onReloadWallet} />}
      {showTransactions && (
        <ModalOverlay onClick={() => setShowTransactions(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={() => setShowTransactions(false)}>✖</CloseButton>
            <TransactionsTable />
          </ModalContent>
        </ModalOverlay>
      )}
    </DashboardWrapper>
  );
};

export default WalletDashboard;
