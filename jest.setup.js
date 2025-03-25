// Mock for next/router
jest.mock('next/navigation', () => ({
    useRouter: () => ({
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
    }),
    usePathname: () => '',
    useSearchParams: () => new URLSearchParams(),
  }));
  
  // Add any global Jest setup here