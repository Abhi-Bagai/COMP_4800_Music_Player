import React from 'react';
import { FlatList, Pressable, StyleSheet, View, Modal, Platform, ScrollView } from 'react-native';
import { PanGestureHandler, LongPressGestureHandler, State } from 'react-native-gesture-handler';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { IconButton } from '@/src/components/ui/icon-button';
import { Text } from '@/src/components/ui/text';
import { useTheme } from '@/src/theme/provider';
import { usePlayerStore } from '@/src/state';
import { useDrag } from '@/src/contexts/drag-context';
