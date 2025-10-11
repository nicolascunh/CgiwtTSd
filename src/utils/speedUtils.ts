/**
 * Utilitários para conversão de velocidade
 */

/**
 * Converte velocidade para km/h
 * Detecta automaticamente se a velocidade está em m/s ou km/h
 * @param speed - Velocidade em m/s ou km/h
 * @returns Velocidade em km/h
 */
export const convertToKmh = (speed: number): number => {
  // Se a velocidade for maior que 50, provavelmente já está em km/h
  // Se for menor, provavelmente está em m/s e precisa ser convertida
  if (speed > 50) {
    return Math.round(speed);
  } else {
    return Math.round(speed * 3.6);
  }
};

/**
 * Formata velocidade para exibição
 * @param speed - Velocidade em m/s ou km/h
 * @returns String formatada com velocidade em km/h
 */
export const formatSpeed = (speed: number): string => {
  const kmh = convertToKmh(speed);
  return `${kmh} km/h`;
};

