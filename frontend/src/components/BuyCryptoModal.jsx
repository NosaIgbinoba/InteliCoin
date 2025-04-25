import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import axios from 'axios';
import { toast } from 'react-toastify';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 20, 0.85);
  backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
`;

const ModalCard = styled.div`
  background: rgba(20, 20, 40, 0.95);
  border: 1px solid var(--primary);
  border-radius: 12px;
  padding: 2rem;
  width: 340px;
  box-shadow: 0 0 30px rgba(0, 240, 255, 0.15);
`;

const Title = styled.h3`
  color: var(--accent);
  margin-bottom: 1rem;
  font-family: var(--font-main);
`;

const Label = styled.label`
  display: block;
  color: var(--light);
  margin-top: 1rem;
  font-size: 0.85rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  margin-top: 0.3rem;
  background: rgba(15, 15, 35, 0.8);
  border: 1px solid var(--primary);
  border-radius: 8px;
  color: var(--light);
`;

const Select = styled.select`
  width: 100%;
  padding: 0.8rem;
  margin-top: 0.3rem;
  background: rgba(15, 15, 35, 0.8);
  border: 1px solid var(--primary);
  border-radius: 8px;
  color: var(--light);
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
`;

const glow = keyframes`
  0% {
    box-shadow: 0 0 8px rgba(0, 240, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 14px rgba(0, 240, 255, 0.6);
  }
  100% {
    box-shadow: 0 0 8px rgba(0, 240, 255, 0.3);
  }
`;

const Button = styled.button`
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  border: none;
  font-family: var(--font-main);
  font-weight: bold;
  cursor: pointer;
  background: ${({ variant }) => variant === 'confirm' ? 'transparent' : '#333'};
  color: ${({ variant }) => variant === 'confirm' ? '#eee' : '#ccc'};

  &:hover {
    opacity: 0.85;
  }

  ${({ variant }) =>
    variant === 'confirm' &&
    css`
      border: none;
    `}
`;


const BuyCryptoModal = ({ onClose, onReloadWallet }) => {
  const [amount, setAmount] = useState('');
  const [symbol, setSymbol] = useState('BTC');
  const [price, setPrice] = useState(null);
  const [prices, setPrices] = useState({});

  useEffect(() => {
    fetchLivePrices();
  }, []);

  useEffect(() => {
    if (prices[symbol]) {
      setPrice(prices[symbol]);
    }
  }, [symbol, prices]);

  const fetchLivePrices = async () => {
    try {
      const res = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,litecoin,solana&vs_currencies=usd'
      );
      setPrices({
        BTC: res.data.bitcoin.usd,
        ETH: res.data.ethereum.usd,
        LTC: res.data.litecoin.usd,
        SOL: res.data.solana.usd
      });
    } catch (err) {
      toast.error('Failed to fetch live prices');
      console.error(err);
    }
  };

  const handleBuy = async () => {
    const floatAmount = parseFloat(amount);
    if (isNaN(floatAmount) || floatAmount <= 0 || !price) {
      toast.warn("Enter a valid USD amount");
      return;
    }

    const cryptoAmount = floatAmount / price;

    try {
      const res = await axios.post('http://127.0.0.1:5000/buy_crypto', {
        symbol,
        amount: cryptoAmount
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success) {
        toast.success(`Bought ${cryptoAmount.toFixed(6)} ${symbol}`);
        onReloadWallet();
        onClose();
      } else {
        toast.error(res.data.message || 'Buy failed');
      }
    } catch (err) {
      console.error("Buy error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Buy error');
    }
  };

  return (
    <Overlay>
      <ModalCard>
        <Title>Buy Crypto</Title>

        <Label>Crypto</Label>
        <Select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
          <option value="BTC">Bitcoin (BTC)</option>
          <option value="ETH">Ethereum (ETH)</option>
          <option value="LTC">Litecoin (LTC)</option>
          <option value="SOL">Solana (SOL)</option>
        </Select>

        <Label>Amount (USD)</Label>
        <Input
          type="number"
          placeholder="e.g. 100"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        {price && amount && (
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--accent)' }}>
            You'll receive ≈ {(parseFloat(amount) / price).toFixed(6)} {symbol}
          </p>
        )}

        <ButtonRow>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="confirm" onClick={handleBuy}>Buy</Button>
        </ButtonRow>
      </ModalCard>
    </Overlay>
  );
};

export default BuyCryptoModal;