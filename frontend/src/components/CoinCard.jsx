import React from 'react';
import styled from 'styled-components';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const Card = styled.div`
  background: rgba(20, 20, 40, 0.9);
  border-radius: 15px;
  padding: 1.5rem;
  width: 250px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.08);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 0 30px rgba(0, 240, 255, 0.15);
  }
`;

const Title = styled.h4`
  font-size: 1.1rem;
  color: var(--light);
  margin: 0;
`;

const Symbol = styled.span`
  font-size: 0.8rem;
  color: #aaa;
  margin-bottom: 1rem;
`;

const Price = styled.div`
  font-size: 1.5rem;
  color: white;
  font-weight: bold;
  margin: 0.3rem 0;
`;

const Change = styled.div`
  font-size: 0.95rem;
  color: ${props => props.positive ? '#00ff88' : '#ff3366'};
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: bold;
`;

const Amount = styled.div`
  margin-top: 1rem;
  font-size: 0.85rem;
  color: var(--accent);
  opacity: 0.9;
`;

const CoinValue = styled.div`
  font-size: 0.85rem;
  color: var(--light);
  margin-top: 0.3rem;
  opacity: 0.6;
`;

const TrendBox = styled.div`
  height: 8px;
  width: 100%;
  border-radius: 4px;
  margin-top: 1rem;
  background: ${props => props.color || '#888'};
  opacity: 0.4;
`;

const CoinCard = ({ name, symbol, price, change, trend, color, amount }) => {
  return (
    <Card>
      <div>
        <Title>{name}</Title>
        <Symbol>{symbol}</Symbol>

        <Price>${price.toLocaleString()}</Price>

        <Change positive={change >= 0}>
          {change >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
          {change >= 0 ? '+' : ''}{change}%
        </Change>

        {amount !== undefined && (
          <>
              <Amount>Holdings: {parseFloat(amount).toFixed(4)} {symbol}</Amount>
              <CoinValue>
              ≈ ${(amount * price).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </CoinValue>
          </>
        )}
      </div>

      <TrendBox color={color} />
    </Card>
  );
};

export default CoinCard;