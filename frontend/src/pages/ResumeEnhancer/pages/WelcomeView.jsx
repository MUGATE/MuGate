import React, { useState } from 'react';
import WelcomeModal from '../components/WelcomeModal';
import CVTypeModal from '../components/CVTypeModal';

const WelcomeView = ({ onChoose }) => {
  const [showCVType, setShowCVType] = useState(false);

  if (showCVType) {
    return (
      <CVTypeModal
        onChoose={onChoose}
        onBack={() => setShowCVType(false)}
      />
    );
  }

  return (
    <WelcomeModal
      onChoose={(choice) => {
        if (choice === 'create') {
          setShowCVType(true);
        } else {
          onChoose('enhance');
        }
      }}
    />
  );
};

export default WelcomeView;
