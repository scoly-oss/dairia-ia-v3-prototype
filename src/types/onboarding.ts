export interface OnboardingData {
  /** IDCC code (e.g., "1486") */
  idcc: string;
  /** Convention collective label (e.g., "Syntec") */
  idccLabel: string;
  effectif: number | '';
  activite: string;
}

export interface OnboardingStepProps {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
}
