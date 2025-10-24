// components/BidInput.tsx
import React, { useEffect, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

type BidInputProps = {
  minBid: number; // minimum allowed bid
  value: number | null; // controlled value from parent
  onChange: (value: number) => void;
};

const BidInput: React.FC<BidInputProps> = ({ minBid, value, onChange }) => {
  // Initialize safely
  const initialText =
    value !== null && value !== undefined
      ? value.toFixed(1)
      : minBid !== null && minBid !== undefined
      ? minBid.toFixed(1)
      : "0.0";

  const [text, setText] = useState(initialText);

  // Sync whenever parent changes value or minBid
  useEffect(() => {
    if (value !== null && value !== undefined && !isNaN(value)) {
      setText(value.toFixed(1));
    } else if (minBid !== null && minBid !== undefined && !isNaN(minBid)) {
      setText(minBid.toFixed(1));
    } else {
      setText("0.0");
    }
  }, [value, minBid]);

  const handleChange = (input: string) => {
    // allow only numbers with max 1 decimal place
    const regex = /^\d*\.?\d{0,1}$/;
    if (!regex.test(input)) return;

    setText(input);

    const num = parseFloat(input);
    if (!isNaN(num)) {
      // force 0.1 steps
      const rounded = Math.max(minBid || 0, Math.round(num * 10) / 10);
      onChange(rounded);
    }
  };

  const handleBlur = () => {
    let num = parseFloat(text);
    if (isNaN(num) || (minBid !== null && num < minBid)) {
      num = minBid ?? 0;
    }
    const rounded = Math.round(num * 10) / 10;
    setText(rounded.toFixed(1));
    onChange(rounded);
  };

  return (
    <View style={{ marginVertical: 6 }}>
      <TextInput
        style={styles.input}
        value={text}
        keyboardType="numeric"
        onChangeText={handleChange}
        onBlur={handleBlur}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 8,
    fontSize: 16,
    width: 120,
  },
});

export default BidInput;
