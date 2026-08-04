import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./components/app/AppRoutes', () => () => (
  <div>Admin application routes</div>
));

test('renders the admin application shell', () => {
  render(<App />);
  expect(screen.getByText('Admin application routes')).toBeInTheDocument();
});
