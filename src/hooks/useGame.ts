import { useCallback } from 'react';
import { useGameStore, useGamePhase, useGameScore, useGameCombo, useGameGrid, useGameConfig } from '@/stores/gameStore';
import type { GameConfig } from '@/types/game';

export const useGame = () => {
  const phase = useGamePhase();
  const score = useGameScore();
  const combo = useGameCombo();
  const grid = useGameGrid();
  const config = useGameConfig();
  
  const { initGame, startGame, handleClick, setHighlight, clearHighlight, finalClick, resetGame, getRecord } = useGameStore();
  
  const initializeGame = useCallback((gameConfig: GameConfig) => {
    initGame(gameConfig);
  }, [initGame]);
  
  const start = useCallback(() => {
    startGame();
  }, [startGame]);
  
  const handleCellClick = useCallback((row: number, col: number, type: 'click' | 'keyboard' = 'click') => {
    return handleClick(row, col, type);
  }, [handleClick]);
  
  const handleFinalClick = useCallback(() => {
    finalClick();
  }, [finalClick]);
  
  const reset = useCallback(() => {
    resetGame();
  }, [resetGame]);
  
  const getGameRecord = useCallback(() => {
    return getRecord();
  }, [getRecord]);
  
  return {
    phase,
    score,
    combo,
    grid,
    config,
    initializeGame,
    start,
    handleCellClick,
    setHighlight,
    clearHighlight,
    handleFinalClick,
    reset,
    getGameRecord,
  };
};
