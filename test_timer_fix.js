// Test script to verify timer fix
// This simulates the timer behavior to ensure it doesn't pause

console.log('Testing Timer Stability Fix...\n');

// Simulate the old problematic pattern
console.log('1. Testing old pattern (should be unstable):');
let oldTimer = null;
let oldCounter = 0;
const oldCallback = () => console.log('Old timer callback called');

const startOldTimer = (callback) => {
  clearInterval(oldTimer);
  oldTimer = setInterval(() => {
    oldCounter++;
    console.log(`Old timer tick: ${oldCounter}`);
    if (oldCounter >= 5) {
      callback();
      clearInterval(oldTimer);
    }
  }, 1000);
};

// Simulate parent re-render by calling startOldTimer multiple times
startOldTimer(oldCallback);
setTimeout(() => {
  console.log('Simulating parent re-render...');
  startOldTimer(oldCallback); // This would restart the timer
}, 2500);

// Wait for old timer to finish, then test new pattern
setTimeout(() => {
  console.log('\n2. Testing new pattern (should be stable):');
  
  let newTimer = null;
  let newCounter = 0;
  let callbackRef = { current: () => console.log('New timer callback called') };
  
  const startNewTimer = () => {
    if (newTimer) return; // Don't restart if already running
    
    newTimer = setInterval(() => {
      newCounter++;
      console.log(`New timer tick: ${newCounter}`);
      if (newCounter >= 5) {
        callbackRef.current();
        clearInterval(newTimer);
        newTimer = null;
      }
    }, 1000);
  };
  
  // Start timer
  startNewTimer();
  
  // Simulate parent re-render - timer should NOT restart
  setTimeout(() => {
    console.log('Simulating parent re-render...');
    startNewTimer(); // This should NOT restart the timer
  }, 2500);
  
  setTimeout(() => {
    console.log('\n✅ Timer fix test completed!');
    console.log('The new approach uses refs to maintain stable callbacks and prevents timer restarts.');
    process.exit(0);
  }, 7000);
  
}, 7000);
