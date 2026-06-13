import React from 'react';

const ChatGreeting = ({ userName, LogoPath }) => {
  const getGreetingText = () => {
    const hour = new Date().getHours();
    let timeOfDay = 'day';
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else timeOfDay = 'evening';

    return userName ? `Good ${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}, ${userName}` : `Good ${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}`;
  };

  return (
    <>
      {/* Center Logo */}
      <div className="center-logo-wrapper">
        <div className="center-logo mask-logo" style={{ WebkitMaskImage: `url(${LogoPath})`, maskImage: `url(${LogoPath})` }}></div>
      </div>

      {/* Greeting */}
      <div className="greeting-container">
        <h1 className="greeting-text">
          {getGreetingText()}
        </h1>
        <h2 className="greeting-subtext">
          How Can I <span className="highlight-gradient">Assist You Today?</span>
        </h2>
      </div>
    </>
  );
};

export default ChatGreeting;
