import React from 'react';
import styled from 'styled-components';

const NavBar = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: transparent;
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem;
  z-index: 1000;
`;

const NavItems = styled.div`
  display: flex;
  gap: 2rem;
  justify-content: center;
  align-items: center;
`;

const NavItem = styled.button`
  background: none;
  border: none;
  color: var(--light);
  font-size: 0.95rem;
  font-family: var(--font-secondary);
  cursor: pointer;
  position: relative;
  padding: 0.2rem 0.5rem;

  &:hover {
    color: var(--accent);
  }

  &::after {
    content: '';
    display: block;
    height: 2px;
    background: var(--accent);
    transition: 0.3s ease;
    transform: scaleX(0);
    transform-origin: center;
  }

  &:hover::after {
    transform: scaleX(1);
  }
`;

const LogoutButton = styled(NavItem)`
  color: #ff6666;
  position: absolute;
  right: 2rem;

  &:hover {
    color: #ff0000;
  }

  &::after {
    background: #ff0000;
  }
`;

const Navbar = ({ onLogout }) => {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <NavBar>
      <NavItems>
        <NavItem onClick={() => scrollTo('wallet')}>Wallet</NavItem>
        <NavItem onClick={() => scrollTo('arbitrage')}>Arbitrage</NavItem>
        <NavItem onClick={() => scrollTo('ai-analysis')}>AI Analysis</NavItem>
        <NavItem onClick={() => scrollTo('market-overview')}>Market Overview</NavItem>
        <NavItem onClick={() => scrollTo('market-trends')}>Market Trends</NavItem>
        <NavItem onClick={() => scrollTo('latest-news')}>Latest News</NavItem>
      </NavItems>

      <LogoutButton onClick={onLogout}>Logout</LogoutButton>
    </NavBar>
  );
};

export default Navbar;
