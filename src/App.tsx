import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardScreen } from './screens/DashboardScreen';
import { ModelsScreen } from './screens/ModelsScreen';
import { NewSampleScreen } from './screens/NewSampleScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { SampleDetailScreen } from './screens/SampleDetailScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { TestsIndexScreen } from './screens/TestsIndexScreen';
import { TestScreen } from './screens/TestScreen';

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardScreen />} />
      <Route path="/tests" element={<TestsIndexScreen />} />
      <Route path="/models" element={<ModelsScreen />} />
      <Route path="/reports" element={<ResultsScreen />} />
      <Route path="/settings" element={<SettingsScreen />} />
      <Route path="/results" element={<Navigate to="/reports" replace />} />
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
