import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export const CustomBottomDock: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const tabs = [
    { name: 'HomeTab', label: 'Home', icon: 'home' as const },
    { name: 'ExploreTab', label: 'Map', icon: 'explore' as const },
    { name: 'CreateTab', label: 'Log', icon: 'add' as const, isCenter: true },
    { name: 'CommunityTab', label: 'Community', icon: 'group' as const },
    { name: 'ProfileTab', label: 'Profile', icon: 'person' as const },
  ];

  return (
    <View style={[styles.dockContainer, { bottom: Math.max(insets.bottom + 6, 12) }]}>
      <View style={styles.dockInner}>
        {tabs.map((tab, idx) => {
          const isFocused = state.index === idx;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: state.routes[idx]?.key || '',
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(tab.name);
            }
          };

          if (tab.isCenter) {
            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.centerFab}
                onPress={onPress}
                activeOpacity={0.88}
              >
                <MaterialIcons name="add" size={24} color={Colors.ink} />
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={onPress}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={tab.icon}
                size={22}
                color={isFocused ? Colors.lime : 'rgba(255, 255, 255, 0.28)'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? Colors.lime : 'rgba(255, 255, 255, 0.28)' },
                ]}
              >
                {tab.label}
              </Text>
              {isFocused ? <View style={styles.navDot} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dockContainer: {
    position: 'absolute',
    left: 10,
    right: 10,
    alignItems: 'center',
    zIndex: 100,
  },
  dockInner: {
    width: '100%',
    maxWidth: 410,
    height: 62,
    backgroundColor: Colors.dockBg,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.dockBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 3,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
    lineHeight: 10,
  },
  navDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.lime,
    marginTop: 2,
  },
  centerFab: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: Colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10,
    shadowColor: Colors.lime,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
});
