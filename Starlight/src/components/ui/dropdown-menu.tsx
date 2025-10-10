import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Modal,
  Dimensions,
  Text,
} from 'react-native';

import { useTheme } from '@/src/theme/provider';

interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
}

export function DropdownMenu({ trigger, items }: DropdownMenuProps) {
  const { tokens } = useTheme();
  const [visible, setVisible] = useState(false);

  const handleTriggerPress = () => {
    console.log('🔧 GEAR BUTTON CLICKED - Dropdown trigger pressed');
    setVisible(true);
  };

  const handleItemPress = (item: DropdownMenuItem) => {
    console.log('Dropdown menu item pressed:', item.id);
    item.onPress();
    setVisible(false);
  };

  const handleBackdropPress = () => {
    setVisible(false);
  };

  const { height: screenHeight } = Dimensions.get('window');
  
  // Simple positioning - just below the header
  const menuStyle = {
    position: 'absolute' as const,
    top: 80, // Just below the header
    right: 20,
    width: 200,
    maxHeight: 200,
  };

  return (
    <>
      <Pressable onPress={handleTriggerPress}>
        {trigger}
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleBackdropPress}
      >
        <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
          <View style={[styles.menu, menuStyle, { backgroundColor: tokens.colors.surface }]}>
            {items.map((item) => (
              <Pressable
                key={item.id}
                style={[
                  styles.menuItem,
                  {
                    backgroundColor: 'transparent',
                  },
                ]}
                onPress={() => handleItemPress(item)}
              >
                <View style={styles.menuItemContent}>
                  {item.icon && (
                    <View style={styles.menuItemIcon}>
                      {item.icon}
                    </View>
                  )}
                  <View style={styles.menuItemLabel}>
                    <Text style={[
                      styles.menuItemText,
                      { 
                        color: item.destructive ? tokens.colors.danger : tokens.colors.text 
                      }
                    ]}>
                      {item.label}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  menu: {
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemLabel: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
