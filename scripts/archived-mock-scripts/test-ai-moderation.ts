// Test Script for AI Moderation System

import { moderateComment } from '../lib/ai-moderation';

async function testModerationSystem() {
  console.log('🤖 Testing AI Comment Moderation System\n');

  const testCases = [
    {
      name: 'Clean Comment',
      content: 'Das ist ein sehr interessanter Artikel! Vielen Dank für die Informationen.',
      author: 'Max Mustermann',
      expected: 'approved'
    },
    {
      name: 'Profanity',
      content: 'Das ist scheiße und du bist ein Idiot!',
      author: 'BadUser',
      expected: 'rejected'
    },
    {
      name: 'Spam',
      content: 'Klick hier für kostenlose Bitcoin! www.spam.com Jetzt kaufen!',
      author: 'SpamBot',
      expected: 'spam'
    },
    {
      name: 'Toxic Content',
      content: 'Alle Deutschen sind dumm und sollten geh sterben!',
      author: 'ToxicUser',
      expected: 'rejected'
    },
    {
      name: 'Borderline Content',
      content: 'Mist, das ist echt blöd gelaufen. Aber trotzdem interessant.',
      author: 'NormalUser',
      expected: 'review'
    },
    {
      name: 'Too Short',
      content: 'Ok',
      author: 'LazyUser',
      expected: 'rejected'
    },
    {
      name: 'Excessive Caps',
      content: 'DAS IST WIRKLICH SEHR INTERESSANT UND ICH BIN BEGEISTERT!!!',
      author: 'LoudUser',
      expected: 'review'
    }
  ];

  for (const test of testCases) {
    console.log(`📝 Testing: ${test.name}`);
    console.log(`Content: "${test.content}"`);
    
    try {
      const result = await moderateComment(test.content, test.author);
      
      console.log(`✅ Status: ${result.status} (Score: ${result.score.toFixed(2)})`);
      console.log(`📋 Reason: ${result.reason}`);
      console.log(`🚩 Flags: [${result.flags.join(', ')}]`);
      
      const statusIcon = result.status === test.expected ? '✅' : '❌';
      console.log(`${statusIcon} Expected: ${test.expected}, Got: ${result.status}\n`);
      
    } catch (error) {
      console.error(`❌ Error testing "${test.name}":`, error);
    }
  }
  
  console.log('🎉 AI Moderation Test Complete!');
}

// Run test if called directly
if (require.main === module) {
  testModerationSystem().catch(console.error);
}

export default testModerationSystem;