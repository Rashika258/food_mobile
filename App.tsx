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
} from 'expo-status-bar' ? require('react-native') : require('react-native');
import { fetchNearbyKitchens, Kitchen } from './src/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<'HOME_KITCHEN' | 'RESTAURANT'>('HOME_KITCHEN');
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    loadKitchens();
  }, [activeTab, radiusKm]);

  const loadKitchens = async () => {
    setLoading(true);
    const data = await fetchNearbyKitchens(12.9304, 77.6784, radiusKm, activeTab);
    setKitchens(data);
    setLoading(false);
  };

  const filteredKitchens = kitchens.filter(
    (k) =>
      k.name.toLowerCase().includes(search.toLowerCase()) ||
      k.cuisines.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header & Location */}
      <View style={styles.header}>
        <View>
          <Text style={styles.locationLabel}>DELIVERING TO</Text>
          <View style={styles.locationRow}>
            <Text style={styles.locationText}>📍 Bellandur, Bangalore</Text>
            <View style={styles.radiusPill}>
              <Text style={styles.radiusPillText}>{radiusKm} KM RADIUS</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.cartBtn}>
          <Text style={styles.cartIcon}>🛍️</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search home thalis, biryani, regional food..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Dual Marketplace Toggle */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'HOME_KITCHEN' && styles.activeTab]}
          onPress={() => setActiveTab('HOME_KITCHEN')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'HOME_KITCHEN' && styles.activeTabText,
            ]}
          >
            🏡 Home Makers (≤ 5 KM)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'RESTAURANT' && styles.activeTab]}
          onPress={() => setActiveTab('RESTAURANT')}
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
          <Text style={styles.radiusSelectorLabel}>Neighborhood Distance:</Text>
          <View style={styles.radiusButtons}>
            {[3, 5, 10].map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.radiusBtn,
                  radiusKm === r && styles.radiusBtnActive,
                ]}
                onPress={() => setRadiusKm(r)}
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
      <ScrollView contentContainerStyle={styles.scrollList}>
        {/* Banner for Differentiators */}
        {activeTab === 'HOME_KITCHEN' && (
          <View style={styles.promoBanner}>
            <Text style={styles.promoTitle}>✨ Pure Homestyle • Zero Plastic Dabbas</Text>
            <Text style={styles.promoDesc}>
              Cooked fresh in small batches by verified home makers in your neighborhood.
            </Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#FF5200" style={{ marginTop: 40 }} />
        ) : filteredKitchens.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No kitchens found within {radiusKm} KM</Text>
            <Text style={styles.emptySub}>Try increasing the radius to 10 KM</Text>
          </View>
        ) : (
          filteredKitchens.map((k) => (
            <TouchableOpacity key={k.id} style={styles.card} activeOpacity={0.9}>
              <Image source={{ uri: k.coverImage }} style={styles.cardImage} />

              {/* Badges on Image */}
              <View style={styles.badgeRow}>
                {k.distanceKm !== null && k.distanceKm !== undefined && (
                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceText}>📍 {k.distanceKm} km away</Text>
                  </View>
                )}
                <View style={styles.prepBadge}>
                  <Text style={styles.prepText}>⏱️ {k.estimatedDeliveryMins || k.orderLeadTimeMinutes}m</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.kitchenName}>{k.name}</Text>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>★ {k.rating}</Text>
                  </View>
                </View>

                <Text style={styles.cuisines}>{k.cuisines}</Text>

                {k.storyText && (
                  <View style={styles.storyBox}>
                    <Text style={styles.storyText} numberOfLines={2}>
                      👩‍🍳 "{k.storyText}"
                    </Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Text style={styles.priceText}>₹{k.priceForTwo} for two</Text>
                  <View style={styles.hygieneBadge}>
                    <Text style={styles.hygieneText}>🛡️ {k.hygieneScore}% Hygiene</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  radiusPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  radiusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2E7D32',
  },
  cartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: {
    fontSize: 18,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF',
  },
  searchInput: {
    backgroundColor: '#F1F3F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F3F5',
  },
  activeTab: {
    backgroundColor: '#FF5200',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
  },
  activeTabText: {
    color: '#FFF',
  },
  radiusSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  radiusSelectorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  radiusButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  radiusBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F1F3F5',
  },
  radiusBtnActive: {
    backgroundColor: '#2E7D32',
  },
  radiusBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555',
  },
  radiusBtnTextActive: {
    color: '#FFF',
  },
  scrollList: {
    padding: 16,
    paddingBottom: 40,
  },
  promoBanner: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB300',
  },
  promoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B78103',
  },
  promoDesc: {
    fontSize: 11,
    color: '#6D4C41',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  badgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    gap: 6,
  },
  distanceBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  distanceText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  prepBadge: {
    backgroundColor: '#FF5200',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  prepText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    padding: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kitchenName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    flex: 1,
  },
  ratingBadge: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  ratingText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  cuisines: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  storyBox: {
    backgroundColor: '#F9FBE7',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  storyText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#33691E',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  priceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  hygieneBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hygieneText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#444',
  },
  emptySub: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
});
