// components/RefreshableWrapper.tsx
import React, { useRef, useState } from "react";
import { Animated, FlatList, RefreshControl, StyleSheet } from "react-native";

type RefreshableWrapperProps = {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
};

export default function RefreshableWrapper({ children, onRefresh }: RefreshableWrapperProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);

    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 30,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <FlatList
      data={[]}
      renderItem={null}
      ListHeaderComponent={
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          {children}
        </Animated.View>
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
});
