import { IconSymbol } from '@/components/ui/icon-symbol';
import { Button } from '@/src/components/ui/button';
import { Surface } from '@/src/components/ui/surface';
import { Text } from '@/src/components/ui/text';
import { FileScanner } from '@/src/services/file-scanner';
import { useTheme } from '@/src/theme/provider';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import { Alert, Platform, View } from 'react-native';

interface FolderPickerProps {
  onScanComplete?: () => void;
  onScanError?: (error: Error) => void;
  onBack?: () => void;
}

export function FolderPicker({ onScanComplete, onScanError, onBack }: FolderPickerProps) {
  const { tokens } = useTheme();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<{
    currentFile: string;
    filesScanned: number;
    totalFiles: number;
    percentage: number;
  } | null>(null);

  const handlePickFiles = async () => {
    try {
      console.log('Starting file picker...');

      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg', 'audio/*'],
        multiple: true,
        copyToCacheDirectory: true, // Always copy to cache for persistent URLs
      });

      console.log('Document picker result:', result);
      console.log('Result canceled:', result.canceled);
      console.log('Result assets:', result.assets);
      console.log('Assets length:', result.assets?.length);

      if (result.assets && result.assets.length > 0) {
        console.log('Selected files:', result.assets);
        await scanSelectedFiles(result.assets);
      } else {
        console.log('No files selected or picker was canceled');
        Alert.alert('No Files', 'No files were selected. Please try again.');
      }
    } catch (error) {
      console.error('Error picking files:', error);
      Alert.alert('Error', 'Failed to pick music files. Please try again.');
      onScanError?.(error as Error);
    }
  };

  const handlePickFolder = async () => {
    try {
      console.log('Starting folder picker...');

      if (Platform.OS === 'web') {
        // For web, we can use webkitdirectory to select folders
        await pickWebFolder();
      } else {
        // For mobile platforms, we can't directly pick folders with expo-document-picker
        // So we'll show an alert explaining the limitation
        Alert.alert(
          'Folder Selection Not Available',
          'Folder selection is not available on mobile platforms. Please select individual music files instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Select Files', onPress: handlePickFiles }
          ]
        );
      }
    } catch (error) {
      console.error('Error picking folder:', error);
      Alert.alert('Error', 'Failed to pick folder. Please try again.');
      onScanError?.(error as Error);
    }
  };

  const pickWebFolder = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.multiple = true;
      input.accept = '.mp3,.m4a,.mp4,.flac,.wav,.aac,.ogg,.wma';

      input.onchange = async (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (!files || files.length === 0) {
          reject(new Error('No files selected'));
          return;
        }

        try {
          console.log('Selected folder with', files.length, 'files');
          
          // Convert FileList to array and then to the format expected by the scanner
          const fileArray = Array.from(files);
          const musicFiles = fileArray
            .filter(file => {
              const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
              return ['.mp3', '.m4a', '.mp4', '.flac', '.wav', '.aac', '.ogg', '.wma'].includes(extension);
            })
            .map(file => ({
              uri: URL.createObjectURL(file),
              name: file.name,
              size: file.size,
              modificationTime: file.lastModified,
              file: file // Keep reference to the actual File object for web
            }));

          if (musicFiles.length === 0) {
            Alert.alert('No Music Files', 'No music files found in the selected folder.');
            resolve();
            return;
          }

          console.log('Found', musicFiles.length, 'music files in folder');
          await scanSelectedFiles(musicFiles);
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      input.oncancel = () => {
        reject(new Error('Folder selection cancelled'));
      };

      input.click();
    });
  };

  const scanSelectedFiles = async (assets: any[]) => {
    console.log('Starting file scan with assets:', assets);
    console.log('Assets type:', typeof assets);
    console.log('Assets is array:', Array.isArray(assets));
    setIsScanning(true);
    setScanProgress(null);

    try {
      const scanner = new FileScanner(
        (progress) => {
          console.log('Scan progress:', progress);
          setScanProgress(progress);
        },
        (summary) => {
          console.log('Scan completed with summary:', summary);
          setIsScanning(false);
          setScanProgress(null);
          onScanComplete?.();

          // Show detailed summary to user
          if (summary.skipped > 0) {
            Alert.alert(
              'Import Complete',
              `Added ${summary.added} new track(s)\nSkipped ${summary.skipped} duplicate(s)\nTotal processed: ${summary.total} file(s)`
            );
          } else {
            Alert.alert(
              'Import Complete',
              `Successfully added ${summary.added} track(s) to your library!`
            );
          }
        },
        (error) => {
          console.error('Scan error:', error);
          setIsScanning(false);
          setScanProgress(null);
          onScanError?.(error);
          Alert.alert('Error', `Scan failed: ${error.message}`);
        }
      );

      // Convert selected assets to music files format
      const musicFiles = assets.map(asset => ({
        uri: asset.uri,
        name: asset.name || 'Unknown',
        size: asset.size || 0,
        modificationTime: asset.lastModified ? asset.lastModified * 1000 : Date.now(),
      }));

      console.log('Converted music files:', musicFiles);

            // Process the files directly
            await scanner.processMusicFiles(musicFiles);

            // Call completion callback
            console.log('File processing completed, calling completion callback');
            setIsScanning(false);
            setScanProgress(null);
            onScanComplete?.();
            Alert.alert('Success', `Found ${musicFiles.length} music file(s)! Files have been added to your library.`);
    } catch (error) {
      console.error('Error in scanSelectedFiles:', error);
      setIsScanning(false);
      setScanProgress(null);
      onScanError?.(error as Error);
    }
  };

  if (isScanning && scanProgress) {
    return (
      <Surface padding="lg" style={{ gap: 16 }}>
        <Text variant="subtitle" weight="medium">
          Scanning Music Library
        </Text>
        <Text tone="subtle">
          Processing {scanProgress.currentFile}
        </Text>
        <Text tone="subtle">
          {scanProgress.filesScanned} of {scanProgress.totalFiles} files ({scanProgress.percentage}%)
        </Text>
        {/* Progress bar would go here */}
        <Button disabled>
          Scanning...
        </Button>
      </Surface>
    );
  }

  return (
    <Surface padding="lg" style={{ gap: 16 }}>
      <Text variant="subtitle" weight="medium">
        Import Music
      </Text>
      <Text tone="subtle">
        {Platform.OS === 'web' 
          ? 'Choose how you want to import music to your library.'
          : 'Select music files from your device to add to your library.'
        }
      </Text>
      
      <View style={{ gap: 12 }}>
        <Button 
          onPress={handlePickFolder}
          disabled={isScanning}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconSymbol name="folder" color={tokens.colors.onPrimary} style={{ marginRight: 8 }} />
            <Text>{isScanning ? 'Scanning...' : Platform.OS === 'web' ? 'Select Music Folder' : 'Select Music Files'}</Text>
          </View>
        </Button>
        
        {Platform.OS === 'web' && (
          <Button 
            variant="secondary"
            onPress={handlePickFiles}
            disabled={isScanning}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconSymbol name="doc" color={tokens.colors.onSecondary} style={{ marginRight: 8 }} />
              <Text>{isScanning ? 'Scanning...' : 'Select Individual Files'}</Text>
            </View>
          </Button>
        )}
      </View>

      {Platform.OS === 'web' && (
        <Text tone="subtle" style={{ fontSize: 12, textAlign: 'center' }}>
          Selecting a folder will import all music files from that folder and its subfolders.
        </Text>
      )}

      {onBack && (
        <Button variant="ghost" onPress={onBack} disabled={isScanning}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconSymbol name="chevron.left" color={tokens.colors.text} style={{ marginRight: 8 }} />
            <Text>Back to Library</Text>
          </View>
        </Button>
      )}
    </Surface>
  );
}
