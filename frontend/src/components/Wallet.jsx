import React from "react";
import styled from 'styled-components';
import { FaWallet } from "react-icons/fa";

const WalletContainer = styled.div`
  position: relative;
  background: rgba(15, 15, 35, 0.85);
  border: 1px solid var(--primary);
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 0 25px rgba(0, 240, 255, 0.3), inset 0 0 10px rgba(0, 240, 255, 0.1);
  backdrop-filter: blur(8px);
  overflow: hidden;
`;

const WalletGlow = styled.div`
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, rgba(0, 240, 255, 0.1), transparent 70%);
  animation: rotate-glow 20s linear infinite;
  z-index: 0;
`;

const WalletBalance = styled.h2`
  color: var(--accent);
  text-shadow: 0 0 15px rgba(0, 255, 157, 0.7);
  font-family: var(--font-main);
  letter-spacing: 1.5px;
  font-size: 2rem;
  margin: 0;
  z-index: 1;
  position: relative;
`;

const WalletIcon = styled(FaWallet)`
  font-size: 1.5rem;
  margin-right: 0.5rem;
  color: var(--primary);
  vertical-align: middle;
`;

const Wallet = ({ walletBalance }) => {
  return (
    <WalletContainer>
      <WalletGlow />
      <WalletBalance>
        <WalletIcon />
        WALLET: ${walletBalance.toFixed(2)}
      </WalletBalance>
    </WalletContainer>
  );
};

export default Wallet;