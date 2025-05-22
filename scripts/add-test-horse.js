/**
 * Create a test horse for owner ID 3 (test owner account)
 * This script is useful for debugging deployments
 */

const fetch = require('node-fetch');

async function addTestHorse() {
  console.log('Creating test horse for owner ID 3...');
  
  const testHorseData = {
    name: "Test Horse " + new Date().toISOString().slice(0, 16),
    owner_id: 3,
    location_country: "Australia",
    disciplines: ["Jumping"],
    levels: ["1.20m"],
    breeds: ["Warmblood"],
    age: 8,
    height_hands: 16.2,
    height_cm: 170,
    sex: "Gelding",
    sire: "Cornet Obolensky",
    dam: "Test Dam",
    dam_sire: "Diamant de Semilly",
    characteristics: ["Brave", "Scopey", "Athletic"],
    price_min: 25000,
    price_max: 40000,
    currency: "AUD",
    description: "A high-quality test horse for debugging deployments",
    photos: [
      "https://images.unsplash.com/photo-1648926774882-36e3d10ac018?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1553284966-19b8815c7817?w=800&auto=format&fit=crop"
    ],
    videos: []
  };

  try {
    // First try the deployment-specific endpoint
    console.log('Trying /api/deployment/add-horse endpoint...');
    
    const deploymentResponse = await fetch('http://localhost:5000/api/deployment/add-horse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testHorseData),
    });
    
    if (deploymentResponse.ok) {
      const data = await deploymentResponse.json();
      console.log('Success! Horse created using deployment endpoint:', data);
      return;
    }
    
    console.log('Deployment endpoint failed, trying test endpoint...');
    
    // If that fails, try the test endpoint
    const response = await fetch('http://localhost:5000/api/test/create-sample-horse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testHorseData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error adding test horse:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Success! Test horse created:', data);
    
    // Now check if we can get the horses for owner ID 3
    console.log('\nChecking if horse is retrievable...');
    const horsesResponse = await fetch('http://localhost:5000/api/deployment/horses');
    
    if (horsesResponse.ok) {
      const horses = await horsesResponse.json();
      console.log(`Found ${horses.length} horses for owner ID 3:`);
      horses.forEach(h => console.log(`- ${h.name} (ID: ${h.id})`));
    } else {
      console.error('Failed to retrieve horses for owner ID 3');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

addTestHorse();