import fs from 'fs';
import path from 'path';

import { glob } from 'glob';

async function migrateAuthImports() {
  // console.log('🔄 Migrating NextAuth imports to new auth system...\n');

  // Find all TypeScript/JavaScript files
  const files = await glob('**/*.{ts,tsx,js,jsx}', {
    ignore: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'scripts/migrate-auth.ts',
      'lib/auth.ts',
      'contexts/AuthContext.tsx',
    ],
    cwd: 'F:\\projekte\\flux2\\fluxao',
  });

  let updatedCount = 0;

  for (const file of files) {
    const filePath = path.join('F:\\projekte\\flux2\\fluxao', file);
    let content = fs.readFileSync(filePath, 'utf-8');
    let hasChanges = false;

    // Replace NextAuth imports
    if (content.includes("from 'next-auth'")) {
      content = content.replace(
        /import \{ getServerSession \} from ['"]next-auth['"]/g,
        "import { getUserFromCookies } from '@/lib/auth'",
      );
      hasChanges = true;
    }

    if (content.includes("from 'next-auth/react'")) {
      // Replace useSession with useAuth
      content = content.replace(
        /import \{ useSession[^}]*\} from ['"]next-auth\/react['"]/g,
        "import { useAuth } from '@/contexts/AuthContext'",
      );

      // Replace signIn, signOut imports
      content = content.replace(
        /import \{ signIn[^}]*\} from ['"]next-auth\/react['"]/g,
        "import { useAuth } from '@/contexts/AuthContext'",
      );

      content = content.replace(
        /import \{ signOut[^}]*\} from ['"]next-auth\/react['"]/g,
        "import { useAuth } from '@/contexts/AuthContext'",
      );
      hasChanges = true;
    }

    // Replace usage patterns
    if (content.includes('useSession()')) {
      content = content.replace(
        /const \{ data: session[^}]*\} = useSession\(\)/g,
        'const { user, loading } = useAuth()',
      );
      hasChanges = true;
    }

    if (content.includes('getServerSession')) {
      content = content.replace(
        /const session = await getServerSession\([^)]*\)/g,
        'const user = await getUserFromCookies()',
      );
      hasChanges = true;
    }

    // Replace session?.user with user
    if (content.includes('session?.user')) {
      content = content.replace(/session\?\.user/g, 'user');
      hasChanges = true;
    }

    if (content.includes('session.user')) {
      content = content.replace(/session\.user/g, 'user');
      hasChanges = true;
    }

    // Replace session checks
    if (content.includes('if (!session)')) {
      content = content.replace(/if \(!session\)/g, 'if (!user)');
      hasChanges = true;
    }

    if (content.includes('if (session)')) {
      content = content.replace(/if \(session\)/g, 'if (user)');
      hasChanges = true;
    }

    // Replace authOptions import
    if (content.includes("from '@/lib/auth-config'")) {
      // Remove authOptions imports
      content = content.replace(
        /import \{ authOptions \} from ['"]@\/lib\/auth-config['"]\n?/g,
        '',
      );
      hasChanges = true;
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      // console.log(`✅ Updated: ${file}`);
      updatedCount++;
    }
  }

  // console.log(`\n📊 Migration complete! Updated ${updatedCount} files.`);
  // console.log('\n⚠️  Please review the following:');
  // console.log('1. Check API routes for proper authentication');
  // console.log('2. Update any custom authentication logic');
  // console.log('3. Test all protected routes');
  // console.log('4. Remove old auth-config.ts file when ready');
}

migrateAuthImports().catch(console.error);
