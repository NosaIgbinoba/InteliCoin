import React, { useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import AnimatedBackground from './AnimatedBackground';
import loginArt from '../assets/login-illustration.png'; // Replace with your actual image path

const Container = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const AuthCard = styled.div`
  display: flex;
  width: 900px;
  height: 500px;
  max-width: 95vw;
  max-height: 90vh;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 0 25px rgba(0, 240, 255, 0.2), 0 0 8px var(--accent);
  border: 1px solid var(--primary);
  z-index: 2;
`;

const FormSide = styled.div`
  flex: 1;
  padding: 3rem;
  background: rgba(20, 20, 40, 0.95);
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const IllustrationSide = styled.div`
  flex: 1;
  background-image: url(${loginArt});
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
`;

const Title = styled.h2`
  color: var(--primary);
  text-align: center;
  margin-bottom: 1.5rem;
  font-family: var(--font-main);
`;

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem;
  padding-right: 3rem;
  margin-bottom: 1rem;
  background: rgba(15, 15, 35, 0.8);
  border: 1px solid var(--primary);
  border-radius: 10px;
  color: var(--light);
  font-family: var(--font-secondary);
`;

const ToggleIcon = styled.span`
  position: absolute;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%);
  cursor: pointer;
  fill: var(--light);
`;

const Button = styled.button`
  width: 100%;
  padding: 1rem;
  margin-top: 0.5rem;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: var(--dark);
  font-weight: bold;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-family: var(--font-main);
`;

const Toggle = styled.p`
  margin-top: 1.5rem;
  text-align: center;
  color: var(--accent);
  cursor: pointer;
  font-size: 0.9rem;
`;

const StatusMessage = styled.div`
  margin-top: 1rem;
  color: ${({ error }) => (error ? '#ff5252' : '#00ff88')};
  text-align: center;
  font-size: 0.85rem;
`;

const AuthForm = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [status, setStatus] = useState({ message: '', error: false });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const url = `http://127.0.0.1:5000/${isLogin ? 'login' : 'register'}`;
    try {
      const res = await axios.post(url, form);
      if (isLogin) {
        setStatus({ message: 'Logged in!', error: false });
        localStorage.setItem('token', res.data.access_token);
        onLoginSuccess && onLoginSuccess(res.data);
      } else {
        setStatus({ message: 'Registered successfully. Please log in.', error: false });
        setIsLogin(true);
      }
    } catch (err) {
      setStatus({
        message: err.response?.data?.message || 'Something went wrong.',
        error: true,
      });
    }
  };

  return (
    <>
      <AnimatedBackground />
      <Container>
        <AuthCard>
          <FormSide>
            <form onSubmit={handleAuth}>
              <Title>{isLogin ? 'Login' : 'Register'}</Title>

              {!isLogin && (
                <Input
                  name="username"
                  placeholder="Username"
                  value={form.username}
                  onChange={handleChange}
                />
              )}

              <Input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
              />

              <InputWrapper>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <ToggleIcon onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <svg height="20" width="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 5c-7.633 0-11.344 6.215-11.938 7.16a1.002 1.002 0 0 0 0 .682c.594.945 4.305 7.16 11.938 7.16s11.344-6.215 11.938-7.16a1.002 1.002 0 0 0 0-.682C23.344 11.215 19.633 5 12 5zm0 12c-3.859 0-7-3.141-7-7s3.141-7 7-7 7 3.141 7 7-3.141 7-7 7z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  ) : (
                    <svg height="20" width="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 6.5c-3.406 0-6.406 2.109-8.109 5.5 1.703 3.391 4.703 5.5 8.109 5.5s6.406-2.109 8.109-5.5C18.406 8.609 15.406 6.5 12 6.5zM12 15c-1.657 0-3-1.343-3-3 0-.343.07-.671.191-.975l3.784 3.784C12.671 14.93 12.343 15 12 15zm2.809-.025L11.025 11.19C11.329 11.07 11.657 11 12 11c1.657 0 3 1.343 3 3 0 .343-.07.671-.191.975z"/>
                    </svg>
                  )}
                </ToggleIcon>
              </InputWrapper>

              <Button type="submit">{isLogin ? 'Login' : 'Register'}</Button>

              {status.message && (
                <StatusMessage error={status.error}>{status.message}</StatusMessage>
              )}
            </form>

            <Toggle onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </Toggle>
          </FormSide>
          <IllustrationSide />
        </AuthCard>
      </Container>
    </>
  );
};

export default AuthForm;
