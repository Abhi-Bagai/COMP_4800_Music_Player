import { IconSymbol } from '@/components/ui/icon-symbol';
import { IconButton } from '@/src/components/ui/icon-button';
import { playTrack } from '@/src/services/playback-service';
import { useLibraryStore } from '@/src/state';
import { useTheme } from '@/src/theme/provider';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ArtistWithTracks {
  id: string;
  name: string;
  trackCount: number;
  albums: {
    id: string;
    title: string;
    year?: number;
    trackCount: number;
    tracks: any[];
  }[];
  allTracks: any[];
}

interface ArtistsScreenProps {
  onBack: () => void;
}

export function ArtistsScreen({ onBack }: ArtistsScreenProps) {
  const { tokens } = useTheme();
  const styles = getStyles(tokens);
  const { tracks } = useLibraryStore();
  const [artists, setArtists] = useState<ArtistWithTracks[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<ArtistWithTracks | null>(null);

  useEffect(() => {
    organizeByArtists();
    // tracks is the only dependency
  }, [tracks]);

  const organizeByArtists = () => {
    // Group tracks by artist
    const artistsMap = new Map<string, ArtistWithTracks>();

    tracks.forEach((track) => {
      const artistName = track.artist?.name || 'Unknown Artist';
      const artistId = track.artist?.id || 'unknown';
      const albumTitle = track.album?.title || 'Unknown Album';
      const albumId = track.album?.id || 'unknown';

      if (!artistsMap.has(artistId)) {
        artistsMap.set(artistId, {
          id: artistId,
          name: artistName,
          trackCount: 0,
          albums: [],
          allTracks: [],
        });
      }

      const artist = artistsMap.get(artistId)!;
      artist.allTracks.push(track);
      artist.trackCount++;

      // Find or create album
      let album = artist.albums.find((a) => a.id === albumId);
      if (!album) {
        album = {
          id: albumId,
          title: albumTitle,
          trackCount: 0,
          tracks: [],
        };
        artist.albums.push(album);
      }

      album.tracks.push(track);
      album.trackCount++;
    });

    // Sort albums by year (newest first) then by title
    artistsMap.forEach((artist) => {
      artist.albums.sort((a, b) => a.title.localeCompare(b.title));

      // Sort tracks within each album by disc and track number
      artist.albums.forEach((album) => {
        album.tracks.sort((a, b) => {
          const discA = a.discNumber || 1;
          const discB = b.discNumber || 1;
          const trackA = a.trackNumber || 0;
          const trackB = b.trackNumber || 0;

          if (discA !== discB) return discA - discB;
          return trackA - trackB;
        });
      });
    });

    const sortedArtists = Array.from(artistsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    setArtists(sortedArtists);
  };

  const handleArtistPress = (artist: ArtistWithTracks) => {
    setSelectedArtist(artist);
  };

  const handlePlayArtist = (artist: ArtistWithTracks) => {
    if (artist.allTracks.length > 0) {
      playTrack(artist.allTracks[0]);
    }
  };

  const handlePlayAlbum = (album: any) => {
    if (album.tracks.length > 0) {
      playTrack(album.tracks[0]);
    }
  };

  if (selectedArtist) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]}>
        <ArtistDetailView
          artist={selectedArtist}
          onBack={() => setSelectedArtist(null)}
          onPlayAlbum={handlePlayAlbum}
          tokens={tokens}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]}>
      <View style={styles.header}>
        <IconButton
          icon={<IconSymbol name="chevron.left" size={24} color={tokens.colors.text} />}
          onPress={onBack}
          accessibilityLabel="Go back"
        />
        <Text style={[styles.headerTitle, { color: tokens.colors.text }]}>Artists</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={artists}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: artist }) => (
          <Pressable
            style={({ pressed }) => [
              styles.artistItem,
              {
                backgroundColor: pressed
                  ? tokens.colors.surfaceElevated
                  : tokens.colors.surface,
              },
            ]}
            onPress={() => handleArtistPress(artist)}
          >
            <View style={styles.artistContent}>
              <View style={[styles.artistArt, { backgroundColor: tokens.colors.surfaceElevated }]}>
                <IconSymbol name="person.fill" size={32} color={tokens.colors.subtleText} />
              </View>
              <View style={styles.artistInfo}>
                <Text style={[styles.artistName, { color: tokens.colors.text }]} numberOfLines={1}>
                  {artist.name}
                </Text>
                <Text style={[styles.artistStats, { color: tokens.colors.subtleText }]}>
                  {artist.albums.length} albums • {artist.trackCount} songs
                </Text>
              </View>
              <Pressable
                style={styles.playButton}
                onPress={() => handlePlayArtist(artist)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconSymbol name="play.fill" size={20} color={tokens.colors.accent} />
              </Pressable>
            </View>
          </Pressable>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.contentContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: tokens.colors.surfaceElevated }]}>
              <IconSymbol name="person.2" size={48} color={tokens.colors.subtleText} />
            </View>
            <Text style={[styles.emptyTitle, { color: tokens.colors.text }]}>
              No Artists Found
            </Text>
            <Text style={[styles.emptyText, { color: tokens.colors.subtleText }]}>
              Add some music to see your artists here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

interface ArtistDetailViewProps {
  artist: ArtistWithTracks;
  onBack: () => void;
  onPlayAlbum: (album: any) => void;
}

function ArtistDetailView({ artist, onBack, onPlayAlbum, tokens }: ArtistDetailViewProps & { tokens: any }) {
  const styles = getStyles(tokens);
  return (
    <>
      <View style={styles.header}>
        <IconButton
          icon={<IconSymbol name="chevron.left" size={24} color={tokens.colors.text} />}
          onPress={onBack}
          accessibilityLabel="Go back"
        />
        <Text style={[styles.headerTitle, { color: tokens.colors.text }]} numberOfLines={1}>
          {artist.name}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <SectionList
        sections={artist.albums.map((album) => ({
          title: album.title,
          data: album.tracks,
          album,
        }))}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.artistHeader}>
            <View style={[styles.artistHeaderArt, { backgroundColor: tokens.colors.surfaceElevated }]}>
              <IconSymbol name="person.fill" size={64} color={tokens.colors.subtleText} />
            </View>
            <Text style={[styles.artistHeaderName, { color: tokens.colors.text }]}>
              {artist.name}
            </Text>
            <Text style={[styles.artistHeaderStats, { color: tokens.colors.subtleText }]}>
              {artist.albums.length} albums • {artist.trackCount} songs
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={[styles.albumHeader, { backgroundColor: tokens.colors.background }]}>
            <View style={styles.albumHeaderContent}>
              <View style={[styles.albumArt, { backgroundColor: tokens.colors.surfaceElevated }]}>
                <IconSymbol name="opticaldisc" size={20} color={tokens.colors.subtleText} />
              </View>
              <View style={styles.albumInfo}>
                <Text style={[styles.albumTitle, { color: tokens.colors.text }]} numberOfLines={1}>
                  {section.title}
                </Text>
                <Text style={[styles.albumStats, { color: tokens.colors.subtleText }]}>
                  {section.album.year && `${section.album.year} • `}
                  {section.album.trackCount} songs
                </Text>
              </View>
              <Pressable
                style={styles.albumPlayButton}
                onPress={() => onPlayAlbum(section.album)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconSymbol name="play.fill" size={16} color={tokens.colors.accent} />
              </Pressable>
            </View>
          </View>
        )}
        renderItem={({ item: track }) => (
          <Pressable
            style={({ pressed }) => [
              styles.trackItem,
              {
                backgroundColor: pressed
                  ? tokens.colors.surfaceElevated
                  : 'transparent',
              },
            ]}
            onPress={() => playTrack(track)}
          >
            <View style={styles.trackContent}>
              <Text style={[styles.trackNumber, { color: tokens.colors.subtleText }]}>
                {track.trackNumber || '—'}
              </Text>
              <View style={styles.trackInfo}>
                <Text style={[styles.trackTitle, { color: tokens.colors.text }]} numberOfLines={1}>
                  {track.title}
                </Text>
                <Text style={[styles.trackDuration, { color: tokens.colors.subtleText }]}>
                  {formatTrackDuration(track.durationMs)}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.contentContainer}
        stickySectionHeadersEnabled={false}
      />
    </>
  );
}

function getStyles(tokens: any) {
  return StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },

  // Artist List Styles
  artistItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  artistContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  artistArt: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistInfo: {
    flex: 1,
    gap: 2,
  },
  artistName: {
    fontSize: 16,
    fontWeight: '600',
  },
  artistStats: {
    fontSize: 14,
  },
  playButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Artist Detail Styles
  artistHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  artistHeaderArt: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  artistHeaderName: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  artistHeaderStats: {
    fontSize: 16,
  },

  // Album Styles
  albumHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  albumHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  albumArt: {
    width: 40,
    height: 40,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumInfo: {
    flex: 1,
    gap: 2,
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  albumStats: {
    fontSize: 14,
  },
  albumPlayButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Track Styles
  trackItem: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  trackContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  trackNumber: {
    width: 24,
    fontSize: 14,
    textAlign: 'center',
  },
  trackInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
  },
  trackDuration: {
    fontSize: 14,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  });
}

function formatTrackDuration(duration?: number | null) {
  if (!duration) return '';
  const totalSeconds = Math.floor(duration / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}