import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Modal, TouchableOpacity, Text } from 'react-native';
import React, { useState, useEffect } from 'react';

// Components
import RegionSelector from './components/RegionSelector';
import MarketplaceList from './components/MarketplaceList';
import CircularRing from './components/CircularRing';
import CenterTraderCard from './components/CenterTraderCard';
import ChatScreen from './components/ChatScreen';
import VoiceNoteRecorder from './components/VoiceNoteRecorder';
import MarketplaceDetail from './components/MarketplaceDetail';
import TraderSignIn from './components/TraderSignIn';
import TraderSignUp from './components/TraderSignUp';
import TraderHub from './components/TraderHub';

// Auth
import { TraderAuthProvider, useTraderAuth } from './context/TraderAuthContext';

// Hooks
import { useRegion } from './hooks/useRegion';

function AppContent() {
  // ==== State Management ====
  const { currentRegion, selectRegion, selectMarketplace } = useRegion();
  const [selectedMarketplace, setSelectedMarketplace] = useState(null);
  const [centerTrader, setCenterTrader] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);

  const { trader, getPendingRequestsCount } = useTraderAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      if (getPendingRequestsCount) {
        const c = await getPendingRequestsCount();
        if (mounted) setPendingCount(c || 0);
      }
    };
    fetchCount();
    const t = setInterval(fetchCount, 5000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [trader, getPendingRequestsCount]);

  // ==== Handlers ====
  const handleRegionChange = (region) => {
    selectRegion(region);
    setSelectedMarketplace(null);
  };

  const handleMarketplaceSelect = (marketplace) => {
    selectMarketplace(marketplace);
    setSelectedMarketplace(marketplace);
    // Get top-rated trader for center display
    const topTrader = (marketplace?.traders || [])
      .slice()
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))[0] || null;
    setCenterTrader(topTrader);
    setDetailOpen(true);
  };

  const handleTraderSelect = (trader) => {
    console.log('Trader selected:', trader.name);
  };

  const handleChat = () => {
    if (centerTrader) setChatOpen(true);
  };

  const handleVoiceNote = () => {
    if (centerTrader) setVoiceOpen(true);
  };

  const handleSendVoiceNote = (voiceData) => {
    console.log('Voice note sent:', voiceData);
    setVoiceOpen(false);
  };

  const handleSendList = () => {
    if (centerTrader) {
      console.log('Send list to:', centerTrader.name);
    }
  };

  // ==== Render ====
  // If a trader is signed in, show the Trader Hub (protected area)
  if (trader) {
    return (
      <View style={styles.container}>
        <TraderHub />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* App Title - centered at top */}
      <View style={styles.headerBar} pointerEvents="none">
        <Text style={styles.titleText}>📔  Trader's Note</Text>
      </View>
      {/* Region Selector - Top Left */}
      <View style={styles.topLeft}>
        <RegionSelector onRegionChange={handleRegionChange} currentRegion={currentRegion} />
        <TouchableOpacity style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }} onPress={() => setSignInOpen(true)}>
          <Text style={{ color: '#0084ff', fontWeight: '700' }}>Trader Hub</Text>
          {pendingCount > 0 && (
            <View style={{ backgroundColor: '#ef4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Circular Ring with Marketplaces */}
      <View style={styles.circularContainer} pointerEvents="box-none">
        <CircularRing marketplaces={currentRegion?.marketplaces || []} onMarketplaceSelect={handleMarketplaceSelect} />
        {centerTrader && (
          <CenterTraderCard trader={centerTrader} onChat={handleChat} onSendList={handleSendList} onVoiceNote={handleVoiceNote} />
        )}
      </View>

      {/* Marketplace Detail Modal */}
      <MarketplaceDetail visible={detailOpen} onClose={() => setDetailOpen(false)} marketplace={selectedMarketplace} />

      {/* Chat Modal */}
      <Modal visible={chatOpen} transparent={false} animationType="slide" onRequestClose={() => setChatOpen(false)}>
        <ChatScreen trader={centerTrader} onClose={() => setChatOpen(false)} />
      </Modal>

      {/* Voice Note Modal */}
      <Modal visible={voiceOpen} transparent={false} animationType="slide" onRequestClose={() => setVoiceOpen(false)}>
        <VoiceNoteRecorder trader={centerTrader} onClose={() => setVoiceOpen(false)} onSend={handleSendVoiceNote} />
      </Modal>

      {/* Sign-in / Sign-up modals for Traders */}
      <TraderSignIn visible={signInOpen} onClose={() => setSignInOpen(false)} onOpenSignUp={() => { setSignInOpen(false); setSignUpOpen(true); }} />
      <TraderSignUp visible={signUpOpen} onClose={() => setSignUpOpen(false)} />

      {/* Marketplace List */}
      <MarketplaceList region={currentRegion} onMarketplaceSelect={handleMarketplaceSelect} onTraderSelect={handleTraderSelect} />

      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <TraderAuthProvider>
      <AppContent />
    </TraderAuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBar: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 60,
    paddingVertical: 10,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0b1226',
    textShadowColor: 'rgba(0,0,0,0.08)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    elevation: 2,
  },
  topLeft: {
    position: 'absolute',
    top: 72,
    left: 12,
    zIndex: 50,
  },
  circularContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 90,
    zIndex: 10,
  },
});
