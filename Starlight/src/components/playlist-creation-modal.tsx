import { IconSymbol } from '@/components/ui/icon-symbol';
import { createNewPlaylist } from '@/src/services/playlist-service';
import { useTheme } from '@/src/theme/provider';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface PlaylistCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onPlaylistCreated?: (playlistId: string) => void;
}

export function PlaylistCreationModal({
  visible,
  onClose,
  onPlaylistCreated,
}: PlaylistCreationModalProps) {
  const { tokens } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const styles = getStyles(tokens);

  const handleCreate = async () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') {
        alert('Please enter a playlist name');
      } else {
        Alert.alert('Error', 'Please enter a playlist name');
      }
      return;
    }

    setIsCreating(true);
    try {
      const playlistId = await createNewPlaylist({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      setName('');
      setDescription('');
      onPlaylistCreated?.(playlistId);
      onClose();
    } catch (error) {
      console.error('Error creating playlist:', error);
      if (Platform.OS === 'web') {
        alert('Failed to create playlist');
      } else {
        Alert.alert('Error', 'Failed to create playlist');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <StatusBar style="light" />

      {Platform.OS === 'ios' ? (
        <BlurView intensity={100} tint="dark" style={styles.container}>
          <Content
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            isCreating={isCreating}
            onCreate={handleCreate}
            onCancel={handleCancel}
            tokens={tokens}
            styles={styles}
          />
        </BlurView>
      ) : (
        <View style={[styles.container, styles.androidContainer]}>
          <Content
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            isCreating={isCreating}
            onCreate={handleCreate}
            onCancel={handleCancel}
            tokens={tokens}
            styles={styles}
          />
        </View>
      )}
    </Modal>
  );
}

interface ContentProps {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  isCreating: boolean;
  onCreate: () => void;
  onCancel: () => void;
  tokens: any;
  styles: any;
}

function Content({
  name,
  setName,
  description,
  setDescription,
  isCreating,
  onCreate,
  onCancel,
  tokens,
  styles,
}: ContentProps) {
  return (
    <>
      <View style={styles.header}>
        <Pressable
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isCreating}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>

        <Text style={styles.title}>New Playlist</Text>

        <Pressable
          style={[
            styles.createButton,
            (!name.trim() || isCreating) && { opacity: tokens.opacity.disabled }
          ]}
          onPress={onCreate}
          disabled={!name.trim() || isCreating}
        >
          <Text style={[
            styles.createButtonText,
            (!name.trim() || isCreating) && styles.createButtonTextDisabled
          ]}>
            {isCreating ? 'Creating...' : 'Create'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.artworkContainer}>
          <View style={styles.artworkPlaceholder}>
            <IconSymbol
              name="music.note.list"
              size={48}
              color={tokens.colors.subtleText}
            />
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="My Playlist"
              placeholderTextColor={tokens.colors.subtleText}
              autoFocus
              editable={!isCreating}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.descriptionInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a description..."
              placeholderTextColor={tokens.colors.subtleText}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!isCreating}
            />
          </View>
        </View>
      </View>
    </>
  );
}

function getStyles(tokens: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    androidContainer: {
      backgroundColor: tokens.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: tokens.colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: tokens.colors.text,
    },
    cancelButton: {
      padding: 8,
    },
    cancelButtonText: {
      fontSize: 16,
      color: tokens.colors.subtleText,
    },
    createButton: {
      padding: 8,
    },
    createButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: tokens.colors.accent,
    },
    createButtonTextDisabled: {
      color: tokens.colors.subtleText,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    artworkContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    artworkPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 8,
      backgroundColor: tokens.colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    form: {
      gap: 24,
    },
    inputContainer: {
      gap: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: tokens.colors.text,
    },
    textInput: {
      backgroundColor: tokens.colors.surfaceElevated,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: tokens.colors.text,
      minHeight: 44,
    },
    descriptionInput: {
      minHeight: 80,
    },
  });
}