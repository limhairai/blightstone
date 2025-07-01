// Script to create a test user account
// Run this in the browser console on the registration page

async function createTestUser() {
  const email = 'limhairai@gmail.com';
  const password = 'TestPassword123!';
  
  console.log('Creating test user with email:', email);
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name: 'Hai Rai Lim'
      })
    });
    
    const result = await response.json();
    console.log('Registration result:', result);
    
    if (response.ok) {
      console.log('✅ User created successfully!');
      console.log('You can now login with:', email, password);
    } else {
      console.error('❌ Registration failed:', result);
    }
  } catch (error) {
    console.error('❌ Error creating user:', error);
  }
}

// Uncomment the line below to auto-create the user
// createTestUser(); 