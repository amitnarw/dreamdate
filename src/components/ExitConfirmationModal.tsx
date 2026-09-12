import React from 'react';
import { BackHandler } from 'react-native';
import AppModal from './AppModal';

interface ExitConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onExit?: () => void;
}

export default function ExitConfirmationModal({
  visible,
  onClose,
  onExit,
}: ExitConfirmationModalProps) {
  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      BackHandler.exitApp();
    }
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title="Exit BoloNa?"
      description="Are you sure you want to leave? Your virtual companions will be waiting for you!"
      icon="log-out-outline"
      iconColor="#F65592"
      secondaryAction={{
        label: 'Stay',
        onPress: onClose,
      }}
      primaryAction={{
        label: 'Exit App',
        variant: 'destructive',
        onPress: handleExit,
      }}
    />
  );
}
