export interface GameModeConfig {
  id: 'classic' | 'blitz';
  stat2Label: string;
  stat2InitialValue: string;
  showComboBar: boolean;
  showClassicBuilder: boolean;
  instructionsVariant: 'classic' | 'blitz';
}
