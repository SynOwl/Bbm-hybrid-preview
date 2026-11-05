import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { HariScreen } from './components/HariScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { ModeScreen } from './components/ModeScreen';
import { MapelScreen } from './components/MapelScreen';
import { SoalCountScreen } from './components/SoalCountScreen';
import { MetodeScreen } from './components/MetodeScreen';
import { RincianScreen } from './components/RincianScreen';
import { TungguScreen } from './components/TungguScreen';
import { UploadSoalScreen } from './components/UploadSoalScreen';
import { SoalViewScreen } from './components/SoalViewScreen';
import { MainScreen } from './components/MainScreen';
import { KlaimScreen } from './components/KlaimScreen';
import { AIScreen } from './components/AIScreen';
import { AIAmanScreen } from './components/AIAmanScreen';
import { LaporanScreen } from './components/LaporanScreen';
import { RekapScreen } from './components/RekapScreen';
import { BadgeScreen } from './components/BadgeScreen';
import { AturanScreen } from './components/AturanScreen';
import { TemaScreen } from './components/TemaScreen';
import { GrupScreen } from './components/GrupScreen';
import { MemberScreen } from './components/MemberScreen';
import { VideoScreen } from './components/VideoScreen';

import { MancingGame } from './components/Games/MancingGame';
import { SasaranGame } from './components/Games/SasaranGame';
import { KotakGame } from './components/Games/KotakGame';
import { RodaGame } from './components/Games/RodaGame';
import { TangkapBebekGame } from './components/Games/TangkapBebekGame';
import { BolaRamalanGame } from './components/Games/BolaRamalanGame';
import { QuizGameModal } from './components/Games/QuizGameModal';

import { RewardModal } from './components/Modals/RewardModal';
import { EventModal } from './components/Modals/EventModal';
import { LevelUpOverlay } from './components/Modals/LevelUpOverlay';
import { GoodbyeModal } from './components/Modals/GoodbyeModal';
import { LightboxModal } from './components/Modals/LightboxModal';
import { VideoReelsModal } from './components/Modals/VideoReelsModal';
import { Toast } from './components/Modals/Toast';

export const App: React.FC = () => {
  const { screen } = useApp();
  const [activeHtml, setActiveHtml] = useState<string>('');
  const [activeQuiz, setActiveQuiz] = useState<
    'hitung' | 'pola' | 'angka' | 'urutan' | 'kata' | 'teka' | null
  >(null);

  return (
    <div className="app">
      {screen !== 's-soal-view' && <Header />}

      {screen === 's-hari' && <HariScreen />}
      {screen === 's-dash' && <DashboardScreen />}
      {screen === 's-mode' && <ModeScreen />}
      {screen === 's-mapel' && <MapelScreen />}
      {screen === 's-soal' && <SoalCountScreen />}
      {screen === 's-metode' && <MetodeScreen />}
      {screen === 's-rincian' && <RincianScreen />}
      {screen === 's-tunggu' && <TungguScreen />}
      {screen === 's-upload' && <UploadSoalScreen onLoadHtml={setActiveHtml} />}
      {screen === 's-soal-view' && <SoalViewScreen htmlContent={activeHtml} />}
      {screen === 's-main' && <MainScreen onOpenQuiz={setActiveQuiz} />}
      {screen === 's-mancing' && <MancingGame />}
      {screen === 's-sasaran' && <SasaranGame />}
      {screen === 's-kotak' && <KotakGame />}
      {screen === 's-roda' && <RodaGame />}
      {screen === 's-bebek' && <TangkapBebekGame />}
      {screen === 's-bola' && <BolaRamalanGame />}
      {screen === 's-klaim' && <KlaimScreen />}
      {screen === 's-ai' && <AIScreen />}
      {screen === 's-ai-aman' && <AIAmanScreen />}
      {screen === 's-laporan' && <LaporanScreen />}
      {screen === 's-rekap' && <RekapScreen />}
      {screen === 's-badge' && <BadgeScreen />}
      {screen === 's-aturan' && <AturanScreen />}
      {screen === 's-tema' && <TemaScreen />}
      {screen === 's-grup' && <GrupScreen />}
      {screen === 's-member' && <MemberScreen />}
      {screen === 's-video' && <VideoScreen />}

      {/* Global Modals & Overlays */}
      <QuizGameModal gameType={activeQuiz} onClose={() => setActiveQuiz(null)} />
      <RewardModal />
      <EventModal />
      <LevelUpOverlay />
      <GoodbyeModal />
      <LightboxModal />
      <VideoReelsModal />
      <Toast />
    </div>
  );
};
export default App;
