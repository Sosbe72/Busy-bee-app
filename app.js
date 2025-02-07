import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const supabaseUrl = 'https://vkockcmcakjwzkradurv.supabase.co'; // Replace with your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrb2NrY21jYWtqd3prcmFkdXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5NjE3NTcsImV4cCI6MjA1NDUzNzc1N30.xi_J6hnQ6QibQkRYCYl8eL6_VkFqbkYpueV85havAgY'; // Replace with your Supabase API Key
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Tamagotchi state
let tamagotchi = {
  hunger: 100,
  happiness: 100,
  pollen: 0,
  honey: 0,
  isScouting: false
};

// Unique user ID
let userId = Math.random().toString(36).substring(7);
let otherBeeActive = false;

// Update user activity
function updateUserActivity() {
  supabase
    .from('connected_users')
    .upsert({ user_id: userId, last_active: new Date() })
    .then(() => {
      console.log('User activity updated');
    });
}

// Check for connected users
async function checkConnectedUsers() {
  const { data } = await supabase
    .from('connected_users')
    .select('*')
    .gte('last_active', new Date(Date.now() - 10000).toISOString());

  if (data.length >= 2) {
    document.getElementById('otherBee').style.display = 'block';
    otherBeeActive = true;
  } else {
    document.getElementById('otherBee').style.display = 'none';
    otherBeeActive = false;
  }
}

// Chat functionality
document.getElementById('chatButton').addEventListener('click', () => {
  const chatBubble = document.getElementById('chatBubble');
  chatBubble.style.display = chatBubble.style.display === 'none' ? 'block' : 'none';
});

function sendMessage() {
  const message = document.getElementById('chatInput').value;
  if (message) {
    supabase
      .from('messages')
      .insert({ user_id: userId, message })
      .then(() => {
        console.log('Message sent');
        document.getElementById('chatInput').value = '';
      });
  }
}

// Listen for new messages
supabase
  .channel('messages')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
    const message = payload.new.message;
    alert(`New message: ${message}`);
  })
  .subscribe();

// Initialize user activity tracking
updateUserActivity();
setInterval(updateUserActivity, 5000);
setInterval(checkConnectedUsers, 5000);

// Update UI function
function updateUI() {
  document.getElementById('honey').textContent = tamagotchi.honey;
  document.getElementById('pollen').textContent = tamagotchi.pollen;
  document.getElementById('hunger').textContent = tamagotchi.hunger;
  document.getElementById('happiness').textContent = tamagotchi.happiness;

  // Update bee emoji and mood status
  const petElement = document.getElementById('pet');
  const moodElement = document.getElementById('mood');

  if (tamagotchi.health <= 0) {
    petElement.textContent = '💀';
    petElement.classList.remove('pulse');
    moodElement.textContent = '💀';
  } else if (tamagotchi.isSick) {
    petElement.textContent = '🐝🤒';
    moodElement.textContent = '🤒';
  } else if (tamagotchi.happiness >= 80 && tamagotchi.hunger >= 80) {
    petElement.textContent = '🐝😊';
    moodElement.textContent = '😊';
  } else if (tamagotchi.happiness <= 30 || tamagotchi.hunger <= 30) {
    petElement.textContent = '🐝😢';
    moodElement.textContent = '😢';
  } else {
    petElement.textContent = '🐝';
    moodElement.textContent = '😐';
  }
}

// Make honey button
function makeHoney() {
  if (tamagotchi.pollen >= 5) {
    tamagotchi.pollen -= 5;
    tamagotchi.honey++;
    document.getElementById('honey').classList.add('honey-animation');
    setTimeout(() => {
      document.getElementById('honey').classList.remove('honey-animation');
    }, 500);
    updateUI();
    updateSupabase();
  }
}

// Update Supabase
async function updateSupabase() {
  await supabase
    .from('tamagotchi')
    .upsert({ id: 1, ...tamagotchi });
}

// Initialize app
initializeApp();