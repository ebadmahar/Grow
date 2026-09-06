import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Typography } from '../../theme';
import { GrovMark } from './GrovMark';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title?: string;
  location?: string;
  showBack?: boolean;
  onBack?: () => void;
  showNotification?: boolean;
  onNotificationPress?: () => void;
  showProfile?: boolean;
  onProfilePress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  location = 'Islamabad, Pakistan',
  showBack = false,
  onBack,
  showNotification = true,
  onNotificationPress,
  showProfile = true,
  onProfilePress,
}) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top, height: 58 + insets.top }]}>
      {showBack ? (
        <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={18} color={Colors.text2} />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerBrand}>
          <View style={styles.headerMark}>
            <GrovMark size={18} color={Colors.lime} strokeWidth={2.2} />
          </View>
          <View>
            <Text style={styles.headerName}>Grōv</Text>
            <Text style={styles.headerSub}>{location}</Text>
          </View>
        </View>
      )}

      {title ? <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text> : null}

      <View style={styles.headerActions}>
        {showNotification ? (
          <TouchableOpacity style={styles.iconBtn} onPress={onNotificationPress}>
            <MaterialIcons name="notifications" size={18} color={Colors.text2} />
          </TouchableOpacity>
        ) : null}

        {showProfile ? (
          <TouchableOpacity style={styles.avatarBtn} onPress={onProfilePress}>
            {user?.avatar_path ? (
              <Image source={{ uri: user.avatar_path }} style={styles.avatarImg} />
            ) : (
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80' }}
                style={styles.avatarImg}
              />
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: 'rgba(244, 247, 240, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 50,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  headerMark: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text1,
    letterSpacing: -0.8,
    lineHeight: 18,
  },
  headerSub: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text1,
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: Colors.lime,
    overflow: 'hidden',
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
});
