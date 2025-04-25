import React from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  height: 100vh;
  background-color: #0b0c2a;
`;

const VisualSide = styled.div`
  flex: 1;
  background: linear-gradient(135deg, #3c42a3, #5b9ee1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: white;
  font-family: 'Arial', sans-serif;

  h1 {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  p {
    font-size: 1rem;
    margin-bottom: 2rem;
  }

  img {
    max-width: 300px;
    border-radius: 12px;
    box-shadow: 0 0 20px rgba(0,0,0,0.4);
  }
`;

const LoginSide = styled.div`
  flex: 1;
  background-color: #101222;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Arial', sans-serif;
`;

const LoginCard = styled.div`
  background: #1a1d35;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
  width: 100%;
  max-width: 400px;
  color: white;

  h2 {
    margin-bottom: 1.5rem;
    text-align: center;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    margin-bottom: 1rem;
    border: none;
    border-radius: 8px;
    background: #2b2e4a;
    color: white;
    font-size: 1rem;
  }

  button {
    width: 100%;
    padding: 0.75rem;
    background: #00f0ff;
    color: #101222;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.3s ease;

    &:hover {
      background: #00c8d2;
    }
  }

  p {
    text-align: center;
    margin-top: 1rem;
    font-size: 0.9rem;
    color: #aaa;
  }
`;

const SplitLoginScreen = () => {
  return (
    <Container>
      <VisualSide>
        <h1>Welcome to the ArBitrage trading platform</h1>
        <p>Don't have an account yet?</p>
        <button style={{ background: '#00f0ff', color: '#101222', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 'bold' }}>Sign Up</button>
        <img src="/illustration.png" alt="illustration" style={{ marginTop: '2rem' }} />
      </VisualSide>
      <LoginSide>
        <LoginCard>
          <h2>Sign In</h2>
          <input type="email" placeholder="Enter your email" />
          <input type="password" placeholder="Enter your password" />
          <button>Sign In</button>
          <p>Forgot your password?</p>
        </LoginCard>
      </LoginSide>
    </Container>
  );
};

export default SplitLoginScreen;
