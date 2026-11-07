import { useGameStore } from './store/gameStore';
import { MainMenu } from './components/ui/MainMenu';
import { CabinHub } from './components/ui/CabinHub';
import { UpgradeMenu } from './components/ui/UpgradeMenu';
import { Match3Board } from './components/match3/Match3Board';

function App() {
  const screen = useGameStore((s) => s.screen);

  return (
    <div className="game-viewport-outer">
      <div className="game-viewport">
        {screen === 'main_menu' && <MainMenu />}
        {screen === 'cabin' && <CabinHub />}
        {screen === 'upgrade_menu' && <UpgradeMenu />}
        {screen === 'match3' && <Match3Board />}
      </div>
    </div>
  );
}

export default App;
