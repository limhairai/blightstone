#!/bin/bash

# AdHub Production Setup Script
# This script helps configure the production environment and CI/CD pipeline

set -e

echo "🚀 AdHub Production Setup"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    print_step "Checking dependencies..."
    
    command -v git >/dev/null 2>&1 || { print_error "Git is required but not installed. Aborting."; exit 1; }
    command -v node >/dev/null 2>&1 || { print_error "Node.js is required but not installed. Aborting."; exit 1; }
    command -v npm >/dev/null 2>&1 || { print_error "npm is required but not installed. Aborting."; exit 1; }
    command -v python3 >/dev/null 2>&1 || { print_error "Python 3 is required but not installed. Aborting."; exit 1; }
    
    print_success "All dependencies are installed"
}

# Check if we're in the right directory
check_project_structure() {
    print_step "Checking project structure..."
    
    if [ ! -f "package.json" ] && [ ! -d "frontend" ]; then
        print_error "This doesn't appear to be the AdHub project root. Please run from the project root."
        exit 1
    fi
    
    if [ ! -d ".git" ]; then
        print_error "This is not a git repository. Please initialize git first."
        exit 1
    fi
    
    print_success "Project structure looks good"
}

# Setup git branches
setup_git_branches() {
    print_step "Setting up git branches..."
    
    # Check if we're on the right branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    
    if [ "$CURRENT_BRANCH" != "staging" ] && [ "$CURRENT_BRANCH" != "main" ]; then
        print_warning "You're on branch '$CURRENT_BRANCH'. Consider switching to 'staging' or 'main'."
    fi
    
    # Create staging branch if it doesn't exist
    if ! git show-ref --verify --quiet refs/heads/staging; then
        print_step "Creating staging branch..."
        git checkout -b staging
        git push -u origin staging
        print_success "Staging branch created"
    else
        print_success "Staging branch already exists"
    fi
    
    # Create main branch if it doesn't exist
    if ! git show-ref --verify --quiet refs/heads/main; then
        print_step "Creating main branch..."
        git checkout -b main
        git push -u origin main
        print_success "Main branch created"
    else
        print_success "Main branch already exists"
    fi
}

# Install dependencies
install_dependencies() {
    print_step "Installing dependencies..."
    
    # Frontend dependencies
    if [ -d "frontend" ]; then
        print_step "Installing frontend dependencies..."
        cd frontend
        npm ci
        cd ..
        print_success "Frontend dependencies installed"
    fi
    
    # Backend dependencies
    if [ -d "backend" ]; then
        print_step "Installing backend dependencies..."
        cd backend
        pip3 install -r requirements/dev.txt
        cd ..
        print_success "Backend dependencies installed"
    fi
}

# Run tests to ensure everything works
run_tests() {
    print_step "Running tests..."
    
    # Frontend tests
    if [ -d "frontend" ]; then
        print_step "Running frontend tests..."
        cd frontend
        npm run lint || print_warning "Frontend linting failed"
        npm run type-check || print_warning "TypeScript check failed"
        npm run test || print_warning "Frontend tests failed"
        cd ..
    fi
    
    # Backend tests
    if [ -d "backend" ]; then
        print_step "Running backend tests..."
        cd backend
        python3 -m pytest tests/ || print_warning "Backend tests failed"
        cd ..
    fi
    
    print_success "Test run completed"
}

# Display next steps
show_next_steps() {
    echo ""
    echo "🎉 Setup Complete!"
    echo "=================="
    echo ""
    echo "Next steps to deploy to production:"
    echo ""
    echo "1. 🔧 Configure GitHub Secrets:"
    echo "   - Go to: https://github.com/limhairai/adhub/settings/secrets/actions"
    echo "   - Add the secrets listed in docs/deployment/PRODUCTION_DEPLOYMENT_GUIDE.md"
    echo ""
    echo "2. 🏗️ Set up Render services:"
    echo "   - Create production services on Render"
    echo "   - Configure environment variables"
    echo "   - Get service IDs for GitHub secrets"
    echo ""
    echo "3. 🗄️ Set up production database:"
    echo "   - Create Supabase production project"
    echo "   - Run migrations: supabase db push"
    echo "   - Configure RLS policies"
    echo ""
    echo "4. 🚀 Deploy to staging:"
    echo "   git checkout staging"
    echo "   git push origin staging"
    echo ""
    echo "5. 🎯 Deploy to production:"
    echo "   git checkout main"
    echo "   git merge staging"
    echo "   git push origin main"
    echo ""
    echo "📖 For detailed instructions, see:"
    echo "   docs/deployment/PRODUCTION_DEPLOYMENT_GUIDE.md"
    echo ""
}

# Main execution
main() {
    check_dependencies
    check_project_structure
    setup_git_branches
    install_dependencies
    run_tests
    show_next_steps
}

# Run the main function
main "$@" 