import React from 'react';
import styled from 'styled-components';
import { FaBitcoin, FaEthereum } from 'react-icons/fa';
import { SiLitecoin, SiRipple } from 'react-icons/si';

const HeroContainer = styled.section`
  position: relative;
  padding: 4rem 2rem;
  text-align: center;
  /* 🚫 Removed z-index to prevent layering issues */
`;

const Title = styled.h1`
  font-family: ${props => props.theme.fonts.main};
  font-size: 4rem;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.primary};
  text-shadow: ${props => props.theme.effects.textGlow};
  letter-spacing: 2px;
`;

const Subtitle = styled.p`
  font-family: ${props => props.theme.fonts.secondary};
  font-size: 1.5rem;
  color: ${props => props.theme.colors.light};
  max-width: 800px;
  margin: 0 auto 2rem;
`;

const CryptoIcons = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 2rem;

  svg {
    font-size: 3rem;
    color: ${props => props.theme.colors.accent};
    transition: all 0.3s ease;

    &:hover {
      color: ${props => props.theme.colors.primary};
      transform: translateY(-5px);
      filter: drop-shadow(${props => props.theme.effects.glow});
    }
  }
`;

const HeroSection = () => {
  return (
    <HeroContainer>
      <Title>INTELICOIN</Title>
      <Subtitle>Next-generation cryptocurrency analytics and trading platform powered by AI</Subtitle>
      <CryptoIcons>
        <FaBitcoin />
        <FaEthereum />
        <SiLitecoin />
        <SiRipple />
      </CryptoIcons>
    </HeroContainer>
  );
};

export default HeroSection;
