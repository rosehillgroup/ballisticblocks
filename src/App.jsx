import { useEffect } from 'react';
import Header from './components/Header.jsx';
import InputPanel from './components/InputPanel.jsx';
import Viewport from './components/Viewport.jsx';
import ResultsPanel from './components/ResultsPanel.jsx';
import useConfiguratorStore from './stores/configuratorStore.js';

export default function App() {
  const solve = useConfiguratorStore((s) => s.solve);

  useEffect(() => {
    solve();
  }, [solve]);

  return (
    <div className="app-layout">
      <Header />
      <InputPanel />
      <Viewport />
      <ResultsPanel />
    </div>
  );
}
