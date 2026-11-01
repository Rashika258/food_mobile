import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth, DEMO_PROFILES } from './AuthContext';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const { user, login, register, logout, switchDemoPersona, loading } = useAuth();
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'KITCHEN_OWNER' | 'DELIVERY_PARTNER'>('CUSTOMER');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    setErrorMsg('');
    if (!email.trim()) {
      setErrorMsg('Please enter your email address');
      return;
    }
    const res = await login(email.trim(), password);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message || 'Login failed. Check your credentials or use demo accounts.');
    }
  };

  const handleRegister = async () => {
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Please enter a valid email');
      return;
    }
    const res = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
      role,
    });
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message || 'Registration failed');
    }
  };

  const handleSwitchDemo = async (key: 'customer' | 'homemaker_anita' | 'homemaker_amma' | 'rider' | 'admin') => {
    await switchDemoPersona(key);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>
                {user ? 'Profile & Account' : tab === 'LOGIN' ? 'Welcome to GharKaKhana' : 'Create Account'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {user ? 'Manage your session and active persona' : 'Fresh homestyle meals & neighborhood kitchens'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
              </View>
            ) : null}

            {user ? (
              /* User is currently logged in */
              <View style={styles.userProfileSection}>
                <View style={styles.profileBadgeRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.profileInfo}>
                    <View style={styles.roleTag}>
                      <Text style={styles.roleTagText}>{user.role.replace('_', ' ')}</Text>
                    </View>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    {user.phone ? <Text style={styles.userPhone}>📞 {user.phone}</Text> : null}
                  </View>
                </View>

                {user.kitchen ? (
                  <View style={styles.kitchenBox}>
                    <Text style={styles.kitchenBoxTitle}>🏡 Managed Kitchen:</Text>
                    <Text style={styles.kitchenBoxName}>{user.kitchen.name}</Text>
                    <Text style={styles.kitchenBoxCuisines}>{user.kitchen.cuisines}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={styles.logoutBtn}
                  onPress={() => {
                    logout();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.logoutBtnText}>Sign Out</Text>
                </TouchableOpacity>

                <View style={styles.divider}>
                  <Text style={styles.dividerText}>OR SWITCH DEMO PERSONA</Text>
                </View>
              </View>
            ) : (
              /* Logged Out: Show Tabs and Form */
              <View>
                <View style={styles.tabBar}>
                  <TouchableOpacity
                    style={[styles.tabItem, tab === 'LOGIN' && styles.tabItemActive]}
                    onPress={() => setTab('LOGIN')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tabItemText, tab === 'LOGIN' && styles.tabItemTextActive]}>
                      Sign In
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tabItem, tab === 'REGISTER' && styles.tabItemActive]}
                    onPress={() => setTab('REGISTER')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tabItemText, tab === 'REGISTER' && styles.tabItemTextActive]}>
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>

                {tab === 'REGISTER' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Priya Sharma"
                      placeholderTextColor="#94A3B8"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. rahul@example.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>

                {tab === 'REGISTER' && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="+91 98765 43210"
                        placeholderTextColor="#94A3B8"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Join As</Text>
                      <View style={styles.roleSelector}>
                        {(
                          [
                            { id: 'CUSTOMER', label: 'Foodie / Customer' },
                            { id: 'KITCHEN_OWNER', label: 'Homemaker Chef' },
                            { id: 'DELIVERY_PARTNER', label: 'Rider' },
                          ] as const
                        ).map((r) => (
                          <TouchableOpacity
                            key={r.id}
                            style={[styles.roleBtn, role === r.id && styles.roleBtnActive]}
                            onPress={() => setRole(r.id)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.roleBtnText, role === r.id && styles.roleBtnTextActive]}>
                              {r.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={tab === 'LOGIN' ? handleLogin : handleRegister}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      {tab === 'LOGIN' ? 'Sign In' : 'Create My Account'}
                    </Text>
                  )}
                </TouchableOpacity>

                <View style={styles.divider}>
                  <Text style={styles.dividerText}>OR 1-CLICK DEMO LOGIN</Text>
                </View>
              </View>
            )}

            {/* Quick Demo Switcher Buttons */}
            <View style={styles.demoButtonsContainer}>
              <TouchableOpacity
                style={styles.demoCard}
                onPress={() => handleSwitchDemo('customer')}
                activeOpacity={0.75}
              >
                <Text style={styles.demoIcon}>👤</Text>
                <View style={styles.demoTextCol}>
                  <Text style={styles.demoTitle}>Rahul Sharma (Customer)</Text>
                  <Text style={styles.demoSub}>customer@foodapp.com</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoCard}
                onPress={() => handleSwitchDemo('homemaker_anita')}
                activeOpacity={0.75}
              >
                <Text style={styles.demoIcon}>👩‍🍳</Text>
                <View style={styles.demoTextCol}>
                  <Text style={styles.demoTitle}>Anita Deshmukh (Homemaker)</Text>
                  <Text style={styles.demoSub}>anita@foodapp.com • Maharashtrian Thalis</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoCard}
                onPress={() => handleSwitchDemo('homemaker_amma')}
                activeOpacity={0.75}
              >
                <Text style={styles.demoIcon}>👵</Text>
                <View style={styles.demoTextCol}>
                  <Text style={styles.demoTitle}>Meenakshi Sundaram (Amma)</Text>
                  <Text style={styles.demoSub}>meenakshi@foodapp.com • South Indian</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoCard}
                onPress={() => handleSwitchDemo('rider')}
                activeOpacity={0.75}
              >
                <Text style={styles.demoIcon}>🛵</Text>
                <View style={styles.demoTextCol}>
                  <Text style={styles.demoTitle}>Vikram Singh (Delivery Rider)</Text>
                  <Text style={styles.demoSub}>rider@foodapp.com</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoCard}
                onPress={() => handleSwitchDemo('admin')}
                activeOpacity={0.75}
              >
                <Text style={styles.demoIcon}>⚡</Text>
                <View style={styles.demoTextCol}>
                  <Text style={styles.demoTitle}>Platform Operations (Admin)</Text>
                  <Text style={styles.demoSub}>admin@foodapp.com</Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
  userProfileSection: {
    marginBottom: 12,
  },
  profileBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  roleTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#C2410C',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  userPhone: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  kitchenBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  kitchenBoxTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    textTransform: 'uppercase',
  },
  kitchenBoxName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350F',
    marginTop: 2,
  },
  kitchenBoxCuisines: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  tabItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabItemTextActive: {
    color: '#EA580C',
    fontWeight: '800',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  roleBtnActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  roleBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  roleBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  primaryBtn: {
    backgroundColor: '#EA580C',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#EA580C',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  divider: {
    alignItems: 'center',
    marginVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    position: 'relative',
  },
  dividerText: {
    position: 'relative',
    top: 9,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  demoButtonsContainer: {
    gap: 8,
    marginTop: 8,
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 10,
  },
  demoIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  demoTextCol: {
    flex: 1,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  demoSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
});
