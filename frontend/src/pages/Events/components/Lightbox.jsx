import React from 'react';

const Lightbox = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;
  return (
    <div className="ev-lightbox-overlay" onClick={onClose}>
      <button className="ev-lightbox-close" onClick={onClose}>✕</button>
      <img src={imageUrl} alt="Event flyer" className="ev-lightbox-image" onClick={(e) => e.stopPropagation()} />
    </div>
  );
};

export default Lightbox;
