import { Ionicons } from '@expo/vector-icons';
import { BlurTargetView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppBackground from '../../components/AppBackground';
import AppBlurView from '../../components/AppBlurView';
import AppHeader from '../../components/AppHeader';
import AppModal from '../../components/AppModal';
import { useTabBlur } from '../../context/TabBlurContext';
import { useTheme } from '../../context/ThemeContext';
import { MOCK_PROFILES, Profile } from '../../data/mockProfiles';
import { useWallet } from '../../services/wallet';

function GridProfileCard({
  item,
  index,
  router,
}: {
  item: Profile;
  index: number;
  router: any;
}) {
  const isBusy = index === 1;
  const { theme, isDark } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.gridCard,
        {
          backgroundColor: isDark ? '#1C1618' : '#FFFFFF',
        },
      ]}
      onPress={() => router.push(`/profile/${item.id}` as any)}
      activeOpacity={0.9}
    >
      {/* Background & Avatar Image */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: isDark ? '#271D20' : '#E9ECEF' },
        ]}
      />
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={StyleSheet.absoluteFill} />
      ) : null}

      {/* Smooth Vertical Gradient Fade (No Hard Cutoff, No Black Corners) */}
      <LinearGradient
        colors={
          isDark
            ? [
                'transparent',
                'rgba(14, 10, 12, 0.0)',
                'rgba(14, 10, 12, 0.60)',
                'rgba(14, 10, 12, 0.95)',
              ]
            : [
                'transparent',
                'rgba(255, 255, 255, 0.0)',
                'rgba(255, 255, 255, 0.72)',
                'rgba(255, 255, 255, 0.98)',
              ]
        }
        locations={[0, 0.40, 0.72, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Status Badge (Online / Busy) - Colored Badge Without Dot */}
      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor: isBusy ? '#E11D48' : '#10B981',
          },
        ]}
      >
        <Text style={styles.statusText}>
          {isBusy ? 'Busy' : 'Online'}
        </Text>
      </View>

      {/* Companion Details at Bottom */}
      <View style={styles.cardGlassPanel} pointerEvents="none">
        <Text
          style={[
            styles.cardName,
            { color: isDark ? '#FFFFFF' : '#191C1D' },
          ]}
          numberOfLines={1}
        >
          {item.name}, {item.age}
        </Text>
        <View style={styles.cardLocationRow}>
          <Ionicons
            name="location-sharp"
            size={11}
            color={isDark ? 'rgba(223, 190, 198, 0.90)' : '#5A606B'}
          />
          <Text
            style={[
              styles.cardCity,
              { color: isDark ? 'rgba(223, 190, 198, 0.90)' : '#5A606B' },
            ]}
            numberOfLines={1}
          >
            {item.city}
          </Text>
        </View>
      </View>

      {/* Vertical Action Column on the Right Side */}
      <View style={styles.cardVerticalActionsCol}>
        {/* Top Button: Circular Chat Button with Centered Icon */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            router.push(`/chat/${item.id}` as any);
          }}
          style={[
            styles.actionCircleBlurBtn,
            {
              backgroundColor: isDark
                ? 'rgba(28, 18, 22, 0.85)'
                : '#FFFFFF',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
          activeOpacity={0.8}
        >
          <Ionicons
            name="chatbubble-ellipses"
            size={18}
            color={isDark ? '#FFF' : '#F65592'}
          />
        </TouchableOpacity>

        {/* Bottom Button: Circular Vibrant Primary Pink Video Call Button */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            router.push(`/call/${item.id}` as any);
          }}
          style={styles.actionCircleSolidBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="videocam" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { targets, notifyTargetMounted } = useTabBlur();
  const [exitModalVisible, setExitModalVisible] = useState(false);

  useEffect(() => {
    notifyTargetMounted();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        setExitModalVisible(true);
        return true;
      };

      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [])
  );

  return (
    <BlurTargetView
      ref={targets.index}
      style={[
        styles.container,
        { overflow: 'hidden' },
      ]}
    >
      <AppBackground>
        <SafeAreaView
          style={styles.container}
          edges={['left', 'right']}
        >
          {/* Standardized AppHeader (Consistent with Female Details Page) */}
          <AppHeader
            title="DreamDate"
            showCoins={true}
            leftElement={
              <View style={styles.brandCircle}>
                <Ionicons name="heart" size={18} color="#F65592" />
              </View>
            }
          />

          {/* Scroll Area with Top/Bottom Edge Fades */}
          <View style={{ flex: 1, position: 'relative' }}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Discover Section Title */}
              <View style={styles.titleRow}>
                <Text
                  style={[
                    styles.headlineText,
                    { color: isDark ? '#FFFFFF' : '#191C1D' },
                  ]}
                >
                  Discover
                </Text>
              </View>

              {/* Grid List */}
              <FlatList
                data={MOCK_PROFILES}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.gridRow}
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                  <GridProfileCard
                    item={item}
                    index={index}
                    router={router}
                  />
                )}
              />
            </ScrollView>
          </View>

          {/* Exit Confirmation Dialog */}
          <AppModal
            visible={exitModalVisible}
            onClose={() => setExitModalVisible(false)}
            title="Exit DreamDate?"
            description="Are you sure you want to exit the app? Your conversations and coins will be saved."
            icon="log-out"
            primaryAction={{
              label: 'Exit App',
              onPress: () => BackHandler.exitApp(),
              variant: 'destructive',
            }}
            secondaryAction={{
              label: 'Stay',
              onPress: () => setExitModalVisible(false),
            }}
          />
        </SafeAreaView>
      </AppBackground>
    </BlurTargetView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  brandCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(246, 85, 146, 0.12)',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 110,
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headlineText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridCard: {
    width: '48%',
    height: 260,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: 9,
    left: 9,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardGlassPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingRight: 48,
    gap: 2,
    zIndex: 5,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardCity: {
    fontSize: 10,
    fontWeight: '500',
  },
  topScrollFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 18,
    zIndex: 15,
  },
  bottomScrollFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    zIndex: 15,
  },
  cardVerticalActionsCol: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    alignItems: 'center',
    gap: 8,
    zIndex: 20,
  },
  actionCircleBlurBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCircleSolidBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F65592',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
