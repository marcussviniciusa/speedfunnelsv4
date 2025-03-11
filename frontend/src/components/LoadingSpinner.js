import React from 'react';
import './LoadingSpinner.css';

/**
 * Componente de spinner de carregamento
 * @param {Object} props - Propriedades do componente
 * @param {string} props.size - Tamanho do spinner (small, medium, large)
 * @param {string} props.color - Cor do spinner (primary, secondary, light, dark)
 * @returns {JSX.Element} Componente de spinner
 */
const LoadingSpinner = ({ size = 'medium', color = 'primary' }) => {
  const sizeClass = `spinner-${size}`;
  const colorClass = `spinner-${color}`;
  
  return (
    <div className={`loading-spinner ${sizeClass} ${colorClass}`}>
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Carregando...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
