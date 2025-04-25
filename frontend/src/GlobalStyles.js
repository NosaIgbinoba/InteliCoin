import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    background: ${props => props.theme.colors.darker};
    color: ${props => props.theme.colors.light};
    font-family: ${props => props.theme.fonts.main};
    overflow-x: hidden;
  }

  .app-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
    position: relative;
    z-index: 10;
  }

  .section-title {
  text-align: center;
  font-family: var(--font-main); /* Same as Arbitrage heading font */
  color: var(--light);
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

  .grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
  }
`;



export default GlobalStyles;