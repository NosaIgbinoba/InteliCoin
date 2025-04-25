import React from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  backdrop-filter: blur(10px);
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Content = styled.div`
  position: relative;
  z-index: 10000;
  background: #111828;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 0 30px rgba(0, 240, 255, 0.4);
  width: 95%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: var(--accent);
  font-size: 1.4rem;
  cursor: pointer;
`;

const Modal = ({ children, onClose }) => {
  return (
    <Overlay onClick={onClose}>
      <Content onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}>
          ✖
        </CloseButton>
        {children}
      </Content>
    </Overlay>
  );
};

export default Modal;
