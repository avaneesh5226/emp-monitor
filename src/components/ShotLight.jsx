import React from 'react';

const ShotLight = ({ shots, index, onClose, onIndex }) => {
  if (index === null || !shots?.length) return null;
  const shot = shots[index];

  return (
    <div className="modal-overlay lightbox" onClick={onClose}>
      <button className="lightbox-close" type="button" onClick={onClose} aria-label="Close">×</button>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-stage">
          <button className="lightbox-nav" type="button" disabled={index === 0} onClick={() => onIndex(index - 1)} aria-label="Previous">‹</button>
          <figure className="lightbox-frame">
            <img src={shot.url} alt={`Screen capture at ${shot.time}`} />
          </figure>
          <button className="lightbox-nav" type="button" disabled={index === shots.length - 1} onClick={() => onIndex(index + 1)} aria-label="Next">›</button>
        </div>
        <div className="lightbox-caption">Captured at {shot.time}</div>
        <div className="lightbox-count">{index + 1} / {shots.length}</div>
      </div>
    </div>
  );
};

export default ShotLight;
