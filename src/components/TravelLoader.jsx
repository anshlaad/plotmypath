import React, { useState, useEffect } from 'react';

const TravelLoader = () => {
  const messages = [
    "AI is packing your bags... 🎒",
    "Finding the best hidden gems... 🗺️",
    "Tasting the famous local food... 🍜",
    "Searching for top-rated stays... 🏨",
    "Almost there, finalizing your trip... ✨"
  ];

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // Har 2.5 second mein text change hoga
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      {/* Mast sa ghoomne wala spinner */}
      <div className="spinner" style={{
        width: '50px',
        height: '50px',
        border: '5px solid #f3f3f3',
        borderTop: '5px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
      }}></div>
      
      {/* Change hone wala text */}
      <h3 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: '500', textAlign: 'center' }}>
        {messages[messageIndex]}
      </h3>

      {/* CSS animation spinner ke liye */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default TravelLoader;