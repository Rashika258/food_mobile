import React, { useState, useEffect, useMemo } from 'react';
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
  FALLBACK_KITCHENS,
} from './src/api';
import { AuthProvider, useAuth } from './src/AuthContext';
import { AuthModal } from './src/AuthModal';
import { useRealtimeLocation } from './src/useRealtimeLocation';

interface CartItem {
  item: MenuItem;
  quantity: number;
}

// Category filter definitions
const QUICK_CATEGORIES = [
  { id: 'ALL', label: 'All Rasois', icon: '🍲' },
  { id: 'THALIS', label: 'Homestyle Thalis', icon: '🍱', query: 'thali' },
  { id: 'EXPRESS', label: '15-Min Express', icon: '⚡', query: 'fast' },
  { id: 'DIET', label: 'Healthy & Diabetic', icon: '🥗', query: 'healthy' },
  { id: 'BIRYANI', label: 'Clay Dum Biryani', icon: '🥘', query: 'biryani' },
  { id: 'SOUTH', label: 'South Tiffins', icon: '🥞', query: 'south' },
  { id: 'GHEE', label: 'Gir Cow Ghee', icon: '🧈', query: 'ghee' },
  { id: 'DABBA', label: 'Zero Plastic Dabba', icon: '🌱', query: 'homestyle' },
];

const HOMEMAKER_REELS = [
  { id: 'r1', name: 'Anita D.', kitchen: 'Ghar Ka Khana', emoji: '👩‍🍳', tag: 'Pure Ghee', specialty: 'Phulkas made fresh on open flame' },
  { id: 'r2', name: 'Amma M.', kitchen: "Amma's Rasoi", emoji: '👵', tag: 'Stone Ground', specialty: 'Gunpowder Podi & Soft Idlis' },
  { id: 'r3', name: 'Tariq K.', kitchen: 'Royal Durbar', emoji: '👨‍🍳', tag: 'Clay Handi', specialty: 'Slow dum cooked saffron rice' },
  { id: 'r4', name: 'Suman L.', kitchen: 'Pahadi Kitchen', emoji: '🥘', tag: 'Cast Iron', specialty: 'Zero preservative homestyle dal' },
  { id: 'r5', name: 'Bhavna B.', kitchen: 'Kathiyawadi Dabba', emoji: '👩‍🍳', tag: 'Cold Pressed', specialty: 'Ringna No Oro & Bajra Rotla' },
];

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

  // Bottom Navigation Bar Tab: HOME | EXPLORE | TIFFINS | ORDERS | STUDIO
  const [activeBottomTab, setActiveBottomTab] = useState<'HOME' | 'EXPLORE' | 'TIFFINS' | 'ORDERS' | 'STUDIO'>('HOME');

  // Customer State
  const [activeMarketplaceTab, setActiveMarketplaceTab] = useState<'HOME_KITCHEN' | 'RESTAURANT'>('HOME_KITCHEN');
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
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
  const [elderCareGift, setElderCareGift] = useState<boolean>(false);

  // Active Order Tracking
  const [activeOrder, setActiveOrder] = useState<any>({
    id: 'ord_active',
    orderNumber: 'FD-892401',
    kitchenName: "Anita's Ghar Ka Khana",
    itemsSummary: '2x Special Ghar Ki Thali (4 Phulkas + Paneer)',
    totalAmount: 325,
    deliveryOtp: '4829',
    status: 'COOKING', // PLACED -> COOKING -> ON_WAY -> DELIVERED
    slot: 'Instant Delivery • 15 Mins',
    riderName: 'Ramesh K. (EV Rider)',
    dabbaType: '3-Tier Stainless Steel Dabba (Plastic-Free)',
  });
  const [trackingModalVisible, setTrackingModalVisible] = useState<boolean>(false);

  // Homemaker Studio State
  const [isKitchenOpen, setIsKitchenOpen] = useState<boolean>(true);
  const [homemakerMenu, setHomemakerMenu] = useState<MenuItem[]>(FALLBACK_MENU['k1'] || []);
  const [homemakerOrders, setHomemakerOrders] = useState<LiveCookingOrder[]>(FALLBACK_HOMEMAKER_ORDERS);

  useEffect(() => {
    loadKitchens();
  }, [activeMarketplaceTab, radiusKm, coords.latitude, coords.longitude]);

  const loadKitchens = async () => {
    setLoading(true);
    const data = await fetchNearbyKitchens(
      coords.latitude,
      coords.longitude,
      radiusKm,
      activeMarketplaceTab
    );
    setKitchens(data && data.length > 0 ? data : FALLBACK_KITCHENS);
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
    setKitchenMenuItems(details.menuItems || FALLBACK_MENU[kitchen.id] || FALLBACK_MENU['k1'] || []);
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
  const deliveryFee = (isCommunityPoolActive || activeMarketplaceTab === 'HOME_KITCHEN') ? 0 : 35;
  const platformFee = 5;
  const grandTotal = cartSubtotal > 0 ? cartSubtotal + deliveryFee + platformFee : 0;

  // Checkout
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in or choose a demo persona to place your order.',
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

    const customInstructions = `Spice: ${spiceLevel}, Fat: ${cookingFat}, Roti: ${rotiChoice}${chefCustomNote ? ` | ${chefCustomNote}` : ''}${elderCareGift ? ' | 👵 Care For Elders Gift Tag' : ''}`;

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
    const orderedItemsSummary = cart.map(c => `${c.quantity}x ${c.item.name}`).join(', ');
    setCart([]);

    setActiveOrder({
      id: res.data?.id || `ord_${Date.now()}`,
      orderNumber: res.data?.orderNumber || `FD-${Math.floor(100000 + Math.random() * 900000)}`,
      kitchenName: selectedKitchen?.name || "Anita's Ghar Ka Khana",
      itemsSummary: orderedItemsSummary,
      totalAmount: grandTotal,
      deliveryOtp: res.data?.deliveryOtp || `${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'COOKING',
      slot: deliverySlot === 'INSTANT' ? 'Instant Delivery • 15 Mins' : 'Scheduled Slot',
      riderName: 'Ramesh K. (Neighborhood EV Rider)',
      dabbaType: '3-Tier Stainless Steel Dabba (Plastic-Free)',
    });
    setActiveBottomTab('ORDERS');
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
    Alert.alert('Rider Summoned!', 'Order is packed in sanitized steel dabba. Neighborhood rider Ramesh has been summoned for doorstep pickup.');
  };

  // Filtered Kitchens logic
  const filteredKitchens = useMemo(() => {
    return kitchens.filter((k) => {
      const matchSearch =
        k.name.toLowerCase().includes(search.toLowerCase()) ||
        k.cuisines.toLowerCase().includes(search.toLowerCase()) ||
        (k.storyText && k.storyText.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      if (selectedCategory === 'ALL') return true;
      const cat = QUICK_CATEGORIES.find((c) => c.id === selectedCategory);
      if (cat?.query) {
        return (
          k.cuisines.toLowerCase().includes(cat.query) ||
          k.name.toLowerCase().includes(cat.query) ||
          (k.description && k.description.toLowerCase().includes(cat.query))
        );
      }
      return true;
    });
  }, [kitchens, search, selectedCategory]);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFBF5" />

      {/* ===================== TOP HEADER APP BAR ===================== */}
      <View style={styles.brandAppBar}>
        <View style={styles.brandLeft}>
          {/* Logo Mark */}
          <View style={styles.brandIconWrapper}>
            <Text style={styles.brandIcon}>🍲</Text>
          </View>
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitle}>RasoiHub</Text>
              <View style={styles.artisanalBadge}>
                <Text style={styles.artisanalBadgeText}>HOMEMADE</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.locationPillRow}
              onPress={refreshLocation}
              activeOpacity={0.7}
            >
              <View style={styles.pulseDot} />
              <Text style={styles.locationMainText} numberOfLines={1}>
                {loadingLocation ? 'Locating...' : addressName}
              </Text>
              <Text style={styles.locationDropdownArrow}>▾</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Right Action Icons: Profile Avatar & Dabba / Cart Indicator */}
        <View style={styles.brandRight}>
          <TouchableOpacity
            style={styles.profileAvatarBtn}
            onPress={() => setAuthModalVisible(true)}
            activeOpacity={0.8}
          >
            {user ? (
              <View style={styles.userInitialsBadge}>
                <Text style={styles.userInitialsText}>{user.name.charAt(0).toUpperCase()}</Text>
              </View>
            ) : (
              <Text style={styles.profileIconPlaceholder}>👤</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cartHeaderBtn}
            onPress={() => setCartModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.cartHeaderEmoji}>🛍️</Text>
            {totalCartCount > 0 && (
              <View style={styles.cartHeaderCounter}>
                <Text style={styles.cartHeaderCounterText}>{totalCartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ===================== MAIN SCREEN CONTENT BY ACTIVE TAB ===================== */}
      <View style={styles.screenBody}>
        {/* ===================== TAB 1: HOME FEED ===================== */}
        {activeBottomTab === 'HOME' && (
          <ScrollView
            style={styles.mainFeedScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.mainFeedContent}
          >
            {/* Search Bar with Micro-Filter */}
            <View style={styles.searchBarWrapper}>
              <View style={styles.searchBarInputContainer}>
                <Text style={styles.searchMagnifierIcon}>🔍</Text>
                <TextInput
                  style={styles.searchTextInput}
                  placeholder="Search home rasois, dabbas, regional thalis..."
                  placeholderTextColor="#94A3B8"
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Text style={styles.searchClearBtn}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* 15-Second Homemaker Stories Reel */}
            <View style={styles.storiesContainer}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.flexRowCenter}>
                  <Text style={styles.liveRedDot}>🔴</Text>
                  <Text style={styles.sectionHeaderTitle}>15s Live Cook Stories</Text>
                </View>
                <Text style={styles.sectionHeaderSubAction}>Watch Prep</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesScrollContent}
              >
                {HOMEMAKER_REELS.map((reel) => (
                  <TouchableOpacity
                    key={reel.id}
                    style={styles.storyBubble}
                    activeOpacity={0.8}
                    onPress={() => {
                      Alert.alert(
                        `📹 ${reel.name} • ${reel.kitchen}`,
                        `"${reel.specialty}"\n\n✨ Tag: ${reel.tag}\n🥘 Authentic family recipe crafted in fresh daily small batches.`
                      );
                    }}
                  >
                    <View style={styles.storyRingWrapper}>
                      <View style={styles.storyInnerCircle}>
                        <Text style={styles.storyEmoji}>{reel.emoji}</Text>
                      </View>
                    </View>
                    <Text style={styles.storyChefName} numberOfLines={1}>
                      {reel.name}
                    </Text>
                    <View style={styles.storyTagBadge}>
                      <Text style={styles.storyTagText} numberOfLines={1}>
                        {reel.tag}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Interactive Category & Quick-Filter Carousel */}
            <View style={styles.categoryCarouselWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScrollContent}
              >
                {QUICK_CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryPill,
                        isActive && styles.categoryPillActive,
                      ]}
                      onPress={() => setSelectedCategory(cat.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.categoryPillIcon}>{cat.icon}</Text>
                      <Text
                        style={[
                          styles.categoryPillLabel,
                          isActive && styles.categoryPillLabelActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Differentiator Banner: Zero Plastic Dabba & Society Pooling */}
            <View style={styles.sustainabilityHeroBanner}>
              <View style={styles.bannerBadgeRow}>
                <View style={styles.bannerTagGreen}>
                  <Text style={styles.bannerTagGreenText}>🌱 100% ZERO-PLASTIC</Text>
                </View>
                <View style={styles.bannerTagAmber}>
                  <Text style={styles.bannerTagAmberText}>⚡ MAX 15 PORTIONS/BATCH</Text>
                </View>
              </View>
              <Text style={styles.sustainabilityHeroTitle}>
                Real Home Food, Delivered in Returnable Steel Dabbas
              </Text>
              <Text style={styles.sustainabilityHeroSubtitle}>
                No dark kitchens. No commercial hydrogenated fats. Pure homestyle taste crafted by verified homemakers in your society radius.
              </Text>

              {/* Society Pooling Mini-Indicator */}
              <TouchableOpacity
                style={styles.societyPoolStrip}
                onPress={() => setCartModalVisible(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.societyPoolIcon}>🏢</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.societyPoolText}>
                    Free Neighborhood Drop: <Text style={{ fontWeight: '900' }}>{selectedSociety}</Text>
                  </Text>
                  <Text style={styles.societyPoolSub}>Pooling with 6 neighboring apartments saves delivery charges</Text>
                </View>
                <Text style={styles.societyPoolArrow}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Marketplace Dual Mode Switcher: Homemakers vs Cloud Kitchens */}
            <View style={styles.marketplaceSwitchContainer}>
              <View style={styles.marketplaceSwitchBar}>
                <TouchableOpacity
                  style={[
                    styles.marketplaceSwitchTab,
                    activeMarketplaceTab === 'HOME_KITCHEN' && styles.marketplaceSwitchTabActive,
                  ]}
                  onPress={() => setActiveMarketplaceTab('HOME_KITCHEN')}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.marketplaceSwitchText,
                      activeMarketplaceTab === 'HOME_KITCHEN' && styles.marketplaceSwitchTextActive,
                    ]}
                  >
                    🏡 Homemakers (≤ {radiusKm} km)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.marketplaceSwitchTab,
                    activeMarketplaceTab === 'RESTAURANT' && styles.marketplaceSwitchTabActive,
                  ]}
                  onPress={() => setActiveMarketplaceTab('RESTAURANT')}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.marketplaceSwitchText,
                      activeMarketplaceTab === 'RESTAURANT' && styles.marketplaceSwitchTextActive,
                    ]}
                  >
                    🍽️ Dining &amp; Cloud
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Radius Filter Pills */}
              {activeMarketplaceTab === 'HOME_KITCHEN' && (
                <View style={styles.radiusPillRow}>
                  <Text style={styles.radiusLabel}>Neighborhood Distance:</Text>
                  <View style={styles.radiusButtonsGroup}>
                    {[3, 5, 10].map((km) => (
                      <TouchableOpacity
                        key={km}
                        style={[
                          styles.radiusChip,
                          radiusKm === km && styles.radiusChipActive,
                        ]}
                        onPress={() => setRadiusKm(km)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.radiusChipText,
                            radiusKm === km && styles.radiusChipTextActive,
                          ]}
                        >
                          {km} KM
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Kitchen Listing Feed */}
            <View style={styles.kitchensFeedHeader}>
              <Text style={styles.feedHeadingTitle}>
                {activeMarketplaceTab === 'HOME_KITCHEN' ? 'Verified Home Rasois Nearby' : 'Popular Dining Kitchens'}
              </Text>
              <Text style={styles.feedHeadingCount}>{filteredKitchens.length} available</Text>
            </View>

            {loading ? (
              <View style={styles.loaderCenter}>
                <ActivityIndicator size="large" color="#E05326" />
                <Text style={styles.loaderText}>Discovering fresh neighborhood pots...</Text>
              </View>
            ) : filteredKitchens.length === 0 ? (
              <View style={styles.emptyResultsCard}>
                <Text style={styles.emptyResultsEmoji}>🍲</Text>
                <Text style={styles.emptyResultsTitle}>No kitchens matching current filters</Text>
                <Text style={styles.emptyResultsSubtitle}>
                  Try expanding the neighborhood distance to 10 km or selecting &quot;All Rasois&quot;.
                </Text>
                <TouchableOpacity
                  style={styles.expandRadiusBtn}
                  onPress={() => {
                    setRadiusKm(10);
                    setSelectedCategory('ALL');
                    setSearch('');
                  }}
                >
                  <Text style={styles.expandRadiusBtnText}>Reset Filters &amp; Expand Radius</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredKitchens.map((kitchen) => (
                <TouchableOpacity
                  key={kitchen.id}
                  style={styles.artisanalKitchenCard}
                  activeOpacity={0.92}
                  onPress={() => handleOpenKitchen(kitchen)}
                >
                  {/* Card Cover Media */}
                  <View style={styles.cardMediaContainer}>
                    <Image
                      source={{
                        uri:
                          kitchen.coverImage ||
                          'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
                      }}
                      style={styles.cardCoverImage}
                    />
                    <View style={styles.cardGradientOverlay} />

                    {/* Floating Badges */}
                    <View style={styles.cardTopBadgeRow}>
                      <View style={styles.batchNoticeBadge}>
                        <Text style={styles.batchNoticeText}>
                          {kitchen.type === 'HOME_KITCHEN' ? '🔥 Small Batch • Fresh Daily' : '⚡ Rapid Kitchen'}
                        </Text>
                      </View>
                      <View style={styles.distanceBadge}>
                        <Text style={styles.distanceBadgeText}>📍 {kitchen.distanceKm || 0.8} km</Text>
                      </View>
                    </View>

                    {/* Delivery & Hygiene Strip */}
                    <View style={styles.cardBottomMediaStrip}>
                      <View style={styles.timeBadge}>
                        <Text style={styles.timeBadgeText}>
                          ⏱️ {kitchen.estimatedDeliveryMins || kitchen.orderLeadTimeMinutes || 20} mins
                        </Text>
                      </View>
                      <View style={styles.hygieneBadge}>
                        <Text style={styles.hygieneBadgeText}>🛡️ {kitchen.hygieneScore || 98}% Hygiene Score</Text>
                      </View>
                    </View>
                  </View>

                  {/* Card Body Info */}
                  <View style={styles.cardContentBody}>
                    <View style={styles.kitchenNameRow}>
                      <Text style={styles.kitchenNameTitle} numberOfLines={1}>
                        {kitchen.name}
                      </Text>
                      <View style={styles.ratingPill}>
                        <Text style={styles.ratingPillText}>★ {kitchen.rating?.toFixed(1) || '4.9'}</Text>
                      </View>
                    </View>

                    <Text style={styles.kitchenCuisinesSubtitle} numberOfLines={1}>
                      {kitchen.cuisines}
                    </Text>

                    {/* Authentic Story Quote if available */}
                    {kitchen.storyText && (
                      <View style={styles.chefStoryQuoteBox}>
                        <Text style={styles.chefStoryQuoteEmoji}>👩‍🍳</Text>
                        <Text style={styles.chefStoryQuoteText} numberOfLines={2}>
                          &quot;{kitchen.storyText}&quot;
                        </Text>
                      </View>
                    )}

                    {/* Price and CTA */}
                    <View style={styles.cardFooterActionRow}>
                      <View>
                        <Text style={styles.priceForTwoLabel}>Avg. Cost</Text>
                        <Text style={styles.priceForTwoValue}>
                          ₹{kitchen.priceForTwo}{' '}
                          <Text style={styles.priceForTwoMuted}>for two</Text>
                        </Text>
                      </View>

                      <View style={styles.viewMenuCTA}>
                        <Text style={styles.viewMenuCTAText}>View Menu &amp; Tiffins →</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* ===================== TAB 2: EXPLORE / CURATED COLLECTIONS ===================== */}
        {activeBottomTab === 'EXPLORE' && (
          <ScrollView
            style={styles.mainFeedScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.mainFeedContent}
          >
            <View style={styles.exploreHeroHeader}>
              <Text style={styles.exploreHeaderTag}>REGIONAL SPECIALS</Text>
              <Text style={styles.exploreHeaderTitle}>Authentic Flavors from Home Roots</Text>
              <Text style={styles.exploreHeaderSub}>
                Hand-picked home kitchens cooking heritage recipes with authentic spices and pure ghee.
              </Text>
            </View>

            {/* Curated Grid Banners */}
            {[
              {
                title: '👵 Dadi-Nani Heritage Recipes',
                desc: 'Slow-cooked lentils, roasted spices in cast iron, and traditional grain rotis.',
                tag: 'Pure Nostalgia',
                bg: '#FEF3C7',
                border: '#FDE68A',
                textColor: '#92400E',
                filter: 'thali',
              },
              {
                title: '🥗 Diabetic-Friendly Low-GI Pots',
                desc: 'Foxtail millet khichdi, bitter gourd sabzi, methi parathas with zero refined sugar.',
                tag: 'Clinically Balanced',
                bg: '#ECFDF5',
                border: '#A7F3D0',
                textColor: '#065F46',
                filter: 'healthy',
              },
              {
                title: '⚡ 15-Minute Hyper-Local Lunch Drops',
                desc: 'Hot steel dabbas dispatched straight from home kitchens inside your gated community.',
                tag: 'Zero Wait',
                bg: '#EFF6FF',
                border: '#BFDBFE',
                textColor: '#1E40AF',
                filter: 'fast',
              },
              {
                title: '🥘 Sunday Clay Handi Dum Feasts',
                desc: 'Aged basmati rice sealed with wheat dough, dum cooked over fragrant charcoal fire.',
                tag: 'Slow Simmered',
                bg: '#FFF1F2',
                border: '#FECDD3',
                textColor: '#9F1239',
                filter: 'biryani',
              },
            ].map((col, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.curatedExploreCard,
                  { backgroundColor: col.bg, borderColor: col.border },
                ]}
                activeOpacity={0.88}
                onPress={() => {
                  setSearch(col.filter);
                  setActiveBottomTab('HOME');
                }}
              >
                <View style={styles.curatedTopRow}>
                  <Text style={[styles.curatedTag, { color: col.textColor }]}>{col.tag}</Text>
                  <Text style={[styles.curatedArrow, { color: col.textColor }]}>Explore Collection →</Text>
                </View>
                <Text style={[styles.curatedTitle, { color: col.textColor }]}>{col.title}</Text>
                <Text style={[styles.curatedDesc, { color: col.textColor }]}>{col.desc}</Text>
              </TouchableOpacity>
            ))}

            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* ===================== TAB 3: TIFFIN SUBSCRIPTIONS ===================== */}
        {activeBottomTab === 'TIFFINS' && (
          <ScrollView
            style={styles.mainFeedScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.mainFeedContent}
          >
            <View style={styles.tiffinHeroCard}>
              <View style={styles.tiffinHeroBadge}>
                <Text style={styles.tiffinHeroBadgeText}>🍱 DAILY OFFICE &amp; HOME TIFFINS</Text>
              </View>
              <Text style={styles.tiffinHeroTitle}>Save Cooking Time. Eat Clean Everyday.</Text>
              <Text style={styles.tiffinHeroSubtitle}>
                Pre-book 7, 14, or 30 days of wholesome home meals. Delivered hot in sanitized steel dabbas. Pause or skip meals anytime with 1 tap.
              </Text>

              <View style={styles.tiffinPerksRow}>
                <View style={styles.tiffinPerk}>
                  <Text style={styles.tiffinPerkIcon}>🛡️</Text>
                  <Text style={styles.tiffinPerkText}>Zero Delivery Fee</Text>
                </View>
                <View style={styles.tiffinPerk}>
                  <Text style={styles.tiffinPerkIcon}>⏸️</Text>
                  <Text style={styles.tiffinPerkText}>Pause Anytime</Text>
                </View>
                <View style={styles.tiffinPerk}>
                  <Text style={styles.tiffinPerkIcon}>🍲</Text>
                  <Text style={styles.tiffinPerkText}>Different Menu Daily</Text>
                </View>
              </View>
            </View>

            <Text style={styles.tiffinSectionHeading}>Popular Neighborhood Meal Plans</Text>

            {FALLBACK_SUBSCRIPTIONS.map((plan) => (
              <View key={plan.id} style={styles.planCardNew}>
                <View style={styles.planCardTop}>
                  <View style={styles.planPackBadge}>
                    <Text style={styles.planPackBadgeText}>{plan.totalMeals} MEAL PACK</Text>
                  </View>
                  <Text style={styles.planDietPill}>{plan.dietaryType}</Text>
                </View>

                <Text style={styles.planTitleNew}>{plan.title}</Text>
                <Text style={styles.planDescNew}>{plan.description}</Text>

                <View style={styles.planDivider} />

                <View style={styles.planPricingRow}>
                  <View>
                    <Text style={styles.planPricePerMeal}>₹{Math.round(plan.price / plan.totalMeals)} / meal</Text>
                    <Text style={styles.planPriceTotal}>₹{plan.price} total (all inclusive)</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.planSubscribeCTA}
                    activeOpacity={0.8}
                    onPress={() => {
                      Alert.alert(
                        '✨ Tiffin Subscription Active!',
                        `You have subscribed to ${plan.title}.\nFirst hot steel dabba will arrive tomorrow at your address.\nNo single-use plastic guaranteed!`
                      );
                    }}
                  >
                    <Text style={styles.planSubscribeCTAText}>Subscribe Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* ===================== TAB 4: ORDERS & LIVE TRACKING ===================== */}
        {activeBottomTab === 'ORDERS' && (
          <ScrollView
            style={styles.mainFeedScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.mainFeedContent}
          >
            {activeOrder ? (
              <View>
                <View style={styles.activeOrderBanner}>
                  <View style={styles.activeOrderBannerHeader}>
                    <View>
                      <Text style={styles.activeOrderTag}>CURRENT ACTIVE ORDER</Text>
                      <Text style={styles.activeOrderKitchenName}>{activeOrder.kitchenName}</Text>
                      <Text style={styles.activeOrderItemsSummary}>{activeOrder.itemsSummary}</Text>
                    </View>
                    <View style={styles.activeOrderAmtPill}>
                      <Text style={styles.activeOrderAmtText}>₹{activeOrder.totalAmount}</Text>
                    </View>
                  </View>

                  {/* 4-Digit Delivery OTP Card */}
                  <View style={styles.heroOtpCard}>
                    <Text style={styles.heroOtpLabel}>DOORSTEP DELIVERY OTP</Text>
                    <Text style={styles.heroOtpDigits}>{activeOrder.deliveryOtp}</Text>
                    <Text style={styles.heroOtpNotice}>
                      Share this 4-digit verification code with your rider upon arrival to receive your fresh meal.
                    </Text>
                  </View>

                  {/* Milestone Tracker Stepper */}
                  <View style={styles.liveTimelineStepper}>
                    <View style={styles.timelineStepItem}>
                      <View style={styles.stepCircleDone}>
                        <Text style={styles.stepCircleDoneText}>✓</Text>
                      </View>
                      <View style={styles.stepInfoCol}>
                        <Text style={styles.stepHeaderBold}>Order Accepted</Text>
                        <Text style={styles.stepSubDetail}>Kitchen confirmed request</Text>
                      </View>
                    </View>

                    <View style={styles.timelineStepItem}>
                      <View style={styles.stepCircleActive}>
                        <Text style={styles.stepCircleActiveEmoji}>🍲</Text>
                      </View>
                      <View style={styles.stepInfoCol}>
                        <Text style={styles.stepHeaderBoldActive}>Simmering Fresh in Small Batch</Text>
                        <Text style={styles.stepSubDetail}>Homemaker is preparing hand-rolled phulkas &amp; dal</Text>
                      </View>
                    </View>

                    <View style={styles.timelineStepItem}>
                      <View style={styles.stepCirclePending}>
                        <Text style={styles.stepCirclePendingText}>🛵</Text>
                      </View>
                      <View style={styles.stepInfoCol}>
                        <Text style={styles.stepHeaderPending}>Neighborhood EV Dispatch</Text>
                        <Text style={styles.stepSubDetail}>{activeOrder.riderName} assigned</Text>
                      </View>
                    </View>
                  </View>

                  {/* Returnable Dabba & Eco Impact Box */}
                  <View style={styles.dabbaStatusBox}>
                    <View style={styles.dabbaIconCircle}>
                      <Text style={{ fontSize: 20 }}>🌱</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dabbaStatusTitle}>{activeOrder.dabbaType}</Text>
                      <Text style={styles.dabbaStatusDesc}>
                        Thank you for keeping 2 plastic takeaway containers out of Indian landfills today!
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Past Orders List */}
                <Text style={styles.pastOrdersTitle}>Recent Order History</Text>
                {[
                  {
                    orderNo: 'FD-774910',
                    kitchen: "Amma's South Indian Kitchen",
                    items: '2x Ghee Podi Thatte Idli, 1x Filter Coffee',
                    date: 'Yesterday, 8:45 AM',
                    amt: 200,
                    status: 'DELIVERED',
                  },
                  {
                    orderNo: 'FD-762934',
                    kitchen: "Anita's Ghar Ka Khana",
                    items: '1x Puran Poli with Katachi Amti',
                    date: '28 Oct, 1:15 PM',
                    amt: 140,
                    status: 'DELIVERED',
                  },
                ].map((ord, idx) => (
                  <View key={idx} style={styles.pastOrderCard}>
                    <View style={styles.pastOrderTopRow}>
                      <View>
                        <Text style={styles.pastOrderKitchen}>{ord.kitchen}</Text>
                        <Text style={styles.pastOrderItems}>{ord.items}</Text>
                        <Text style={styles.pastOrderDate}>{ord.date}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.pastOrderAmt}>₹{ord.amt}</Text>
                        <View style={styles.pastOrderDeliveredPill}>
                          <Text style={styles.pastOrderDeliveredText}>✓ {ord.status}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyResultsCard}>
                <Text style={styles.emptyResultsEmoji}>📦</Text>
                <Text style={styles.emptyResultsTitle}>No active orders right now</Text>
                <Text style={styles.emptyResultsSubtitle}>Explore delicious home-cooked meals from nearby kitchens.</Text>
                <TouchableOpacity
                  style={styles.expandRadiusBtn}
                  onPress={() => setActiveBottomTab('HOME')}
                >
                  <Text style={styles.expandRadiusBtnText}>Order Fresh Food →</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* ===================== TAB 5: HOMEMAKER COOK STUDIO ===================== */}
        {activeBottomTab === 'STUDIO' && (
          <ScrollView
            style={styles.mainFeedScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.mainFeedContent}
          >
            {/* Chef Profile Header */}
            <View style={styles.studioHeroCard}>
              <View style={styles.studioHeaderRow}>
                <View>
                  <Text style={styles.studioChefName}>Anita Deshmukh 👩‍🍳</Text>
                  <Text style={styles.studioKitchenTitle}>Anita&apos;s Ghar Ka Khana • Bellandur</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.statusToggleBtn,
                    isKitchenOpen ? styles.statusOpenBtn : styles.statusClosedBtn,
                  ]}
                  onPress={() => setIsKitchenOpen(!isKitchenOpen)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.statusToggleBtnText}>
                    {isKitchenOpen ? '🟢 OPEN FOR ORDERS' : '🔴 CLOSED'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Stats Grid */}
              <View style={styles.studioStatGrid}>
                <View style={styles.studioStatBox}>
                  <Text style={styles.studioStatNumber}>₹2,520</Text>
                  <Text style={styles.studioStatLabel}>Today&apos;s Net Payout</Text>
                </View>
                <View style={styles.studioStatBox}>
                  <Text style={styles.studioStatNumber}>10%</Text>
                  <Text style={styles.studioStatLabel}>Platform Fee (Fair)</Text>
                </View>
                <View style={styles.studioStatBox}>
                  <Text style={styles.studioStatNumber}>7</Text>
                  <Text style={styles.studioStatLabel}>Daily Tiffin Subs</Text>
                </View>
              </View>

              {/* Instant Daily UPI Payout */}
              <TouchableOpacity
                style={styles.upiPayoutBox}
                onPress={() => {
                  Alert.alert(
                    '⚡ UPI Instant Settlement Successful',
                    '₹2,520 deposited into anita@okhdfcbank!\nTransaction Ref: UPI-984210\nZero deduction fee.'
                  );
                }}
                activeOpacity={0.85}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.upiPayoutTitle}>⚡ Instant UPI Bank Transfer</Text>
                  <Text style={styles.upiPayoutSub}>Withdraw ₹2,520 directly to anita@okhdfcbank</Text>
                </View>
                <View style={styles.upiPayoutActionPill}>
                  <Text style={styles.upiPayoutActionText}>Withdraw →</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Live Cooking Queue */}
            <View style={styles.sectionHeadingWithSub}>
              <Text style={styles.sectionMainTitle}>🔥 Live Cooking Queue ({homemakerOrders.length})</Text>
              <Text style={styles.sectionSubtitleText}>Bellandur Neighborhood Delivery</Text>
            </View>

            {homemakerOrders.map((ord) => (
              <View key={ord.id} style={styles.homemakerOrderCard}>
                <View style={styles.homemakerOrderCardTop}>
                  <View>
                    <Text style={styles.homemakerOrderNumber}>{ord.orderNumber}</Text>
                    <Text style={styles.homemakerCustomerName}>{ord.customerName}</Text>
                  </View>
                  <View
                    style={[
                      styles.orderStateBadge,
                      ord.status === 'READY_FOR_PICKUP' ? styles.orderStateReady : styles.orderStatePrep,
                    ]}
                  >
                    <Text style={styles.orderStateBadgeText}>{ord.status.replace('_', ' ')}</Text>
                  </View>
                </View>

                <Text style={styles.homemakerOrderItems}>{ord.items}</Text>
                <View style={styles.homemakerOrderFooter}>
                  <Text style={styles.homemakerOrderAmt}>₹{ord.totalAmount} • {ord.slot}</Text>
                  {ord.status === 'PREPARING' ? (
                    <TouchableOpacity
                      style={styles.markReadyBtn}
                      onPress={() => markOrderReady(ord.id)}
                    >
                      <Text style={styles.markReadyBtnText}>✓ Ready for Pickup</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.otpReadyPill}>
                      <Text style={styles.otpReadyPillText}>Rider OTP: {ord.deliveryOtp}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}

            {/* Small Batch Portion Limiter */}
            <View style={[styles.sectionHeadingWithSub, { marginTop: 14 }]}>
              <Text style={styles.sectionMainTitle}>🍱 Aaj Ka Menu &amp; Batch Limiter</Text>
              <Text style={styles.sectionSubtitleText}>Limits daily order intake to protect homemaker quality</Text>
            </View>

            {homemakerMenu.map((item) => (
              <View key={item.id} style={styles.batchLimiterCard}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.batchItemName}>{item.name}</Text>
                  <Text style={styles.batchItemPrice}>₹{item.price} • Max {item.dailyStockLimit} portions</Text>
                  <View style={styles.portionsRemainingRow}>
                    <Text style={styles.portionsLabel}>Portions Left:</Text>
                    <Text
                      style={[
                        styles.portionsValue,
                        (item.portionsRemaining || 0) < 5 && styles.portionsValueLow,
                      ]}
                    >
                      {item.portionsRemaining} / {item.dailyStockLimit}
                    </Text>
                  </View>
                </View>

                <View style={styles.stepperActionCol}>
                  <View style={styles.stepperRowGroup}>
                    <TouchableOpacity
                      style={styles.portionAdjustBtn}
                      onPress={() => adjustPortion(item.id, -1)}
                    >
                      <Text style={styles.portionAdjustBtnText}>-1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.portionAdjustBtn, styles.portionAdjustBtnAdd]}
                      onPress={() => adjustPortion(item.id, 5)}
                    >
                      <Text style={[styles.portionAdjustBtnText, { color: '#FFF' }]}>+5</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.soldOutPill}
                    onPress={() => adjustPortion(item.id, -(item.portionsRemaining || 0))}
                  >
                    <Text style={styles.soldOutPillText}>Sold Out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </View>

      {/* ===================== FLOATING CART SUMMARY PILL (WHEN ITEMS IN CART) ===================== */}
      {totalCartCount > 0 && activeBottomTab !== 'ORDERS' && (
        <View style={styles.floatingCartPillContainer}>
          <View style={styles.floatingCartPill}>
            <View style={styles.floatingCartLeft}>
              <View style={styles.floatingCartCounterCircle}>
                <Text style={styles.floatingCartCounterText}>{totalCartCount}</Text>
              </View>
              <View>
                <Text style={styles.floatingCartTotalAmount}>₹{cartSubtotal}</Text>
                <Text style={styles.floatingCartSubNotice}>Returnable Steel Dabba Included</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.floatingCartCheckoutCTA}
              onPress={() => setCartModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.floatingCartCheckoutCTAText}>Review Dabba →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ===================== BOTTOM NAVIGATION BAR ===================== */}
      <View style={styles.bottomNavigationBar}>
        {[
          { id: 'HOME', label: 'Rasois', icon: '🍲' },
          { id: 'EXPLORE', label: 'Explore', icon: '🧭' },
          { id: 'TIFFINS', label: 'Tiffins', icon: '🍱' },
          { id: 'ORDERS', label: 'Orders', icon: '🛵', badge: activeOrder ? '1' : undefined },
          { id: 'STUDIO', label: 'Cook Studio', icon: '👩‍🍳' },
        ].map((tab) => {
          const isSelected = activeBottomTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.bottomNavTabItem}
              onPress={() => setActiveBottomTab(tab.id as any)}
              activeOpacity={0.7}
            >
              <View style={styles.bottomNavIconWrapper}>
                <Text style={[styles.bottomNavIcon, isSelected && styles.bottomNavIconSelected]}>
                  {tab.icon}
                </Text>
                {tab.badge && (
                  <View style={styles.bottomNavBadge}>
                    <Text style={styles.bottomNavBadgeText}>{tab.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.bottomNavLabel, isSelected && styles.bottomNavLabelSelected]}>
                {tab.label}
              </Text>
              {isSelected && <View style={styles.bottomNavActiveIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ===================== KITCHEN MENU & TIFFINS MODAL ===================== */}
      <Modal visible={menuModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.menuModalSafe}>
          {selectedKitchen && (
            <View style={{ flex: 1 }}>
              {/* Modal Header */}
              <View style={styles.modalHeaderTopBar}>
                <TouchableOpacity
                  style={styles.modalBackBtn}
                  onPress={() => setMenuModalVisible(false)}
                >
                  <Text style={styles.modalBackIcon}>←</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.modalKitchenTitle} numberOfLines={1}>
                    {selectedKitchen.name}
                  </Text>
                  <Text style={styles.modalKitchenSubtitle}>
                    ★ {selectedKitchen.rating} • {selectedKitchen.distanceKm || 0.8} km • 🛡️ {selectedKitchen.hygieneScore}% Hygiene
                  </Text>
                </View>
              </View>

              {/* Sub-tabs: Daily Menu vs Tiffin Subscriptions */}
              <View style={styles.modalSubTabsBar}>
                <TouchableOpacity
                  style={[styles.modalSubTabItem, menuTab === 'MENU' && styles.modalSubTabItemActive]}
                  onPress={() => setMenuTab('MENU')}
                >
                  <Text style={[styles.modalSubTabText, menuTab === 'MENU' && styles.modalSubTabTextActive]}>
                    🍛 Aaj Ka Menu
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSubTabItem, menuTab === 'SUBSCRIPTIONS' && styles.modalSubTabItemActive]}
                  onPress={() => setMenuTab('SUBSCRIPTIONS')}
                >
                  <Text style={[styles.modalSubTabText, menuTab === 'SUBSCRIPTIONS' && styles.modalSubTabTextActive]}>
                    📅 Tiffin Subscriptions
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Modal Scroll List */}
              <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                {menuTab === 'MENU' ? (
                  kitchenMenuItems.map((item) => {
                    const qty = getCartItemQuantity(item.id);
                    return (
                      <View key={item.id} style={styles.dishCardRow}>
                        <View style={{ flex: 1, paddingRight: 14 }}>
                          <View style={styles.dietSpecialRow}>
                            <View style={item.dietaryType === 'VEG' ? styles.vegSquareDot : styles.nonVegSquareDot}>
                              <View style={item.dietaryType === 'VEG' ? styles.vegInnerCircle : styles.nonVegInnerCircle} />
                            </View>
                            <Text style={styles.dietLabelText}>{item.dietaryType}</Text>
                            {item.isDailySpecial && (
                              <View style={styles.dailySpecialBadge}>
                                <Text style={styles.dailySpecialBadgeText}>Daily Special</Text>
                              </View>
                            )}
                          </View>

                          <Text style={styles.dishNameText}>{item.name}</Text>
                          <Text style={styles.dishPriceText}>₹{item.price}</Text>
                          <Text style={styles.dishDescriptionText} numberOfLines={2}>
                            {item.description}
                          </Text>

                          {item.portionsRemaining !== undefined && (
                            <Text style={styles.dishPortionsNotice}>
                              ⚡ Only {item.portionsRemaining} portions cooked today
                            </Text>
                          )}
                        </View>

                        {/* Quantity Stepper or Add Button */}
                        <View style={styles.dishAddCol}>
                          {qty === 0 ? (
                            <TouchableOpacity
                              style={styles.dishAddButton}
                              onPress={() => addToCart(item)}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.dishAddButtonText}>ADD +</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.dishStepperBox}>
                              <TouchableOpacity
                                style={styles.dishStepperBtn}
                                onPress={() => removeFromCart(item.id)}
                              >
                                <Text style={styles.dishStepperBtnText}>−</Text>
                              </TouchableOpacity>
                              <Text style={styles.dishStepperCount}>{qty}</Text>
                              <TouchableOpacity
                                style={styles.dishStepperBtn}
                                onPress={() => addToCart(item)}
                              >
                                <Text style={styles.dishStepperBtnText}>+</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })
                ) : (
                  kitchenPlans.map((plan) => (
                    <View key={plan.id} style={styles.planCardNew}>
                      <View style={styles.planPackBadge}>
                        <Text style={styles.planPackBadgeText}>{plan.totalMeals} MEALS</Text>
                      </View>
                      <Text style={styles.planTitleNew}>{plan.title}</Text>
                      <Text style={styles.planDescNew}>{plan.description}</Text>
                      <View style={styles.planPricingRow}>
                        <Text style={styles.planPriceTotal}>₹{plan.price}</Text>
                        <TouchableOpacity
                          style={styles.planSubscribeCTA}
                          onPress={() => {
                            Alert.alert('Subscribed!', `You subscribed to ${plan.title}. Fresh hot meals start tomorrow.`);
                            setMenuModalVisible(false);
                          }}
                        >
                          <Text style={styles.planSubscribeCTAText}>Subscribe Now</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
                <View style={{ height: 120 }} />
              </ScrollView>

              {/* Floating Bottom Cart Bar inside Menu */}
              {totalCartCount > 0 && (
                <View style={styles.floatingCartPillContainer}>
                  <View style={styles.floatingCartPill}>
                    <View style={styles.floatingCartLeft}>
                      <View style={styles.floatingCartCounterCircle}>
                        <Text style={styles.floatingCartCounterText}>{totalCartCount}</Text>
                      </View>
                      <View>
                        <Text style={styles.floatingCartTotalAmount}>₹{cartSubtotal}</Text>
                        <Text style={styles.floatingCartSubNotice}>Returnable Steel Dabba Included</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.floatingCartCheckoutCTA}
                      onPress={() => setCartModalVisible(true)}
                    >
                      <Text style={styles.floatingCartCheckoutCTAText}>Review Cart →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* ===================== CART & CHECKOUT MODAL ===================== */}
      <Modal visible={cartModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.menuModalSafe}>
          <View style={styles.modalHeaderTopBar}>
            <TouchableOpacity
              style={styles.modalBackBtn}
              onPress={() => setCartModalVisible(false)}
            >
              <Text style={styles.modalBackIcon}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.modalKitchenTitle}>Your Dabba &amp; Checkout</Text>
              <Text style={styles.modalKitchenSubtitle}>Bellandur Neighborhood Hub</Text>
            </View>
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyResultsCard}>
              <Text style={styles.emptyResultsEmoji}>🛍️</Text>
              <Text style={styles.emptyResultsTitle}>Your Dabba is Empty</Text>
              <Text style={styles.emptyResultsSubtitle}>Explore fresh home thalis and small batch regional curries!</Text>
            </View>
          ) : (
            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {/* Ordered Items List */}
              <View style={styles.checkoutSectionCard}>
                <Text style={styles.checkoutSectionHeader}>Items in Your Order</Text>
                {cart.map((ci) => (
                  <View key={ci.item.id} style={styles.checkoutItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkoutItemName}>{ci.item.name}</Text>
                      <Text style={styles.checkoutItemPrice}>₹{ci.item.price * ci.quantity}</Text>
                    </View>
                    <View style={styles.dishStepperBox}>
                      <TouchableOpacity
                        style={styles.dishStepperBtn}
                        onPress={() => removeFromCart(ci.item.id)}
                      >
                        <Text style={styles.dishStepperBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.dishStepperCount}>{ci.quantity}</Text>
                      <TouchableOpacity
                        style={styles.dishStepperBtn}
                        onPress={() => addToCart(ci.item)}
                      >
                        <Text style={styles.dishStepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              {/* Gated Society Pooling (Free Delivery) */}
              <View style={[styles.checkoutSectionCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <View style={styles.societyPoolTopHeader}>
                  <Text style={[styles.checkoutSectionHeader, { color: '#1E3A8A', marginBottom: 0 }]}>
                    🏢 Gated Society Pool (FREE Delivery)
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsCommunityPoolActive(!isCommunityPoolActive)}
                    style={{
                      backgroundColor: isCommunityPoolActive ? '#2563EB' : '#FFFFFF',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '900', color: isCommunityPoolActive ? '#FFFFFF' : '#2563EB' }}>
                      {isCommunityPoolActive ? '✓ Pooled' : '+ Join Pool'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {isCommunityPoolActive && (
                  <View style={{ gap: 6, marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {['Marvel Serenity', 'Green Glen', 'Prestige Tech'].map((soc) => (
                        <TouchableOpacity
                          key={soc}
                          onPress={() => setSelectedSociety(soc)}
                          style={[
                            styles.societySelectorChip,
                            selectedSociety === soc && styles.societySelectorChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.societySelectorChipText,
                              selectedSociety === soc && { color: '#FFF' },
                            ]}
                          >
                            {soc}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={styles.societySavingsNotice}>
                      🎉 Delivery fee waived! Neighbor batch drop at {deliverySlot === 'INSTANT' ? '1:00 PM' : 'Scheduled Slot'}.
                    </Text>
                  </View>
                )}
              </View>

              {/* Homestyle Taste Customizer */}
              <View style={[styles.checkoutSectionCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                <Text style={[styles.checkoutSectionHeader, { color: '#78350F' }]}>
                  ✨ Maa Ke Haath Ka Touch (Cooked To Your Taste)
                </Text>

                {/* Spice selector */}
                <Text style={styles.customizerLabel}>1. Spice Level:</Text>
                <View style={styles.customizerButtonGroup}>
                  {[
                    { id: 'MILD', label: '🌱 Mild' },
                    { id: 'MEDIUM', label: '🥘 Medium' },
                    { id: 'TEEKHA', label: '🔥 Teekha' },
                  ].map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => setSpiceLevel(s.id as any)}
                      style={[
                        styles.customizerPill,
                        spiceLevel === s.id && styles.customizerPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.customizerPillText,
                          spiceLevel === s.id && { color: '#FFF' },
                        ]}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Fat Selector */}
                <Text style={styles.customizerLabel}>2. Cooking Fat:</Text>
                <View style={styles.customizerButtonGroup}>
                  {[
                    { id: 'COLD_PRESSED', label: 'Groundnut Oil' },
                    { id: 'GIR_GHEE', label: 'Desi Cow Ghee' },
                    { id: 'LOW_OIL', label: 'Low Oil Diet' },
                  ].map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      onPress={() => setCookingFat(f.id as any)}
                      style={[
                        styles.customizerPill,
                        cookingFat === f.id && styles.customizerPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.customizerPillText,
                          cookingFat === f.id && { color: '#FFF' },
                        ]}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom Note input */}
                <TextInput
                  placeholder="Special note for home chef (e.g. keep dal runny, light tadka)..."
                  placeholderTextColor="#A16207"
                  value={chefCustomNote}
                  onChangeText={setChefCustomNote}
                  style={styles.chefCustomNoteInput}
                />
              </View>

              {/* Care For Elders / Gift a Meal */}
              <TouchableOpacity
                style={[
                  styles.checkoutSectionCard,
                  { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' },
                ]}
                onPress={() => setElderCareGift(!elderCareGift)}
                activeOpacity={0.8}
              >
                <View style={styles.elderCareRow}>
                  <Text style={{ fontSize: 20 }}>👵</Text>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.elderCareTitle}>Care for Elders / Gift a Warm Meal</Text>
                    <Text style={styles.elderCareSub}>Personalized handwritten love note printed on steel dabba tag</Text>
                  </View>
                  <Text style={{ fontSize: 18 }}>{elderCareGift ? '☑️' : '⬜'}</Text>
                </View>
              </TouchableOpacity>

              {/* Delivery Slot Selection */}
              <View style={styles.checkoutSectionCard}>
                <Text style={styles.checkoutSectionHeader}>Delivery Slot</Text>
                <View style={styles.slotCardsRow}>
                  <TouchableOpacity
                    style={[styles.slotSelectCard, deliverySlot === 'INSTANT' && styles.slotSelectCardActive]}
                    onPress={() => setDeliverySlot('INSTANT')}
                  >
                    <Text style={[styles.slotSelectTitle, deliverySlot === 'INSTANT' && styles.slotSelectTitleActive]}>
                      ⚡ Instant
                    </Text>
                    <Text style={styles.slotSelectSub}>15-20 Mins</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.slotSelectCard, deliverySlot === 'PREORDER_LUNCH' && styles.slotSelectCardActive]}
                    onPress={() => setDeliverySlot('PREORDER_LUNCH')}
                  >
                    <Text style={[styles.slotSelectTitle, deliverySlot === 'PREORDER_LUNCH' && styles.slotSelectTitleActive]}>
                      🍱 Lunch
                    </Text>
                    <Text style={styles.slotSelectSub}>1:00 PM</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.slotSelectCard, deliverySlot === 'PREORDER_DINNER' && styles.slotSelectCardActive]}
                    onPress={() => setDeliverySlot('PREORDER_DINNER')}
                  >
                    <Text style={[styles.slotSelectTitle, deliverySlot === 'PREORDER_DINNER' && styles.slotSelectTitleActive]}>
                      🌙 Dinner
                    </Text>
                    <Text style={styles.slotSelectSub}>8:00 PM</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Returnable Dabba Guarantee */}
              <TouchableOpacity
                style={styles.dabbaReturnCommitmentCard}
                onPress={() => setReturnDabba(!returnDabba)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 20 }}>{returnDabba ? '☑️' : '⬜'}</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.dabbaReturnTitle}>Returnable Steel Dabba (Zero Single-Use Plastic)</Text>
                  <Text style={styles.dabbaReturnDesc}>
                    I will exchange my previous sanitized stainless steel dabba with the rider upon arrival.
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Bill Summary */}
              <View style={styles.checkoutSectionCard}>
                <Text style={styles.checkoutSectionHeader}>Bill Summary</Text>
                <View style={styles.billLineRow}>
                  <Text style={styles.billLineLabel}>Item Total</Text>
                  <Text style={styles.billLineValue}>₹{cartSubtotal}</Text>
                </View>
                <View style={styles.billLineRow}>
                  <Text style={styles.billLineLabel}>Neighborhood Delivery Partner</Text>
                  <Text style={[styles.billLineValue, deliveryFee === 0 && { color: '#059669', fontWeight: '900' }]}>
                    {deliveryFee === 0 ? 'FREE (Society Pooled)' : `₹${deliveryFee}`}
                  </Text>
                </View>
                <View style={styles.billLineRow}>
                  <Text style={styles.billLineLabel}>Platform &amp; Sanitized Dabba Care</Text>
                  <Text style={styles.billLineValue}>₹{platformFee}</Text>
                </View>

                <View style={styles.billTotalLine}>
                  <Text style={styles.billTotalLabel}>Grand Total</Text>
                  <Text style={styles.billTotalValue}>₹{grandTotal}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.confirmCheckoutBtn, isPlacingOrder && { opacity: 0.6 }]}
                onPress={handlePlaceOrder}
                disabled={isPlacingOrder}
                activeOpacity={0.85}
              >
                {isPlacingOrder ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.confirmCheckoutBtnText}>Confirm Order &amp; Pay ₹{grandTotal}</Text>
                )}
              </TouchableOpacity>

              <View style={{ height: 60 }} />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Authentication Modal */}
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
  safeContainer: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },

  // ===================== APP BAR =====================
  brandAppBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3ECE4',
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFF4ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  brandIcon: {
    fontSize: 22,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  artisanalBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  artisanalBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  locationPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  locationMainText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    maxWidth: 160,
  },
  locationDropdownArrow: {
    fontSize: 11,
    color: '#94A3B8',
  },
  brandRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileAvatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitialsBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#E05326',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitialsText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  profileIconPlaceholder: {
    fontSize: 17,
  },
  cartHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartHeaderEmoji: {
    fontSize: 17,
  },
  cartHeaderCounter: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E05326',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartHeaderCounterText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },

  // ===================== SCREEN BODY & TABS =====================
  screenBody: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  mainFeedScroll: {
    flex: 1,
  },
  mainFeedContent: {
    paddingBottom: 24,
  },

  // Search Bar
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBarInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchMagnifierIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  searchClearBtn: {
    fontSize: 13,
    color: '#94A3B8',
    padding: 4,
  },

  // Stories
  storiesContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3ECE4',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  flexRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveRedDot: {
    fontSize: 10,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionHeaderSubAction: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E05326',
  },
  storiesScrollContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  storyBubble: {
    alignItems: 'center',
    width: 66,
  },
  storyRingWrapper: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    borderColor: '#E05326',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 2,
  },
  storyInnerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyEmoji: {
    fontSize: 24,
  },
  storyChefName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  storyTagBadge: {
    backgroundColor: '#FFF4ED',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginTop: 2,
  },
  storyTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#C2410C',
  },

  // Category Carousel
  categoryCarouselWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3ECE4',
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  categoryPillActive: {
    backgroundColor: '#E05326',
    borderColor: '#E05326',
  },
  categoryPillIcon: {
    fontSize: 13,
  },
  categoryPillLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  categoryPillLabelActive: {
    color: '#FFFFFF',
  },

  // Sustainability Hero Banner
  sustainabilityHeroBanner: {
    margin: 16,
    backgroundColor: '#FFFBF5',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  bannerBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  bannerTagGreen: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  bannerTagGreenText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#065F46',
  },
  bannerTagAmber: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  bannerTagAmberText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#C2410C',
  },
  sustainabilityHeroTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 20,
  },
  sustainabilityHeroSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  societyPoolStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 8,
  },
  societyPoolIcon: {
    fontSize: 16,
  },
  societyPoolText: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '700',
  },
  societyPoolSub: {
    fontSize: 9,
    color: '#3B82F6',
    marginTop: 1,
  },
  societyPoolArrow: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1D4ED8',
  },

  // Marketplace Dual Switcher
  marketplaceSwitchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  marketplaceSwitchBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 3,
    gap: 4,
  },
  marketplaceSwitchTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 11,
  },
  marketplaceSwitchTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  marketplaceSwitchText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  marketplaceSwitchTextActive: {
    color: '#E05326',
    fontWeight: '900',
  },
  radiusPillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  radiusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  radiusButtonsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  radiusChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  radiusChipActive: {
    backgroundColor: '#0D9488',
  },
  radiusChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  radiusChipTextActive: {
    color: '#FFFFFF',
  },

  // Kitchen Feed
  kitchensFeedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  feedHeadingTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  feedHeadingCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },

  // Artisanal Kitchen Card
  artisanalKitchenCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3ECE4',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardMediaContainer: {
    position: 'relative',
    height: 165,
    width: '100%',
    backgroundColor: '#E2E8F0',
  },
  cardCoverImage: {
    width: '100%',
    height: '100%',
  },
  cardGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  cardTopBadgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  batchNoticeBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  batchNoticeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  distanceBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  cardBottomMediaStrip: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeBadge: {
    backgroundColor: '#E05326',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  hygieneBadge: {
    backgroundColor: '#065F46',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  hygieneBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  cardContentBody: {
    padding: 16,
  },
  kitchenNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kitchenNameTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  ratingPill: {
    backgroundColor: '#059669',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
  },
  ratingPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  kitchenCuisinesSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    fontWeight: '600',
  },
  chefStoryQuoteBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFBF5',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
    gap: 8,
  },
  chefStoryQuoteEmoji: {
    fontSize: 16,
  },
  chefStoryQuoteText: {
    flex: 1,
    fontSize: 11,
    fontStyle: 'italic',
    color: '#9A3412',
    lineHeight: 16,
  },
  cardFooterActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3ECE4',
  },
  priceForTwoLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '700',
  },
  priceForTwoValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  priceForTwoMuted: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
  },
  viewMenuCTA: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  viewMenuCTAText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#E05326',
  },

  // Loader & Empty
  loaderCenter: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loaderText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 10,
  },
  emptyResultsCard: {
    alignItems: 'center',
    padding: 30,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyResultsEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyResultsTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  emptyResultsSubtitle: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  expandRadiusBtn: {
    marginTop: 14,
    backgroundColor: '#E05326',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  expandRadiusBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // ===================== EXPLORE TAB =====================
  exploreHeroHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  exploreHeaderTag: {
    fontSize: 10,
    fontWeight: '900',
    color: '#E05326',
    letterSpacing: 1,
  },
  exploreHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  exploreHeaderSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 17,
  },
  curatedExploreCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  curatedTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  curatedTag: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  curatedArrow: {
    fontSize: 10,
    fontWeight: '900',
  },
  curatedTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  curatedDesc: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
    opacity: 0.9,
  },

  // ===================== TIFFINS TAB =====================
  tiffinHeroCard: {
    margin: 16,
    backgroundColor: '#FFF7ED',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  tiffinHeroBadge: {
    backgroundColor: '#EA580C',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  tiffinHeroBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tiffinHeroTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#7C2D12',
  },
  tiffinHeroSubtitle: {
    fontSize: 11,
    color: '#9A3412',
    marginTop: 4,
    lineHeight: 16,
  },
  tiffinPerksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FED7AA',
  },
  tiffinPerk: {
    alignItems: 'center',
    gap: 4,
  },
  tiffinPerkIcon: {
    fontSize: 18,
  },
  tiffinPerkText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7C2D12',
  },
  tiffinSectionHeading: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  planCardNew: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  planCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  planPackBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  planPackBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#2563EB',
  },
  planDietPill: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  planTitleNew: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  planDescNew: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 15,
  },
  planDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  planPricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planPricePerMeal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  planPriceTotal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  planSubscribeCTA: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  planSubscribeCTAText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
  },

  // ===================== ORDERS TAB =====================
  activeOrderBanner: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  activeOrderBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  activeOrderTag: {
    fontSize: 9,
    fontWeight: '900',
    color: '#E05326',
    letterSpacing: 0.5,
  },
  activeOrderKitchenName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  activeOrderItemsSummary: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  activeOrderAmtPill: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeOrderAmtText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#C2410C',
  },
  heroOtpCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroOtpLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  heroOtpDigits: {
    fontSize: 34,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 8,
    marginVertical: 4,
  },
  heroOtpNotice: {
    fontSize: 10,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 14,
  },
  liveTimelineStepper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  timelineStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepCircleDone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleDoneText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#059669',
  },
  stepCircleActive: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActiveEmoji: {
    fontSize: 13,
  },
  stepCirclePending: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCirclePendingText: {
    fontSize: 12,
  },
  stepInfoCol: {
    flex: 1,
  },
  stepHeaderBold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  stepHeaderBoldActive: {
    fontSize: 12,
    fontWeight: '900',
    color: '#E05326',
  },
  stepHeaderPending: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  stepSubDetail: {
    fontSize: 10,
    color: '#64748B',
  },
  dabbaStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    gap: 10,
  },
  dabbaIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dabbaStatusTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#166534',
  },
  dabbaStatusDesc: {
    fontSize: 10,
    color: '#15803D',
    marginTop: 1,
    lineHeight: 14,
  },
  pastOrdersTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
  },
  pastOrderCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pastOrderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pastOrderKitchen: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  pastOrderItems: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  pastOrderDate: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 4,
  },
  pastOrderAmt: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  pastOrderDeliveredPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  pastOrderDeliveredText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#059669',
  },

  // ===================== STUDIO TAB =====================
  studioHeroCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    marginTop: 1,
  },
  statusToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusOpenBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusClosedBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statusToggleBtnText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#047857',
  },
  studioStatGrid: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  studioStatBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  studioStatNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  studioStatLabel: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '700',
  },
  upiPayoutBox: {
    marginTop: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upiPayoutTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#065F46',
  },
  upiPayoutSub: {
    fontSize: 9,
    color: '#047857',
  },
  upiPayoutActionPill: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  upiPayoutActionText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  sectionHeadingWithSub: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionMainTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  sectionSubtitleText: {
    fontSize: 10,
    color: '#64748B',
  },
  homemakerOrderCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  homemakerOrderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  homemakerOrderNumber: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  homemakerCustomerName: {
    fontSize: 11,
    color: '#64748B',
  },
  orderStateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  orderStatePrep: {
    backgroundColor: '#FEF3C7',
  },
  orderStateReady: {
    backgroundColor: '#ECFDF5',
  },
  orderStateBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#92400E',
  },
  homemakerOrderItems: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 6,
  },
  homemakerOrderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  homemakerOrderAmt: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  markReadyBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  markReadyBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  otpReadyPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  otpReadyPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2563EB',
  },
  batchLimiterCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  batchItemName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  batchItemPrice: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  portionsRemainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  portionsLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  portionsValue: {
    fontSize: 11,
    fontWeight: '900',
    color: '#059669',
  },
  portionsValueLow: {
    color: '#DC2626',
  },
  stepperActionCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  stepperRowGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  portionAdjustBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  portionAdjustBtnAdd: {
    backgroundColor: '#E05326',
  },
  portionAdjustBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
  },
  soldOutPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FEF2F2',
    borderRadius: 5,
  },
  soldOutPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#DC2626',
  },

  // ===================== FLOATING CART PILL =====================
  floatingCartPillContainer: {
    position: 'absolute',
    bottom: 64,
    left: 16,
    right: 16,
  },
  floatingCartPill: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 8,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  floatingCartCounterCircle: {
    backgroundColor: '#E05326',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCartCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  floatingCartTotalAmount: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  floatingCartSubNotice: {
    color: '#94A3B8',
    fontSize: 9,
  },
  floatingCartCheckoutCTA: {
    backgroundColor: '#E05326',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  floatingCartCheckoutCTAText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  // ===================== BOTTOM NAVIGATION BAR =====================
  bottomNavigationBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1EBE4',
    paddingVertical: 6,
    paddingBottom: Platform.OS === 'ios' ? 14 : 8,
  },
  bottomNavTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 2,
  },
  bottomNavIconWrapper: {
    position: 'relative',
  },
  bottomNavIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  bottomNavIconSelected: {
    opacity: 1,
  },
  bottomNavBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#E05326',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  bottomNavLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
  },
  bottomNavLabelSelected: {
    color: '#E05326',
    fontWeight: '900',
  },
  bottomNavActiveIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#E05326',
  },

  // ===================== MODALS =====================
  menuModalSafe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeaderTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1EBE4',
  },
  modalBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalKitchenTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalKitchenSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  modalSubTabsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  modalSubTabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalSubTabItemActive: {
    backgroundColor: '#E05326',
    borderColor: '#E05326',
  },
  modalSubTabText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  modalSubTabTextActive: {
    color: '#FFFFFF',
  },
  modalScrollBody: {
    padding: 16,
  },
  dishCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dietSpecialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  vegSquareDot: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
  },
  vegInnerCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  nonVegSquareDot: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
  },
  nonVegInnerCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
  },
  dietLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  dailySpecialBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dailySpecialBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#B45309',
  },
  dishNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  dishPriceText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  dishDescriptionText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 15,
  },
  dishPortionsNotice: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E05326',
    marginTop: 4,
  },
  dishAddCol: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishAddButton: {
    backgroundColor: '#FFF4ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  dishAddButtonText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#E05326',
  },
  dishStepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E05326',
    borderRadius: 8,
    overflow: 'hidden',
  },
  dishStepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  dishStepperBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  dishStepperCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 6,
  },

  // Checkout Sections
  checkoutSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1EBE4',
  },
  checkoutSectionHeader: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
  },
  checkoutItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  checkoutItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  checkoutItemPrice: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  societyPoolTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  societySelectorChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  societySelectorChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  societySelectorChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E40AF',
  },
  societySavingsNotice: {
    fontSize: 10,
    color: '#1D4ED8',
    fontStyle: 'italic',
    marginTop: 4,
  },
  customizerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 4,
  },
  customizerButtonGroup: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  customizerPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  customizerPillActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  customizerPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78350F',
  },
  chefCustomNoteInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    color: '#78350F',
    marginTop: 4,
  },
  elderCareRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  elderCareTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#881337',
  },
  elderCareSub: {
    fontSize: 9,
    color: '#9F1239',
  },
  slotCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  slotSelectCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  slotSelectCardActive: {
    borderColor: '#E05326',
    backgroundColor: '#FFF7ED',
  },
  slotSelectTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  slotSelectTitleActive: {
    color: '#E05326',
  },
  slotSelectSub: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
  },
  dabbaReturnCommitmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  dabbaReturnTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#166534',
  },
  dabbaReturnDesc: {
    fontSize: 9,
    color: '#15803D',
    marginTop: 2,
    lineHeight: 13,
  },
  billLineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  billLineLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  billLineValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  billTotalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  billTotalLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  billTotalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#E05326',
  },
  confirmCheckoutBtn: {
    backgroundColor: '#E05326',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmCheckoutBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
