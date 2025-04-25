import React from 'react';
import styled, { keyframes } from 'styled-components';

const move = keyframes`
  0% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(50px, 50px);
  }
  100% {
    transform: translate(0, 0);
  }
`;

const BackgroundContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
`;

const Particle = styled.div`
  position: absolute;
  width: 2px;
  height: 2px;
  background: ${props => props.color};
  border-radius: 50%;
  opacity: 0.5;
  animation: ${move} ${props => props.duration || '10s'} infinite ease-in-out;
  top: ${props => props.top || '50%'};
  left: ${props => props.left || '50%'};
`;

const AnimatedBackground = () => {
  const particles = [];
  const colors = ['#00f0ff', '#ff00f0', '#00ff9d', '#ffcc00', '#00ccff'];
  
  for (let i = 0; i < 30; i++) {
    particles.push({
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: `${10 + Math.random() * 20}s`,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${1 + Math.random() * 3}px`
    });
  }
  
  return (
    <BackgroundContainer>
      {particles.map(particle => (
        <Particle
          key={particle.id}
          color={particle.color}
          duration={particle.duration}
          top={particle.top}
          left={particle.left}
          style={{ width: particle.size, height: particle.size }}
        />
      ))}
    </BackgroundContainer>
  );
};

export default AnimatedBackground;