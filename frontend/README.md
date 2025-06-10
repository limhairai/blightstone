# AdHub Frontend

Enterprise-level frontend application for AdHub, built with Next.js.

## Features

- Modern UI with Tailwind CSS and Radix UI components
- Supabase Authentication and Database integration
- Responsive design
- Dark mode support
- Type-safe with TypeScript
- Comprehensive testing setup
- Performance optimized
- SEO friendly

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js app directory
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Base UI components
│   │   ├── layout/             # Layout components
│   │   └── features/           # Feature-specific components
│   ├── contexts/               # React contexts
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions and configurations
│   ├── types/                  # TypeScript type definitions
│   ├── styles/                 # Global styles and Tailwind config
│   ├── public/                 # Static assets
│   └── docs/                   # Documentation
├── tests/                      # Test files
├── .eslintrc.js               # ESLint configuration
├── .prettierrc                # Prettier configuration
├── jest.config.js             # Jest configuration
├── next.config.mjs            # Next.js configuration
├── postcss.config.mjs         # PostCSS configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Project dependencies
```

## Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Configure environment variables:
Create a `.env.local` file in the frontend directory with necessary API keys and Supabase URL/anon key (refer to Supabase documentation and your project setup).
For example:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
# Add other necessary environment variables here
```

3. Run the development server:
```bash
npm run dev
```

## Development Guidelines

1. **Component Structure**
   - Use atomic design principles
   - Keep components small and focused
   - Use TypeScript for type safety
   - Follow naming conventions

2. **Styling**
   - Use Tailwind CSS for styling
   - Follow BEM naming convention for custom classes
   - Use CSS modules for component-specific styles
   - Maintain consistent spacing and typography

3. **State Management**
   - Use React Context for global state
   - Use local state for component-specific state
   - Implement proper error handling
   - Use loading states appropriately

4. **Testing**
   - Write unit tests for components
   - Write integration tests for features
   - Maintain high test coverage
   - Use Jest and React Testing Library

5. **Performance**
   - Implement code splitting
   - Optimize images and assets
   - Use proper caching strategies
   - Monitor and optimize bundle size

6. **Accessibility**
   - Follow WCAG guidelines
   - Use semantic HTML
   - Implement proper ARIA attributes
   - Test with screen readers

7. **Documentation**
   - Document component props
   - Add usage examples
   - Keep README up to date
   - Document architectural decisions 