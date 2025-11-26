import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  MapPin,
  Navigation,
  Phone,
  Clock,
  Star,
  ArrowLeft,
  ExternalLink,
  Loader,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import useTheme from "@/utils/useTheme";
import useScrollHeader from "@/utils/useScrollHeader";

export default function PharmacyLocatorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showHeaderBorder, handleScroll, scrollViewRef } = useScrollHeader();

  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);

  // Request location permission and get user location
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status);

        if (status === "granted") {
          let location = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      } catch (error) {
        console.error("Location error:", error);
        Alert.alert(
          "Location Error",
          "Could not get your location. Using default location.",
          [{ text: "OK" }],
        );
        // Use Lagos, Nigeria as default location
        setUserLocation({
          latitude: 6.5244,
          longitude: 3.3792,
        });
      }
    })();
  }, []);

  // Fetch nearby pharmacies
  const {
    data: pharmaciesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["pharmacies", userLocation?.latitude, userLocation?.longitude],
    queryFn: async () => {
      if (!userLocation) throw new Error("No location available");

      const response = await fetch(
        `/api/pharmacy-locator?latitude=${userLocation.latitude}&longitude=${userLocation.longitude}&radius=5000`,
      );
      if (!response.ok) throw new Error("Failed to fetch pharmacies");
      return response.json();
    },
    enabled: !!userLocation,
  });

  const pharmacies = pharmaciesData?.pharmacies || [];

  const openMaps = (pharmacy) => {
    const { lat, lng } = pharmacy.location;
    const url = `https://maps.google.com/?q=${lat},${lng}`;
    Linking.openURL(url);
  };

  const callPharmacy = (phoneNumber) => {
    if (phoneNumber) {
      const cleanPhone = phoneNumber.replace(/[^\d+]/g, "");
      Linking.openURL(`tel:${cleanPhone}`);
    } else {
      Alert.alert(
        "No Phone Number",
        "Phone number not available for this pharmacy.",
      );
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return colors.success;
    if (rating >= 3.5) return colors.warning;
    return colors.error;
  };

  const PharmacyCard = ({ pharmacy }) => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            fontWeight: "600",
            fontSize: 16,
            color: colors.text,
            flex: 1,
          }}
        >
          {pharmacy.name}
        </Text>
        <TouchableOpacity
          onPress={() => openMaps(pharmacy)}
          style={{
            backgroundColor: colors.primary + "20",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            marginLeft: 8,
          }}
        >
          <Navigation size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
      >
        <MapPin
          size={14}
          color={colors.textSecondary}
          style={{ marginRight: 4 }}
        />
        <Text
          style={{
            fontWeight: "400",
            fontSize: 14,
            color: colors.textSecondary,
            flex: 1,
          }}
        >
          {pharmacy.address}
        </Text>
      </View>

      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginRight: 16,
          }}
        >
          <Text
            style={{
              fontWeight: "500",
              fontSize: 12,
              color: colors.textTertiary,
              marginRight: 4,
            }}
          >
            {pharmacy.distance_km} km away
          </Text>
        </View>

        {pharmacy.rating && (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Star
              size={14}
              color={getRatingColor(pharmacy.rating)}
              fill={getRatingColor(pharmacy.rating)}
            />
            <Text
              style={{
                fontWeight: "500",
                fontSize: 12,
                color: colors.text,
                marginLeft: 4,
                marginRight: 4,
              }}
            >
              {pharmacy.rating.toFixed(1)}
            </Text>
            <Text
              style={{
                fontWeight: "400",
                fontSize: 12,
                color: colors.textTertiary,
              }}
            >
              ({pharmacy.user_ratings_total || 0})
            </Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <TouchableOpacity
          onPress={() => openMaps(pharmacy)}
          style={{
            flex: 1,
            backgroundColor: colors.primary,
            paddingVertical: 10,
            borderRadius: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Navigation size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text
            style={{
              fontWeight: "600",
              fontSize: 14,
              color: "#FFFFFF",
            }}
          >
            Directions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => callPharmacy(pharmacy.phone)}
          style={{
            flex: 1,
            backgroundColor: colors.surfaceElevated,
            paddingVertical: 10,
            borderRadius: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Phone size={16} color={colors.text} style={{ marginRight: 6 }} />
          <Text
            style={{
              fontWeight: "600",
              fontSize: 14,
              color: colors.text,
            }}
          >
            Call
          </Text>
        </TouchableOpacity>
      </View>

      {pharmacy.open_now !== undefined && (
        <View
          style={{
            backgroundColor: pharmacy.open_now
              ? colors.success + "20"
              : colors.error + "20",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            alignSelf: "flex-start",
            marginTop: 8,
          }}
        >
          <Text
            style={{
              fontWeight: "500",
              fontSize: 10,
              color: pharmacy.open_now ? colors.success : colors.error,
            }}
          >
            {pharmacy.open_now ? "Open Now" : "Closed"}
          </Text>
        </View>
      )}
    </View>
  );

  const LocationPermissionCard = () => (
    <View
      style={{
        backgroundColor: colors.warning + "20",
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 20,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <MapPin size={20} color={colors.warning} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontWeight: "600",
            fontSize: 14,
            color: colors.warning,
            marginBottom: 4,
          }}
        >
          Location Access Needed
        </Text>
        <Text
          style={{
            fontWeight: "400",
            fontSize: 12,
            color: colors.warning,
          }}
        >
          Please enable location access to find nearby pharmacies
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceHighest }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Fixed Header */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.surfaceHighest,
          paddingTop: insets.top + 24,
          paddingBottom: 24,
          paddingHorizontal: 20,
          borderBottomWidth: showHeaderBorder ? 1 : 0,
          borderBottomColor: colors.border,
          zIndex: 1000,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text
            style={{
              fontWeight: "600",
              fontSize: 18,
              color: colors.text,
            }}
          >
            Find Pharmacy
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 24 + 18 + 24 + 24,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Location Status */}
        {locationPermission !== "granted" && <LocationPermissionCard />}

        {/* Search Summary */}
        {userLocation && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginHorizontal: 20,
              marginBottom: 20,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primary + "20",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <MapPin size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: 14,
                  color: colors.text,
                  marginBottom: 2,
                }}
              >
                Searching nearby pharmacies
              </Text>
              <Text
                style={{
                  fontWeight: "400",
                  fontSize: 12,
                  color: colors.textSecondary,
                }}
              >
                Within 5km of your location
              </Text>
            </View>
            {isLoading && <Loader size={20} color={colors.primary} />}
          </View>
        )}

        {/* Loading State */}
        {isLoading && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              padding: 40,
              marginHorizontal: 20,
              alignItems: "center",
            }}
          >
            <Loader
              size={40}
              color={colors.primary}
              style={{ marginBottom: 16 }}
            />
            <Text
              style={{
                fontWeight: "600",
                fontSize: 18,
                color: colors.text,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              Finding nearby pharmacies
            </Text>
            <Text
              style={{
                fontWeight: "400",
                fontSize: 14,
                color: colors.textTertiary,
                textAlign: "center",
              }}
            >
              Please wait while we search for pharmacies near you
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              padding: 40,
              marginHorizontal: 20,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.error + "20",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <MapPin size={40} color={colors.error} />
            </View>
            <Text
              style={{
                fontWeight: "600",
                fontSize: 18,
                color: colors.text,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              Could not find pharmacies
            </Text>
            <Text
              style={{
                fontWeight: "400",
                fontSize: 14,
                color: colors.textTertiary,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              There was an error finding pharmacies near you. Please check your
              internet connection and try again.
            </Text>
          </View>
        )}

        {/* Pharmacies List */}
        {pharmacies.length > 0 && (
          <>
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: 20,
                  color: colors.text,
                }}
              >
                Found {pharmacies.length} pharmacies
              </Text>
            </View>

            {pharmacies.map((pharmacy) => (
              <PharmacyCard key={pharmacy.id} pharmacy={pharmacy} />
            ))}
          </>
        )}

        {/* Empty State */}
        {!isLoading && !error && pharmacies.length === 0 && userLocation && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              padding: 40,
              marginHorizontal: 20,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.surfaceElevated,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <MapPin size={40} color={colors.textTertiary} />
            </View>

            <Text
              style={{
                fontWeight: "600",
                fontSize: 18,
                color: colors.text,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              No pharmacies found
            </Text>

            <Text
              style={{
                fontWeight: "400",
                fontSize: 14,
                color: colors.textTertiary,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              We couldn't find any pharmacies within 5km of your location. Try
              expanding your search radius or check your location.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
