import React, { useState } from 'react';
import styled from 'styled-components';

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
  width: 320px;
  box-shadow: 0 0 30px rgba(0, 240, 255, 0.15);
`;

const Title = styled.h3`
  margin: 0 0 1rem;
  color: var(--accent);
  font-family: var(--font-main);
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  margin-bottom: 1rem;
  background: rgba(15, 15, 35, 0.8);
  border: 1px solid var(--primary);
  border-radius: 8px;
  color: var(--light);
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Button = styled.button`
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-family: var(--font-main);
  background: ${props => props.variant === 'confirm' ? 'var(--primary)' : '#333'};
  color: ${props => props.variant === 'confirm' ? 'var(--dark)' : '#ccc'};

  &:hover {
    opacity: 0.9;
  }
`;

const DepositModal = ({ onClose, onConfirm }) => {
  const [amount, setAmount] = useState('');

  const handleConfirm = () => {
    const parsed = parseFloat(amount);
    if (!isNaN(parsed) && parsed > 0) {
      onConfirm(parsed);
      onClose();
    }
  };

  return (
    <Overlay>
      <ModalCard>
        <Title>Deposit Funds</Title>
        <Input
          type="number"
          placeholder="Amount (USD)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <ButtonRow>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="confirm" onClick={handleConfirm}>Confirm</Button>
        </ButtonRow>
      </ModalCard>
    </Overlay>
  );
};

export default DepositModal;
