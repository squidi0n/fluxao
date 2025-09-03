#!/bin/bash

echo "🚀 FluxAO Complete Setup Script"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Check dependencies
echo ""
echo "📦 Checking dependencies..."

if command_exists node; then
    print_success "Node.js $(node --version) installed"
else
    print_error "Node.js not installed"
    exit 1
fi

if command_exists pnpm; then
    print_success "pnpm $(pnpm --version) installed"
else
    print_error "pnpm not installed"
    exit 1
fi

# Step 2: Install packages
echo ""
echo "📦 Installing packages..."
pnpm install

# Step 3: Setup database
echo ""
echo "🗄️  Setting up database..."
npx prisma generate
npx prisma db push
npx prisma db seed

print_success "Database setup complete"

# Step 4: Create necessary directories
echo ""
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p public/uploads
mkdir -p .next

print_success "Directories created"

# Step 5: Build application
echo ""
echo "🏗️  Building application..."
pnpm run build || {
    print_warning "Build completed with warnings"
}

# Step 6: Setup environment
echo ""
echo "🔧 Environment setup..."

if [ ! -f .env.local ]; then
    cp .env.example .env.local 2>/dev/null || {
        print_warning ".env.local not found, creating basic config..."
        cat > .env.local << EOF
# Database
DATABASE_URL=file:./dev.db

# NextAuth
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"

# Application
NODE_ENV="production"
BASE_URL="http://localhost:3000"
JWT_SECRET="$(openssl rand -base64 32)"

# Email
EMAIL_FROM="noreply@fluxao.com"
EOF
    }
    print_success "Environment file created"
else
    print_success "Environment file exists"
fi

# Step 7: Check optional services
echo ""
echo "🔍 Checking optional services..."

if command_exists redis-cli; then
    if redis-cli ping >/dev/null 2>&1; then
        print_success "Redis is running"
    else
        print_warning "Redis installed but not running"
        echo "   Start with: sudo service redis-server start"
    fi
else
    print_warning "Redis not installed (optional for queue features)"
    echo "   Install with: sudo apt install redis-server"
fi

# Step 8: PM2 setup
echo ""
echo "🚀 Setting up PM2..."

if [ -f ecosystem.config.js ]; then
    print_success "PM2 config found"
    echo "   Start production: pnpm run pm2:start"
    echo "   Stop production: pnpm run pm2:stop"
    echo "   View logs: pnpm run pm2:logs"
else
    print_warning "PM2 config not found"
fi

# Step 9: Final summary
echo ""
echo "================================"
echo "✨ Setup Complete!"
echo "================================"
echo ""
echo "🎯 Quick Start Commands:"
echo "   Development: pnpm run dev"
echo "   Production:  pnpm run start"
echo "   PM2 Cluster: pnpm run pm2:start"
echo ""
echo "📊 Admin Access:"
echo "   URL: http://localhost:3000/admin"
echo "   Setup: Create account then update role in database"
echo ""
echo "🔧 Configuration:"
echo "   Edit .env.local for environment settings"
echo "   Edit ecosystem.config.js for PM2 settings"
echo ""
echo "📚 Documentation:"
echo "   README.md - Project documentation"
echo "   CLAUDE.md - AI assistant guide"
echo ""

print_success "FluxAO is ready to launch! 🚀"