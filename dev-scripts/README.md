# Development Scripts

This directory contains development and setup scripts for the Blightstone CRM project.

## Scripts

### Environment Setup
- `setup-environment.sh` - Sets up environment variables for development

### Development Servers  
- `start-dev.sh` - Starts both frontend and backend development servers
- `start-frontend.sh` - Starts only the frontend development server
- `start-backend.sh` - Starts only the backend development server (deprecated - backend removed)

### Styling & Theming
- `fix-colors-to-bw.sh` - Converts color scheme to black and white theme
- `fix-gradients.sh` - Removes colorful gradients and replaces with solid colors
- `fix-auth-backgrounds.sh` - Fixes authentication page backgrounds for light mode
- `fix-auth-inputs.sh` - Fixes authentication input field styling

### Rebranding
- `rebrand-script.sh` - Converts AdHub branding to Blightstone branding

## Usage

All scripts should be run from the project root directory:

```bash
# Example
./dev-scripts/start-dev.sh
```

## Note

Some scripts may reference the old backend setup which has been removed in favor of Next.js API routes deployed on Vercel.