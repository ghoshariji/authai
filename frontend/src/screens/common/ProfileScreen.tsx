import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { launchImageLibrary } from 'react-native-image-picker';
import { useGetProfileQuery, useUpdateProfileMutation, useChangePasswordMutation } from '../../store/api/authApi';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import Avatar from '../../components/common/Avatar';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';

const ProfileScreen: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, role, logout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const [name, setName] = useState(user?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const { data: profile, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: changingPwd }] = useChangePasswordMutation();

  const bgColor = isDark ? colors.background.dark : colors.background.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;
  const cardBg = isDark ? colors.card.dark : colors.card.light;

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'SUPER_ADMIN': return colors.error;
      case 'COLLEGE_ADMIN': return colors.primary;
      case 'TEACHER': return colors.secondary;
      case 'STUDENT': return colors.success;
      default: return colors.info;
    }
  };

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Name cannot be empty' });
      return;
    }
    try {
      await updateProfile({ name }).unwrap();
      Toast.show({ type: 'success', text1: 'Profile updated' });
      setEditMode(false);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update profile' });
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Toast.show({ type: 'error', text1: 'All password fields are required' });
      return;
    }
    if (newPassword.length < 6) {
      Toast.show({ type: 'error', text1: 'New password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Passwords do not match' });
      return;
    }
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      Toast.show({ type: 'success', text1: 'Password changed successfully' });
      setShowPasswordSection(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.data?.message || 'Failed to change password' });
    }
  };

  const handlePickAvatar = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, response => {
      if (response.assets && response.assets[0]) {
        Toast.show({ type: 'info', text1: 'Avatar upload not implemented in demo' });
      }
    });
  };

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading) return <Loader fullScreen isDark={isDark} />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: cardBg }, shadow.md]}>
          <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarContainer}>
            <Avatar name={user?.name ?? 'U'} uri={user?.avatar} size={88} />
            <View style={[styles.editAvatarBadge, { backgroundColor: colors.primary }]}>
              <Text style={{ color: '#FFF', fontSize: 14 }}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={[styles.userName, { color: textColor }]}>{profile?.name ?? user?.name}</Text>
          <Text style={[styles.userEmail, { color: secondaryColor }]}>{profile?.email ?? user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: `${getRoleBadgeColor()}20`, borderColor: getRoleBadgeColor() }]}>
            <Text style={[styles.roleText, { color: getRoleBadgeColor() }]}>{role?.replace('_', ' ')}</Text>
          </View>
        </View>

        {/* Edit Profile */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Profile Information</Text>
            <TouchableOpacity onPress={() => { setEditMode(!editMode); setName(user?.name ?? ''); }}>
              <Text style={[styles.editBtn, { color: colors.primary }]}>{editMode ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          {editMode ? (
            <>
              <Input
                label="Full Name"
                value={name}
                onChangeText={setName}
                isDark={isDark}
                required
              />
              <Input
                label="Email"
                value={user?.email ?? ''}
                isDark={isDark}
                editable={false}
                containerStyle={{ opacity: 0.6 }}
              />
              <Button
                title="Save Changes"
                onPress={handleUpdateProfile}
                loading={updating}
                fullWidth
                size="md"
              />
            </>
          ) : (
            <>
              {[
                { label: 'Full Name', value: profile?.name ?? user?.name ?? '' },
                { label: 'Email', value: profile?.email ?? user?.email ?? '' },
                { label: 'Role', value: role?.replace('_', ' ') ?? '' },
                { label: 'Status', value: user?.isActive ? 'Active' : 'Inactive' },
              ].map(info => (
                <View key={info.label} style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: secondaryColor }]}>{info.label}</Text>
                  <Text style={[styles.infoValue, { color: textColor }]}>{info.value}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Change Password */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowPasswordSection(!showPasswordSection)}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Change Password</Text>
            <Text style={[styles.editBtn, { color: colors.primary }]}>{showPasswordSection ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showPasswordSection && (
            <>
              <Input label="Current Password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry={!showPwd} isDark={isDark} />
              <Input label="New Password" value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showPwd} isDark={isDark} />
              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPwd}
                isDark={isDark}
                rightIcon={<Text>{showPwd ? '🙈' : '👁️'}</Text>}
                onRightIconPress={() => setShowPwd(!showPwd)}
              />
              <Button title="Update Password" onPress={handleChangePassword} loading={changingPwd} fullWidth size="md" />
            </>
          )}
        </View>

        {/* Settings */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Settings</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={{ fontSize: 22 }}>🌙</Text>
              <Text style={[styles.settingLabel, { color: textColor }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#E0E0E0', true: `${colors.primary}80` }}
              thumbColor={isDark ? colors.primary : '#FFF'}
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={{ fontSize: 22 }}>🔔</Text>
              <Text style={[styles.settingLabel, { color: textColor }]}>Notifications</Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#E0E0E0', true: `${colors.primary}80` }}
              thumbColor={colors.primary}
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <Button
            title="Sign Out"
            onPress={handleLogout}
            variant="danger"
            fullWidth
            size="lg"
            icon={<Text style={{ fontSize: 18 }}>🚪</Text>}
          />
        </View>

        <Text style={[styles.version, { color: secondaryColor }]}>EduManage v1.0.0</Text>
        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  profileHeader: {
    margin: spacing[5],
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    alignItems: 'center',
  },
  avatarContainer: { position: 'relative', marginBottom: spacing[4] },
  editAvatarBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },
  userName: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, marginBottom: spacing[1] },
  userEmail: { fontSize: fontSize.sm, marginBottom: spacing[3] },
  roleBadge: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
  },
  roleText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, letterSpacing: 0.5 },
  section: {
    marginHorizontal: spacing[5],
    marginBottom: spacing[4],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  editBtn: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.1)',
  },
  infoLabel: { fontSize: fontSize.sm },
  infoValue: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing[3] },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  settingLabel: { fontSize: fontSize.md },
  logoutSection: { paddingHorizontal: spacing[5], marginBottom: spacing[4] },
  version: { textAlign: 'center', fontSize: fontSize.xs },
});

export default ProfileScreen;
