import React from 'react';
import AppHeader from './AppHeader';

interface Props {
  title?: string;
  showBack?: boolean;
}

export default function CoinHeader({ title = 'BoloNa', showBack = false }: Props) {
  return <AppHeader title={title} showBack={showBack} showCoins={true} />;
}
