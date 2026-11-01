import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import {
  fetchNearbyKitchens,
  fetchKitchenDetails,
  placeMobileOrder,
  Kitchen,
  MenuItem,
  SubscriptionPlan,
  LiveCookingOrder,
  FALLBACK_HOMEMAKER_ORDERS,
  FALLBACK_MENU,
  FALLBACK_SUBSCRIPTIONS,
} from './src/api';
import { AuthProvider, useAuth } from './src/AuthContext';
import { AuthModal } from './src/AuthModal';
import { useRealtimeLocation } from './src/useRealtimeLocation';

interface CartItem {
  item: MenuItem;
  quantity: number;
}

function FoodAppMain() {
  const { user, token } = useAuth();
  const [authModalVisible, setAuthModalVisible] = useState<boolean>(false);

  // Real-time Device Location
  const {
    coords,
    addressName,
    subAddress,
    loadingLocation,
    permissionGranted,
    refreshLocation,
  } = useRealtimeLocation();
  // Mode: CUSTOMER or HOMEMAKER
  const [appMode, setAppMode] = useState<'CUSTOMER' | 'HOMEMAKER'>('CUSTOMER');

  // Customer State
  const [activeTab, setActiveTab] = useState<'HOME_KITCHEN' | 'RESTAURANT'>('HOME_KITCHEN');
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Selected Kitchen & Menu Modal
  const [selectedKitchen, setSelectedKitchen] = useState<Kitchen | null>(null);
  const [kitchenMenuItems, setKitchenMenuItems] = useState<MenuItem[]>([]);
  const [kitchenPlans, setKitchenPlans] = useState<SubscriptionPlan[]>([]);
  const [menuModalVisible, setMenuModalVisible] = useState<boolean>(false);
  const [menuTab, setMenuTab] = useState<'MENU' | 'SUBSCRIPTIONS'>('MENU');

  // Cart & Checkout
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartModalVisible, setCartModalVisible] = useState<boolean>(false);
  const [deliverySlot, setDeliverySlot] = useState<'INSTANT' | 'PREORDER_LUNCH' | 'PREORDER_DINNER'>('INSTANT');
  const [returnDabba, setReturnDabba] = useState<boolean>(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);

  // Gated Society Pool & Customization
  const [selectedSociety, setSelectedSociety] = useState<string>('Marvel Serenity');
  const [isCommunityPoolActive, setIsCommunityPoolActive] = useState<boolean>(true);
  const [spiceLevel, setSpiceLevel] = useState<'MILD' | 'MEDIUM' | 'TEEKHA'>('MEDIUM');
  const [cookingFat, setCookingFat] = useState<'COLD_PRESSED' | 'GIR_GHEE' | 'LOW_OIL'>('COLD_PRESSED');
  const [rotiChoice, setRotiChoice] = useState<'PHULKAS' | 'BHAKRI' | 'MULTIGRAIN'>('PHULKAS');
  const [chefCustomNote, setChefCustomNote] = useState<string>('');

  // Active Order Tracking
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [trackingModalVisible, setTrackingModalVisible] = useState<boolean>(false);

  // Homemaker Studio State
  const [isKitchenOpen, setIsKitchenOpen] = useState<boolean>(true);
  const [homemakerMenu, setHomemakerMenu] = useState<MenuItem[]>(FALLBACK_MENU['k1'] || []);
  const [homemakerOrders, setHomemakerOrders] = useState<LiveCookingOrder[]>(FALLBACK_HOMEMAKER_ORDERS);

  useEffect(() => {
    loadKitchens();
  }, [activeTab, radiusKm, coords.latitude, coords.longitude]);

  const loadKitchens = async () => {
    setLoading(true);
    const data = await fetchNearbyKitchens(
      coords.latitude,
      coords.longitude,
      radiusKm,
      activeTab
    );
    setKitchens(data);
    setLoading(false);
  };

  const handleOpenKitchen = async (kitchen: Kitchen) => {
    setSelectedKitchen(kitchen);
    setMenuTab('MENU');
    const details = await fetchKitchenDetails(
      kitchen.id,
      coords.latitude,
      coords.longitude
    );
    setKitchenMenuItems(details.menuItems || FALLBACK_MENU[kitchen.id] || FALLBACK_MENU['k1']);
    setKitchenPlans(details.subscriptionPlans || FALLBACK_SUBSCRIPTIONS.filter((s) => s.kitchenId === kitchen.id));
    setMenuModalVisible(true);
  };

  // Cart operations
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.item.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((ci) =>
          ci.item.id === itemId ? { ...ci, quantity: ci.quantity - 1 } : ci
        );
      }
      return prev.filter((ci) => ci.item.id !== itemId);
    });
  };

  const getCartItemQuantity = (itemId: string) => {
    return cart.find((ci) => ci.item.id === itemId)?.quantity || 0;
  };

  const totalCartCount = cart.reduce((acc, ci) => acc + ci.quantity, 0);
  const cartSubtotal = cart.reduce((acc, ci) => acc + ci.item.price * ci.quantity, 0);
  const deliveryFee = (isCommunityPoolActive || activeTab === 'HOME_KITCHEN') ? 0 : 35;
  const platformFee = 5;
  const grandTotal = cartSubtotal > 0 ? cartSubtotal + deliveryFee + platformFee : 0;

  // Checkout
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in or select a demo account before placing your order.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => setAuthModalVisible(true) },
        ]
      );
      return;
    }
    setIsPlacingOrder(true);

    const deliveryAddress =
      user.addresses && user.addresses.length > 0
        ? `${user.addresses[0].addressLine}, ${user.addresses[0].city}`
        : `${addressName}${subAddress ? ' (' + subAddress + ')' : ''}`;

    const customInstructions = `Spice: ${spiceLevel}, Fat: ${cookingFat}, Roti: ${rotiChoice}${chefCustomNote ? ` | ${chefCustomNote}` : ''}`;

    const payload = {
      kitchenId: selectedKitchen?.id || 'k1',
      deliveryAddress,
      deliveryLat: coords.latitude,
      deliveryLng: coords.longitude,
      totalAmount: grandTotal,
      type: deliverySlot === 'INSTANT' ? 'INSTANT' : 'PRE_ORDER',
      scheduledFor:
        deliverySlot === 'PREORDER_LUNCH'
          ? 'Today, 1:00 PM'
          : deliverySlot === 'PREORDER_DINNER'
          ? 'Today, 8:00 PM'
          : undefined,
      dabbaReturned: returnDabba,
      communitySocietyName: isCommunityPoolActive ? selectedSociety : undefined,
      deliveryInstructions: customInstructions,
      items: cart.map((ci) => ({
        menuItemId: ci.item.id,
        quantity: ci.quantity,
        price: ci.item.price,
        specialRequest: customInstructions,
      })),
    };

    const res = await placeMobileOrder(payload, token);
    setIsPlacingOrder(false);
    setCartModalVisible(false);
    setMenuModalVisible(false);
    setCart([]);

    setActiveOrder({
      id: res.data?.id || 'ord_101',
      orderNumber: res.data?.orderNumber || 'FD-892401',
      totalAmount: grandTotal,
      deliveryOtp: res.data?.deliveryOtp || '4829',
      status: 'PREPARING',
      kitchenName: selectedKitchen?.name || "Anita's Ghar Ka Khana",
      slot: deliverySlot === 'INSTANT' ? 'Instant 15-20 Mins' : 'Pre-order Slot',
    });
    setTrackingModalVisible(true);
  };

  // Homemaker Operations
  const adjustPortion = (id: string, delta: number) => {
    setHomemakerMenu((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const current = item.portionsRemaining || 0;
          const next = Math.max(0, current + delta);
          return { ...item, portionsRemaining: next, isAvailable: next > 0 };
        }
        return item;
      })
    );
  };

  const markOrderReady = (orderId: string) => {
    setHomemakerOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: 'READY_FOR_PICKUP' } : ord))
    );
    Alert.alert('Rider Notified!', 'Order marked ready. Neighborhood rider Ramesh has been summoned for pickup.');
  };

  const filteredKitchens = kitchens.filter(
    (k) =>
      k.name.toLowerCase().includes(search.toLowerCase()) ||
      k.cuisines.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Top Universal App Bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Text style={styles.appTitle}>🍲 FoodApp</Text>
          <View style={styles.badgeHub}>
            <Text style={styles.badgeHubText}>HYPER-LOCAL</Text>
          </View>
        </View>

        <View style={styles.topBarRight}>
          {/* User Profile / Auth Button */}
          <TouchableOpacity
            style={styles.authTopBarBtn}
            onPress={() => setAuthModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.authTopBarText}>
              {user ? `👤 ${user.name.split(' ')[0]}` : '🔑 Sign In'}
            </Text>
          </TouchableOpacity>

          {/* Mode Switcher Pill */}
          <TouchableOpacity
            style={[styles.modeSwitchBtn, appMode === 'HOMEMAKER' && styles.modeSwitchHomemaker]}
            onPress={() => setAppMode(appMode === 'CUSTOMER' ? 'HOMEMAKER' : 'CUSTOMER')}
            activeOpacity={0.85}
          >
            <Text style={[styles.modeSwitchText, appMode === 'HOMEMAKER' && styles.modeSwitchTextLight]}>
              {appMode === 'CUSTOMER' ? '👩‍🍳 Cook Studio' : '🛍️ Order Food'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ===================== HOMEMAKER STUDIO MODE ===================== */}
      {appMode === 'HOMEMAKER' ? (
        <ScrollView style={styles.studioContainer} showsVerticalScrollIndicator={false}>
          {/* Chef Profile Banner */}
          <View style={styles.studioCard}>
            <View style={styles.studioHeaderRow}>
              <View>
                <Text style={styles.studioChefName}>Anita Deshmukh 👩‍🍳</Text>
                <Text style={styles.studioKitchenTitle}>Anita&apos;s Ghar Ka Khana • Bellandur</Text>
              </View>
              <TouchableOpacity
                style={[styles.statusToggle, isKitchenOpen ? styles.statusOpen : styles.statusClosed]}
                onPress={() => setIsKitchenOpen(!isKitchenOpen)}
              >
                <Text style={styles.statusToggleText}>
                  {isKitchenOpen ? '🟢 OPEN FOR ORDERS' : '🔴 CLOSED'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>₹2,520</Text>
                <Text style={styles.statLabel}>Today&apos;s Net Payout</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>10%</Text>
                <Text style={styles.statLabel}>Platform Fee (Fair)</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>7</Text>
                <Text style={styles.statLabel}>Daily Tiffin Subs</Text>
              </View>
            </View>
          </View>

          {/* Live Kitchen Cooking Board */}
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>🔥 Live Cooking Queue ({homemakerOrders.length})</Text>
            <Text style={styles.sectionSubtitle}>Bellandur Neighborhood</Text>
          </View>

          {homemakerOrders.map((ord) => (
            <View key={ord.id} style={styles.orderCard}>
              <View style={styles.orderCardTop}>
                <View>
                  <Text style={styles.orderNumber}>{ord.orderNumber}</Text>
                  <Text style={styles.orderCustomer}>{ord.customerName}</Text>
                </View>
                <View style={[styles.statusPill, ord.status === 'READY_FOR_PICKUP' ? styles.statusReady : styles.statusPrep]}>
                  <Text style={styles.statusPillText}>{ord.status.replace('_', ' ')}</Text>
                </View>
              </View>

              <Text style={styles.orderItems}>{ord.items}</Text>
              <View style={styles.orderFooter}>
                <Text style={styles.orderAmount}>₹{ord.totalAmount} • {ord.slot}</Text>
                {ord.status === 'PREPARING' ? (
                  <TouchableOpacity
                    style={styles.readyBtn}
                    onPress={() => markOrderReady(ord.id)}
                  >
                    <Text style={styles.readyBtnText}>✓ Ready for Pickup</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.otpPill}>
                    <Text style={styles.otpPillText}>OTP: {ord.deliveryOtp}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}

          {/* Aaj Ka Menu & Small Batch Limiter */}
          <View style={[styles.sectionHeadingRow, { marginTop: 10 }]}>
            <Text style={styles.sectionTitle}>🍱 Aaj Ka Menu & Batch Portions</Text>
            <Text style={styles.sectionSubtitle}>Prevent cooking fatigue</Text>
          </View>

          {homemakerMenu.map((item) => (
            <View key={item.id} style={styles.menuBatchCard}>
              <View style={styles.menuBatchInfo}>
                <Text style={styles.menuBatchName}>{item.name}</Text>
                <Text style={styles.menuBatchPrice}>₹{item.price} • Max {item.dailyStockLimit} portions</Text>
                <View style={styles.portionCountRow}>
                  <Text style={styles.portionCountLabel}>Portions Left:</Text>
                  <Text style={[styles.portionCountValue, (item.portionsRemaining || 0) < 5 && styles.textRed]}>
                    {item.portionsRemaining} / {item.dailyStockLimit}
                  </Text>
                </View>
              </View>

              <View style={styles.stepperCol}>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.portionBtn}
                    onPress={() => adjustPortion(item.id, -1)}
                  >
                    <Text style={styles.portionBtnText}>-1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.portionBtn, styles.portionBtnAdd]}
                    onPress={() => adjustPortion(item.id, 5)}
                  >
                    <Text style={[styles.portionBtnText, styles.textWhite]}>+5</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.soldOutBtn}
                  onPress={() => adjustPortion(item.id, -(item.portionsRemaining || 0))}
                >
                  <Text style={styles.soldOutText}>Sold Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={{ height: 60 }} />
        </ScrollView>
      ) : (
        /* ===================== CUSTOMER MARKETPLACE MODE ===================== */
        <View style={{ flex: 1 }}>
          {/* Header & Real-Time Location */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.deliveringLabelRow}>
                <Text style={styles.locationLabel}>DELIVERING TO</Text>
                {permissionGranted && (
                  <View style={styles.liveGpsBadge}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.liveGpsText}>LIVE GPS</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.locationRow}
                onPress={refreshLocation}
                activeOpacity={0.7}
              >
                <Text style={styles.locationPin}>📍</Text>
                <View style={{ flex: 1, paddingRight: 4 }}>
                  <Text style={styles.locationText} numberOfLines={1}>
                    {loadingLocation ? 'Fetching device location...' : addressName}
                  </Text>
                  {subAddress ? (
                    <Text style={styles.subAddressText} numberOfLines={1}>
                      {subAddress}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.radiusPill}>
                  <Text style={styles.radiusPillText}>{radiusKm} KM</Text>
                </View>

                <TouchableOpacity
                  style={styles.gpsRefreshBtn}
                  onPress={refreshLocation}
                  disabled={loadingLocation}
                  activeOpacity={0.7}
                >
                  {loadingLocation ? (
                    <ActivityIndicator size="small" color="#EA580C" />
                  ) : (
                    <Text style={styles.gpsRefreshIcon}>🔄</Text>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            </View>

            {/* Header Right: Account Profile Avatar & Cart */}
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.userProfileBtn}
                onPress={() => setAuthModalVisible(true)}
                activeOpacity={0.8}
              >
                {user ? (
                  <View style={styles.userAvatarSm}>
                    <Text style={styles.userAvatarSmText}>
                      {user.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.userIconSm}>👤</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cartBtn}
                onPress={() => setCartModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.cartIcon}>🛍️</Text>
                {totalCartCount > 0 && (
                  <View style={styles.cartCountBadge}>
                    <Text style={styles.cartCountBadgeText}>{totalCartCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search home thalis, biryani, dabba..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Text style={styles.clearSearch}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Dual Marketplace Toggle */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'HOME_KITCHEN' && styles.activeTab]}
              onPress={() => setActiveTab('HOME_KITCHEN')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'HOME_KITCHEN' && styles.activeTabText,
                ]}
              >
                🏡 Homemakers (≤ {radiusKm} KM)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'RESTAURANT' && styles.activeTab]}
              onPress={() => setActiveTab('RESTAURANT')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'RESTAURANT' && styles.activeTabText,
                ]}
              >
                🍽️ Restaurants
              </Text>
            </TouchableOpacity>
          </View>

          {/* Radius Switcher for Home Makers */}
          {activeTab === 'HOME_KITCHEN' && (
            <View style={styles.radiusSelector}>
              <Text style={styles.radiusSelectorLabel}>Neighborhood Radius:</Text>
              <View style={styles.radiusButtons}>
                {[3, 5, 10].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.radiusBtn,
                      radiusKm === r && styles.radiusBtnActive,
                    ]}
                    onPress={() => setRadiusKm(r)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.radiusBtnText,
                        radiusKm === r && styles.radiusBtnTextActive,
                      ]}
                    >
                      {r} KM
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Food Listings */}
          <ScrollView
            contentContainerStyle={styles.scrollList}
            showsVerticalScrollIndicator={false}
          >
            {/* Banner for Differentiators */}
            {activeTab === 'HOME_KITCHEN' && (
              <View style={styles.promoBanner}>
                <View style={styles.promoHeader}>
                  <Text style={styles.promoTag}>✨ GHARKAKHANA ADVANTAGE</Text>
                </View>
                <Text style={styles.promoTitle}>Pure Homestyle • Zero Plastic Dabbas</Text>
                <Text style={styles.promoDesc}>
                  Cooked fresh in 10-15 portion small batches by verified home makers in your neighborhood.
                </Text>
              </View>
            )}

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF5200" />
                <Text style={styles.loadingText}>Finding nearby kitchens...</Text>
              </View>
            ) : filteredKitchens.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏡</Text>
                <Text style={styles.emptyTitle}>No kitchens found within {radiusKm} KM</Text>
                <Text style={styles.emptySub}>
                  Try expanding your distance to 10 KM or clearing search filters.
                </Text>
                <TouchableOpacity
                  style={styles.expandBtn}
                  onPress={() => setRadiusKm(10)}
                >
                  <Text style={styles.expandBtnText}>Expand to 10 KM</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredKitchens.map((k) => (
                <TouchableOpacity
                  key={k.id}
                  style={styles.card}
                  activeOpacity={0.92}
                  onPress={() => handleOpenKitchen(k)}
                >
                  <View style={styles.imageContainer}>
                    <Image
                      source={{
                        uri:
                          k.coverImage ||
                          'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
                      }}
                      style={styles.cardImage}
                    />
                    <View style={styles.imageOverlay} />

                    {/* Floating Badges */}
                    <View style={styles.badgeRow}>
                      {k.distanceKm !== null && k.distanceKm !== undefined && (
                        <View style={styles.distanceBadge}>
                          <Text style={styles.distanceText}>📍 {k.distanceKm} km</Text>
                        </View>
                      )}
                      <View style={styles.prepBadge}>
                        <Text style={styles.prepText}>
                          ⚡ {k.estimatedDeliveryMins || k.orderLeadTimeMinutes}m
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.kitchenName} numberOfLines={1}>
                        {k.name}
                      </Text>
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>★ {k.rating?.toFixed(1) || '4.8'}</Text>
                      </View>
                    </View>

                    <Text style={styles.cuisines} numberOfLines={1}>
                      {k.cuisines}
                    </Text>

                    {k.storyText ? (
                      <View style={styles.storyBox}>
                        <Text style={styles.storyLabel}>👩‍🍳 Cook&apos;s Story</Text>
                        <Text style={styles.storyText} numberOfLines={2}>
                          &quot;{k.storyText}&quot;
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.cardFooter}>
                      <Text style={styles.priceText}>
                        ₹{k.priceForTwo} <Text style={styles.priceSub}>for two</Text>
                      </Text>
                      <View style={styles.actionPill}>
                        <Text style={styles.actionPillText}>View Menu & Tiffins →</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Floating Cart Bar if cart has items */}
          {totalCartCount > 0 && (
            <View style={styles.floatingCartBar}>
              <View>
                <Text style={styles.floatingCartCount}>{totalCartCount} item(s) • ₹{cartSubtotal}</Text>
                <Text style={styles.floatingCartSub}>Returnable Dabba included</Text>
              </View>
              <TouchableOpacity
                style={styles.floatingCheckoutBtn}
                onPress={() => setCartModalVisible(true)}
              >
                <Text style={styles.floatingCheckoutBtnText}>View Cart →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ===================== KITCHEN MENU & TIFFINS MODAL ===================== */}
      <Modal visible={menuModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalSafe}>
          {selectedKitchen && (
            <View style={{ flex: 1 }}>
              {/* Modal Header */}
              <View style={styles.menuModalHeader}>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setMenuModalVisible(false)}
                >
                  <Text style={styles.modalCloseIcon}>←</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                    {selectedKitchen.name}
                  </Text>
                  <Text style={styles.modalHeaderSub}>
                    ★ {selectedKitchen.rating} • {selectedKitchen.distanceKm || 0.6} km • 🛡️ {selectedKitchen.hygieneScore}% Hygiene
                  </Text>
                </View>
              </View>

              {/* Sub-tabs: A la Carte Menu vs Tiffin Meal Plans */}
              <View style={styles.menuSubTabs}>
                <TouchableOpacity
                  style={[styles.menuSubTab, menuTab === 'MENU' && styles.menuSubTabActive]}
                  onPress={() => setMenuTab('MENU')}
                >
                  <Text style={[styles.menuSubTabText, menuTab === 'MENU' && styles.menuSubTabTextActive]}>
                    🍛 Daily Menu
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.menuSubTab, menuTab === 'SUBSCRIPTIONS' && styles.menuSubTabActive]}
                  onPress={() => setMenuTab('SUBSCRIPTIONS')}
                >
                  <Text style={[styles.menuSubTabText, menuTab === 'SUBSCRIPTIONS' && styles.menuSubTabTextActive]}>
                    📅 Tiffin Subscriptions
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
                {menuTab === 'MENU' ? (
                  kitchenMenuItems.map((item) => {
                    const qty = getCartItemQuantity(item.id);
                    return (
                      <View key={item.id} style={styles.menuItemRow}>
                        <View style={{ flex: 1, paddingRight: 12 }}>
                          <View style={styles.dietRow}>
                            <Text style={item.dietaryType === 'VEG' ? styles.vegIcon : styles.nonVegIcon}>
                              {item.dietaryType === 'VEG' ? '🟢 Veg' : '🔴 Non-Veg'}
                            </Text>
                            {item.isDailySpecial && (
                              <View style={styles.specialBadge}>
                                <Text style={styles.specialBadgeText}>Daily Special</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.menuItemName}>{item.name}</Text>
                          <Text style={styles.menuItemPrice}>₹{item.price}</Text>
                          <Text style={styles.menuItemDesc} numberOfLines={2}>
                            {item.description}
                          </Text>
                          {item.portionsRemaining !== undefined && (
                            <Text style={styles.portionNotice}>
                              ⚡ Only {item.portionsRemaining} portions left today
                            </Text>
                          )}
                        </View>

                        {/* Add to Cart Stepper */}
                        <View style={styles.itemActionCol}>
                          {qty === 0 ? (
                            <TouchableOpacity
                              style={styles.addBtn}
                              onPress={() => addToCart(item)}
                            >
                              <Text style={styles.addBtnText}>ADD +</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.stepperContainer}>
                              <TouchableOpacity
                                style={styles.stepperMinus}
                                onPress={() => removeFromCart(item.id)}
                              >
                                <Text style={styles.stepperSign}>-</Text>
                              </TouchableOpacity>
                              <Text style={styles.stepperQty}>{qty}</Text>
                              <TouchableOpacity
                                style={styles.stepperPlus}
                                onPress={() => addToCart(item)}
                              >
                                <Text style={styles.stepperSign}>+</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })
                ) : (
                  kitchenPlans.map((plan) => (
                    <View key={plan.id} style={styles.planCard}>
                      <View style={styles.planBadge}>
                        <Text style={styles.planBadgeText}>{plan.totalMeals} MEAL PACK</Text>
                      </View>
                      <Text style={styles.planTitle}>{plan.title}</Text>
                      <Text style={styles.planDesc}>{plan.description}</Text>
                      <View style={styles.planFooter}>
                        <Text style={styles.planPrice}>₹{plan.price} <Text style={styles.priceSub}>all-inclusive</Text></Text>
                        <TouchableOpacity
                          style={styles.planSubscribeBtn}
                          onPress={() => {
                            Alert.alert('Tiffin Subscribed!', `You subscribed to ${plan.title}. Hot home meals start tomorrow in steel dabba.`);
                            setMenuModalVisible(false);
                          }}
                        >
                          <Text style={styles.planSubscribeText}>Subscribe Now</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
                <View style={{ height: 100 }} />
              </ScrollView>

              {/* Floating Bottom Cart Bar inside Menu */}
              {totalCartCount > 0 && (
                <View style={styles.floatingCartBar}>
                  <View>
                    <Text style={styles.floatingCartCount}>{totalCartCount} item(s) • ₹{cartSubtotal}</Text>
                    <Text style={styles.floatingCartSub}>Returnable Dabba Guarantee</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.floatingCheckoutBtn}
                    onPress={() => {
                      setCartModalVisible(true);
                    }}
                  >
                    <Text style={styles.floatingCheckoutBtnText}>Review Cart →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* ===================== CART & CHECKOUT MODAL ===================== */}
      <Modal visible={cartModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.menuModalHeader}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setCartModalVisible(false)}
            >
              <Text style={styles.modalCloseIcon}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.modalHeaderTitle}>Your Cart & Checkout</Text>
              <Text style={styles.modalHeaderSub}>Bellandur Neighborhood Hub</Text>
            </View>
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🛍️</Text>
              <Text style={styles.emptyTitle}>Your cart is empty</Text>
              <Text style={styles.emptySub}>Add some delicious homestyle thalis or bowls!</Text>
            </View>
          ) : (
            <ScrollView style={styles.cartScroll} showsVerticalScrollIndicator={false}>
              {/* Items List */}
              <View style={styles.cartSection}>
                <Text style={styles.cartSectionTitle}>Items Ordered</Text>
                {cart.map((ci) => (
                  <View key={ci.item.id} style={styles.cartItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cartItemName}>{ci.item.name}</Text>
                      <Text style={styles.cartItemPrice}>₹{ci.item.price * ci.quantity}</Text>
                    </View>
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={styles.stepperMinus}
                        onPress={() => removeFromCart(ci.item.id)}
                      >
                        <Text style={styles.stepperSign}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperQty}>{ci.quantity}</Text>
                      <TouchableOpacity
                        style={styles.stepperPlus}
                        onPress={() => addToCart(ci.item)}
                      >
                        <Text style={styles.stepperSign}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              {/* Gated Society Pool (FREE Delivery) */}
              <View style={[styles.cartSection, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={[styles.cartSectionTitle, { color: '#1E3A8A', marginBottom: 0 }]}>
                    🏢 Gated Society Pool (FREE Delivery)
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsCommunityPoolActive(!isCommunityPoolActive)}
                    style={{ backgroundColor: isCommunityPoolActive ? '#2563EB' : '#FFFFFF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '900', color: isCommunityPoolActive ? '#FFFFFF' : '#2563EB' }}>
                      {isCommunityPoolActive ? '✓ Pooled' : '+ Join Pool'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {isCommunityPoolActive && (
                  <View style={{ gap: 6, marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {['Marvel Serenity', 'Green Glen', 'Prestige Tech'].map((soc) => (
                        <TouchableOpacity
                          key={soc}
                          onPress={() => setSelectedSociety(soc)}
                          style={[
                            { flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DBEAFE' },
                            selectedSociety === soc && { backgroundColor: '#2563EB', borderColor: '#2563EB' },
                          ]}
                        >
                          <Text style={[{ fontSize: 10, fontWeight: '800', color: '#1E40AF' }, selectedSociety === soc && { color: '#FFF' }]}>
                            {soc}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={{ fontSize: 10, color: '#1D4ED8', fontStyle: 'italic', marginTop: 2 }}>
                      🎉 Delivery fee waived! Neighbor batch drop at {deliverySlot === 'INSTANT' ? '1:00 PM' : 'Scheduled Slot'}.
                    </Text>
                  </View>
                )}
              </View>

              {/* Homestyle Customizer */}
              <View style={[styles.cartSection, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                <Text style={[styles.cartSectionTitle, { color: '#78350F' }]}>
                  ✨ Maa Ke Haath Ka Touch (Cooked To Your Taste)
                </Text>

                {/* Spice selector */}
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#92400E', marginBottom: 4 }}>
                  1. Spice Level:
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                  {[
                    { id: 'MILD', label: '🌱 Mild' },
                    { id: 'MEDIUM', label: '🥘 Medium' },
                    { id: 'TEEKHA', label: '🔥 Teekha' },
                  ].map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => setSpiceLevel(s.id as any)}
                      style={[
                        { flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FDE68A' },
                        spiceLevel === s.id && { backgroundColor: '#D97706', borderColor: '#D97706' },
                      ]}
                    >
                      <Text style={[{ fontSize: 10, fontWeight: '800', color: '#78350F' }, spiceLevel === s.id && { color: '#FFF' }]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Fat Selector */}
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#92400E', marginBottom: 4 }}>
                  2. Cooking Fat:
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                  {[
                    { id: 'COLD_PRESSED', label: 'Groundnut Oil' },
                    { id: 'GIR_GHEE', label: 'Desi Cow Ghee' },
                    { id: 'LOW_OIL', label: 'Low Oil Diet' },
                  ].map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      onPress={() => setCookingFat(f.id as any)}
                      style={[
                        { flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FDE68A' },
                        cookingFat === f.id && { backgroundColor: '#D97706', borderColor: '#D97706' },
                      ]}
                    >
                      <Text style={[{ fontSize: 10, fontWeight: '800', color: '#78350F' }, cookingFat === f.id && { color: '#FFF' }]}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom Note input */}
                <TextInput
                  placeholder="Special note for home chef (e.g. keep dal runny, add lemon)..."
                  placeholderTextColor="#A16207"
                  value={chefCustomNote}
                  onChangeText={setChefCustomNote}
                  style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 11, color: '#78350F' }}
                />
              </View>

              {/* Delivery Slot Selection */}
              <View style={styles.cartSection}>
                <Text style={styles.cartSectionTitle}>Delivery Slot</Text>
                <View style={styles.slotGrid}>
                  <TouchableOpacity
                    style={[styles.slotCard, deliverySlot === 'INSTANT' && styles.slotCardActive]}
                    onPress={() => setDeliverySlot('INSTANT')}
                  >
                    <Text style={[styles.slotTitle, deliverySlot === 'INSTANT' && styles.slotTitleActive]}>
                      ⚡ Instant
                    </Text>
                    <Text style={styles.slotDesc}>15-20 Mins</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.slotCard, deliverySlot === 'PREORDER_LUNCH' && styles.slotCardActive]}
                    onPress={() => setDeliverySlot('PREORDER_LUNCH')}
                  >
                    <Text style={[styles.slotTitle, deliverySlot === 'PREORDER_LUNCH' && styles.slotTitleActive]}>
                      🍱 Lunch Slot
                    </Text>
                    <Text style={styles.slotDesc}>1:00 PM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.slotCard, deliverySlot === 'PREORDER_DINNER' && styles.slotCardActive]}
                    onPress={() => setDeliverySlot('PREORDER_DINNER')}
                  >
                    <Text style={[styles.slotTitle, deliverySlot === 'PREORDER_DINNER' && styles.slotTitleActive]}>
                      🌙 Dinner Slot
                    </Text>
                    <Text style={styles.slotDesc}>8:00 PM</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Zero Plastic Steel Dabba Commitment */}
              <TouchableOpacity
                style={styles.dabbaCheckbox}
                onPress={() => setReturnDabba(!returnDabba)}
                activeOpacity={0.8}
              >
                <Text style={styles.dabbaCheckIcon}>{returnDabba ? '☑️' : '⬜'}</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.dabbaTitle}>Returnable Steel Dabba (Zero Plastic)</Text>
                  <Text style={styles.dabbaDesc}>
                    I will return the previous stainless steel dabba to the rider upon arrival.
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Bill Details */}
              <View style={styles.cartSection}>
                <Text style={styles.cartSectionTitle}>Bill Summary</Text>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Item Total</Text>
                  <Text style={styles.billValue}>₹{cartSubtotal}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Delivery Partner Fee (≤ 5km)</Text>
                  <Text style={[styles.billValue, deliveryFee === 0 && styles.textGreen]}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Platform & Dabba Fee</Text>
                  <Text style={styles.billValue}>₹{platformFee}</Text>
                </View>
                <View style={[styles.billRow, styles.billTotalRow]}>
                  <Text style={styles.billTotalLabel}>To Pay</Text>
                  <Text style={styles.billTotalValue}>₹{grandTotal}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.checkoutBtn, isPlacingOrder && styles.btnDisabled]}
                onPress={handlePlaceOrder}
                disabled={isPlacingOrder}
              >
                {isPlacingOrder ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.checkoutBtnText}>Confirm & Pay ₹{grandTotal}</Text>
                )}
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* ===================== ORDER TRACKING & OTP MODAL ===================== */}
      <Modal visible={trackingModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalSafe}>
          {activeOrder && (
            <View style={styles.trackingContainer}>
              <View style={styles.menuModalHeader}>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setTrackingModalVisible(false)}
                >
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.modalHeaderTitle}>Order {activeOrder.orderNumber}</Text>
                  <Text style={styles.modalHeaderSub}>{activeOrder.kitchenName}</Text>
                </View>
              </View>

              <ScrollView style={{ padding: 20 }}>
                {/* 4-Digit Delivery OTP Card */}
                <View style={styles.otpCard}>
                  <Text style={styles.otpCardLabel}>DELIVERY VERIFICATION OTP</Text>
                  <Text style={styles.otpCardNumber}>{activeOrder.deliveryOtp}</Text>
                  <Text style={styles.otpCardNotice}>
                    Share this 4-digit code with rider Ramesh upon doorstep arrival to receive your fresh meal.
                  </Text>
                </View>

                {/* Milestone Stepper */}
                <View style={styles.trackingTimeline}>
                  <View style={styles.timelineStep}>
                    <Text style={styles.stepIconDone}>✓</Text>
                    <View style={styles.stepInfo}>
                      <Text style={styles.stepTitle}>Order Confirmed</Text>
                      <Text style={styles.stepSub}>Kitchen has accepted your meal request</Text>
                    </View>
                  </View>

                  <View style={styles.timelineStep}>
                    <Text style={styles.stepIconActive}>🍲</Text>
                    <View style={styles.stepInfo}>
                      <Text style={styles.stepTitle}>Cooking Fresh in Small Batch</Text>
                      <Text style={styles.stepSub}>Homemaker Anita is simmering fresh phulkas & dal</Text>
                    </View>
                  </View>

                  <View style={styles.timelineStep}>
                    <Text style={styles.stepIconPending}>🛵</Text>
                    <View style={styles.stepInfo}>
                      <Text style={styles.stepTitlePending}>Neighborhood Delivery</Text>
                      <Text style={styles.stepSub}>Rider assigned for rapid delivery (&lt; 20 mins)</Text>
                    </View>
                  </View>
                </View>

                {/* Eco & Dabba Info */}
                <View style={styles.ecoBox}>
                  <Text style={styles.ecoTitle}>🌱 ESG Sustainability Impact</Text>
                  <Text style={styles.ecoDesc}>
                    By ordering in our returnable stainless steel dabbas, you prevented 2 single-use plastic takeaway containers from landfills!
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.dismissBtn}
                  onPress={() => setTrackingModalVisible(false)}
                >
                  <Text style={styles.dismissBtnText}>Return to Marketplace</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Authentication & Profile Modal */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FoodAppMain />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authTopBarBtn: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  authTopBarText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C2410C',
  },
  deliveringLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveGpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveGpsText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.5,
  },
  locationPin: {
    fontSize: 15,
  },
  subAddressText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 1,
  },
  gpsRefreshBtn: {
    padding: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsRefreshIcon: {
    fontSize: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userProfileBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarSm: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarSmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  userIconSm: {
    fontSize: 18,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  badgeHub: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeHubText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#2563EB',
  },
  modeSwitchBtn: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  modeSwitchHomemaker: {
    backgroundColor: '#EA580C',
    borderColor: '#C2410C',
  },
  modeSwitchText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EA580C',
  },
  modeSwitchTextLight: {
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 8,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  radiusPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  radiusPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#047857',
  },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartIcon: {
    fontSize: 20,
  },
  cartCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EA580C',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  clearSearch: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  activeTab: {
    backgroundColor: '#EA580C',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  radiusSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  radiusSelectorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  radiusButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  radiusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  radiusBtnActive: {
    backgroundColor: '#059669',
  },
  radiusBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  radiusBtnTextActive: {
    color: '#FFFFFF',
  },
  scrollList: {
    padding: 16,
    paddingBottom: 40,
  },
  promoBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  promoHeader: {
    marginBottom: 4,
  },
  promoTag: {
    fontSize: 10,
    fontWeight: '900',
    color: '#D97706',
  },
  promoTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#78350F',
    marginTop: 2,
  },
  promoDesc: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 4,
    lineHeight: 17,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 160,
    width: '100%',
    backgroundColor: '#E2E8F0',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  badgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distanceBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  prepBadge: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  prepText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  cardBody: {
    padding: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kitchenName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  cuisines: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  storyBox: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  storyLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#C2410C',
    marginBottom: 2,
  },
  storyText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#9A3412',
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  priceSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  actionPill: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  expandBtn: {
    marginTop: 14,
    backgroundColor: '#EA580C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  expandBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Floating Cart Bar
  floatingCartBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  floatingCartCount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  floatingCartSub: {
    color: '#94A3B8',
    fontSize: 11,
  },
  floatingCheckoutBtn: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  floatingCheckoutBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  // Modal Common
  modalSafe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  menuModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalHeaderSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  menuSubTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  menuSubTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  menuSubTabActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  menuSubTabText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  menuSubTabTextActive: {
    color: '#FFFFFF',
  },
  menuScroll: {
    padding: 16,
  },
  menuItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dietRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  vegIcon: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  nonVegIcon: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  specialBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  specialBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#B45309',
  },
  menuItemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  menuItemPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  menuItemDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 15,
  },
  portionNotice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
    marginTop: 6,
  },
  itemActionCol: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#EA580C',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    borderRadius: 10,
    overflow: 'hidden',
  },
  stepperMinus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepperPlus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepperSign: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  stepperQty: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    paddingHorizontal: 6,
  },

  // Tiffin Plans
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  planBadge: {
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2563EB',
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  planDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  planSubscribeBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  planSubscribeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  // Cart & Checkout
  cartScroll: {
    padding: 16,
  },
  cartSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cartSectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
  },
  cartItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  cartItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  cartItemPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 2,
  },
  slotGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  slotCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  slotCardActive: {
    borderColor: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  slotTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  slotTitleActive: {
    color: '#EA580C',
  },
  slotDesc: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  dabbaCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  dabbaCheckIcon: {
    fontSize: 20,
  },
  dabbaTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#166534',
  },
  dabbaDesc: {
    fontSize: 10,
    color: '#15803D',
    marginTop: 2,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  billLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  billValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  billTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  billTotalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  billTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#EA580C',
  },
  checkoutBtn: {
    backgroundColor: '#EA580C',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  btnDisabled: {
    opacity: 0.6,
  },

  // Tracking Modal
  trackingContainer: {
    flex: 1,
  },
  otpCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  otpCardLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  otpCardNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 6,
    marginVertical: 6,
  },
  otpCardNotice: {
    fontSize: 11,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 16,
  },
  trackingTimeline: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 16,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIconDone: {
    fontSize: 14,
    fontWeight: '900',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    width: 32,
    height: 32,
    borderRadius: 16,
    textAlign: 'center',
    lineHeight: 32,
  },
  stepIconActive: {
    fontSize: 16,
    backgroundColor: '#FFF7ED',
    width: 32,
    height: 32,
    borderRadius: 16,
    textAlign: 'center',
    lineHeight: 32,
  },
  stepIconPending: {
    fontSize: 16,
    backgroundColor: '#F1F5F9',
    width: 32,
    height: 32,
    borderRadius: 16,
    textAlign: 'center',
    lineHeight: 32,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  stepTitlePending: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  stepSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  ecoBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 16,
  },
  ecoTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#166534',
  },
  ecoDesc: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 2,
    lineHeight: 16,
  },
  dismissBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  dismissBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },

  // Homemaker Studio Styles
  studioContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  studioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  studioHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  studioChefName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  studioKitchenTitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusToggle: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusOpen: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusClosed: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statusToggleText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#047857',
  },
  statGrid: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  orderCustomer: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPrep: {
    backgroundColor: '#FEF3C7',
  },
  statusReady: {
    backgroundColor: '#ECFDF5',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#92400E',
  },
  orderItems: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  orderAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  readyBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  readyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  otpPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  otpPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#2563EB',
  },
  menuBatchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuBatchInfo: {
    flex: 1,
    paddingRight: 10,
  },
  menuBatchName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  menuBatchPrice: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  portionCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  portionCountLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  portionCountValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#059669',
  },
  stepperCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 6,
  },
  portionBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  portionBtnAdd: {
    backgroundColor: '#EA580C',
  },
  portionBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  soldOutBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
  },
  soldOutText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#DC2626',
  },
  textGreen: {
    color: '#059669',
  },
  textRed: {
    color: '#DC2626',
  },
  textWhite: {
    color: '#FFFFFF',
  },
});
