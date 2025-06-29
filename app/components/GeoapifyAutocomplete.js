// GeoapifyAutocomplete.js
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Keyboard, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

const GEOAPIFY_URL = 'https://api.geoapify.com/v1/geocode/autocomplete';

const GeoapifyAutocomplete = ({ apiKey, value, onSelect, style }) => {
  const [input, setInput] = useState(value || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const [dropdownWidth, setDropdownWidth] = useState(Dimensions.get('window').width - 32);

  useEffect(() => { setInput(value || ''); }, [value]);

  useEffect(() => {
    if (!input || input.length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      fetch(`${GEOAPIFY_URL}?text=${encodeURIComponent(input)}&filter=countrycode:au&format=json&apiKey=${apiKey}`)
        .then(res => res.json())
        .then(data => {
          setResults(data.results || []);
          setShowDropdown(true);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(timeout);
  }, [input, apiKey]);

  const handleSelect = (item) => {
    setInput(item.formatted);
    setShowDropdown(false);
    setResults([]);
    onSelect && onSelect(item);
    Keyboard.dismiss();
  };

  // Hide dropdown on outside press using a full-screen overlay
  const handleOutsidePress = () => {
    setShowDropdown(false);
    Keyboard.dismiss();
  };

  // Position dropdown below input
  const onInputLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    setDropdownWidth(width);
  };

  return (
    <View style={[{ position: 'relative', zIndex: 10 }, style]}>
      <TextInput
        ref={inputRef}
        style={{ height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, backgroundColor: '#fff' }}
        placeholder="Start typing address..."
        value={input}
        onChangeText={setInput}
        onFocus={() => input.length >= 3 && setShowDropdown(true)}
        autoCorrect={false}
        autoCapitalize="none"
        onLayout={onInputLayout}
      />
      {loading && <ActivityIndicator size="small" style={{ position: 'absolute', right: 10, top: 10 }} />}
      {showDropdown && results.length > 0 && (
        <View style={{ position: 'absolute', top: 45, left: 0, width: dropdownWidth, zIndex: 100 }}>
          {/* Overlay to catch outside presses */}
          <TouchableWithoutFeedback onPress={handleOutsidePress}>
            <View style={{
              position: 'absolute',
              top: -45,
              left: -16,
              right: -16,
              bottom: 0,
              height: Dimensions.get('window').height,
              width: Dimensions.get('window').width,
              zIndex: 99,
              backgroundColor: 'transparent',
            }} />
          </TouchableWithoutFeedback>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#eee',
            maxHeight: 180,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            zIndex: 100,
          }}>
            <FlatList
              data={results}
              keyExtractor={item => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleSelect(item)} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
                  <Text>{item.formatted}</Text>
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      )}
    </View>
  );
};

export default GeoapifyAutocomplete;
