import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardScreen } from './screens/DashboardScreen';
import { TestScreen } from './screens/TestScreen';

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardScreen />} />
      <Route path="/test/blind" element={<TestScreen />} />
      <Route path="/test/full" element={<TestScreen />} />
      <Route path="/test/provider/:providerId" element={<TestScreen />} />
      <Route path="/test/provider/:providerId/model/:modelId" element={<TestScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
