import React, {useMemo, useState, useEffect} from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  Alert,
  NativeModules,
  NativeEventEmitter,
} from 'react-native';

interface TrackItem {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  isPlaying?: boolean;
  filePath?: string;
}

type Palette = {
  accent: string;
  window: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
};

const SIDEBAR_ITEMS = [
  {label: 'Library', children: ['All Songs', 'Albums', 'Artists', 'Recently Added']},
  {label: 'Playlists', children: ['Favorites', 'Chill Mix', 'Workout']},
];

function Sidebar({palette, activeSection, onSectionChange}: {
  palette: Palette;
  activeSection: string;
  onSectionChange: (section: string) => void;
}): React.JSX.Element {
  return (
    <View style={[styles.sidebar, {backgroundColor: palette.surface}]}>
      {SIDEBAR_ITEMS.map(group => (
        <View key={group.label} style={styles.sidebarGroup}>
          <Text style={[styles.sidebarHeading, {color: palette.textSecondary}]}>
            {group.label}
          </Text>
          {group.children.map(item => (
            <Pressable
              key={item}
              style={[
                styles.sidebarItem,
                activeSection === item && styles.sidebarItemActive
              ]}
              onPress={() => onSectionChange(item)}
            >
              <Text style={[
                styles.sidebarItemText,
                {color: activeSection === item ? palette.accent : palette.textPrimary}
              ]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

interface TrackRowProps {
  item: TrackItem;
  index: number;
  palette: Palette;
  isSelected: boolean;
  onPress: () => void;
  onDoublePress: () => void;
}

function TrackRow({item, index, palette, isSelected, onPress, onDoublePress}: TrackRowProps): React.JSX.Element {
  const rowStyle = [
    styles.trackRow,
    item.isPlaying && styles.trackRowActive,
    isSelected && styles.trackRowSelected
  ];
  const indexColor = item.isPlaying ? palette.accent : palette.textSecondary;

  return (
    <Pressable
      style={rowStyle}
      onPress={onPress}
      onLongPress={onDoublePress}
    >
      <Text style={[styles.trackColumnIndex, {color: indexColor}]}>
        {item.isPlaying ? '▶︎' : index + 1}
      </Text>
      <View style={styles.trackColumnMain}>
        <Text
          style={[styles.trackTitle, {color: item.isPlaying ? palette.accent : palette.textPrimary}]}
        >
          {item.title}
        </Text>
        <Text style={[styles.trackSubtitle, {color: palette.textSecondary}]}>
          {item.artist}
        </Text>
      </View>
      <Text style={[styles.trackAlbum, {color: palette.textSecondary}]}>
        {item.album}
      </Text>
      <Text style={[styles.trackDuration, {color: palette.textSecondary}]}>
        {item.duration}
      </Text>
    </Pressable>
  );
}

// Native modules
const { MusicFilePicker, AudioPlayer } = NativeModules;
const audioPlayerEmitter = AudioPlayer ? new NativeEventEmitter(AudioPlayer) : null;

export default function App(): React.JSX.Element {
  const colorScheme = useColorScheme();
  const [query, setQuery] = useState('');
  const [activeSection, setActiveSection] = useState('All Songs');
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [importedTracks, setImportedTracks] = useState<TrackItem[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const importMusicFiles = async () => {
    if (MusicFilePicker) {
      try {
        const files = await MusicFilePicker.pickMusicFiles();
        if (files && files.length > 0) {
          const newTracks: TrackItem[] = files.map(file => ({
            id: file.id,
            title: file.title,
            artist: file.artist,
            album: file.album,
            duration: file.duration,
            filePath: file.filePath,
          }));
          setImportedTracks(prev => [...prev, ...newTracks]);
          Alert.alert('Success', `Imported ${newTracks.length} tracks!`);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to import music files');
      }
    } else {
      // Fallback for development
      const newTracks: TrackItem[] = [
        {
          id: `imported-${Date.now()}-1`,
          title: 'Demo Song 1',
          artist: 'Local Artist',
          album: 'My Music',
          duration: '3:45',
        },
      ];
      setImportedTracks(prev => [...prev, ...newTracks]);
      Alert.alert('Demo Mode', `Added ${newTracks.length} demo tracks!`);
    }
  };

  const playTrack = async (track: TrackItem) => {
    if (!track.filePath || !AudioPlayer) {
      console.log('No file path or AudioPlayer not available');
      setPlayingTrackId(track.id);
      return;
    }

    try {
      await AudioPlayer.loadAndPlay(track.filePath);
      setPlayingTrackId(track.id);
      setSelectedTrackId(track.id);
    } catch (error) {
      Alert.alert('Playback Error', 'Could not play this track');
    }
  };

  const togglePlayPause = () => {
    if (!AudioPlayer) return;

    if (isPlaying) {
      AudioPlayer.pause();
    } else {
      AudioPlayer.resume();
    }
  };

  // Setup audio player event listeners
  useEffect(() => {
    if (!audioPlayerEmitter) return;

    const playbackStateSubscription = audioPlayerEmitter.addListener(
      'onPlaybackStateChanged',
      (data) => setIsPlaying(data.isPlaying)
    );

    const progressSubscription = audioPlayerEmitter.addListener(
      'onProgress',
      (data) => {
        setCurrentTime(data.currentTime);
        setDuration(data.duration);
      }
    );

    const trackFinishedSubscription = audioPlayerEmitter.addListener(
      'onTrackFinished',
      () => {
        // Auto-play next track
        const tracks = [...demoTracks, ...importedTracks];
        const currentIndex = tracks.findIndex(t => t.id === playingTrackId);
        if (currentIndex < tracks.length - 1) {
          const nextTrack = tracks[currentIndex + 1];
          playTrack(nextTrack);
        }
      }
    );

    return () => {
      playbackStateSubscription?.remove();
      progressSubscription?.remove();
      trackFinishedSubscription?.remove();
    };
  }, [playingTrackId, importedTracks]);

  const demoTracks = useMemo<TrackItem[]>(
    () => [
      {
        id: '1',
        title: 'Electric Sunrise',
        artist: 'Plini',
        album: 'Handmade Cities',
        duration: '5:58',
      },
      {
        id: '2',
        title: 'Atlas',
        artist: 'Bicep',
        album: 'Isles',
        duration: '6:09',
      },
      {
        id: '3',
        title: 'Open Eye Signal',
        artist: 'Jon Hopkins',
        album: 'Immunity',
        duration: '7:08',
      },
      {
        id: '4',
        title: 'Bloom',
        artist: 'ODESZA',
        album: 'In Return',
        duration: '5:48',
      },
      {
        id: '5',
        title: 'Weightless',
        artist: 'Marconi Union',
        album: 'Weightless (Ambient Transmissions Vol. 2)',
        duration: '8:10',
      },
      {
        id: '6',
        title: 'Seventeen',
        artist: 'Sjowgren',
        album: 'Single',
        duration: '3:25',
      },
      {
        id: '7',
        title: 'Stay With Me',
        artist: 'Miki Matsubara',
        album: 'Pocket Park',
        duration: '4:05',
      },
      {
        id: '8',
        title: 'Nothing Left to Lose',
        artist: 'Everything But The Girl',
        album: 'Fuse',
        duration: '4:40',
      },
      {
        id: '9',
        title: 'Shelter',
        artist: 'Porter Robinson & Madeon',
        album: 'Single',
        duration: '3:38',
      },
      {
        id: '10',
        title: 'Sunset Lover',
        artist: 'Petit Biscuit',
        album: 'Presence',
        duration: '3:58',
      },
    ],
    [],
  );

  const allTracks = useMemo(() => [...demoTracks, ...importedTracks], [demoTracks, importedTracks]);

  const palette = colorScheme === 'dark' ? darkTheme : lightTheme;
  const currentTrack = allTracks.find(t => t.id === playingTrackId);

  return (
    <View style={[styles.appContainer, {backgroundColor: palette.window}]}>
      <View style={styles.windowShell}>
        <Sidebar
          palette={palette}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <View style={styles.content}>
          <View style={styles.contentHeader}>
            <View>
              <Text style={[styles.contentTitle, {color: palette.textPrimary}]}>{activeSection}</Text>
              <Text style={[styles.contentSubtitle, {color: palette.textSecondary}]}>
                {allTracks.length} tracks · {activeSection}
              </Text>
            </View>
            <View style={{flexDirection: 'row', gap: 12}}>
              <Pressable
                style={[styles.importButton, {backgroundColor: palette.accent}]}
                onPress={importMusicFiles}
              >
                <Text style={styles.importButtonText}>Import Music</Text>
              </Pressable>
              <TextInput
                placeholder="Search library"
                placeholderTextColor={palette.textSecondary}
                value={query}
                onChangeText={setQuery}
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: palette.surface,
                    color: palette.textPrimary,
                    borderColor: palette.border,
                  },
                ]}
              />
            </View>
          </View>
          <View style={[styles.listHeader, {borderBottomColor: palette.border}]}>
            <Text style={[styles.listHeaderText, styles.listHeaderIndex, {color: palette.textSecondary}]}>
              #
            </Text>
            <Text style={[styles.listHeaderText, styles.listHeaderTrack, {color: palette.textSecondary}]}>
              Title
            </Text>
            <Text style={[styles.listHeaderText, styles.listHeaderAlbum, {color: palette.textSecondary}]}>
              Album
            </Text>
            <Text style={[styles.listHeaderText, styles.listHeaderDuration, {color: palette.textSecondary}]}>
              Time
            </Text>
          </View>
          <FlatList
            data={allTracks}
            keyExtractor={item => item.id}
            renderItem={({item, index}) => (
              <TrackRow
                key={item.id}
                item={{...item, isPlaying: item.id === playingTrackId}}
                index={index}
                palette={palette}
                isSelected={item.id === selectedTrackId}
                onPress={() => setSelectedTrackId(item.id)}
                onDoublePress={() => playTrack(item)}
              />
            )}
            style={styles.trackList}
            contentContainerStyle={styles.trackListContent}
          />
        </View>
      </View>
      <View style={[styles.playbackBar, {backgroundColor: palette.surface, borderTopColor: palette.border}]}>
        <View style={styles.playbackMeta}>
          <View style={[styles.artworkPlaceholder, {backgroundColor: palette.border}]} />
          <View>
            <Text style={[styles.playbackTitle, {color: palette.textPrimary}]}>
              {currentTrack?.title || 'No track playing'}
            </Text>
            <Text style={[styles.playbackSubtitle, {color: palette.textSecondary}]}>
              {currentTrack?.artist || ''}
            </Text>
          </View>
        </View>
        <View style={styles.playbackControls}>
          <Pressable
            style={styles.controlButton}
            onPress={() => {
              const currentIndex = allTracks.findIndex(t => t.id === playingTrackId);
              if (currentIndex > 0) {
                const prevTrack = allTracks[currentIndex - 1];
                playTrack(prevTrack);
              }
            }}
          >
            <Text style={[styles.controlIcon, {color: palette.textPrimary}]}>⏮</Text>
          </Pressable>
          <Pressable
            style={[styles.controlButton, styles.playPauseButton]}
            onPress={togglePlayPause}
          >
            <Text style={[styles.controlIconLarge, {color: palette.textPrimary}]}>
              {isPlaying ? '⏸' : '▶️'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.controlButton}
            onPress={() => {
              const currentIndex = allTracks.findIndex(t => t.id === playingTrackId);
              if (currentIndex < allTracks.length - 1) {
                const nextTrack = allTracks[currentIndex + 1];
                playTrack(nextTrack);
              }
            }}
          >
            <Text style={[styles.controlIcon, {color: palette.textPrimary}]}>⏭</Text>
          </Pressable>
        </View>
        <View style={styles.timelineSection}>
          <Text style={[styles.timelineTime, {color: palette.textSecondary}]}>
            {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}
          </Text>
          <View style={[styles.timelineTrack, {backgroundColor: palette.border}]}>
            <View style={[
              styles.timelineProgress,
              {
                backgroundColor: palette.accent,
                width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%'
              }
            ]} />
          </View>
          <Text style={[styles.timelineTime, {color: palette.textSecondary}]}>
            {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const ACCENT_COLOR = '#4C6EF5';

const lightTheme: Palette = {
  accent: ACCENT_COLOR,
  window: '#f6f8fb',
  surface: '#ffffff',
  border: '#d3d7e0',
  textPrimary: '#1c1f2b',
  textSecondary: '#6b7385',
};

const darkTheme: Palette = {
  accent: ACCENT_COLOR,
  window: '#1c1f2b',
  surface: '#2a2e3d',
  border: '#3a3f52',
  textPrimary: '#f7f8fc',
  textSecondary: '#9ba3b5',
};

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
  windowShell: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 220,
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 32,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#d3d7e0',
  },
  sidebarGroup: {
    gap: 8,
  },
  sidebarHeading: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sidebarItem: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  sidebarItemActive: {
    backgroundColor: 'rgba(76, 110, 245, 0.1)',
  },
  sidebarItemText: {
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  contentTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  contentSubtitle: {
    marginTop: 4,
    fontSize: 14,
  },
  searchInput: {
    width: 220,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  listHeaderIndex: {
    width: 40,
  },
  listHeaderTrack: {
    flex: 1,
  },
  listHeaderAlbum: {
    width: 200,
  },
  listHeaderDuration: {
    width: 60,
    textAlign: 'right',
  },
  trackList: {
    flex: 1,
  },
  trackListContent: {
    paddingBottom: 120,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 12,
  },
  trackRowActive: {
    backgroundColor: 'rgba(76, 110, 245, 0.12)',
  },
  trackRowSelected: {
    backgroundColor: 'rgba(76, 110, 245, 0.06)',
  },
  trackColumnIndex: {
    width: 40,
    fontSize: 14,
  },
  trackColumnMain: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  trackSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  trackAlbum: {
    width: 200,
    fontSize: 14,
  },
  trackDuration: {
    width: 60,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  playbackBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  playbackMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  artworkPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  playbackTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  playbackSubtitle: {
    fontSize: 13,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlButton: {
    padding: 8,
    borderRadius: 24,
  },
  playPauseButton: {
    backgroundColor: 'rgba(76, 110, 245, 0.12)',
  },
  controlIcon: {
    fontSize: 20,
  },
  controlIconLarge: {
    fontSize: 28,
  },
  timelineSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: 260,
  },
  timelineTime: {
    fontSize: 12,
  },
  timelineTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  timelineProgress: {
    height: '100%',
    width: '35%',
    borderRadius: 3,
  },
  importButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  importButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});