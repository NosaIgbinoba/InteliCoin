import React from 'react';
import styled from 'styled-components';
import { FaEthereum, FaBitcoin } from 'react-icons/fa';

const WalletContainer = styled.div`
  background: rgba(10, 10, 30, 0.7);
  border-radius: 15px;
  padding: 1.5rem;
  border: 1px solid ${props => props.theme.colors.secondary};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      45deg,
      transparent 65%,
      ${props => props.theme.colors.secondary} 150%
    );
    opacity: 0.1;
    pointer-events: none;
  }
`;

const BalanceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const BalanceTitle = styled.h3`
  color: ${props => props.theme.colors.primary};
  text-shadow: ${props => props.theme.effects.textGlow};
  margin: 0;
`;

const BalanceAmount = styled.div`
  font-size: 2rem;
  color: ${props => props.theme.colors.accent};
  font-family: ${props => props.theme.fonts.main};
  text-shadow: ${props => props.theme.effects.textGlow};
`;

const Asset = styled.div`
  display: flex;
  align-items: center;
  padding: 0.8rem 0;
  border-top: 1px dashed rgba(0, 240, 255, 0.3);
`;

const AssetIcon = styled.div`
  width: 30px;
  height: 30px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  
  svg {
    color: ${props => props.color};
  }
`;

const AssetDetails = styled.div`
  flex: 1;
`;

const AssetName = styled.div`
  color: ${props => props.theme.colors.light};
`;

const AssetValue = styled.div`
  color: ${props => props.theme.colors.accent};
`;

const WalletStatus = ({ walletBalance, btcBalance = 0 }) => {
  const assets = [
    { 
      name: 'Bitcoin', 
      value: btcBalance, 
      icon: <FaBitcoin />, 
      color: '#f7931a',
      usdValue: btcBalance * 50000 // Example BTC price for display
    },
    { 
      name: 'Ethereum', 
      value: 0, 
      icon: <FaEthereum />, 
      color: '#627eea',
      usdValue: 0
    }
  ];

  return (
    <WalletContainer>
      <BalanceHeader>
        <BalanceTitle>WALLET STATUS</BalanceTitle>
        <BalanceAmount>${walletBalance.toFixed(2)}</BalanceAmount>
      </BalanceHeader>
      {assets.map((asset, index) => (
        <Asset key={index}>
          <AssetIcon color={asset.color}>{asset.icon}</AssetIcon>
          <AssetDetails>
            <AssetName>{asset.name}</AssetName>
            <AssetValue>
              {asset.value.toFixed(6)} {asset.name.substring(0, 3)} • 
              ${asset.usdValue.toFixed(2)}
            </AssetValue>
          </AssetDetails>
        </Asset>
      ))}
    </WalletContainer>
  );
};

export default WalletStatus;