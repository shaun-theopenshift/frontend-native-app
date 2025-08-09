import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

const GEOAPIFY_URL = 'https://api.geoapify.com/v1/geocode/autocomplete';

const GeoapifyAutocomplete = ({ apiKey, value, onSelect, placeholder, style }) => {
  const [input, setInput] = useState(value || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const [inputLayout, setInputLayout] = useState(null);

  // Sync external value prop with internal input state
  useEffect(() => {
    setInput(value || '');
  }, [value]);

  // Debounced fetch for suggestions
  useEffect(() => {
    if (!input || input.length < 3) {
      setResults([]);
      // Explicitly hide dropdown if input is too short or empty
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(() => {
      fetch(`${GEOAPIFY_URL}?text=${encodeURIComponent(input)}&filter=countrycode:au&format=json&apiKey=${apiKey}`)
        .then(res => res.json())
        .then(data => {
          setResults(data.results || []);
          // Only show dropdown if there are results AND the input is currently focused
          if (data.results && data.results.length > 0 && inputRef.current?.isFocused()) {
            setShowDropdown(true);
          } else {
            setShowDropdown(false);
          }
        })
        .catch((err) => {
          console.error("Geoapify API error:", err);
          setResults([]);
          setShowDropdown(false);
        })
        .finally(() => setLoading(false));
    }, 350); // Debounce time
    return () => clearTimeout(timeout);
  }, [input, apiKey]);

  const handleChange = (text) => {
    setInput(text);
  };

  const handleFocus = () => {
    // When input is focused, if there are existing results or if input is long enough,
    // prepare to show dropdown by setting showDropdown to true.
    // The Modal's 'visible' prop will ultimately control if it's shown based on results.length > 0
    if (results.length > 0 || input.length >= 3) {
        setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    // CRITICAL FIX: Hide dropdown immediately when the input loses focus.
    // The timeout and isFocused() check were causing race conditions.
    setShowDropdown(false);
  };

  const handleSelect = (item) => {
    setInput(item.formatted); // Set the input text to the selected item's formatted address
    setShowDropdown(false); // Hide dropdown immediately on selection
    Keyboard.dismiss(); // Dismiss keyboard
    onSelect(item); // Pass the full selected item object to the parent component
  };

  const handleOutsidePress = () => {
    setShowDropdown(false);
    Keyboard.dismiss();
  };

  // Capture the layout of the TextInput to position the modal correctly
  const onTextInputLayout = (event) => {
    inputRef.current.measureInWindow((winX, winY, winWidth, winHeight) => {
      setInputLayout({ x: winX, y: winY, width: winWidth, height: winHeight });
    });
  };

  return (
    <View style={style}>
      <TextInput
        ref={inputRef}
        style={localStyles.input}
        placeholder={placeholder}
        value={input}
        onChangeText={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur} // Updated onBlur handler
        autoCapitalize="words"
        autoCorrect={false}
        onLayout={onTextInputLayout} // Capture layout on render
      />
      {loading && <ActivityIndicator size="small" color="#0000ff" style={localStyles.activityIndicator} />}

      {/* MODAL FOR SUGGESTIONS */}
      <Modal
        visible={showDropdown && results.length > 0} // Only show if dropdown is true AND there are results
        transparent={true}
        animationType="fade"
        onRequestClose={handleOutsidePress}
      >
        <TouchableWithoutFeedback onPress={handleOutsidePress}>
          <View style={localStyles.modalOverlay}>
            {inputLayout && ( // Only render dropdown content if inputLayout is available
              <View
                style={[
                  localStyles.dropdownContainer,
                  {
                    top: inputLayout.y + inputLayout.height + 5, // Position below the input + a small margin
                    left: inputLayout.x,
                    width: inputLayout.width,
                  },
                ]}
              >
                <FlatList
                  data={results}
                  keyExtractor={(item) => item.place_id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => handleSelect(item)}
                      style={localStyles.dropdownItem}
                    >
                      <Text>{item.formatted}</Text>
                    </TouchableOpacity>
                  )}
                  keyboardShouldPersistTaps="handled" // Important for FlatList inside modal
                />
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const localStyles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  activityIndicator: {
    position: 'absolute',
    right: 20,
    top: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    maxHeight: 180,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'absolute',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
});

export default GeoapifyAutocomplete;