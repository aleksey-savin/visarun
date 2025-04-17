import './App.css';
import { TrpcProvider } from './lib/trpcProvider';

import UsersPage from './pages/UsersPage';

const App = () => {
  return (
    <TrpcProvider>
      <UsersPage />
    </TrpcProvider>
  );
};

export default App;
