import React from 'react';
import { BudgetConstraintWorkspaceBar } from './BudgetConstraintWorkspaceBar';

export interface BudgetMeterProps {
  target: number;
  maxBudget: number;
  currentOffer: number;
  originalPrice: number;
  onUpdateBudget?: (newBudget: number) => void;
  onUpdateTarget?: (newTarget: number) => void;
  isLight?: boolean;
}

export const BudgetMeter: React.FC<BudgetMeterProps> = ({
  target,
  maxBudget,
  currentOffer,
  originalPrice,
  onUpdateBudget,
  onUpdateTarget,
  isLight = false,
}) => {
  return (
    <BudgetConstraintWorkspaceBar
      targetPrice={target}
      maxBudget={maxBudget}
      currentPrice={currentOffer}
      originalPrice={originalPrice}
      onUpdateBudget={onUpdateBudget}
      onUpdateTarget={onUpdateTarget}
      isLight={isLight}
      label="Budget Discipline & Constraint"
    />
  );
};

export { BudgetConstraintWorkspaceBar };
export default BudgetMeter;
