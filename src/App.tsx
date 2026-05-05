import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardScreen } from './screens/DashboardScreen';
import { NewSampleScreen } from './screens/NewSampleScreen';
import { SampleDetailScreen } from './screens/SampleDetailScreen';
import { TestScreen } from './screens/TestScreen';

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardScreen />} />
      <Route path="/samples/new" element={<NewSampleScreen />} />
      <Route path="/samples/:id" element={<SampleDetailScreen />} />
      <Route path="/test/blind" element={<TestScreen />} />
      <Route path="/test/full" element={<TestScreen />} />
      <Route path="/test/sample/:sampleId" element={<TestScreen />} />
      <Route path="/test/provider/:providerId" element={<TestScreen />} />
      <Route path="/test/provider/:providerId/model/:modelId" element={<TestScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
