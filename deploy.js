#!/usr/bin/env node

/**
 * This is a helper script to prepare your SmartKosh project for deployment
 * Run it with: node deploy.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 SmartKosh Deployment Preparation Script');
console.log('==========================================\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('❌ .env file is missing. Creating from .env.example...');
  try {
    fs.copyFileSync('.env.example', '.env');
    console.log('✅ Created .env file. Please edit it with your actual values.');
  } catch (err) {
    console.error('❌ Failed to create .env file:', err);
    process.exit(1);
  }
}

// Function to update the .env file with user input
const updateEnvFile = () => {
  rl.question('\n📌 Enter your Supabase PostgreSQL URL: ', (dbUrl) => {
    if (!dbUrl) {
      console.log('❌ Database URL is required for deployment.');
      return rl.close();
    }

    rl.question('📌 Enter your deployment URL (e.g., https://smartkosh.vercel.app): ', (deployUrl) => {
      deployUrl = deployUrl || 'http://localhost:3000';

      rl.question('📌 Enter a secure string for NEXTAUTH_SECRET (or press Enter to generate one): ', (authSecret) => {
        if (!authSecret) {
          try {
            authSecret = require('crypto').randomBytes(32).toString('hex');
            console.log('✅ Generated NEXTAUTH_SECRET');
          } catch (err) {
            authSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            console.log('✅ Generated fallback NEXTAUTH_SECRET');
          }
        }

        rl.question('📌 Enter a secure string for JWT_SECRET (or press Enter to generate one): ', (jwtSecret) => {
          if (!jwtSecret) {
            try {
              jwtSecret = require('crypto').randomBytes(32).toString('hex');
              console.log('✅ Generated JWT_SECRET');
            } catch (err) {
              jwtSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
              console.log('✅ Generated fallback JWT_SECRET');
            }
          }

          rl.question('📌 Enter your OpenAI API key (optional): ', (openaiKey) => {
            // Update .env file
            let envContent = fs.readFileSync('.env', 'utf8');
            envContent = envContent
              .replace(/DATABASE_URL=".*"/, `DATABASE_URL="${dbUrl}"`)
              .replace(/NEXTAUTH_URL=".*"/, `NEXTAUTH_URL="${deployUrl}"`)
              .replace(/NEXTAUTH_SECRET=".*"/, `NEXTAUTH_SECRET="${authSecret}"`)
              .replace(/JWT_SECRET=".*"/, `JWT_SECRET="${jwtSecret}"`);

            if (openaiKey) {
              envContent = envContent.replace(/OPENAI_API_KEY=".*"/, `OPENAI_API_KEY="${openaiKey}"`);
            }

            fs.writeFileSync('.env', envContent);
            console.log('✅ Updated .env file with your values.');

            console.log('\n🔍 Running build to check for errors...');
            try {
              execSync('npm run build', { stdio: 'inherit' });
              console.log('✅ Build completed successfully.');
              console.log('\n🚀 Your project is ready for deployment to Vercel!');
              console.log('\nNext steps:');
              console.log('1. Commit your changes: git add . && git commit -m "Ready for deployment"');
              console.log('2. Push to GitHub: git push');
              console.log('3. Connect your repository to Vercel and deploy');
              console.log('4. Add the environment variables to your Vercel project');
            } catch (err) {
              console.error('❌ Build failed. Please fix the errors before deploying.');
            }
            rl.close();
          });
        });
      });
    });
  });
};

// Prompt user for Supabase setup
console.log('\n🔹 Supabase Setup');
console.log('=================');
console.log('To set up SmartKosh with Supabase:');
console.log('1. Create a Supabase project at https://supabase.com');
console.log('2. Go to Project Settings > Database to find your connection string');
console.log('3. Set the connection string in your .env file\n');

rl.question('Do you have your Supabase connection details ready? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    updateEnvFile();
  } else {
    console.log('\n⚠️ Please set up your Supabase project first.');
    console.log('Follow the instructions in README.md for deploying to Vercel with Supabase.');
    rl.close();
  }
});

rl.on('close', () => {
  console.log('\nThank you for using SmartKosh! 🙏');
  process.exit(0);
}); 